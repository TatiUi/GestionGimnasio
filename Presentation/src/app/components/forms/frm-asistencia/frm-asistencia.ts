import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InscripcionService } from '../../../shared/services/inscripcion-service';
import { InscripcionModel } from '../../../shared/models/inscripcion-model';
import { UsuarioService } from '../../../shared/services/usuario-service';
import { ClaseService } from '../../../shared/services/clase-service';
import { AuthService } from '../../../shared/services/auth-service';
import { Roles } from '../../../shared/models/roles';
import {
    form,
    FormField,
    FormRoot,
    required,
    min,
    readonly
} from '@angular/forms/signals';

interface AsistenciaForm {
    inscripcion_id: number;
    clase_id: number;
    fecha_asistencia: string;
    estado: 'Presente' | 'Ausente';
}

@Component({
    imports: [
        MatDialogModule,
        MatDividerModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        FormRoot,
        FormField
    ],
    selector: 'app-frm-asistencia',
    styleUrl: './frm-asistencia.css',
    templateUrl: './frm-asistencia.html',
})
export class FrmAsistencia implements OnInit {

    titulo: string = '';

    dialogRef = inject(MatDialogRef<FrmAsistencia>);

    private readonly data = inject(MAT_DIALOG_DATA);

    srvInscripcion = inject(InscripcionService);

    srvUsuario = inject(UsuarioService);

    srvClase = inject(ClaseService);

    srvAuth = inject(AuthService);

    readonly isEditing = this.data.data !== undefined;

    readonly isInfo = this.data.info === true;

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

    objAsistencia = signal<AsistenciaForm>({
        inscripcion_id: 0,
        clase_id: 0,
        fecha_asistencia: '',
        estado: 'Presente'
    });

    frmAsistencia = form(this.objAsistencia, (s) => {

        // Validar inscripción
        required(s.inscripcion_id, {
            message: 'La inscripción es requerida'
        });

        min(s.inscripcion_id, 1, {
            message: 'Seleccione una inscripción'
        });

        // Validar clase
        required(s.clase_id, {
            message: 'La clase es requerida'
        });

        min(s.clase_id, 1, {
            message: 'La inscripción debe tener una clase asociada'
        });

        // Validar fecha de asistencia
        required(s.fecha_asistencia, {
            message: 'La fecha de asistencia es requerida'
        });

        // Validar estado
        required(s.estado, {
            message: 'El estado es requerido'
        });

        // Restringir los campos según el rol
        readonly(s.inscripcion_id, () =>
            this.isInfo ||
            (this.esEntrenador && this.isEditing)
        );

        readonly(s.clase_id, () => true);

        readonly(s.fecha_asistencia, () => this.isInfo);

        readonly(s.estado, () => this.isInfo);

    }, {
        submission: {
            action: async () => {

                if (this.isInfo ||
                    (!this.esAdmin && !this.esEntrenador)) {

                    return;

                }

                const asistencia = this.objAsistencia();

                if (!this.asistenciaValida()) {

                    return;

                }

                // Convertir la fecha al formato del backend
                this.dialogRef.close({
                    ...asistencia,
                    fecha_asistencia:
                        asistencia.fecha_asistencia + ' 00:00:00'
                });

            }
        }
    });

    // Verificar si una clase pertenece al entrenador
    puedeGestionarClase(clase_id: number): boolean {

        if (this.esAdmin) {

            return true;

        }

        if (this.esEntrenador &&
            this.srvClase.clases.hasValue()) {

            for (const clase of this.srvClase.clases.value().data) {

                if (Number(clase.id) === Number(clase_id) &&
                    Number(clase.entrenador_id) ===
                    Number(this.srvAuth.getUsuarioId())) {

                    return true;

                }

            }

        }

        return false;

    }

    // Obtener únicamente las inscripciones autorizadas
    obtenerInscripciones(): InscripcionModel[] {

        const inscripciones: InscripcionModel[] = [];

        if (this.srvInscripcion.inscripciones.hasValue()) {

            for (const inscripcion of
                this.srvInscripcion.inscripciones.value().data) {

                const inscripcionOriginal =
                    this.isEditing &&
                    Number(inscripcion.id) ===
                    Number(this.data.data.inscripcion_id);

                if ((inscripcion.estado === 'Inscrito' ||
                    inscripcionOriginal) &&
                    this.puedeGestionarClase(inscripcion.clase_id)) {

                    inscripciones.push(inscripcion);

                }

            }

        }

        return inscripciones;

    }

    // Obtener el nombre completo del cliente
    obtenerUsuario(usuario_id: number): string {

        if (this.esAdmin &&
            this.srvUsuario.usuarios.hasValue()) {

            for (const usuario of
                this.srvUsuario.usuarios.value().data) {

                if (Number(usuario.id) === Number(usuario_id)) {

                    return usuario.nombre + ' ' + usuario.apellido;

                }

            }

        }

        return 'Usuario ID: ' + usuario_id;

    }

    // Obtener el nombre de la clase
    obtenerClase(clase_id: number): string {

        if (clase_id === 0) {

            return '';

        }

        if (this.srvClase.clases.hasValue()) {

            for (const clase of
                this.srvClase.clases.value().data) {

                if (Number(clase.id) === Number(clase_id) &&
                    this.puedeGestionarClase(clase_id)) {

                    return clase.nombre;

                }

            }

        }

        return 'Clase ID: ' + clase_id;

    }

    // Asignar automáticamente la clase de la inscripción
    onInscripcionChange(inscripcion_id: number): void {

        if (this.isInfo ||
            (!this.esAdmin && !this.esEntrenador) ||
            (this.esEntrenador && this.isEditing)) {

            return;

        }

        let clase_id = 0;

        for (const inscripcion of this.obtenerInscripciones()) {

            if (Number(inscripcion.id) === Number(inscripcion_id)) {

                clase_id = Number(inscripcion.clase_id);

                break;

            }

        }

        this.objAsistencia.update(asistencia => ({

            ...asistencia,
            inscripcion_id: clase_id > 0
                ? Number(inscripcion_id)
                : 0,
            clase_id: clase_id

        }));

    }

    // Verificar la inscripción y la clase antes de guardar
    asistenciaValida(): boolean {

        const asistencia = this.objAsistencia();

        if (asistencia.inscripcion_id <= 0 ||
            asistencia.clase_id <= 0 ||
            !this.puedeGestionarClase(asistencia.clase_id)) {

            return false;

        }

        // Al editar, el entrenador conserva la inscripción original
        if (this.esEntrenador && this.isEditing) {

            return Number(asistencia.inscripcion_id) ===
                Number(this.data.data.inscripcion_id) &&
                Number(asistencia.clase_id) ===
                Number(this.data.data.clase_id);

        }

        // Verificar que la inscripción pertenezca a la clase
        for (const inscripcion of this.obtenerInscripciones()) {

            if (Number(inscripcion.id) ===
                Number(asistencia.inscripcion_id) &&
                Number(inscripcion.clase_id) ===
                Number(asistencia.clase_id)) {

                return true;

            }

        }

        // El administrador puede conservar la inscripción original
        // aunque no aparezca en la página de registros consultada
        if (this.esAdmin && this.isEditing) {

            return Number(asistencia.inscripcion_id) ===
                Number(this.data.data.inscripcion_id) &&
                Number(asistencia.clase_id) ===
                Number(this.data.data.clase_id);

        }

        return false;

    }

    // Mostrar la inscripción original cuando no es editable
    obtenerInscripcionActual(): string {

        const inscripcion_id =
            this.objAsistencia().inscripcion_id;

        for (const inscripcion of this.obtenerInscripciones()) {

            if (Number(inscripcion.id) === Number(inscripcion_id)) {

                return '#' + inscripcion.id + ' - ' +
                    this.obtenerUsuario(inscripcion.usuario_id) +
                    ' - ' +
                    this.obtenerClase(inscripcion.clase_id);

            }

        }

        return 'Inscripción #' + inscripcion_id;

    }

    ngOnInit(): void {

        this.titulo = this.data.title;

        // Impedir el acceso de usuarios no autorizados
        if (!this.esAdmin && !this.esEntrenador) {

            this.dialogRef.close(false);

            return;

        }

        if (this.esAdmin) {

            // El administrador consulta todos los registros
            this.srvInscripcion.filtrar({estado: ''});

            this.srvUsuario.filtrar({nombre: ''});

            this.srvClase.filtrar({nombre: ''});

        } else if (this.esEntrenador) {

            // Cargar únicamente las clases del entrenador
            this.srvClase.filtrar({
                entrenador_id: Number(this.srvAuth.getUsuarioId())
            });

            // Cargar las inscripciones correspondientes
            this.srvInscripcion.filtrar({
                estado: '',
                entrenador_id: Number(this.srvAuth.getUsuarioId())
            });

        }

        // Cargar los datos al editar o consultar
        if (this.data.data) {

            this.objAsistencia.set({
                inscripcion_id: Number(this.data.data.inscripcion_id),
                clase_id: Number(this.data.data.clase_id),
                fecha_asistencia: this.data.data.fecha_asistencia
                    .substring(0, 10),
                estado: this.data.data.estado
            });

        }

    }

}