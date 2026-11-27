import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { RolService } from '../../shared/services/rol-service';
import { RolModel } from '../../shared/models/rol-model';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FrmRol } from '../forms/frm-rol/frm-rol';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogoGeneral } from '../forms/dialogo-general/dialogo-general';
import { PrintService } from '../../shared/services/print-service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { form, FormField } from '@angular/forms/signals';

type FilterForm = {
    nombre: string;
};

@Component({
    imports: [
        MatTableModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatInputModule,
        MatFormFieldModule,
        MatExpansionModule,
        FormField
    ],
    selector: 'app-roles-component',
    styleUrl: './roles-component.css',
    templateUrl: './roles-component.html',
})
export class RolesComponent implements OnInit {

    buscarID = signal<number | null>(null);

    displayedColumns: string[] = [
        'id',
        'nombre',
        'botonera'
    ];

    dataSource = signal<RolModel[]>([]);

    srvRol = inject(RolService);
    dialog = inject(MatDialog);
    srvPrint = inject(PrintService);

    filtro: { nombre: string } = {
        nombre: ''
    };

    panelFilterState = signal(false);

    objFilter = signal<FilterForm>({
        nombre: ''
    });

    frmFilter = form(this.objFilter);

    private consultarInfo = false;

    constructor() {

        // Actualizar los datos de la tabla
        effect(() => {
            const respuesta = this.srvRol.roles;

            if (respuesta.hasValue()) {
                this.dataSource.set(respuesta.value().data);
            }
        });

        // Buscar un rol por su identificador
        effect(() => {

            const id = this.buscarID();
            const respuesta = this.srvRol.rolPorId;

            if (id === null) {
                return;
            }

            if (respuesta.status() === 'resolved') {

                const rol = respuesta.value()?.data;

                if (!rol) {

                    this.buscarID.set(null);

                    this.alerta(
                        'error',
                        'No se encontró el rol',
                        'Cerrar'
                    );

                    return;
                }

                if (Number(rol.id) !== id) {
                    return;
                }

                this.buscarID.set(null);

                if (this.consultarInfo) {

                    this.mostrarDialogo(
                        'Información del rol',
                        rol,
                        true,
                        id
                    );

                } else {

                    this.mostrarDialogo(
                        'Editar rol',
                        rol,
                        false,
                        id
                    );

                }

            } else if (respuesta.status() === 'error') {

                this.buscarID.set(null);

                this.alerta(
                    'error',
                    'No se pudo cargar el rol',
                    'Cerrar'
                );

            }

        });
    }

    onFilterClose(): void {
        this.panelFilterState.set(false);
    }

    toggleFilterPanel(): void {
        this.panelFilterState.update((isOpen) => !isOpen);
    }

    onFilterChange(nombre: string): void {

        this.filtro = {
            nombre: nombre.trim()
        };

        this.filtrarRoles();
    }

    private resetFilter(): void {

        this.filtro = {
            nombre: ''
        };

        this.objFilter.set({
            nombre: ''
        });

        this.filtrarRoles();
    }

    private filtrarRoles(): void {

        this.srvRol.filtrar({...this.filtro});

    }

    private alerta(
        icono: string,
        mensaje: string,
        textoAceptar: string
    ): void {

        this.dialog.open(DialogoGeneral, {
            width: '90vw',
            maxWidth: '25rem',
            data: {
                icono: icono,
                texto: mensaje,
                textoAceptar: textoAceptar
            }
        });

    }

    public mostrarDialogo(
        titulo: string,
        datos?: RolModel,
        info?: boolean,
        id?: number
    ): void {

        const dialogRef = this.dialog.open(FrmRol, {
            width: '90vw',
            maxWidth: '30rem',
            data: {
                title: titulo,
                data: datos,
                info: info
            },
            disableClose: true
        });

        dialogRef.afterClosed()
            .subscribe((objRol) => {

                if (!objRol || info) {
                    return;
                }

                this.srvRol.guardar(objRol, id)
                    .subscribe({

                        next: () => {

                            this.resetFilter();

                            this.alerta(
                                'check_circle',
                                id === undefined
                                    ? 'Rol creado correctamente'
                                    : 'Rol actualizado correctamente',
                                'Cerrar'
                            );

                        },

                        error: (error: HttpErrorResponse) => {

                            this.alerta(
                                'error',
                                this.obtenerMensajeError(error),
                                'Cerrar'
                            );

                        }

                    });

            });

    }

    private obtenerMensajeError(
        error: HttpErrorResponse
    ): string {

        if (typeof error.error?.errors === 'object'
            && error.error.errors !== null) {

            return Object.values(error.error.errors)
                .filter((value): value is string =>
                    typeof value === 'string')
                .join(' ');

        }

        if (typeof error.error?.error === 'string') {
            return error.error.error;
        }

        if (error.status === 409) {
            return 'El rol ya existe o tiene usuarios asociados.';
        }

        return 'No se pudo completar la operación. Intente nuevamente.';
    }

    onCreate(): void {

        this.mostrarDialogo('Nuevo rol');

    }

    onEdit(idRol: number): void {

        this.consultarInfo = false;

        this.buscarID.set(idRol);

        this.srvRol.buscarPorId(idRol);

        this.srvRol.rolPorId.reload();

    }

    onInfo(idRol: number): void {

        this.consultarInfo = true;

        this.buscarID.set(idRol);

        this.srvRol.buscarPorId(idRol);

        this.srvRol.rolPorId.reload();

    }

    onDelete(idRol: number): void {

        const dialogRef = this.dialog.open(DialogoGeneral, {
            width: '90vw',
            maxWidth: '25rem',
            data: {
                icono: 'warning',
                texto: '¿Está seguro de que desea eliminar este rol?',
                textoAceptar: 'Eliminar',
                textoCancelar: 'Cancelar'
            }
        });

        dialogRef.afterClosed()
            .subscribe((respuesta) => {

                if (respuesta !== true) {
                    return;
                }

                this.srvRol.eliminar(idRol)
                    .subscribe({

                        next: () => {

                            this.resetFilter();

                            this.alerta(
                                'check_circle',
                                'Rol eliminado correctamente',
                                'Cerrar'
                            );

                        },

                        error: (error: HttpErrorResponse) => {

                            this.alerta(
                                'error',
                                this.obtenerMensajeError(error),
                                'Cerrar'
                            );

                        }

                    });

            });

    }

    onPrint(): void {

        const columnas = ['ID', 'Nombre'];

        const filas = this.dataSource().map((fila) => [
            fila.id?.toString() ?? '',
            fila.nombre
        ]);

        this.srvPrint.print(
            columnas,
            filas,
            'Catálogo de roles'
        );

    }

    ngOnInit(): void {

        this.resetFilter();

    }
}