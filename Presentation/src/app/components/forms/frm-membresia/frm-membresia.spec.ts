import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MembresiaModel } from '../../../shared/models/membresia-model';
import { UsuarioService } from '../../../shared/services/usuario-service';
import { PlanMembresiaService } from '../../../shared/services/plan-membresia-service';
import {
    form,
    FormField,
    FormRoot,
    required,
    min,
    readonly
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
    selector: 'app-frm-membresia',
    styleUrl: './frm-membresia.css',
    templateUrl: './frm-membresia.html',
})
export class FrmMembresia implements OnInit {

    titulo: string = '';

    dialogRef = inject(MatDialogRef<FrmMembresia>);

    private readonly data = inject(MAT_DIALOG_DATA);

    srvUsuario = inject(UsuarioService);

    srvPlan = inject(PlanMembresiaService);

    readonly isEditing = this.data.data !== undefined;

    readonly isInfo = this.data.info === true;

    objMembresia = signal<MembresiaModel>({
        usuario_id: 0,
        plan_id: 0,
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'Activa'
    });

    frmMembresia = form(this.objMembresia, (s) => {

        // Validar usuario
        required(s.usuario_id, {
            message: 'El usuario es requerido'
        });

        min(s.usuario_id, 1, {
            message: 'Seleccione un usuario'
        });

        // Validar plan
        required(s.plan_id, {
            message: 'El plan es requerido'
        });

        min(s.plan_id, 1, {
            message: 'Seleccione un plan de membresía'
        });

        // Validar fecha de inicio
        required(s.fecha_inicio, {
            message: 'La fecha de inicio es requerida'
        });

        // Validar fecha de finalización
        required(s.fecha_fin, {
            message: 'La fecha de finalización es requerida'
        });

        // Validar estado
        required(s.estado, {
            message: 'El estado es requerido'
        });

        // Modo de solo lectura
        readonly(s.usuario_id, () => this.isInfo);
        readonly(s.plan_id, () => this.isInfo);
        readonly(s.fecha_inicio, () => this.isInfo);
        readonly(s.fecha_fin, () => this.isInfo);
        readonly(s.estado, () => this.isInfo);

    }, {
        submission: {
            action: async () => {

                if (!this.isInfo) {

                    this.dialogRef.close(this.objMembresia());

                }

            }
        }
    });

    ngOnInit(): void {

        this.titulo = this.data.title;

        // Cargar los usuarios disponibles
        this.srvUsuario.filtrar({nombre: ''});

        // Cargar los planes disponibles
        this.srvPlan.filtrar({nombre: ''});

        // Cargar los datos al editar o consultar
        if (this.data.data) {

            this.objMembresia.set({
                usuario_id: Number(this.data.data.usuario_id),
                plan_id: Number(this.data.data.plan_id),
                fecha_inicio: this.data.data.fecha_inicio,
                fecha_fin: this.data.data.fecha_fin,
                estado: this.data.data.estado
            });

        }

    }

}