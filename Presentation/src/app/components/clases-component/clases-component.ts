import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { ClaseService } from '../../shared/services/clase-service';
import { ClaseModel } from '../../shared/models/clase-model';
import { UsuarioService } from '../../shared/services/usuario-service';
import { UsuarioModel } from '../../shared/models/usuario-model';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FrmClase } from '../forms/frm-clase/frm-clase';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogoGeneral } from '../forms/dialogo-general/dialogo-general';
import { PrintService } from '../../shared/services/print-service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { form, FormField } from '@angular/forms/signals';
import { AuthService } from '../../shared/services/auth-service';
import { Roles } from '../../shared/models/roles';

interface FilterForm {
    nombre: string;
}

@Component({
    imports: [
        MatTableModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatInputModule,
        MatFormFieldModule,
        MatExpansionModule,
        FormField
    ],
    selector: 'app-clases-component',
    styleUrl: './clases-component.css',
    templateUrl: './clases-component.html',
})
export class ClasesComponent implements OnInit {

    buscarID = signal<number | null>(null);

    displayedColumns: string[] = [
        'id',
        'nombre',
        'descripcion',
        'entrenador',
        'capacidad',
        'fecha_hora_inicio',
        'fecha_hora_fin',
        'estado',
        'botonera'
    ];

    dataSource = signal<ClaseModel[]>([]);

    usuarios = signal<UsuarioModel[]>([]);

    srvClase = inject(ClaseService);

    srvUsuario = inject(UsuarioService);

    srvAuth = inject(AuthService);

    dialog = inject(MatDialog);

    srvPrint = inject(PrintService);

    filtro = {
        nombre: ''
    };

    panelFilterState = signal(false);

    objFilter = signal<FilterForm>({
        nombre: ''
    });

    frmFilter = form(this.objFilter);

    private consultarInfo = false;

    // Comprobar si el usuario es administrador
    public get esAdmin(): boolean {

        return this.srvAuth.isLoggedIn() &&
            this.srvAuth.getRol() === Roles.Admin;

    }

    // Comprobar si el usuario es entrenador
    public get esEntrenador(): boolean {

        return this.srvAuth.isLoggedIn() &&
            this.srvAuth.getRol() === Roles.Entrenador;

    }

    // Comprobar si el usuario es cliente
    public get esCliente(): boolean {

        return this.srvAuth.isLoggedIn() &&
            this.srvAuth.getRol() === Roles.Cliente;

    }

    // Obtener el título según el rol
    public get tituloCatalogo(): string {

        if (this.esAdmin) {

            return 'Catálogo de clases';

        }

        if (this.esEntrenador) {

            return 'Mis clases asignadas';

        }

        return 'Clases disponibles';

    }

    constructor() {

        // Cargar las clases según el rol
        effect(() => {

            const respuesta = this.srvClase.clases;

            if (respuesta.hasValue()) {

                const registros = respuesta.value().data;

                this.dataSource.set(registros.filter(clase =>
                    this.puedeConsultarClase(clase)
                ));

            } else {

                this.dataSource.set([]);

            }

        });

        // Cargar los usuarios únicamente para el administrador
        effect(() => {

            const respuesta = this.srvUsuario.usuarios;

            if (this.esAdmin && respuesta.hasValue()) {

                this.usuarios.set(respuesta.value().data);

            } else {

                this.usuarios.set([]);

            }

        });

        // Obtener una clase por su ID
        effect(() => {

            const id = this.buscarID();

            if (id === null) {
                return;
            }

            const respuesta = this.srvClase.clasePorId;

            if (respuesta.status() === 'resolved' &&
                respuesta.hasValue()) {

                const clase = respuesta.value().data;

                if (clase && Number(clase.id) === id) {

                    this.buscarID.set(null);

                    if (!this.puedeConsultarClase(clase)) {

                        return;

                    }

                    this.mostrarDialogo(
                        this.consultarInfo
                            ? 'Información de la clase'
                            : 'Editar clase',
                        clase,
                        this.consultarInfo
                    );

                }

            }

            if (respuesta.error()) {

                this.buscarID.set(null);

                this.alerta(
                    'error',
                    'No se pudo consultar la clase.'
                );

            }

        });

    }

    // Comprobar si el usuario puede consultar una clase
    puedeConsultarClase(clase: ClaseModel): boolean {

        // El administrador puede consultar todas las clases
        if (this.esAdmin) {

            return true;

        }

        // El entrenador consulta únicamente sus clases
        if (this.esEntrenador) {

            return Number(clase.entrenador_id) ===
                Number(this.srvAuth.getUsuarioId());

        }

        // El cliente consulta clases programadas que no han comenzado
        if (this.esCliente) {

            const fechaInicio = new Date(
                clase.fecha_hora_inicio.replace(' ', 'T')
            );

            return clase.estado === 'Programada' &&
                fechaInicio.getTime() > Date.now();

        }

        return false;

    }

    // Cerrar el panel de filtros
    onFilterClose(): void {

        this.panelFilterState.set(false);

    }

    // Abrir o cerrar el panel
    toggleFilterPanel(): void {

        this.panelFilterState.update(valor => !valor);

    }

    // Filtrar las clases por nombre
    onFilterChange(nombre: string): void {

        this.filtro.nombre = nombre.trim();

        this.filtrarClases();

    }

    // Limpiar el filtro
    resetFilter(): void {

        this.filtro = {
            nombre: ''
        };

        this.objFilter.set({
            nombre: ''
        });

        this.filtrarClases();

    }

    // Consultar las clases según el rol
    filtrarClases(): void {

        this.dataSource.set([]);

        if (this.esAdmin) {

            this.srvClase.filtrar({...this.filtro});

        } else if (this.esEntrenador) {

            this.srvClase.filtrar({
                ...this.filtro,
                entrenador_id: Number(this.srvAuth.getUsuarioId())
            });

        } else if (this.esCliente) {

            this.srvClase.filtrar({
                ...this.filtro,
                estado: 'Programada'
            });

        }

    }

    // Mostrar mensajes al usuario
    alerta(icono: string, texto: string): void {

        this.dialog.open(DialogoGeneral, {

            width: '90vw',
            maxWidth: '25rem',

            data: {
                icono: icono,
                texto: texto,
                textoAceptar: 'Aceptar'
            }

        });

    }

    // Abrir el formulario de clases
    mostrarDialogo(
        titulo: string,
        clase?: ClaseModel,
        info: boolean = false
    ): void {

        // El entrenador y el cliente únicamente consultan
        if (this.esEntrenador || this.esCliente) {

            if (!info || !clase ||
                !this.puedeConsultarClase(clase)) {

                return;

            }

            this.alerta(
                'info',
                'Clase: ' + clase.nombre +
                '\nDescripción: ' + clase.descripcion +
                '\nEntrenador: ' +
                    this.obtenerEntrenador(clase.entrenador_id) +
                '\nCapacidad: ' + clase.capacidad + ' personas' +
                '\nFecha de inicio: ' + clase.fecha_hora_inicio +
                '\nFecha de fin: ' + clase.fecha_hora_fin +
                '\nEstado: ' + clase.estado
            );

            return;

        }

        // Solo el administrador puede utilizar el formulario
        if (!this.esAdmin) {

            return;

        }

        const dialogRef = this.dialog.open(FrmClase, {

            width: '90vw',
            maxWidth: '35rem',
            disableClose: true,

            data: {
                title: titulo,
                data: clase,
                info: info
            }

        });

        dialogRef.afterClosed().subscribe(objClase => {

            if (!objClase || info || !this.esAdmin) {

                return;

            }

            this.srvClase.guardar(
                objClase,
                clase?.id
            ).subscribe({

                next: () => {

                    this.resetFilter();

                    this.alerta(
                        'check_circle',
                        clase
                            ? 'Clase actualizada correctamente.'
                            : 'Clase registrada correctamente.'
                    );

                },

                error: (error: HttpErrorResponse) => {

                    this.alerta(
                        'error',
                        this.obtenerMensajeError(error)
                    );

                }

            });

        });

    }

    // Obtener el mensaje de error del backend
    obtenerMensajeError(error: HttpErrorResponse): string {

        if (error.error?.errors) {

            return Object.values(error.error.errors).join('\n');

        }

        if (error.error?.message) {

            return error.error.message;

        }

        if (error.status === 403) {

            return 'No tiene permiso para realizar esta operación.';

        }

        if (error.status === 409) {

            return 'La clase ya existe o tiene información asociada.';

        }

        return 'No se pudo realizar la operación.';

    }

    // Registrar una nueva clase
    onCreate(): void {

        if (!this.esAdmin) {

            return;

        }

        this.mostrarDialogo('Nueva clase');

    }

    // Editar una clase
    onEdit(id: number): void {

        if (!this.esAdmin) {

            return;

        }

        this.consultarInfo = false;

        this.buscarID.set(id);

        this.srvClase.buscarPorId(id);

        this.srvClase.clasePorId.reload();

    }

    // Consultar información de una clase
    onInfo(id: number): void {

        if (this.esEntrenador || this.esCliente) {

            for (const clase of this.dataSource()) {

                if (Number(clase.id) === id &&
                    this.puedeConsultarClase(clase)) {

                    this.mostrarDialogo(
                        'Información de la clase',
                        clase,
                        true
                    );

                    return;

                }

            }

            return;

        }

        if (!this.esAdmin) {

            return;

        }

        this.consultarInfo = true;

        this.buscarID.set(id);

        this.srvClase.buscarPorId(id);

        this.srvClase.clasePorId.reload();

    }

    // Eliminar una clase
    onDelete(id: number): void {

        if (!this.esAdmin) {

            return;

        }

        const dialogRef = this.dialog.open(DialogoGeneral, {

            width: '90vw',
            maxWidth: '25rem',

            data: {
                icono: 'warning',
                texto: '¿Está seguro de eliminar esta clase?',
                textoAceptar: 'Eliminar',
                textoCancelar: 'Cancelar'
            }

        });

        dialogRef.afterClosed().subscribe(respuesta => {

            if (respuesta === true && this.esAdmin) {

                this.srvClase.eliminar(id).subscribe({

                    next: () => {

                        this.resetFilter();

                        this.alerta(
                            'check_circle',
                            'Operación realizada correctamente.'
                        );

                    },

                    error: (error: HttpErrorResponse) => {

                        this.alerta(
                            'error',
                            this.obtenerMensajeError(error)
                        );

                    }

                });

            }

        });

    }

 obtenerEntrenador(entrenador_id: number): string {

    if (this.srvUsuario.usuarios.hasValue()) {

        for (const usuario of
            this.srvUsuario.usuarios.value().data) {

            if (Number(usuario.id) === Number(entrenador_id)) {

                return usuario.nombre + ' ' + usuario.apellido;

            }

        }

    }

    return 'Entrenador ID: ' + entrenador_id;

}

    // Imprimir las clases autorizadas
    onPrint(): void {

        if (!this.esAdmin &&
            !this.esEntrenador &&
            !this.esCliente) {

            return;

        }

        const columnas = [
            'ID',
            'Nombre',
            'Descripción',
            'Entrenador',
            'Capacidad',
            'Fecha y hora de inicio',
            'Fecha y hora de fin',
            'Estado'
        ];

        const registros = this.dataSource().filter(clase =>
            this.puedeConsultarClase(clase)
        );

        const filas = registros.map(clase => [

            clase.id ?? '',
            clase.nombre,
            clase.descripcion,
            this.obtenerEntrenador(clase.entrenador_id),
            clase.capacidad,
            clase.fecha_hora_inicio,
            clase.fecha_hora_fin,
            clase.estado ?? ''

        ]);

        this.srvPrint.print(
            columnas,
            filas,
            this.tituloCatalogo
        );

    }

ngOnInit(): void {

    if (this.esAdmin) {

        this.srvUsuario.filtrar({nombre: ''});

    }

    this.resetFilter();

}

}