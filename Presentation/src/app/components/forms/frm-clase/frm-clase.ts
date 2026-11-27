import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UsuarioService } from '../../../shared/services/usuario-service';
import { UsuarioModel } from '../../../shared/models/usuario-model';
import {
    form,
    FormField,
    FormRoot,
    required,
    maxLength,
    pattern,
    min,
    readonly
} from '@angular/forms/signals';

interface ClaseForm {
    entrenador_id: number;
    nombre: string;
    descripcion: string;
    capacidad: number;
    fecha_hora_inicio: string;
    fecha_hora_fin: string;
    estado: 'Programada' | 'Finalizada' | 'Cancelada';
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
    selector: 'app-frm-clase',
    styleUrl: './frm-clase.css',
    templateUrl: './frm-clase.html',
})
export class FrmClase implements OnInit {

    titulo: string = '';

    dialogRef = inject(MatDialogRef<FrmClase>);

    private readonly data = inject(MAT_DIALOG_DATA);

    srvUsuario = inject(UsuarioService);

    readonly isEditing = this.data.data !== undefined;

    readonly isInfo = this.data.info === true;

    objClase = signal<ClaseForm>({
        entrenador_id: 0,
        nombre: '',
        descripcion: '',
        capacidad: 0,
        fecha_hora_inicio: '',
        fecha_hora_fin: '',
        estado: 'Programada'
    });

    frmClase = form(this.objClase, (s) => {

        // Validar entrenador
        required(s.entrenador_id, {
            message: 'El entrenador es requerido'
        });

        min(s.entrenador_id, 1, {
            message: 'Seleccione un entrenador'
        });

        // Validar nombre
        required(s.nombre, {
            message: 'El nombre es requerido'
        });

        maxLength(s.nombre, 100, {
            message: 'El nombre no puede superar los 100 caracteres'
        });

        pattern(s.nombre, /\S/, {
            message: 'Ingrese un nombre válido'
        });

        // Validar descripción
        required(s.descripcion, {
            message: 'La descripción es requerida'
        });

        pattern(s.descripcion, /\S/, {
            message: 'Ingrese una descripción válida'
        });

        // Validar capacidad
        required(s.capacidad, {
            message: 'La capacidad es requerida'
        });

        min(s.capacidad, 1, {
            message: 'La capacidad debe ser mayor a cero'
        });

        // Validar fecha y hora de inicio
        required(s.fecha_hora_inicio, {
            message: 'La fecha y hora de inicio son requeridas'
        });

        // Validar fecha y hora de finalización
        required(s.fecha_hora_fin, {
            message: 'La fecha y hora de finalización son requeridas'
        });

        // Validar estado
        required(s.estado, {
            message: 'El estado es requerido'
        });

        // Modo de solo lectura
        readonly(s.entrenador_id, () => this.isInfo);
        readonly(s.nombre, () => this.isInfo);
        readonly(s.descripcion, () => this.isInfo);
        readonly(s.capacidad, () => this.isInfo);
        readonly(s.fecha_hora_inicio, () => this.isInfo);
        readonly(s.fecha_hora_fin, () => this.isInfo);
        readonly(s.estado, () => this.isInfo);

    }, {
        submission: {
            action: async () => {

                if (!this.isInfo) {

                    const clase = this.objClase();

                    // Convertir las fechas al formato del backend
                    this.dialogRef.close({
                        ...clase,
                        fecha_hora_inicio: clase.fecha_hora_inicio
                            .substring(0, 16).replace('T', ' ') + ':00',
                        fecha_hora_fin: clase.fecha_hora_fin
                            .substring(0, 16).replace('T', ' ') + ':00'
                    });

                }

            }
        }
    });

    // Obtener únicamente los usuarios con rol de entrenador
    obtenerEntrenadores(): UsuarioModel[] {

        const entrenadores: UsuarioModel[] = [];

        if (this.srvUsuario.usuarios.hasValue()) {

            for (const usuario of this.srvUsuario.usuarios.value().data) {

                if (Number(usuario.rol_id) === 2) {

                    entrenadores.push(usuario);

                }

            }

        }

        return entrenadores;

    }

    ngOnInit(): void {

        this.titulo = this.data.title;

        // Cargar los usuarios
        this.srvUsuario.filtrar({nombre: ''});

        // Cargar los datos al editar o consultar
        if (this.data.data) {

            this.objClase.set({
                entrenador_id: Number(this.data.data.entrenador_id),
                nombre: this.data.data.nombre,
                descripcion: this.data.data.descripcion,
                capacidad: Number(this.data.data.capacidad),
                fecha_hora_inicio: this.data.data.fecha_hora_inicio
                    .substring(0, 16).replace(' ', 'T'),
                fecha_hora_fin: this.data.data.fecha_hora_fin
                    .substring(0, 16).replace(' ', 'T'),
                estado: this.data.data.estado ?? 'Programada'
            });

        }

    }

}