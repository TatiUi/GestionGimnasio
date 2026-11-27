import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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

interface PlanForm {
    nombre: string;
    descripcion: string;
    precio: number;
    duracion_dias: number;
}

@Component({
    imports: [
        MatDialogModule,
        MatDividerModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        FormRoot,
        FormField
    ],
    selector: 'app-frm-plan-membresia',
    styleUrl: './frm-plan-membresia.css',
    templateUrl: './frm-plan-membresia.html',
})
export class FrmPlanMembresia implements OnInit {

    titulo: string = '';

    dialogRef = inject(MatDialogRef<FrmPlanMembresia>);

    private readonly data = inject(MAT_DIALOG_DATA);

    readonly isEditing = this.data.data !== undefined;

    readonly isInfo = this.data.info === true;

    objPlan = signal<PlanForm>({
        nombre: '',
        descripcion: '',
        precio: 0,
        duracion_dias: 0
    });

    frmPlan = form(this.objPlan, (s) => {

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

        // Validar precio
        required(s.precio, {
            message: 'El precio es requerido'
        });

        min(s.precio, 0.01, {
            message: 'El precio debe ser mayor a cero'
        });

        // Validar duración
        required(s.duracion_dias, {
            message: 'La duración es requerida'
        });

        min(s.duracion_dias, 1, {
            message: 'La duración debe ser de al menos un día'
        });

        // Modo de solo lectura
        readonly(s.nombre, () => this.isInfo);
        readonly(s.descripcion, () => this.isInfo);
        readonly(s.precio, () => this.isInfo);
        readonly(s.duracion_dias, () => this.isInfo);

    }, {
        submission: {
            action: async () => {

                if (!this.isInfo) {

                    this.dialogRef.close(this.objPlan());

                }

            }
        }
    });

    ngOnInit(): void {

        this.titulo = this.data.title;

        if (this.data.data) {

            this.objPlan.set({
                nombre: this.data.data.nombre,
                descripcion: this.data.data.descripcion,
                precio: Number(this.data.data.precio),
                duracion_dias: Number(this.data.data.duracion_dias)
            });

        }

    }

}