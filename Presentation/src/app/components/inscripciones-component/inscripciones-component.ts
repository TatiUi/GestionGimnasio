import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { InscripcionService } from '../../shared/services/inscripcion-service';
import { InscripcionModel } from '../../shared/models/inscripcion-model';
import { UsuarioService } from '../../shared/services/usuario-service';
import { UsuarioModel } from '../../shared/models/usuario-model';
import { ClaseService } from '../../shared/services/clase-service';
import { ClaseModel } from '../../shared/models/clase-model';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FrmInscripcion } from '../forms/frm-inscripcion/frm-inscripcion';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogoGeneral } from '../forms/dialogo-general/dialogo-general';
import { PrintService } from '../../shared/services/print-service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { form, FormField } from '@angular/forms/signals';
import { AuthService } from '../../shared/services/auth-service';
import { Roles } from '../../shared/models/roles';

interface FilterForm {
    estado: string;
}

@Component({
    imports: [
        MatTableModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatExpansionModule,
        MatSelectModule,
        FormField
    ],
    selector: 'app-inscripciones-component',
    styleUrl: './inscripciones-component.css',
    templateUrl: './inscripciones-component.html',
})
export class InscripcionesComponent implements OnInit {

    buscarID = signal<number | null>(null);

    displayedColumns: string[] = [
        'id',
        'usuario',
        'clase',
        'fecha_inscripcion',
        'estado',
        'botonera'
    ];

    dataSource = signal<InscripcionModel[]>([]);

    usuarios = signal<UsuarioModel[]>([]);

    clases = signal<ClaseModel[]>([]);

    srvInscripcion = inject(InscripcionService);

    srvUsuario = inject(UsuarioService);

    srvClase = inject(ClaseService);

    srvAuth = inject(AuthService);

    dialog = inject(MatDialog);

    srvPrint = inject(PrintService);

    filtro = {
        estado: ''
    };

    panelFilterState = signal(false);

    objFilter = signal<FilterForm>({
        estado: ''
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

            return 'Catálogo de inscripciones';

        }

        if (this.esEntrenador) {

            return 'Inscripciones de mis clases';

        }

        return 'Mis inscripciones';

    }

    constructor() {

        // Cargar las inscripciones según el rol
        effect(() => {

            const respuesta = this.srvInscripcion.inscripciones;

            if (respuesta.hasValue()) {

                this.dataSource.set(
                    respuesta.value().data.filter(inscripcion =>
                        this.puedeConsultarInscripcion(inscripcion)
                    )
                );

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

        // Cargar las clases según el rol
        effect(() => {

            const respuesta = this.srvClase.clases;

            if (respuesta.hasValue()) {

                const registros = respuesta.value().data;

                if (this.esEntrenador) {

                    this.clases.set(registros.filter(clase =>
                        Number(clase.entrenador_id) ===
                        Number(this.srvAuth.getUsuarioId())
                    ));

                } else if (this.esAdmin || this.esCliente) {

                    this.clases.set(registros);

                } else {

                    this.clases.set([]);

                }

            } else {

                this.clases.set([]);

            }

        });

        // Obtener una inscripción por su ID
        effect(() => {

            const id = this.buscarID();

            if (id === null) {
                return;
            }

            const respuesta = this.srvInscripcion.inscripcionPorId;

            if (respuesta.status() === 'resolved' &&
                respuesta.hasValue()) {

                const inscripcion = respuesta.value().data;

                if (inscripcion && Number(inscripcion.id) === id) {

                    this.buscarID.set(null);

                    if (!this.puedeConsultarInscripcion(inscripcion)) {
                        return;
                    }

                    this.mostrarDialogo(
                        this.consultarInfo
                            ? 'Información de la inscripción'
                            : 'Editar inscripción',
                        inscripcion,
                        this.consultarInfo
                    );

                }

            }

            if (respuesta.error()) {

                this.buscarID.set(null);

                this.alerta(
                    'error',
                    'No se pudo consultar la inscripción.'
                );

            }

        });

    }

    // Comprobar si el usuario puede consultar una inscripción
    puedeConsultarInscripcion(
        inscripcion: InscripcionModel
    ): boolean {

        if (this.esAdmin) {

            return true;

        }

        // El cliente únicamente consulta sus inscripciones
        if (this.esCliente) {

            return Number(inscripcion.usuario_id) ===
                Number(this.srvAuth.getUsuarioId());

        }

        // El entrenador consulta las inscripciones de sus clases
        if (this.esEntrenador) {

            for (const clase of this.clases()) {

                if (Number(clase.id) ===
                    Number(inscripcion.clase_id) &&
                    Number(clase.entrenador_id) ===
                    Number(this.srvAuth.getUsuarioId())) {

                    return true;

                }

            }

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

    // Filtrar por estado
    onFilterChange(estado: string): void {

        this.filtro.estado = estado;

        this.filtrarInscripciones();

    }

    // Limpiar el filtro
    resetFilter(): void {

        this.filtro = {
            estado: ''
        };

        this.objFilter.set({
            estado: ''
        });

        this.filtrarInscripciones();

    }

    // Consultar las inscripciones según el rol
    filtrarInscripciones(): void {

        this.dataSource.set([]);

        if (this.esAdmin) {

            this.srvInscripcion.filtrar({...this.filtro});

        } else if (this.esEntrenador) {

            this.srvInscripcion.filtrar({
                ...this.filtro,
                entrenador_id: Number(this.srvAuth.getUsuarioId())
            });

        } else if (this.esCliente) {

            this.srvInscripcion.filtrar({
                ...this.filtro,
                usuario_id: Number(this.srvAuth.getUsuarioId())
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

    // Abrir el formulario de inscripciones
    mostrarDialogo(
        titulo: string,
        inscripcion?: InscripcionModel,
        info: boolean = false
    ): void {

        // Consultar información sin cargar todos los usuarios
        if (info && !this.esAdmin) {

            if (!inscripcion ||
                !this.puedeConsultarInscripcion(inscripcion)) {

                return;

            }

            this.alerta(
                'info',
                'Cliente: ' +
                    this.obtenerUsuario(inscripcion.usuario_id) +
                '\nClase: ' +
                    this.obtenerClase(inscripcion.clase_id) +
                '\nFecha de inscripción: ' +
                    inscripcion.fecha_inscripcion +
                '\nEstado: ' + inscripcion.estado
            );

            return;

        }

        // El entrenador no puede registrar ni editar
        if (!this.esAdmin && !this.esCliente) {

            return;

        }

        // El cliente no puede editar inscripciones
        if (this.esCliente && inscripcion) {

            return;

        }

        const dialogRef = this.dialog.open(FrmInscripcion, {

            width: '90vw',
            maxWidth: '35rem',
            disableClose: true,

            data: {
                title: titulo,
                data: inscripcion,
                info: info
            }

        });

        dialogRef.afterClosed().subscribe(objInscripcion => {

            if (!objInscripcion || info) {

                return;

            }

            if (!this.esAdmin && !this.esCliente) {

                return;

            }

            // Garantizar que el cliente se inscriba a sí mismo
            if (this.esCliente) {

                if (inscripcion) {
                    return;
                }

                objInscripcion.usuario_id =
                    Number(this.srvAuth.getUsuarioId());

                objInscripcion.estado = 'Inscrito';

            }

            this.srvInscripcion.guardar(
                objInscripcion,
                inscripcion?.id
            ).subscribe({

                next: () => {

                    this.resetFilter();

                    this.alerta(
                        'check_circle',
                        inscripcion
                            ? 'Inscripción actualizada correctamente.'
                            : 'Inscripción registrada correctamente.'
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

            return 'La inscripción ya existe o tiene información asociada.';

        }

        return 'No se pudo realizar la operación.';

    }

    // Registrar una inscripción
    onCreate(): void {

        if (!this.esAdmin && !this.esCliente) {

            return;

        }

        this.mostrarDialogo('Nueva inscripción');

    }

    // Editar una inscripción
    onEdit(id: number): void {

        if (!this.esAdmin) {

            return;

        }

        this.consultarInfo = false;

        this.buscarID.set(id);

        this.srvInscripcion.buscarPorId(id);

        this.srvInscripcion.inscripcionPorId.reload();

    }

    // Consultar información de una inscripción
    onInfo(id: number): void {

        if (this.esEntrenador || this.esCliente) {

            for (const inscripcion of this.dataSource()) {

                if (Number(inscripcion.id) === id &&
                    this.puedeConsultarInscripcion(inscripcion)) {

                    this.mostrarDialogo(
                        'Información de la inscripción',
                        inscripcion,
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

        this.srvInscripcion.buscarPorId(id);

        this.srvInscripcion.inscripcionPorId.reload();

    }

    // Comprobar si el cliente puede cancelar una inscripción
    puedeCancelar(inscripcion: InscripcionModel): boolean {

        return this.esCliente &&
            this.puedeConsultarInscripcion(inscripcion) &&
            inscripcion.estado === 'Inscrito';

    }

    // Cancelar una inscripción sin eliminar el registro
    onCancelar(inscripcion: InscripcionModel): void {

        if (!this.puedeCancelar(inscripcion) ||
            !inscripcion.id) {

            return;

        }

        const dialogRef = this.dialog.open(DialogoGeneral, {

            width: '90vw',
            maxWidth: '25rem',

            data: {
                icono: 'warning',
                texto: '¿Está seguro de cancelar esta inscripción?',
                textoAceptar: 'Sí, cancelar',
                textoCancelar: 'Volver'
            }

        });

        dialogRef.afterClosed().subscribe(respuesta => {

            if (respuesta === true &&
                this.puedeCancelar(inscripcion) &&
                inscripcion.id) {

                const datos: InscripcionModel = {
                    ...inscripcion,
                    estado: 'Cancelado'
                };

                this.srvInscripcion.guardar(
                    datos,
                    inscripcion.id
                ).subscribe({

                    next: () => {

                        this.resetFilter();

                        this.alerta(
                            'check_circle',
                            'Inscripción cancelada correctamente.'
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

    // Eliminar una inscripción
    onDelete(id: number): void {

        if (!this.esAdmin) {

            return;

        }

        const dialogRef = this.dialog.open(DialogoGeneral, {

            width: '90vw',
            maxWidth: '25rem',

            data: {
                icono: 'warning',
                texto: '¿Está seguro de eliminar esta inscripción?',
                textoAceptar: 'Eliminar',
                textoCancelar: 'Cancelar'
            }

        });

        dialogRef.afterClosed().subscribe(respuesta => {

            if (respuesta === true && this.esAdmin) {

                this.srvInscripcion.eliminar(id).subscribe({

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

    // Obtener el nombre del cliente
    obtenerUsuario(usuario_id: number): string {

        if (this.esCliente &&
            Number(usuario_id) ===
            Number(this.srvAuth.getUsuarioId())) {

            return this.srvAuth.getUsuario().correo_electronico;

        }

        if (this.esAdmin) {

            for (const usuario of this.usuarios()) {

                if (Number(usuario.id) === Number(usuario_id)) {

                    return usuario.nombre + ' ' + usuario.apellido;

                }

            }

        }

        return 'Usuario ID: ' + usuario_id;

    }

    // Obtener el nombre de la clase
    obtenerClase(clase_id: number): string {

        for (const clase of this.clases()) {

            if (Number(clase.id) === Number(clase_id)) {

                return clase.nombre;

            }

        }

        return 'Clase ID: ' + clase_id;

    }

    // Imprimir las inscripciones autorizadas
    onPrint(): void {

        if (!this.esAdmin &&
            !this.esEntrenador &&
            !this.esCliente) {

            return;

        }

        const columnas = [
            'ID',
            'Cliente',
            'Clase',
            'Fecha de inscripción',
            'Estado'
        ];

        const registros = this.dataSource().filter(inscripcion =>
            this.puedeConsultarInscripcion(inscripcion)
        );

        const filas = registros.map(inscripcion => [

            inscripcion.id ?? '',
            this.obtenerUsuario(inscripcion.usuario_id),
            this.obtenerClase(inscripcion.clase_id),
            inscripcion.fecha_inscripcion,
            inscripcion.estado

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

            this.srvClase.filtrar({nombre: ''});

        } else if (this.esEntrenador) {

            this.srvClase.filtrar({
                entrenador_id: Number(this.srvAuth.getUsuarioId())
            });

        } else if (this.esCliente) {

            this.srvClase.filtrar({nombre: ''});

        }

        // Cargar las inscripciones según el rol
        this.resetFilter();

    }

}