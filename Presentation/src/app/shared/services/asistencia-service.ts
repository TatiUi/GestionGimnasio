import { inject, Injectable, signal } from '@angular/core';
import { AsistenciaModel } from '../models/asistencia-model';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type ParametroAsistencia = Record<string, string | number | boolean>;

interface RespuestaAsistencias {
    data: AsistenciaModel[];
    pagination: {
        offset: number;
        limit: number;
        total: number;
    };
}

interface RespuestaAsistencia {
    data: AsistenciaModel | null;
}

const _SERVIDOR = environment.servidor;

@Injectable({ providedIn: 'root' })
export class AsistenciaService {

    private readonly http = inject(HttpClient);

    private readonly parametros = signal<ParametroAsistencia | null>(null);
    private readonly asistenciaId = signal<number | null>(null);

    readonly asistencias = httpResource<RespuestaAsistencias>(() => {
        const parametros = this.parametros();

        if (parametros === null) {
            return undefined;
        }

        return {
            url: `${_SERVIDOR}/asistencias/filter/0/20`,
            params: parametros
        };
    });

    readonly asistenciaPorId = httpResource<RespuestaAsistencia>(() => {
        const id = this.asistenciaId();

        return id === null
            ? undefined
            : `${_SERVIDOR}/asistencias/${id}`;
    });

    public buscarPorId(id: number): void {
        this.asistenciaId.set(id);
    }

    filtrar(parametros: ParametroAsistencia): void {
        this.parametros.set(parametros);
    }

    guardar(datos: AsistenciaModel, id?: number) {
        delete datos.id;

        if (id) {
            // Modificar la asistencia
            return this.http.put<any>(
                `${_SERVIDOR}/asistencias/${id}`, datos
            );
        } else {
            // Registrar una nueva asistencia
            return this.http.post<any>(
                `${_SERVIDOR}/asistencias`, datos
            );
        }
    }

    eliminar(id: number) {
        return this.http.delete<any>(
            `${_SERVIDOR}/asistencias/${id}`
        );
    }
}