import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MembresiaService } from '../../shared/services/membresia-service';
import { MembresiaModel } from '../../shared/models/membresia-model';
import { UsuarioService } from '../../shared/services/usuario-service';
import { UsuarioModel } from '../../shared/models/usuario-model';
import { PlanMembresiaService } from '../../shared/services/plan-membresia-service';
import { PlanMembresiaModel } from '../../shared/models/plan-membresia-model';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FrmMembresia } from '../forms/frm-membresia/frm-membresia';
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
    selector: 'app-membresias-component',
    styleUrl: './membresias-component.css',
    templateUrl: './membresias-component.html',
})
export class MembresiasComponent implements OnInit {

    buscarID = signal<number | null>(null);

    displayedColumns: string[] = [
        'id',
        'usuario',
        'plan',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'botonera'
    ];

    dataSource = signal<MembresiaModel[]>([]);

    usuarios = signal<UsuarioModel[]>([]);

    planes = signal<PlanMembresiaModel[]>([]);

    srvMembresia = inject(MembresiaService);

    srvUsuario = inject(UsuarioService);

    srvPlan = inject(PlanMembresiaService);

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

    // Comprobar si el usuario es cliente
    public get esCliente(): boolean {

        return this.srvAuth.isLoggedIn() &&
            this.srvAuth.getRol() === Roles.Cliente;

    }

    constructor() {

        // Cargar las membresías según el rol
        effect(() => {

            const respuesta = this.srvMembresia.membresias;

            if (respuesta.hasValue()) {

                const registros = respuesta.value().data;

                if (this.esAdmin) {

                    this.dataSource.set(registros);

                } else if (this.esCliente) {

                    this.dataSource.set(registros.filter(membresia =>
                        Number(membresia.usuario_id) ===
                        Number(this.srvAuth.getUsuarioId())
                    ));

                } else {

                    this.dataSource.set([]);

                }

            }

        });

        // Cargar los usuarios únicamente para el administrador
        effect(() => {

            const respuesta = this.srvUsuario.usuarios;

            if (this.esAdmin && respuesta.hasValue()) {

                this.usuarios.set(respuesta.value().data);

            } else if (!this.esAdmin) {

                this.usuarios.set([]);

            }

        });

        // Cargar los planes de membresías
        effect(() => {

            const respuesta = this.srvPlan.planesMembresias;

            if (respuesta.hasValue()) {

                this.planes.set(respuesta.value().data);

            }

        });

        // Obtener una membresía por su ID
        effect(() => {

            const id = this.buscarID();

            if (id === null) {
                return;
            }

            const respuesta = this.srvMembresia.membresiaPorId;

            if (respuesta.status() === 'resolved' &&
                respuesta.hasValue()) {

                const membresia = respuesta.value().data;

                if (membresia && Number(membresia.id) === id) {

                    this.buscarID.set(null);

                    this.mostrarDialogo(
                        this.consultarInfo
                            ? 'Información de la membresía'
                            : 'Editar membresía',
                        membresia,
                        this.consultarInfo
                    );

                }

            }

            if (respuesta.error()) {

                this.buscarID.set(null);

                this.alerta(
                    'error',
                    'No se pudo consultar la membresía.'
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

    // Filtrar por estado
    onFilterChange(estado: string): void {

        this.filtro.estado = estado;

        this.filtrarMembresias();

    }

    // Limpiar el filtro
    resetFilter(): void {

        this.filtro = {
            estado: ''
        };

        this.objFilter.set({
            estado: ''
        });

        this.filtrarMembresias();

    }

    // Consultar las membresías según el rol
    filtrarMembresias(): void {

        this.dataSource.set([]);

        if (this.esAdmin) {

            this.srvMembresia.filtrar({...this.filtro});

        } else if (this.esCliente) {

            this.srvMembresia.filtrar({
                ...this.filtro,
                usuario_id: Number(this.srvAuth.getUsuarioId())
            });

        }

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

    // Abrir el formulario de membresías
    mostrarDialogo(
        titulo: string,
        membresia?: MembresiaModel,
        info: boolean = false
    ): void {

        // El cliente únicamente puede consultar sus membresías
        if (this.esCliente) {

            if (!info || !membresia ||
                Number(membresia.usuario_id) !==
                Number(this.srvAuth.getUsuarioId())) {

                return;

            }

            this.alerta(
                'info',
                'Plan: ' + this.obtenerPlan(membresia.plan_id) +
                '\nFecha de inicio: ' + membresia.fecha_inicio +
                '\nFecha de finalización: ' + membresia.fecha_fin +
                '\nEstado: ' + membresia.estado
            );

            return;

        }

        // Solo el administrador puede utilizar el formulario
        if (!this.esAdmin) {

            return;

        }

        const dialogRef = this.dialog.open(FrmMembresia, {

            width: '90vw',
            maxWidth: '35rem',
            disableClose: true,

            data: {
                title: titulo,
                data: membresia,
                info: info
            }

        });

        dialogRef.afterClosed().subscribe(objMembresia => {

            if (!objMembresia || info || !this.esAdmin) {
                return;
            }

            this.srvMembresia.guardar(
                objMembresia,
                membresia?.id
            ).subscribe({

                next: () => {

                    this.resetFilter();

                    this.alerta(
                        'check_circle',
                        membresia
                            ? 'Membresía actualizada correctamente.'
                            : 'Membresía registrada correctamente.'
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

        if (error.status === 403) {

            return 'No tiene permiso para realizar esta operación.';

        }

        if (error.status === 409) {

            return 'La membresía ya existe o tiene información asociada.';

        }

        return 'No se pudo realizar la operación.';

    }

    // Crear membresía
    onCreate(): void {

        if (!this.esAdmin) {
            return;
        }

        this.mostrarDialogo('Nueva membresía');

    }

    // Editar membresía
    onEdit(id: number): void {

        if (!this.esAdmin) {
            return;
        }

        this.consultarInfo = false;

        this.buscarID.set(id);

        this.srvMembresia.buscarPorId(id);

        this.srvMembresia.membresiaPorId.reload();

    }

    // Consultar información
    onInfo(id: number): void {

        if (this.esCliente) {

            // Buscar únicamente entre las membresías propias
            for (const membresia of this.dataSource()) {

                if (Number(membresia.id) === id &&
                    Number(membresia.usuario_id) ===
                    Number(this.srvAuth.getUsuarioId())) {

                    this.mostrarDialogo(
                        'Información de la membresía',
                        membresia,
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

        this.srvMembresia.buscarPorId(id);

        this.srvMembresia.membresiaPorId.reload();

    }

    // Eliminar membresía
    onDelete(id: number): void {

        if (!this.esAdmin) {
            return;
        }

        const dialogRef = this.dialog.open(DialogoGeneral, {

            width: '90vw',
            maxWidth: '25rem',

            data: {
                icono: 'warning',
                texto: '¿Está seguro de eliminar esta membresía?',
                textoAceptar: 'Eliminar',
                textoCancelar: 'Cancelar'
            }

        });

        dialogRef.afterClosed().subscribe(respuesta => {

            if (respuesta === true && this.esAdmin) {

                this.srvMembresia.eliminar(id).subscribe({

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

        // Mostrar el correo del cliente autenticado
        if (this.esCliente) {

            if (Number(usuario_id) ===
                Number(this.srvAuth.getUsuarioId())) {

                return this.srvAuth.getUsuario().correo_electronico;

            }

            return '';

        }

        for (const usuario of this.usuarios()) {

            if (Number(usuario.id) === Number(usuario_id)) {

                return usuario.nombre + ' ' + usuario.apellido;

            }

        }

        return 'Usuario ID: ' + usuario_id;

    }

    // Obtener el nombre del plan
    obtenerPlan(plan_id: number): string {

        for (const plan of this.planes()) {

            if (Number(plan.id) === Number(plan_id)) {

                return plan.nombre;

            }

        }

        return 'Plan ID: ' + plan_id;

    }

    // Imprimir las membresías autorizadas
    onPrint(): void {

        if (!this.esAdmin && !this.esCliente) {
            return;
        }

        const columnas = [
            'ID',
            'Usuario',
            'Plan',
            'Fecha de inicio',
            'Fecha de finalización',
            'Estado'
        ];

        const registros = this.esAdmin
            ? this.dataSource()
            : this.dataSource().filter(membresia =>
                Number(membresia.usuario_id) ===
                Number(this.srvAuth.getUsuarioId())
            );

        const filas = registros.map(membresia => [

            membresia.id ?? '',
            this.obtenerUsuario(membresia.usuario_id),
            this.obtenerPlan(membresia.plan_id),
            membresia.fecha_inicio,
            membresia.fecha_fin,
            membresia.estado ?? ''

        ]);

        this.srvPrint.print(
            columnas,
            filas,
            this.esAdmin
                ? 'Catálogo de membresías'
                : 'Mis membresías'
        );

    }

    ngOnInit(): void {

        // Solo el administrador consulta todos los usuarios
        if (this.esAdmin) {

            this.srvUsuario.filtrar({nombre: ''});

        }

        // Cargar los planes
        this.srvPlan.filtrar({nombre: ''});

        // Cargar las membresías según el rol
        this.resetFilter();

    }

}