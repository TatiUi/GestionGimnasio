import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { AsistenciaService } from '../../shared/services/asistencia-service';
import { AsistenciaModel } from '../../shared/models/asistencia-model';
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
import { FrmAsistencia } from '../forms/frm-asistencia/frm-asistencia';
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
    selector: 'app-asistencias-component',
    styleUrl: './asistencias-component.css',
    templateUrl: './asistencias-component.html',
})
export class AsistenciasComponent implements OnInit {

    buscarID = signal<number | null>(null);

    displayedColumns: string[] = [
        'id',
        'inscripcion',
        'usuario',
        'clase',
        'fecha_asistencia',
        'estado',
        'botonera'
    ];

    dataSource = signal<AsistenciaModel[]>([]);

    inscripciones = signal<InscripcionModel[]>([]);

    usuarios = signal<UsuarioModel[]>([]);

    clases = signal<ClaseModel[]>([]);

    srvAsistencia = inject(AsistenciaService);

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

    // Obtener el título según el rol
    public get tituloCatalogo(): string {

        return this.esAdmin
            ? 'Catálogo de asistencias'
            : 'Asistencias de mis clases';

    }

    constructor() {

        // Cargar las asistencias autorizadas
        effect(() => {

            const respuesta = this.srvAsistencia.asistencias;

            if (respuesta.hasValue()) {

                this.dataSource.set(
                    respuesta.value().data.filter(asistencia =>
                        this.puedeGestionarClase(asistencia.clase_id)
                    )
                );

            } else {

                this.dataSource.set([]);

            }

        });

        // Cargar las inscripciones según el rol
        effect(() => {

            const respuesta = this.srvInscripcion.inscripciones;

            if (respuesta.hasValue()) {

                this.inscripciones.set(
                    respuesta.value().data.filter(inscripcion =>
                        this.puedeGestionarClase(inscripcion.clase_id)
                    )
                );

            } else {

                this.inscripciones.set([]);

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

                if (this.esAdmin) {

                    this.clases.set(registros);

                } else if (this.esEntrenador) {

                    this.clases.set(registros.filter(clase =>
                        Number(clase.entrenador_id) ===
                        Number(this.srvAuth.getUsuarioId())
                    ));

                } else {

                    this.clases.set([]);

                }

            } else {

                this.clases.set([]);

            }

        });

        // Obtener una asistencia por su ID
        effect(() => {

            const id = this.buscarID();

            if (id === null) {
                return;
            }

            const respuesta = this.srvAsistencia.asistenciaPorId;

            if (respuesta.status() === 'resolved' &&
                respuesta.hasValue()) {

                const asistencia = respuesta.value().data;

                if (asistencia && Number(asistencia.id) === id) {

                    this.buscarID.set(null);

                    if (!this.puedeGestionarClase(asistencia.clase_id)) {
                        return;
                    }

                    this.mostrarDialogo(
                        this.consultarInfo
                            ? 'Información de la asistencia'
                            : 'Editar asistencia',
                        asistencia,
                        this.consultarInfo
                    );

                }

            }

            if (respuesta.error()) {

                this.buscarID.set(null);

                this.alerta(
                    'error',
                    'No se pudo consultar la asistencia.'
                );

            }

        });

    }

    // Comprobar si el usuario puede gestionar una clase
    puedeGestionarClase(clase_id: number): boolean {

        if (this.esAdmin) {

            return true;

        }

        if (this.esEntrenador) {

            for (const clase of this.clases()) {

                if (Number(clase.id) === Number(clase_id) &&
                    Number(clase.entrenador_id) ===
                    Number(this.srvAuth.getUsuarioId())) {

                    return true;

                }

            }

        }

        return false;

    }

    // Comprobar que la inscripción pertenezca a la clase
    inscripcionValida(asistencia: AsistenciaModel): boolean {

        for (const inscripcion of this.inscripciones()) {

            if (Number(inscripcion.id) ===
                Number(asistencia.inscripcion_id) &&
                Number(inscripcion.clase_id) ===
                Number(asistencia.clase_id) &&
                inscripcion.estado === 'Inscrito') {

                return this.puedeGestionarClase(
                    inscripcion.clase_id
                );

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

        this.filtrarAsistencias();

    }

    // Limpiar el filtro
    resetFilter(): void {

        this.filtro = {
            estado: ''
        };

        this.objFilter.set({
            estado: ''
        });

        this.filtrarAsistencias();

    }

    // Consultar las asistencias según el rol
    filtrarAsistencias(): void {

        this.dataSource.set([]);

        if (this.esAdmin) {

            this.srvAsistencia.filtrar({...this.filtro});

        } else if (this.esEntrenador) {

            this.srvAsistencia.filtrar({
                ...this.filtro,
                entrenador_id: Number(this.srvAuth.getUsuarioId())
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

    // Abrir el formulario de asistencias
    mostrarDialogo(
        titulo: string,
        asistencia?: AsistenciaModel,
        info: boolean = false
    ): void {

        if (!this.esAdmin && !this.esEntrenador) {

            return;

        }

        // Verificar que el entrenador tenga asignada la clase
        if (asistencia &&
            !this.puedeGestionarClase(asistencia.clase_id)) {

            return;

        }

        // Consultar información como entrenador
        if (this.esEntrenador && info && asistencia) {

            this.alerta(
                'info',
                'Inscripción: #' + asistencia.inscripcion_id +
                '\nCliente: ' +
                    this.obtenerCliente(asistencia.inscripcion_id) +
                '\nClase: ' +
                    this.obtenerClase(asistencia.clase_id) +
                '\nFecha de asistencia: ' +
                    asistencia.fecha_asistencia +
                '\nEstado: ' + asistencia.estado
            );

            return;

        }

        const dialogRef = this.dialog.open(FrmAsistencia, {

            width: '90vw',
            maxWidth: '35rem',
            disableClose: true,

            data: {
                title: titulo,
                data: asistencia,
                info: info
            }

        });

        dialogRef.afterClosed().subscribe(objAsistencia => {

            if (!objAsistencia || info ||
                (!this.esAdmin && !this.esEntrenador)) {

                return;

            }

            // Validar las operaciones del entrenador
            if (this.esEntrenador) {

                if (!this.puedeGestionarClase(
                    objAsistencia.clase_id
                )) {

                    this.alerta(
                        'error',
                        'No tiene permiso para gestionar esta clase.'
                    );

                    return;

                }

                if (asistencia) {

                    // El entrenador no puede cambiar la inscripción
                    // ni la clase de una asistencia existente
                    if (!this.puedeGestionarClase(asistencia.clase_id) ||
                        Number(objAsistencia.inscripcion_id) !==
                        Number(asistencia.inscripcion_id) ||
                        Number(objAsistencia.clase_id) !==
                        Number(asistencia.clase_id)) {

                        return;

                    }

                } else if (!this.inscripcionValida(objAsistencia)) {

                    this.alerta(
                        'error',
                        'La inscripción seleccionada no es válida.'
                    );

                    return;

                }

            }

            this.srvAsistencia.guardar(
                objAsistencia,
                asistencia?.id
            ).subscribe({

                next: () => {

                    this.resetFilter();

                    this.alerta(
                        'check_circle',
                        asistencia
                            ? 'Asistencia actualizada correctamente.'
                            : 'Asistencia registrada correctamente.'
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

            return 'La asistencia ya existe o tiene información asociada.';

        }

        return 'No se pudo realizar la operación.';

    }

    // Registrar una asistencia
    onCreate(): void {

        if (!this.esAdmin && !this.esEntrenador) {

            return;

        }

        this.mostrarDialogo('Nueva asistencia');

    }

    // Editar una asistencia
    onEdit(id: number): void {

        if (!this.esAdmin && !this.esEntrenador) {

            return;

        }

        if (this.esEntrenador) {

            for (const asistencia of this.dataSource()) {

                if (Number(asistencia.id) === id &&
                    this.puedeGestionarClase(asistencia.clase_id)) {

                    this.mostrarDialogo(
                        'Editar asistencia',
                        asistencia
                    );

                    return;

                }

            }

            return;

        }

        this.consultarInfo = false;

        this.buscarID.set(id);

        this.srvAsistencia.buscarPorId(id);

        this.srvAsistencia.asistenciaPorId.reload();

    }

    // Consultar información de una asistencia
    onInfo(id: number): void {

        if (this.esEntrenador) {

            for (const asistencia of this.dataSource()) {

                if (Number(asistencia.id) === id &&
                    this.puedeGestionarClase(asistencia.clase_id)) {

                    this.mostrarDialogo(
                        'Información de la asistencia',
                        asistencia,
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

        this.srvAsistencia.buscarPorId(id);

        this.srvAsistencia.asistenciaPorId.reload();

    }

    // Eliminar una asistencia
    onDelete(id: number): void {

        // Solo el administrador puede eliminar
        if (!this.esAdmin) {

            return;

        }

        const dialogRef = this.dialog.open(DialogoGeneral, {

            width: '90vw',
            maxWidth: '25rem',

            data: {
                icono: 'warning',
                texto: '¿Está seguro de eliminar esta asistencia?',
                textoAceptar: 'Eliminar',
                textoCancelar: 'Cancelar'
            }

        });

        dialogRef.afterClosed().subscribe(respuesta => {

            if (respuesta === true && this.esAdmin) {

                this.srvAsistencia.eliminar(id).subscribe({

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

    // Obtener el nombre completo del usuario
    obtenerUsuario(usuario_id: number): string {

        if (this.esAdmin) {

            for (const usuario of this.usuarios()) {

                if (Number(usuario.id) === Number(usuario_id)) {

                    return usuario.nombre + ' ' + usuario.apellido;

                }

            }

        }

        return 'Usuario ID: ' + usuario_id;

    }

    // Obtener el cliente asociado a la inscripción
    obtenerCliente(inscripcion_id: number): string {

        for (const inscripcion of this.inscripciones()) {

            if (Number(inscripcion.id) === Number(inscripcion_id) &&
                this.puedeGestionarClase(inscripcion.clase_id)) {

                return this.obtenerUsuario(inscripcion.usuario_id);

            }

        }

        return 'Inscripción ID: ' + inscripcion_id;

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

    // Imprimir las asistencias autorizadas
    onPrint(): void {

        if (!this.esAdmin && !this.esEntrenador) {

            return;

        }

        const columnas = [
            'ID',
            'Inscripción',
            'Cliente',
            'Clase',
            'Fecha de asistencia',
            'Estado'
        ];

        const registros = this.dataSource().filter(asistencia =>
            this.puedeGestionarClase(asistencia.clase_id)
        );

        const filas = registros.map(asistencia => [

            asistencia.id ?? '',
            asistencia.inscripcion_id,
            this.obtenerCliente(asistencia.inscripcion_id),
            this.obtenerClase(asistencia.clase_id),
            asistencia.fecha_asistencia,
            asistencia.estado

        ]);

        this.srvPrint.print(
            columnas,
            filas,
            this.tituloCatalogo
        );

    }

    ngOnInit(): void {

        if (this.esAdmin) {

            // Cargar todas las inscripciones, usuarios y clases
            this.srvInscripcion.filtrar({estado: ''});

            this.srvUsuario.filtrar({nombre: ''});

            this.srvClase.filtrar({nombre: ''});

        } else if (this.esEntrenador) {

            // Cargar las clases asignadas al entrenador
            this.srvClase.filtrar({
                entrenador_id: Number(this.srvAuth.getUsuarioId())
            });

            // Cargar las inscripciones de sus clases
            this.srvInscripcion.filtrar({
                estado: '',
                entrenador_id: Number(this.srvAuth.getUsuarioId())
            });

        }

        // Cargar las asistencias según el rol
        this.resetFilter();

    }

}