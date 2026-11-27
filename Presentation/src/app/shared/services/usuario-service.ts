import { inject, Injectable, signal } from '@angular/core';
import { UsuarioModel } from '../models/usuario-model';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type ParametroUsuario = Record<string, string | number | boolean>;

interface RespuestaUsuarios {
    data: UsuarioModel[];
    pagination: {
        offset: number;
        limit: number;
        total: number;
    };
}

interface RespuestaUsuario {
    data: UsuarioModel | null;
}

const _SERVIDOR = environment.servidor;

@Injectable({ providedIn: 'root' })
export class UsuarioService {

    private readonly http = inject(HttpClient);

    private readonly parametros = signal<ParametroUsuario | null>(null);
    private readonly usuarioId = signal<number | null>(null);

    readonly usuarios = httpResource<RespuestaUsuarios>(() => {
        const parametros = this.parametros();

        if (parametros === null) {
            return undefined;
        }

        return {
            url: `${_SERVIDOR}/usuarios/filter/0/20`,
            params: parametros
        };
    });

    readonly usuarioPorId = httpResource<RespuestaUsuario>(() => {
        const id = this.usuarioId();

        return id === null
            ? undefined
            : `${_SERVIDOR}/usuarios/${id}`;
    });

    public buscarPorId(id: number): void {
        this.usuarioId.set(id);
    }

    filtrar(parametros: ParametroUsuario): void {
        this.parametros.set(parametros);
    }

    guardar(datos: UsuarioModel, id?: number) {
        delete datos.id;

        if (id) {
            // Modificar el usuario
            return this.http.put<any>(
                `${_SERVIDOR}/usuarios/${id}`, datos
            );
        } else {
            // Crear un nuevo usuario
            return this.http.post<any>(
                `${_SERVIDOR}/usuarios`, datos
            );
        }
    }

    eliminar(id: number) {
        return this.http.delete<any>(
            `${_SERVIDOR}/usuarios/${id}`
        );
    }
}