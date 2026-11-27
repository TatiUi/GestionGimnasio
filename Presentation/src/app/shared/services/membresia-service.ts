import { inject, Injectable, signal } from '@angular/core';
import { MembresiaModel } from '../models/membresia-model';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type ParametroMembresia = Record<string, string | number | boolean>;

interface RespuestaMembresias {
    data: MembresiaModel[];
    pagination: {
        offset: number;
        limit: number;
        total: number;
    };
}

interface RespuestaMembresia {
    data: MembresiaModel | null;
}

const _SERVIDOR = environment.servidor;

@Injectable({ providedIn: 'root' })
export class MembresiaService {

    private readonly http = inject(HttpClient);

    private readonly parametros = signal<ParametroMembresia | null>(null);
    private readonly membresiaId = signal<number | null>(null);

    readonly membresias = httpResource<RespuestaMembresias>(() => {
        const parametros = this.parametros();

        if (parametros === null) {
            return undefined;
        }

        return {
            url: `${_SERVIDOR}/membresias/filter/0/20`,
            params: parametros
        };
    });

    readonly membresiaPorId = httpResource<RespuestaMembresia>(() => {
        const id = this.membresiaId();

        return id === null
            ? undefined
            : `${_SERVIDOR}/membresias/${id}`;
    });

    public buscarPorId(id: number): void {
        this.membresiaId.set(id);
    }

    filtrar(parametros: ParametroMembresia): void {
        this.parametros.set(parametros);
    }

    guardar(datos: MembresiaModel, id?: number) {
        delete datos.id;

        if (id) {
            // Modificar la membresía
            return this.http.put<any>(
                `${_SERVIDOR}/membresias/${id}`, datos
            );
        } else {
            // Crear una nueva membresía
            return this.http.post<any>(
                `${_SERVIDOR}/membresias`, datos
            );
        }
    }

    eliminar(id: number) {
        return this.http.delete<any>(
            `${_SERVIDOR}/membresias/${id}`
        );
    }
}