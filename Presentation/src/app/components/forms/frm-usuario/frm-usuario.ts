import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UsuarioCreateInput } from '../../../shared/models/usuario-model';
import { RolService } from '../../../shared/services/rol-service';
import {
    form,
    FormField,
    FormRoot,
    maxLength,
    minLength,
    pattern,
    required,
    readonly,
    email,
    validate,
    RootFieldContext
} from '@angular/forms/signals';

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
    selector: 'app-frm-usuario',
    styleUrl: './frm-usuario.css',
    templateUrl: './frm-usuario.html',
})
export class FrmUsuario implements OnInit {

    titulo: string = '';

    dialogRef = inject(MatDialogRef<FrmUsuario>);

    private readonly data = inject(MAT_DIALOG_DATA);

    srvRol = inject(RolService);

    readonly isEditing = this.data.data !== undefined;
    readonly isInfo = this.data.info === true;

    objUsuario = signal<UsuarioCreateInput>({
        rol_id: 0,
        nombre: '',
        apellido: '',
        cedula: '',
        correo_electronico: '',
        telefono: '',
        password: ''
    });

    frmUsuario = form(this.objUsuario, (s) => {

        // Validar rol
        required(s.rol_id, {
            message: 'El rol es requerido'
        });

        validate(s.rol_id, (context: RootFieldContext<number>) => {

            const valor = Number(context.value());

            if (!Number.isInteger(valor) || valor <= 0) {
                return {
                    kind: 'invalid',
                    message: 'Seleccione un rol válido'
                };
            }

            return null;
        });

        // Validar nombre
        required(s.nombre, {
            message: 'El nombre es requerido'
        });

        pattern(s.nombre, /\S/, {
            message: 'Ingrese un nombre válido'
        });

        // Validar apellido
        required(s.apellido, {
            message: 'El apellido es requerido'
        });

        pattern(s.apellido, /\S/, {
            message: 'Ingrese un apellido válido'
        });

        // Validar cédula
        required(s.cedula, {
            message: 'La cédula es requerida'
        });

        // Validar correo electrónico
        required(s.correo_electronico, {
            message: 'El correo electrónico es requerido'
        });

        email(s.correo_electronico, {
            message: 'Ingrese un correo electrónico válido'
        });

        // Validar teléfono
        required(s.telefono, {
            message: 'El teléfono es requerido'
        });

        // Validar contraseña
        if (!this.isEditing && !this.isInfo) {

            required(s.password, {
                message: 'La contraseña es requerida'
            });

        }

        minLength(s.password, 8, {
            message: 'La contraseña debe tener al menos 8 caracteres'
        });

        maxLength(s.password, 64, {
            message: 'La contraseña no puede superar los 64 caracteres'
        });

        // Modo de solo lectura
        readonly(s.rol_id, () => this.isInfo);
        readonly(s.nombre, () => this.isInfo);
        readonly(s.apellido, () => this.isInfo);
        readonly(s.cedula, () => this.isInfo);
        readonly(s.correo_electronico, () => this.isInfo);
        readonly(s.telefono, () => this.isInfo);
        readonly(s.password, () => this.isInfo);

    }, {
        submission: {
            action: async () => {

                if (this.isInfo) {
                    return;
                }

                const datos = {...this.objUsuario()};

                if (this.isEditing && !datos.password) {

                    const { password, ...datosActualizados } = datos;

                    this.dialogRef.close(datosActualizados);

                } else {

                    this.dialogRef.close(datos);

                }
            }
        }
    });

    ngOnInit(): void {

        this.titulo = this.data.title;

        // Cargar los roles disponibles
        this.srvRol.filtrar({});

        // Cargar los datos del usuario al editar o consultar
        if (this.data.data) {

            this.objUsuario.set({
                rol_id: Number(this.data.data.rol_id),
                nombre: this.data.data.nombre,
                apellido: this.data.data.apellido,
                cedula: this.data.data.cedula,
                correo_electronico: this.data.data.correo_electronico,
                telefono: this.data.data.telefono ?? '',
                password: ''
            });

        }
    }
}