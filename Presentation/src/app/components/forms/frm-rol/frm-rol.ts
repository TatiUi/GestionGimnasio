import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RolCreateInput } from '../../../shared/models/rol-model';
import {
    form,
    FormField,
    FormRoot,
    maxLength,
    required,
    pattern,
    readonly
} from '@angular/forms/signals';

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
    selector: 'app-frm-rol',
    styleUrl: './frm-rol.css',
    templateUrl: './frm-rol.html',
})
export class FrmRol implements OnInit {

    titulo: string = '';

    dialogRef = inject(MatDialogRef<FrmRol>);

    private readonly data = inject(MAT_DIALOG_DATA);

    readonly isEditing = this.data.data !== undefined;
    readonly isInfo = this.data.info === true;

    objRol = signal<RolCreateInput>({
        nombre: ''
    });

    frmRol = form(this.objRol, (s) => {

        required(s.nombre, {
            message: 'El nombre del rol es requerido'
        });

        maxLength(s.nombre, 50, {
            message: 'El nombre no puede tener más de 50 caracteres'
        });

        pattern(s.nombre, /\S/, {
            message: 'El nombre no puede contener únicamente espacios'
        });

        readonly(s.nombre, () => this.isInfo);

    }, {
        submission: {
            action: async () => {
                if (!this.isInfo) {
                    this.dialogRef.close(this.objRol());
                }
            }
        }
    });

    ngOnInit(): void {
        this.titulo = this.data.title;

        if (this.data.data) {
            this.objRol.set({
                nombre: this.data.data.nombre
            });
        }
    }
}