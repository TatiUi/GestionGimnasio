import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UsuarioService } from '../../../shared/services/usuario-service';
import { UsuarioModel } from '../../../shared/models/usuario-model';
import { ClaseService } from '../../../shared/services/clase-service';
import { ClaseModel } from '../../../shared/models/clase-model';
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

interface InscripcionForm {
    usuario_id: number;
    clase_id: number;
    fecha_inscripcion: string;
    estado: 'Inscrito' | 'Cancelado';
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
    selector: 'app-frm-inscripcion',
    styleUrl: './frm-inscripcion.css',
    templateUrl: './frm-inscripcion.html',
})
export class FrmInscripcion implements OnInit {

    titulo: string = '';

    dialogRef = inject(MatDialogRef<FrmInscripcion>);

    private readonly data = inject(MAT_DIALOG_DATA);

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

    // Comprobar si el usuario es cliente
    public get esCliente(): boolean {

        return this.srvAuth.isLoggedIn() &&
            this.srvAuth.getRol() === Roles.Cliente;

    }

    objInscripcion = signal<InscripcionForm>({
        usuario_id: 0,
        clase_id: 0,
        fecha_inscripcion: '',
        estado: 'Inscrito'
    });

    frmInscripcion = form(this.objInscripcion, (s) => {

        // Validar usuario
        required(s.usuario_id, {
            message: 'El usuario es requerido'
        });

        min(s.usuario_id, 1, {
            message: 'Seleccione un cliente'
        });

        // Validar clase
        required(s.clase_id, {
            message: 'La clase es requerida'
        });

        min(s.clase_id, 1, {
            message: 'Seleccione una clase'
        });

        // Validar fecha de inscripción
        required(s.fecha_inscripcion, {
            message: 'La fecha de inscripción es requerida'
        });

        // Validar estado
        required(s.estado, {
            message: 'El estado es requerido'
        });

        // Restringir los campos según el rol
        readonly(s.usuario_id, () =>
            this.isInfo || this.esCliente
        );

        readonly(s.clase_id, () =>
            this.isInfo
        );

        readonly(s.fecha_inscripcion, () =>
            this.isInfo || this.esCliente
        );

        readonly(s.estado, () =>
            this.isInfo || this.esCliente
        );

    }, {
        submission: {
            action: async () => {

                if (this.isInfo ||
                    (!this.esAdmin && !this.esCliente)) {

                    return;

                }

                const inscripcion = this.objInscripcion();

                if (this.esCliente) {

                    // El cliente no puede editar registros existentes
                    if (this.isEditing) {

                        return;

                    }

                    // Comprobar que la clase seleccionada esté disponible
                    if (!this.claseDisponibleSeleccionada()) {

                        return;

                    }

                    // Asignar los datos del cliente automáticamente
                    this.dialogRef.close({
                        ...inscripcion,
                        usuario_id:
                            Number(this.srvAuth.getUsuarioId()),
                        fecha_inscripcion:
                            this.obtenerFechaActual() + ' 00:00:00',
                        estado: 'Inscrito'
                    });

                } else {

                    // Guardar los datos seleccionados por el administrador
                    this.dialogRef.close({
                        ...inscripcion,
                        fecha_inscripcion:
                            inscripcion.fecha_inscripcion + ' 00:00:00'
                    });

                }

            }
        }
    });

    // Obtener únicamente los usuarios con rol de cliente
    obtenerClientes(): UsuarioModel[] {

        const clientes: UsuarioModel[] = [];

        if (this.esAdmin &&
            this.srvUsuario.usuarios.hasValue()) {

            for (const usuario of this.srvUsuario.usuarios.value().data) {

                if (Number(usuario.rol_id) === Roles.Cliente) {

                    clientes.push(usuario);

                }

            }

        }

        return clientes;

    }

    // Obtener las clases según el rol
    obtenerClases(): ClaseModel[] {

        const clases: ClaseModel[] = [];

        if (this.srvClase.clases.hasValue()) {

            for (const clase of this.srvClase.clases.value().data) {

                if (this.esAdmin) {

                    clases.push(clase);

                } else if (this.esCliente) {

                    const fechaInicio = new Date(
                        clase.fecha_hora_inicio.replace(' ', 'T')
                    );

                    if (clase.estado === 'Programada' &&
                        fechaInicio.getTime() > Date.now()) {

                        clases.push(clase);

                    }

                }

            }

        }

        return clases;

    }

    // Comprobar si la clase seleccionada sigue disponible
    claseDisponibleSeleccionada(): boolean {

        for (const clase of this.obtenerClases()) {

            if (Number(clase.id) ===
                Number(this.objInscripcion().clase_id)) {

                return true;

            }

        }

        return false;

    }

    // Obtener el correo del cliente autenticado
    obtenerClienteActual(): string {

        return this.srvAuth.getUsuario().correo_electronico;

    }

    // Obtener la fecha actual en formato YYYY-MM-DD
    obtenerFechaActual(): string {

        const fecha = new Date();

        const anio = fecha.getFullYear();

        const mes = String(fecha.getMonth() + 1)
            .padStart(2, '0');

        const dia = String(fecha.getDate())
            .padStart(2, '0');

        return anio + '-' + mes + '-' + dia;

    }

    ngOnInit(): void {

        this.titulo = this.data.title;

        // Impedir el acceso a usuarios no autorizados
        if (!this.esAdmin && !this.esCliente) {

            this.dialogRef.close(false);

            return;

        }

        if (this.esCliente) {

            if (this.isEditing || this.isInfo) {

                this.dialogRef.close(false);

                return;

            }

            // Cargar las clases sin consultar usuarios
            this.srvClase.filtrar({nombre: ''});

            // Asignar los datos automáticamente
            this.objInscripcion.set({
                usuario_id:
                    Number(this.srvAuth.getUsuarioId()),
                clase_id: 0,
                fecha_inscripcion:
                    this.obtenerFechaActual(),
                estado: 'Inscrito'
            });

        } else {

            // El administrador consulta los usuarios y clases
            this.srvUsuario.filtrar({nombre: ''});

            this.srvClase.filtrar({nombre: ''});

            // Cargar los datos al editar o consultar
            if (this.data.data) {

                this.objInscripcion.set({
                    usuario_id: Number(this.data.data.usuario_id),
                    clase_id: Number(this.data.data.clase_id),
                    fecha_inscripcion:
                        this.data.data.fecha_inscripcion.substring(0, 10),
                    estado: this.data.data.estado
                });

            }

        }

    }

}