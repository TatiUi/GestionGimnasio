import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { PlanMembresiaService } from '../../shared/services/plan-membresia-service';
import { PlanMembresiaModel } from '../../shared/models/plan-membresia-model';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FrmPlanMembresia } from '../forms/frm-plan-membresia/frm-plan-membresia';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogoGeneral } from '../forms/dialogo-general/dialogo-general';
import { PrintService } from '../../shared/services/print-service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { form, FormField } from '@angular/forms/signals';
import { AuthService } from '../../shared/services/auth-service';
import { Roles } from '../../shared/models/roles';

interface FilterForm {
    nombre: string;
}

@Component({
    imports: [
        MatTableModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatInputModule,
        MatFormFieldModule,
        MatExpansionModule,
        FormField
    ],
    selector: 'app-planes-membresias-component',
    styleUrl: './planes-membresias-component.css',
    templateUrl: './planes-membresias-component.html',
})
export class PlanesMembresiasComponent implements OnInit {

    buscarID = signal<number | null>(null);

    displayedColumns: string[] = [
        'id',
        'nombre',
        'descripcion',
        'precio',
        'duracion_dias',
        'activo',
        'botonera'
    ];

    dataSource = signal<PlanMembresiaModel[]>([]);

    srvPlan = inject(PlanMembresiaService);

    srvAuth = inject(AuthService);

    dialog = inject(MatDialog);

    srvPrint = inject(PrintService);

    filtro = {
        nombre: ''
    };

    panelFilterState = signal(false);

    objFilter = signal<FilterForm>({
        nombre: ''
    });

    frmFilter = form(this.objFilter);

    private consultarInfo = false;

    // Comprobar si el usuario es administrador
    public get esAdmin(): boolean {

        return this.srvAuth.isLoggedIn() &&
            this.srvAuth.getRol() === Roles.Admin;

    }

    constructor() {

        // Cargar los planes en la tabla
        effect(() => {

            const respuesta = this.srvPlan.planesMembresias;

            if (respuesta.hasValue()) {

                this.dataSource.set(respuesta.value().data);

            }

        });

        // Obtener un plan por su ID
        effect(() => {

            const id = this.buscarID();

            if (id === null) {
                return;
            }

            const respuesta = this.srvPlan.planMembresiaPorId;

            if (respuesta.status() === 'resolved' &&
                respuesta.hasValue()) {

                const plan = respuesta.value().data;

                if (plan && Number(plan.id) === id) {

                    this.buscarID.set(null);

                    this.mostrarDialogo(
                        this.consultarInfo
                            ? 'Información del plan'
                            : 'Editar plan de membresía',
                        plan,
                        this.consultarInfo
                    );

                }

            }

            if (respuesta.error()) {

                this.buscarID.set(null);

                this.alerta(
                    'error',
                    'No se pudo consultar el plan de membresía.'
                );

            }

        });

    }

    // Cerrar el panel de filtros
    onFilterClose(): void {

        this.panelFilterState.set(false);

    }

    // Abrir o cerrar el panel
    toggleFilterPanel(): void {

        this.panelFilterState.update(valor => !valor);

    }

    // Filtrar por nombre
    onFilterChange(nombre: string): void {

        this.filtro.nombre = nombre.trim();

        this.filtrarPlanes();

    }

    // Limpiar el filtro
    resetFilter(): void {

        this.filtro = {
            nombre: ''
        };

        this.objFilter.set({
            nombre: ''
        });

        this.filtrarPlanes();

    }

    // Consultar los planes
    filtrarPlanes(): void {

        this.srvPlan.filtrar({...this.filtro});

    }

    // Mostrar mensajes
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

    // Abrir el formulario de planes
    mostrarDialogo(
        titulo: string,
        plan?: PlanMembresiaModel,
        info: boolean = false
    ): void {

        // Impedir que un cliente abra un formulario de edición
        if (!info && !this.esAdmin) {
            return;
        }

        const dialogRef = this.dialog.open(FrmPlanMembresia, {

            width: '90vw',
            maxWidth: '35rem',
            disableClose: true,

            data: {
                title: titulo,
                data: plan,
                info: info
            }

        });

        dialogRef.afterClosed().subscribe(objPlan => {

            // Solo el administrador puede guardar cambios
            if (!objPlan || info || !this.esAdmin) {
                return;
            }

            this.srvPlan.guardar(
                objPlan,
                plan?.id
            ).subscribe({

                next: () => {

                    this.resetFilter();

                    this.alerta(
                        'check_circle',
                        plan
                            ? 'Plan actualizado correctamente.'
                            : 'Plan registrado correctamente.'
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

        if (error.error?.message) {

            return error.error.message;

        }

        if (error.status === 409) {

            return 'El plan ya existe o tiene información asociada.';

        }

        return 'No se pudo realizar la operación.';

    }

    // Crear plan
    onCreate(): void {

        if (!this.esAdmin) {
            return;
        }

        this.mostrarDialogo('Nuevo plan de membresía');

    }

    // Editar plan
    onEdit(id: number): void {

        if (!this.esAdmin) {
            return;
        }

        this.consultarInfo = false;

        this.buscarID.set(id);

        this.srvPlan.buscarPorId(id);

        this.srvPlan.planMembresiaPorId.reload();

    }

    // Consultar información
    onInfo(id: number): void {

        this.consultarInfo = true;

        this.buscarID.set(id);

        this.srvPlan.buscarPorId(id);

        this.srvPlan.planMembresiaPorId.reload();

    }

    // Eliminar plan
    onDelete(id: number): void {

        if (!this.esAdmin) {
            return;
        }

        const dialogRef = this.dialog.open(DialogoGeneral, {

            width: '90vw',
            maxWidth: '25rem',

            data: {
                icono: 'warning',
                texto: '¿Está seguro de eliminar este plan de membresía?',
                textoAceptar: 'Eliminar',
                textoCancelar: 'Cancelar'
            }

        });

        dialogRef.afterClosed().subscribe(respuesta => {

            if (respuesta === true && this.esAdmin) {

                this.srvPlan.eliminar(id).subscribe({

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

    // Obtener el estado del plan
    obtenerEstado(activo?: number): string {

        return Number(activo) === 1
            ? 'Activo'
            : 'Inactivo';

    }

    // Imprimir el catálogo de planes
    onPrint(): void {

        const columnas = [
            'ID',
            'Nombre',
            'Descripción',
            'Precio',
            'Duración',
            'Estado'
        ];

        const filas = this.dataSource().map(plan => [

            plan.id ?? '',
            plan.nombre,
            plan.descripcion,
            '₡' + plan.precio,
            plan.duracion_dias + ' días',
            this.obtenerEstado(plan.activo)

        ]);

        this.srvPrint.print(
            columnas,
            filas,
            'Catálogo de planes de membresías'
        );

    }

    ngOnInit(): void {

        this.resetFilter();

    }

}