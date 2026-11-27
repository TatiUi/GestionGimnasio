import { inject, Injectable, signal } from '@angular/core';
import { PlanMembresiaModel } from '../models/plan-membresia-model';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type ParametroPlanMembresia = Record<string, string | number | boolean>;

interface RespuestaPlanesMembresias {
    data: PlanMembresiaModel[];
    pagination: {
        offset: number;
        limit: number;
        total: number;
    };
}

interface RespuestaPlanMembresia {
    data: PlanMembresiaModel | null;
}

const _SERVIDOR = environment.servidor;

@Injectable({ providedIn: 'root' })
export class PlanMembresiaService {

    private readonly http = inject(HttpClient);

    private readonly parametros = signal<ParametroPlanMembresia | null>(null);
    private readonly planMembresiaId = signal<number | null>(null);

    readonly planesMembresias = httpResource<RespuestaPlanesMembresias>(() => {
        const parametros = this.parametros();

        if (parametros === null) {
            return undefined;
        }

        return {
            url: `${_SERVIDOR}/planes_membresias/filter/0/20`,
            params: parametros
        };
    });

    readonly planMembresiaPorId = httpResource<RespuestaPlanMembresia>(() => {
        const id = this.planMembresiaId();

        return id === null
            ? undefined
            : `${_SERVIDOR}/planes_membresias/${id}`;
    });

    public buscarPorId(id: number): void {
        this.planMembresiaId.set(id);
    }

    filtrar(parametros: ParametroPlanMembresia): void {
        this.parametros.set(parametros);
    }

    guardar(datos: PlanMembresiaModel, id?: number) {
        delete datos.id;

        if (id) {
            // Modificar el plan de membresía
            return this.http.put<any>(
                `${_SERVIDOR}/planes_membresias/${id}`, datos
            );
        } else {
            // Crear un nuevo plan de membresía
            return this.http.post<any>(
                `${_SERVIDOR}/planes_membresias`, datos
            );
        }
    }

    eliminar(id: number) {
        return this.http.delete<any>(
            `${_SERVIDOR}/planes_membresias/${id}`
        );
    }
}