import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './shared/services/auth-service';
import { Roles } from './shared/models/roles';

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet,
        RouterLink,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatMenuModule,
        MatSidenavModule,
        MatListModule,
        MatDividerModule
    ],
    templateUrl: './app.html',
    styleUrl: './app.css',
})
export class App {

    protected readonly authService = inject(AuthService);

    menuItems = [
        {
            label: 'Inicio',
            icon: 'home',
            route: 'home',
            rol: [Roles.Admin, Roles.Entrenador, Roles.Cliente]
        },
        {
            label: 'Usuarios',
            icon: 'group',
            route: 'usuarios',
            rol: [Roles.Admin]
        },
        {
            label: 'Planes de membresías',
            icon: 'assignment',
            route: 'planes-membresias',
            rol: [Roles.Admin, Roles.Cliente]
        },
        {
            label: 'Membresías',
            icon: 'card_membership',
            route: 'membresias',
            rol: [Roles.Admin, Roles.Cliente]
        },
        {
            label: 'Clases',
            icon: 'fitness_center',
            route: 'clases',
            rol: [Roles.Admin, Roles.Entrenador, Roles.Cliente]
        },
        {
            label: 'Inscripciones',
            icon: 'event_available',
            route: 'inscripciones',
            rol: [Roles.Admin, Roles.Entrenador, Roles.Cliente]
        },
        {
            label: 'Asistencias',
            icon: 'fact_check',
            route: 'asistencias',
            rol: [Roles.Admin, Roles.Entrenador]
        },
        {
            label: 'Pagos',
            icon: 'payments',
            route: 'pagos',
            rol: [Roles.Admin, Roles.Cliente]
        },
        {
            label: 'Roles',
            icon: 'admin_panel_settings',
            route: 'roles',
            rol: [Roles.Admin]
        }
    ];

    // Obtener el rol del usuario autenticado
    public get rolActual(): number {

        if (!this.authService.isLoggedIn()) {

            return -1;

        }

        return this.authService.getRol();

    }

    // Obtener el correo del usuario autenticado
    public get correoActual(): string {

        if (!this.authService.isLoggedIn()) {

            return '';

        }

        return this.authService.getUsuario().correo_electronico;

    }

    // Obtener el nombre del rol
    public get nombreRol(): string {

        switch (this.rolActual) {

            case Roles.Admin:
                return 'Administrador';

            case Roles.Entrenador:
                return 'Entrenador';

            case Roles.Cliente:
                return 'Cliente';

            default:
                return '';

        }

    }

    // Cerrar sesión
    loggout() {

        this.authService.loggout();

    }

}