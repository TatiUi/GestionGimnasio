import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { UsuarioService } from '../../shared/services/usuario-service';
import { UsuarioModel } from '../../shared/models/usuario-model';
import { RolService } from '../../shared/services/rol-service';
import { RolModel } from '../../shared/models/rol-model';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FrmUsuario } from '../forms/frm-usuario/frm-usuario';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogoGeneral } from '../forms/dialogo-general/dialogo-general';
import { PrintService } from '../../shared/services/print-service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { form, FormField } from '@angular/forms/signals';

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
    selector: 'app-usuarios-component',
    styleUrl: './usuarios-component.css',
    templateUrl: './usuarios-component.html',
})
export class UsuariosComponent implements OnInit {

    buscarID = signal<number | null>(null);

    displayedColumns: string[] = [
        'id',
        'nombre',
        'apellido',
        'cedula',
        'correo_electronico',
        'telefono',
        'rol',
        'activo',
        'botonera'
    ];

    dataSource = signal<UsuarioModel[]>([]);

    // Almacenar los roles obtenidos desde el backend
    roles = signal<RolModel[]>([]);

    srvUsuario = inject(UsuarioService);

    srvRol = inject(RolService);

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

    constructor() {

        // Cargar los usuarios en la tabla
        effect(() => {

            const respuesta = this.srvUsuario.usuarios;

            if (respuesta.hasValue()) {

                this.dataSource.set(respuesta.value().data);

            }

        });

        // Cargar los roles desde la base de datos
        effect(() => {

            const respuesta = this.srvRol.roles;

            if (respuesta.hasValue()) {

                this.roles.set(respuesta.value().data);

            }

        });

        // Obtener un usuario por su ID
        effect(() => {

            const id = this.buscarID();

            if (id === null) {
                return;
            }

            const respuesta = this.srvUsuario.usuarioPorId;

            if (respuesta.status() === 'resolved' &&
                respuesta.hasValue()) {

                const usuario = respuesta.value().data;

                if (usuario && Number(usuario.id) === id) {

                    this.buscarID.set(null);

                    this.mostrarDialogo(
                        this.consultarInfo
                            ? 'Información del usuario'
                            : 'Editar usuario',
                        usuario,
                        this.consultarInfo
                    );

                }

            }

            if (respuesta.error()) {

                this.buscarID.set(null);

                this.alerta(
                    'error',
                    'No se pudo consultar el usuario.'
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

        this.filtrarUsuarios();

    }

    // Limpiar el filtro
    resetFilter(): void {

        this.filtro = {
            nombre: ''
        };

        this.objFilter.set({
            nombre: ''
        });

        this.filtrarUsuarios();

    }

    // Consultar los usuarios
    filtrarUsuarios(): void {

        this.srvUsuario.filtrar({...this.filtro});

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

    // Abrir el formulario de usuarios
    mostrarDialogo(
        titulo: string,
        usuario?: UsuarioModel,
        info: boolean = false
    ): void {

        const dialogRef = this.dialog.open(FrmUsuario, {

            width: '90vw',
            maxWidth: '45rem',
            disableClose: true,

            data: {
                title: titulo,
                data: usuario,
                info: info
            }

        });

        dialogRef.afterClosed().subscribe(objUsuario => {

            if (!objUsuario || info) {
                return;
            }

            this.srvUsuario.guardar(
                objUsuario,
                usuario?.id
            ).subscribe({

                next: () => {

                    this.resetFilter();

                    this.alerta(
                        'check_circle',
                        usuario
                            ? 'Usuario actualizado correctamente.'
                            : 'Usuario registrado correctamente.'
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

            return 'El usuario ya existe o tiene información asociada.';

        }

        return 'No se pudo realizar la operación.';

    }

    // Crear usuario
    onCreate(): void {

        this.mostrarDialogo('Nuevo usuario');

    }

    // Editar usuario
    onEdit(id: number): void {

        this.consultarInfo = false;

        this.buscarID.set(id);

        this.srvUsuario.buscarPorId(id);

        this.srvUsuario.usuarioPorId.reload();

    }

    // Consultar información
    onInfo(id: number): void {

        this.consultarInfo = true;

        this.buscarID.set(id);

        this.srvUsuario.buscarPorId(id);

        this.srvUsuario.usuarioPorId.reload();

    }

    // Eliminar usuario
    onDelete(id: number): void {

        const dialogRef = this.dialog.open(DialogoGeneral, {

            width: '90vw',
            maxWidth: '25rem',

            data: {
                icono: 'warning',
                texto: '¿Está seguro de eliminar este usuario?',
                textoAceptar: 'Eliminar',
                textoCancelar: 'Cancelar'
            }

        });

        dialogRef.afterClosed().subscribe(respuesta => {

            if (respuesta === true) {

                this.srvUsuario.eliminar(id).subscribe({

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

    // Buscar el nombre del rol según su ID
    obtenerRol(rol_id: number): string {

        for (const rol of this.roles()) {

            if (Number(rol.id) === Number(rol_id)) {

                return rol.nombre;

            }

        }

        return 'Rol no encontrado';

    }

    // Obtener el estado del usuario
    obtenerEstado(activo?: number): string {

        return Number(activo) === 1
            ? 'Activo'
            : 'Inactivo';

    }

    // Imprimir el catálogo de usuarios
    onPrint(): void {

        const columnas = [
            'ID',
            'Nombre',
            'Apellido',
            'Cédula',
            'Correo electrónico',
            'Teléfono',
            'Rol',
            'Estado'
        ];

        const filas = this.dataSource().map(usuario => [

            usuario.id ?? '',
            usuario.nombre,
            usuario.apellido,
            usuario.cedula,
            usuario.correo_electronico,
            usuario.telefono,
            this.obtenerRol(usuario.rol_id),
            this.obtenerEstado(usuario.activo)

        ]);

        this.srvPrint.print(
            columnas,
            filas,
            'Catálogo de usuarios'
        );

    }

    ngOnInit(): void {

        // Cargar los roles
        this.srvRol.filtrar({nombre: ''});

        // Cargar los usuarios
        this.resetFilter();

    }

}