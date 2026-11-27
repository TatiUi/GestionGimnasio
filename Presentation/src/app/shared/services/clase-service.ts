import { inject, Injectable, signal } from '@angular/core';
import { ClaseModel } from '../models/clase-model';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type ParametroClase = Record<string, string | number | boolean>;

interface RespuestaClases {
    data: ClaseModel[];
    pagination: {
        offset: number;
        limit: number;
        total: number;
    };
}

interface RespuestaClase {
    data: ClaseModel | null;
}

const _SERVIDOR = environment.servidor;

@Injectable({ providedIn: 'root' })
export class ClaseService {

    private readonly http = inject(HttpClient);

    private readonly parametros = signal<ParametroClase | null>(null);
    private readonly claseId = signal<number | null>(null);

    readonly clases = httpResource<RespuestaClases>(() => {
        const parametros = this.parametros();

        if (parametros === null) {
            return undefined;
        }

        return {
            url: `${_SERVIDOR}/clases/filter/0/20`,
            params: parametros
        };
    });

    readonly clasePorId = httpResource<RespuestaClase>(() => {
        const id = this.claseId();

        return id === null
            ? undefined
            : `${_SERVIDOR}/clases/${id}`;
    });

    public buscarPorId(id: number): void {
        this.claseId.set(id);
    }

    filtrar(parametros: ParametroClase): void {
        this.parametros.set(parametros);
    }

    guardar(datos: ClaseModel, id?: number) {
        delete datos.id;

        if (id) {
            // Modificar la clase
            return this.http.put<any>(
                `${_SERVIDOR}/clases/${id}`, datos
            );
        } else {
            // Crear una nueva clase
            return this.http.post<any>(
                `${_SERVIDOR}/clases`, datos
            );
        }
    }

    eliminar(id: number) {
        return this.http.delete<any>(
            `${_SERVIDOR}/clases/${id}`
        );
    }
}