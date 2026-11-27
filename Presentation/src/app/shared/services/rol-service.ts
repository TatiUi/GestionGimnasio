import { inject, Injectable, signal } from '@angular/core';
import { RolModel } from '../models/rol-model';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type ParametroRol = Record<string, string | number | boolean>;

interface RespuestaRoles {
    data: RolModel[];
    pagination: {
        offset: number;
        limit: number;
        total: number;
    };
}

interface RespuestaRol {
    data: RolModel | null;
}

const _SERVIDOR = environment.servidor;

@Injectable({ providedIn: 'root' })
export class RolService {

    private readonly http = inject(HttpClient);

    private readonly parametros = signal<ParametroRol | null>(null);
    private readonly rolId = signal<number | null>(null);

    readonly roles = httpResource<RespuestaRoles>(() => {
        const parametros = this.parametros();

        if (parametros === null) {
            return undefined;
        }

        return {
            url: `${_SERVIDOR}/roles/filter/0/20`,
            params: parametros
        };
    });

    readonly rolPorId = httpResource<RespuestaRol>(() => {
        const id = this.rolId();

        return id === null
            ? undefined
            : `${_SERVIDOR}/roles/${id}`;
    });

    public buscarPorId(id: number): void {
        this.rolId.set(id);
    }

    filtrar(parametros: ParametroRol): void {
        this.parametros.set(parametros);
    }

    guardar(datos: RolModel, id?: number) {
        delete datos.id;

        if (id) {
            // Modificar el rol
            return this.http.put<any>(
                `${_SERVIDOR}/roles/${id}`, datos
            );
        } else {
            // Crear un nuevo rol
            return this.http.post<any>(
                `${_SERVIDOR}/roles`, datos
            );
        }
    }

    eliminar(id: number) {
        return this.http.delete<any>(
            `${_SERVIDOR}/roles/${id}`
        );
    }
}