import { Routes } from '@angular/router';
import { jwtGuard } from './shared/helpers/guards/jwt-guard';
import { Roles } from './shared/models/roles';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    {
        path: 'home',
        canActivate: [jwtGuard],
        data: { roles: [Roles.Admin, Roles.Entrenador, Roles.Cliente] },
        loadComponent: () => import('./components/home-component/home-component')
            .then(m => m.HomeComponent)
    },
    {
        path: 'admin',
        canActivate: [jwtGuard],
        data: { roles: [Roles.Admin] },
        loadComponent: () => import('./components/admin-component/admin-component')
            .then(m => m.AdminComponent)
    },
    {
        path: 'roles',
        canActivate: [jwtGuard],
        data: { roles: [Roles.Admin] },
        loadComponent: () => import('./components/roles-component/roles-component')
            .then(m => m.RolesComponent)
    },
    {
        path: 'usuarios',
        canActivate: [jwtGuard],
        data: { roles: [Roles.Admin] },
        loadComponent: () => import('./components/usuarios-component/usuarios-component')
            .then(m => m.UsuariosComponent)
    },
    {
        path: 'planes-membresias',
        canActivate: [jwtGuard],
        data: { roles: [Roles.Admin, Roles.Cliente] },
        loadComponent: () => import('./components/planes-membresias-component/planes-membresias-component')
            .then(m => m.PlanesMembresiasComponent)
    },
    {
        path: 'membresias',
        canActivate: [jwtGuard],
        data: { roles: [Roles.Admin, Roles.Cliente] },
        loadComponent: () => import('./components/membresias-component/membresias-component')
            .then(m => m.MembresiasComponent)
    },
    {
        path: 'pagos',
        canActivate: [jwtGuard],
        data: { roles: [Roles.Admin, Roles.Cliente] },
        loadComponent: () => import('./components/pagos-component/pagos-component')
            .then(m => m.PagosComponent)
    },
    {
        path: 'clases',
        canActivate: [jwtGuard],
        data: { roles: [Roles.Admin, Roles.Entrenador, Roles.Cliente] },
        loadComponent: () => import('./components/clases-component/clases-component')
            .then(m => m.ClasesComponent)
    },
    {
        path: 'inscripciones',
        canActivate: [jwtGuard],
        data: { roles: [Roles.Admin, Roles.Entrenador, Roles.Cliente] },
        loadComponent: () => import('./components/inscripciones-component/inscripciones-component')
            .then(m => m.InscripcionesComponent)
    },
    {
        path: 'asistencias',
        canActivate: [jwtGuard],
        data: { roles: [Roles.Admin, Roles.Entrenador] },
        loadComponent: () => import('./components/asistencias-component/asistencias-component')
            .then(m => m.AsistenciasComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./components/login-component/login-component')
            .then(m => m.LoginComponent)
    },
    {
        path: 'error403',
        loadComponent: () => import('./components/error403-component/error403-component')
            .then(m => m.Error403Component)
    },
    {
        path: '**',
        loadComponent: () => import('./components/error404-component/error404-component')
            .then(m => m.Error404Component)
    }
];