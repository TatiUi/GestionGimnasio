import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { PagoService } from '../../shared/services/pago-service';
import { PagoModel } from '../../shared/models/pago-model';
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
import { FrmPago } from '../forms/frm-pago/frm-pago';
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
    selector: 'app-pagos-component',
    styleUrl: './pagos-component.css',
    templateUrl: './pagos-component.html',
})
export class PagosComponent implements OnInit {

    buscarID = signal<number | null>(null);

    displayedColumns: string[] = [
        'id',
        'membresia',
        'monto',
        'fecha_pago',
        'metodo_pago',
        'estado',
        'botonera'
    ];

    dataSource = signal<PagoModel[]>([]);

    membresias = signal<MembresiaModel[]>([]);

    usuarios = signal<UsuarioModel[]>([]);

    planes = signal<PlanMembresiaModel[]>([]);

    srvPago = inject(PagoService);

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

        // Cargar los pagos según el rol
        effect(() => {

            const respuesta = this.srvPago.pagos;

            if (respuesta.hasValue()) {

                const registros = respuesta.value().data;

                if (this.esAdmin) {

                    this.dataSource.set(registros);

                } else if (this.esCliente) {

                    this.dataSource.set(registros.filter(pago =>
                        this.esPagoPropio(pago)
                    ));

                } else {

                    this.dataSource.set([]);

                }

            } else {

                this.dataSource.set([]);

            }

        });

        // Cargar las membresías según el rol
        effect(() => {

            const respuesta = this.srvMembresia.membresias;

            if (respuesta.hasValue()) {

                const registros = respuesta.value().data;

                if (this.esAdmin) {

                    this.membresias.set(registros);

                } else if (this.esCliente) {

                    this.membresias.set(registros.filter(membresia =>
                        Number(membresia.usuario_id) ===
                        Number(this.srvAuth.getUsuarioId())
                    ));

                } else {

                    this.membresias.set([]);

                }

            } else {

                this.membresias.set([]);

            }

        });

        // Cargar los usuarios únicamente para el administrador
        effect(() => {

            const respuesta = this.srvUsuario.usuarios;

            if (this.esAdmin && respuesta.hasValue()) {

                this.usuarios.set(respuesta.value().data);

            } else {

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

        // Obtener un pago por su ID
        effect(() => {

            const id = this.buscarID();

            if (id === null) {
                return;
            }

            const respuesta = this.srvPago.pagoPorId;

            if (respuesta.status() === 'resolved' &&
                respuesta.hasValue()) {

                const pago = respuesta.value().data;

                if (pago && Number(pago.id) === id) {

                    this.buscarID.set(null);

                    this.mostrarDialogo(
                        this.consultarInfo
                            ? 'Información del pago'
                            : 'Editar pago',
                        pago,
                        this.consultarInfo
                    );

                }

            }

            if (respuesta.error()) {

                this.buscarID.set(null);

                this.alerta(
                    'error',
                    'No se pudo consultar el pago.'
                );

            }

        });

    }

    // Comprobar si el pago pertenece al cliente autenticado
    esPagoPropio(pago: PagoModel): boolean {

        if (!this.esCliente) {
            return false;
        }

        for (const membresia of this.membresias()) {

            if (Number(membresia.id) ===
                Number(pago.membresia_id) &&
                Number(membresia.usuario_id) ===
                Number(this.srvAuth.getUsuarioId())) {

                return true;

            }

        }

        return false;

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

        this.filtrarPagos();

    }

    // Limpiar el filtro
    resetFilter(): void {

        this.filtro = {
            estado: ''
        };

        this.objFilter.set({
            estado: ''
        });

        this.filtrarPagos();

    }

    // Consultar los pagos según el rol
    filtrarPagos(): void {

        this.dataSource.set([]);

        if (this.esAdmin) {

            this.srvPago.filtrar({...this.filtro});

        } else if (this.esCliente) {

            this.srvPago.filtrar({
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

    // Abrir el formulario de pagos
    mostrarDialogo(
        titulo: string,
        pago?: PagoModel,
        info: boolean = false
    ): void {

        // El cliente únicamente puede consultar sus pagos
        if (this.esCliente) {

            if (!info || !pago || !this.esPagoPropio(pago)) {

                return;

            }

            this.alerta(
                'info',
                'Membresía: ' +
                    this.obtenerMembresia(pago.membresia_id) +
                '\nMonto: ₡' + pago.monto +
                '\nFecha de pago: ' + pago.fecha_pago +
                '\nMétodo de pago: ' + pago.metodo_pago +
                '\nEstado: ' + pago.estado
            );

            return;

        }

        // Solo el administrador puede utilizar el formulario
        if (!this.esAdmin) {

            return;

        }

        const dialogRef = this.dialog.open(FrmPago, {

            width: '90vw',
            maxWidth: '35rem',
            disableClose: true,

            data: {
                title: titulo,
                data: pago,
                info: info
            }

        });

        dialogRef.afterClosed().subscribe(objPago => {

            if (!objPago || info || !this.esAdmin) {

                return;

            }

            this.srvPago.guardar(
                objPago,
                pago?.id
            ).subscribe({

                next: () => {

                    this.resetFilter();

                    this.alerta(
                        'check_circle',
                        pago
                            ? 'Pago actualizado correctamente.'
                            : 'Pago registrado correctamente.'
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

        if (error.error?.errors) {

            return Object.values(error.error.errors).join('\n');

        }

        if (error.status === 403) {

            return 'No tiene permiso para realizar esta operación.';

        }

        if (error.status === 409) {

            return 'El pago ya existe o tiene información asociada.';

        }

        return 'No se pudo realizar la operación.';

    }

    // Registrar un pago
    onCreate(): void {

        if (!this.esAdmin) {
            return;
        }

        this.mostrarDialogo('Nuevo pago');

    }

    // Editar un pago
    onEdit(id: number): void {

        if (!this.esAdmin) {
            return;
        }

        this.consultarInfo = false;

        this.buscarID.set(id);

        this.srvPago.buscarPorId(id);

        this.srvPago.pagoPorId.reload();

    }

    // Consultar información del pago
    onInfo(id: number): void {

        if (this.esCliente) {

            // Buscar únicamente entre los pagos propios
            for (const pago of this.dataSource()) {

                if (Number(pago.id) === id &&
                    this.esPagoPropio(pago)) {

                    this.mostrarDialogo(
                        'Información del pago',
                        pago,
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

        this.srvPago.buscarPorId(id);

        this.srvPago.pagoPorId.reload();

    }

    // Eliminar un pago
    onDelete(id: number): void {

        if (!this.esAdmin) {
            return;
        }

        const dialogRef = this.dialog.open(DialogoGeneral, {

            width: '90vw',
            maxWidth: '25rem',

            data: {
                icono: 'warning',
                texto: '¿Está seguro de eliminar este pago?',
                textoAceptar: 'Eliminar',
                textoCancelar: 'Cancelar'
            }

        });

        dialogRef.afterClosed().subscribe(respuesta => {

            if (respuesta === true && this.esAdmin) {

                this.srvPago.eliminar(id).subscribe({

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

    // Obtener la información de la membresía
    obtenerMembresia(membresia_id: number): string {

        for (const membresia of this.membresias()) {

            if (Number(membresia.id) === Number(membresia_id)) {

                if (this.esCliente) {

                    return '#' + membresia.id + ' - ' +
                        this.obtenerPlan(membresia.plan_id);

                }

                return '#' + membresia.id + ' - ' +
                    this.obtenerUsuario(membresia.usuario_id) + ' - ' +
                    this.obtenerPlan(membresia.plan_id);

            }

        }

        return 'Membresía ID: ' + membresia_id;

    }

    // Imprimir únicamente los pagos autorizados
    onPrint(): void {

        if (!this.esAdmin && !this.esCliente) {

            return;

        }

        const columnas = [
            'ID',
            'Membresía',
            'Monto',
            'Fecha de pago',
            'Método de pago',
            'Estado'
        ];

        const registros = this.esAdmin
            ? this.dataSource()
            : this.dataSource().filter(pago =>
                this.esPagoPropio(pago)
            );

        const filas = registros.map(pago => [

            pago.id ?? '',
            this.obtenerMembresia(pago.membresia_id),
            '₡' + pago.monto,
            pago.fecha_pago,
            pago.metodo_pago,
            pago.estado ?? ''

        ]);

        this.srvPrint.print(
            columnas,
            filas,
            this.esAdmin
                ? 'Catálogo de pagos'
                : 'Mis pagos'
        );

    }

    ngOnInit(): void {

        if (this.esAdmin) {

            // Cargar todas las membresías y usuarios
            this.srvMembresia.filtrar({estado: ''});

            this.srvUsuario.filtrar({nombre: ''});

        } else if (this.esCliente) {

            // Cargar únicamente las membresías del cliente
            this.srvMembresia.filtrar({
                estado: '',
                usuario_id: Number(this.srvAuth.getUsuarioId())
            });

        }

        // Cargar los planes
        this.srvPlan.filtrar({nombre: ''});

        // Cargar los pagos según el rol
        this.resetFilter();

    }

}