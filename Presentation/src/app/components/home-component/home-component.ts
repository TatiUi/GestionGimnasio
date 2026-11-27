import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../shared/services/auth-service';
import { Roles } from '../../shared/models/roles';
import { UsuarioService } from '../../shared/services/usuario-service';
import { MembresiaService } from '../../shared/services/membresia-service';
import { PagoService } from '../../shared/services/pago-service';
import { ClaseService } from '../../shared/services/clase-service';
import { InscripcionService } from '../../shared/services/inscripcion-service';
import { AsistenciaService } from '../../shared/services/asistencia-service';

@Component({
    imports: [
        RouterLink,
        MatCardModule,
        MatIconModule,
        MatButtonModule
    ],
    selector: 'app-home-component',
    styleUrl: './home-component.css',
    templateUrl: './home-component.html',
})
export class HomeComponent implements OnInit {

    private readonly srvAuth = inject(AuthService);

    srvUsuario = inject(UsuarioService);

    srvMembresia = inject(MembresiaService);

    srvPago = inject(PagoService);

    srvClase = inject(ClaseService);

    srvInscripcion = inject(InscripcionService);

    srvAsistencia = inject(AsistenciaService);

    // Obtener el correo del usuario autenticado
    public get correo(): string {

        if (!this.srvAuth.isLoggedIn()) {

            return '';

        }

        return this.srvAuth.getUsuario().correo_electronico;

    }

    // Obtener el rol del usuario autenticado
    public get rol(): number {

        if (!this.srvAuth.isLoggedIn()) {

            return -1;

        }

        return this.srvAuth.getRol();

    }

    // Comprobar si es administrador
    public get esAdmin(): boolean {

        return this.rol === Roles.Admin;

    }

    // Comprobar si es entrenador
    public get esEntrenador(): boolean {

        return this.rol === Roles.Entrenador;

    }

    // Comprobar si es cliente
    public get esCliente(): boolean {

        return this.rol === Roles.Cliente;

    }

    // Obtener el nombre del rol
    public get nombreRol(): string {

        switch (this.rol) {

            case Roles.Admin:
                return 'Administrador';

            case Roles.Entrenador:
                return 'Entrenador';

            case Roles.Cliente:
                return 'Cliente';

            default:
                return 'Usuario';

        }

    }

    // Obtener el total de usuarios
    public get totalUsuarios(): number | string {

        if (!this.esAdmin) {

            return '-';

        }

        if (this.srvUsuario.usuarios.hasValue()) {

            return this.srvUsuario.usuarios
                .value().pagination.total;

        }

        return '-';

    }

    // Obtener el total de membresías activas
    public get totalMembresias(): number | string {

        if (!this.esAdmin && !this.esCliente) {

            return '-';

        }

        if (this.srvMembresia.membresias.hasValue()) {

            return this.srvMembresia.membresias
                .value().pagination.total;

        }

        return '-';

    }

    // Obtener el total de pagos completados
    public get totalPagos(): number | string {

        if (!this.esAdmin && !this.esCliente) {

            return '-';

        }

        if (this.srvPago.pagos.hasValue()) {

            return this.srvPago.pagos
                .value().pagination.total;

        }

        return '-';

    }

    // Obtener el total de clases
    public get totalClases(): number | string {

        if (this.srvClase.clases.hasValue()) {

            return this.srvClase.clases
                .value().pagination.total;

        }

        return '-';

    }

    // Obtener el total de inscripciones
    public get totalInscripciones(): number | string {

        if (!this.esEntrenador && !this.esCliente) {

            return '-';

        }

        if (this.srvInscripcion.inscripciones.hasValue()) {

            return this.srvInscripcion.inscripciones
                .value().pagination.total;

        }

        return '-';

    }

    // Obtener el total de asistencias
    public get totalAsistencias(): number | string {

        if (!this.esEntrenador) {

            return '-';

        }

        if (this.srvAsistencia.asistencias.hasValue()) {

            return this.srvAsistencia.asistencias
                .value().pagination.total;

        }

        return '-';

    }

    // Obtener las métricas según el rol
    public get metricas() {

        if (this.esAdmin) {

            return [
                {
                    label: 'Usuarios registrados',
                    valor: this.totalUsuarios,
                    icon: 'group',
                    descripcion: 'Usuarios registrados en el sistema.',
                    color: 'bg-blue-100 text-blue-700'
                },
                {
                    label: 'Membresías activas',
                    valor: this.totalMembresias,
                    icon: 'credit_card',
                    descripcion: 'Membresías con estado activo.',
                    color: 'bg-green-100 text-green-700'
                },
                {
                    label: 'Pagos completados',
                    valor: this.totalPagos,
                    icon: 'payments',
                    descripcion: 'Pagos registrados como completados.',
                    color: 'bg-amber-100 text-amber-700'
                },
                {
                    label: 'Clases registradas',
                    valor: this.totalClases,
                    icon: 'fitness_center',
                    descripcion: 'Total de clases del gimnasio.',
                    color: 'bg-purple-100 text-purple-700'
                }
            ];

        }

        if (this.esEntrenador) {

            return [
                {
                    label: 'Mis clases',
                    valor: this.totalClases,
                    icon: 'fitness_center',
                    descripcion: 'Clases asignadas al entrenador.',
                    color: 'bg-blue-100 text-blue-700'
                },
                {
                    label: 'Inscripciones activas',
                    valor: this.totalInscripciones,
                    icon: 'groups',
                    descripcion: 'Inscripciones activas en mis clases.',
                    color: 'bg-green-100 text-green-700'
                },
                {
                    label: 'Asistencias registradas',
                    valor: this.totalAsistencias,
                    icon: 'fact_check',
                    descripcion: 'Registros de asistencia de mis clases.',
                    color: 'bg-purple-100 text-purple-700'
                }
            ];

        }

        if (this.esCliente) {

            return [
                {
                    label: 'Mis membresías activas',
                    valor: this.totalMembresias,
                    icon: 'credit_card',
                    descripcion: 'Mis membresías con estado activo.',
                    color: 'bg-green-100 text-green-700'
                },
                {
                    label: 'Mis inscripciones activas',
                    valor: this.totalInscripciones,
                    icon: 'event_available',
                    descripcion: 'Inscripciones con estado Inscrito.',
                    color: 'bg-blue-100 text-blue-700'
                },
                {
                    label: 'Mis pagos completados',
                    valor: this.totalPagos,
                    icon: 'payments',
                    descripcion: 'Mis pagos registrados como completados.',
                    color: 'bg-amber-100 text-amber-700'
                },
                {
                    label: 'Clases registradas',
                    valor: this.totalClases,
                    icon: 'fitness_center',
                    descripcion: 'Total de clases del gimnasio.',
                    color: 'bg-purple-100 text-purple-700'
                }
            ];

        }

        return [];

    }

    // Accesos rápidos según el rol
    accesos = [
        {
            label: 'Planes de membresías',
            icon: 'assignment',
            descripcion: 'Consultar los planes de membresías disponibles.',
            route: '/planes-membresias',
            rol: [Roles.Admin, Roles.Cliente]
        },
        {
            label: 'Usuarios',
            icon: 'group',
            descripcion: 'Gestionar los usuarios del gimnasio.',
            route: '/usuarios',
            rol: [Roles.Admin]
        },
        {
            label: 'Membresías',
            icon: 'credit_card',
            descripcion: 'Consultar la información de las membresías.',
            route: '/membresias',
            rol: [Roles.Admin, Roles.Cliente]
        },
        {
            label: 'Pagos',
            icon: 'payments',
            descripcion: 'Consultar los pagos registrados.',
            route: '/pagos',
            rol: [Roles.Admin, Roles.Cliente]
        },
        {
            label: 'Clases',
            icon: 'fitness_center',
            descripcion: 'Consultar las actividades deportivas del gimnasio.',
            route: '/clases',
            rol: [Roles.Admin, Roles.Entrenador, Roles.Cliente]
        },
        {
            label: 'Inscripciones',
            icon: 'event_available',
            descripcion: 'Consultar las inscripciones a clases.',
            route: '/inscripciones',
            rol: [Roles.Admin, Roles.Entrenador, Roles.Cliente]
        },
        {
            label: 'Asistencias',
            icon: 'fact_check',
            descripcion: 'Consultar y registrar asistencias a clases.',
            route: '/asistencias',
            rol: [Roles.Admin, Roles.Entrenador]
        }
    ];

    // Consultar las métricas del dashboard
    cargarMetricas(): void {

        const usuario_id = Number(
            this.srvAuth.getUsuarioId()
        );

        if (this.esAdmin) {

            // Total de usuarios registrados
            this.srvUsuario.filtrar({
                nombre: ''
            });

            // Total de membresías activas
            this.srvMembresia.filtrar({
                estado: 'Activa'
            });

            // Total de pagos completados
            this.srvPago.filtrar({
                estado: 'Completado'
            });

            // Total de clases registradas
            this.srvClase.filtrar({
                nombre: ''
            });

        } else if (this.esEntrenador) {

            // Total de clases asignadas
            this.srvClase.filtrar({
                entrenador_id: usuario_id
            });

            // Total de inscripciones activas de sus clases
            this.srvInscripcion.filtrar({
                entrenador_id: usuario_id,
                estado: 'Inscrito'
            });

            // Total de asistencias de sus clases
            this.srvAsistencia.filtrar({
                entrenador_id: usuario_id,
                estado: ''
            });

        } else if (this.esCliente) {

            // Total de membresías activas propias
            this.srvMembresia.filtrar({
                usuario_id: usuario_id,
                estado: 'Activa'
            });

            // Total de inscripciones activas propias
            this.srvInscripcion.filtrar({
                usuario_id: usuario_id,
                estado: 'Inscrito'
            });

            // Total de pagos completados propios
            this.srvPago.filtrar({
                usuario_id: usuario_id,
                estado: 'Completado'
            });

            // Total de clases registradas
            this.srvClase.filtrar({
                nombre: ''
            });

        }

    }

    ngOnInit(): void {

        if (this.srvAuth.isLoggedIn()) {

            this.cargarMetricas();

        }

    }

}