import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
    const srvAuth = inject(AuthService);
    const router = inject(Router);

    if (req.url.startsWith(`${environment.servidor}/auth/`)) {
        return next(req);
    }

    return next(req)
        .pipe(
            finalize(
                () => {
                    if (srvAuth.isLoggedIn()) {
                        srvAuth.verifySession();
                    } else {
                        srvAuth.loggout();
                        router.navigate(['/login']);
                    }
                }
            )
        );
};