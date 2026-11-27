import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MembresiaService } from '../../../shared/services/membresia-service';
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

interface PagoForm {
    membresia_id: number;
    monto: number;
    fecha_pago: string;
    metodo_pago: string;
    estado: 'Pendiente' | 'Completado' | 'Anulado';
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
    selector: 'app-frm-pago',
    styleUrl: './frm-pago.css',
    templateUrl: './frm-pago.html',
})
export class FrmPago implements OnInit {

    titulo: string = '';

    dialogRef = inject(MatDialogRef<FrmPago>);

    private readonly data = inject(MAT_DIALOG_DATA);

    srvMembresia = inject(MembresiaService);

    srvUsuario = inject(UsuarioService);

    srvPlan = inject(PlanMembresiaService);

    readonly isEditing = this.data.data !== undefined;

    readonly isInfo = this.data.info === true;

    objPago = signal<PagoForm>({
        membresia_id: 0,
        monto: 0,
        fecha_pago: '',
        metodo_pago: '',
        estado: 'Pendiente'
    });

    frmPago = form(this.objPago, (s) => {

        // Validar membresía
        required(s.membresia_id, {
            message: 'La membresía es requerida'
        });

        min(s.membresia_id, 1, {
            message: 'Seleccione una membresía'
        });

        // Validar monto
        required(s.monto, {
            message: 'El monto es requerido'
        });

        min(s.monto, 0.01, {
            message: 'El monto debe ser mayor a cero'
        });

        // Validar fecha de pago
        required(s.fecha_pago, {
            message: 'La fecha de pago es requerida'
        });

        // Validar método de pago
        required(s.metodo_pago, {
            message: 'Seleccione un método de pago'
        });

        // Validar estado
        required(s.estado, {
            message: 'El estado es requerido'
        });

        // Modo de solo lectura
        readonly(s.membresia_id, () => this.isInfo);
        readonly(s.monto, () => this.isInfo);
        readonly(s.fecha_pago, () => this.isInfo);
        readonly(s.metodo_pago, () => this.isInfo);
        readonly(s.estado, () => this.isInfo);

    }, {
        submission: {
            action: async () => {

                if (!this.isInfo) {

                    const pago = this.objPago();

                    // Convertir la fecha antes de enviarla
                    this.dialogRef.close({
                        ...pago,
                        fecha_pago: pago.fecha_pago + ' 00:00:00'
                    });

                }

            }
        }
    });

    // Obtener el nombre completo del usuario
    obtenerUsuario(usuario_id: number): string {

        if (this.srvUsuario.usuarios.hasValue()) {

            for (const usuario of this.srvUsuario.usuarios.value().data) {

                if (Number(usuario.id) === Number(usuario_id)) {

                    return usuario.nombre + ' ' + usuario.apellido;

                }

            }

        }

        return 'Usuario ID: ' + usuario_id;

    }

    // Obtener el nombre del plan
    obtenerPlan(plan_id: number): string {

        if (this.srvPlan.planesMembresias.hasValue()) {

            for (const plan of this.srvPlan.planesMembresias.value().data) {

                if (Number(plan.id) === Number(plan_id)) {

                    return plan.nombre;

                }

            }

        }

        return 'Plan ID: ' + plan_id;

    }

    ngOnInit(): void {

        this.titulo = this.data.title;

        // Cargar las membresías
        this.srvMembresia.filtrar({estado: ''});

        // Cargar los usuarios
        this.srvUsuario.filtrar({nombre: ''});

        // Cargar los planes
        this.srvPlan.filtrar({nombre: ''});

        // Cargar los datos al editar o consultar
        if (this.data.data) {

            this.objPago.set({
                membresia_id: Number(this.data.data.membresia_id),
                monto: Number(this.data.data.monto),
                fecha_pago: this.data.data.fecha_pago.substring(0, 10),
                metodo_pago: this.data.data.metodo_pago,
                estado: this.data.data.estado ?? 'Pendiente'
            });

        }

    }

}