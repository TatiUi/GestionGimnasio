import { inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TokenService } from './token-service';
import { Router } from '@angular/router';
import { User } from '../models/User';
import { IToken, LoginForm } from '../models/interfaces';
import { map, tap, catchError, of } from 'rxjs';

const servidor = environment.servidor + '/auth';

@Service()
export class AuthService {

    private http = inject(HttpClient);
    private readonly srvTokens = inject(TokenService);
    private readonly router = inject(Router);

    private userActualS = signal(this.userActual);

    private refreshing: boolean = false;

    private readonly LIMITE_REFRESH = 20; // segundos

    // Obtener el usuario autenticado
    public getUsuario(): User {

        return this.userActualS();

    }

    // Obtener el identificador del usuario
    public getUsuarioId(): string {

        return this.userActualS().id;

    }

    // Obtener el rol del usuario
    public getRol(): number {

        return Number(this.userActualS().rol_id);

    }

    public login(datos: LoginForm) {

        return this.http.post<IToken>(`${servidor}/login`, datos)
        .pipe(
            tap((tokens) => {
                this.doLogin(tokens);
            }),
            map(() => true),
            catchError((error) => {
                console.log(error);
                return of(error.status);
            })
        );

    }

    public loggout() {

        if (this.isLoggedIn()) {

            this.http.delete(
                `${servidor}/loggout/${this.userActual.id}`, {}
            ).subscribe();

        }

        this.doLoggOut();

    }

    doLogin(tokens: IToken) {

        // Guardar los tokens
        this.srvTokens.setTokens(tokens);

        // Actualizar los datos del usuario y rol
        this.userActualS.set(this.userActual);

    }

    doLoggOut() {

        // Eliminar los tokens
        this.srvTokens.eliminarTokens();

        // Limpiar los datos del usuario y rol
        this.userActualS.set(this.userActual);

        // Navegar a la página de login
        this.router.navigate(['/login']);

    }

    public isLoggedIn(): boolean {

        return !!this.srvTokens.token &&
            !this.srvTokens.jwtTokenExp();

    }

    private get userActual(): User {

        if (!this.srvTokens.token) {

            return new User();

        } else {

            const tokenD = this.srvTokens.decodeToken();

            return new User({
                id: String(tokenD.sub),
                correo_electronico: tokenD.correo_electronico,
                rol_id: tokenD.rol_id
            });

        }

    }

    public refreshSession() {

        if (!this.refreshing) {

            this.refreshing = true;

            const idUsuario = this.srvTokens.decodeToken().sub;

            return this.http.post<IToken>(
                `${servidor}/refresh-session/${idUsuario}`,
                {
                    tkRef: this.srvTokens.refreshToken
                }
            )
            .subscribe({

                next: tokens => {

                    this.srvTokens.setTokens(tokens);

                    // Actualizar los datos del usuario
                    this.userActualS.set(this.userActual);

                    this.refreshing = false;

                },

                error: () => {

                    this.refreshing = false;
                    this.doLoggOut();

                }

            });

        }

        return false;

    }

    public verifySession(): boolean {

        if (this.isLoggedIn()) {

            const tiempo = this.srvTokens.tokenTimeToExp();

            console.log(tiempo);

            if (tiempo <= 0) {

                this.loggout();

                return false;

            }

            if (tiempo > 0 && tiempo <= this.LIMITE_REFRESH) {

                this.refreshSession();

            }

            return true;

        } else {

            this.loggout();

            return false;

        }

    }

}