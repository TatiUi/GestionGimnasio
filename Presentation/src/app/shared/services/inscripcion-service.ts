import { inject, Injectable, signal } from '@angular/core';
import { InscripcionModel } from '../models/inscripcion-model';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type ParametroInscripcion = Record<string, string | number | boolean>;

interface RespuestaInscripciones {
    data: InscripcionModel[];
    pagination: {
        offset: number;
        limit: number;
        total: number;
    };
}

interface RespuestaInscripcion {
    data: InscripcionModel | null;
}

const _SERVIDOR = environment.servidor;

@Injectable({ providedIn: 'root' })
export class InscripcionService {

    private readonly http = inject(HttpClient);

    private readonly parametros = signal<ParametroInscripcion | null>(null);
    private readonly inscripcionId = signal<number | null>(null);

    readonly inscripciones = httpResource<RespuestaInscripciones>(() => {
        const parametros = this.parametros();

        if (parametros === null) {
            return undefined;
        }

        return {
            url: `${_SERVIDOR}/inscripciones/filter/0/20`,
            params: parametros
        };
    });

    readonly inscripcionPorId = httpResource<RespuestaInscripcion>(() => {
        const id = this.inscripcionId();

        return id === null
            ? undefined
            : `${_SERVIDOR}/inscripciones/${id}`;
    });

    public buscarPorId(id: number): void {
        this.inscripcionId.set(id);
    }

    filtrar(parametros: ParametroInscripcion): void {
        this.parametros.set(parametros);
    }

    guardar(datos: InscripcionModel, id?: number) {
        delete datos.id;

        if (id) {
            // Modificar la inscripción
            return this.http.put<any>(
                `${_SERVIDOR}/inscripciones/${id}`, datos
            );
        } else {
            // Crear una nueva inscripción
            return this.http.post<any>(
                `${_SERVIDOR}/inscripciones`, datos
            );
        }
    }

    eliminar(id: number) {
        return this.http.delete<any>(
            `${_SERVIDOR}/inscripciones/${id}`
        );
    }
}