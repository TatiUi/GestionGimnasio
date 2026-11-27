import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { TokenService } from '../../services/token-service';
import { Roles } from '../../models/roles';

export const jwtGuard: CanActivateFn = (route, state) => {
    const srvAuth = inject(AuthService);
    const srvTokens = inject(TokenService);
    const router = inject(Router);

    if (!srvAuth.isLoggedIn()) {
        return router.createUrlTree(['/login']);
    }

    const tokenD = srvTokens.decodeToken();
    const rol_id = Number(tokenD.rol_id);

    const roles: Roles[] = route.data['roles'] ?? [];

    if (roles.length > 0 && !roles.includes(rol_id)) {
        return router.createUrlTree(['/error403']);
    }

    return true;
};