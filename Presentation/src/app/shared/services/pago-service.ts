import { inject, Injectable, signal } from '@angular/core';
import { PagoModel } from '../models/pago-model';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type ParametroPago = Record<string, string | number | boolean>;

interface RespuestaPagos {
    data: PagoModel[];
    pagination: {
        offset: number;
        limit: number;
        total: number;
    };
}

interface RespuestaPago {
    data: PagoModel | null;
}

const _SERVIDOR = environment.servidor;

@Injectable({ providedIn: 'root' })
export class PagoService {

    private readonly http = inject(HttpClient);

    private readonly parametros = signal<ParametroPago | null>(null);
    private readonly pagoId = signal<number | null>(null);

    readonly pagos = httpResource<RespuestaPagos>(() => {
        const parametros = this.parametros();

        if (parametros === null) {
            return undefined;
        }

        return {
            url: `${_SERVIDOR}/pagos/filter/0/20`,
            params: parametros
        };
    });

    readonly pagoPorId = httpResource<RespuestaPago>(() => {
        const id = this.pagoId();

        return id === null
            ? undefined
            : `${_SERVIDOR}/pagos/${id}`;
    });

    public buscarPorId(id: number): void {
        this.pagoId.set(id);
    }

    filtrar(parametros: ParametroPago): void {
        this.parametros.set(parametros);
    }

    guardar(datos: PagoModel, id?: number) {
        delete datos.id;

        if (id) {
            // Modificar el pago
            return this.http.put<any>(
                `${_SERVIDOR}/pagos/${id}`, datos
            );
        } else {
            // Registrar un nuevo pago
            return this.http.post<any>(
                `${_SERVIDOR}/pagos`, datos
            );
        }
    }

    eliminar(id: number) {
        return this.http.delete<any>(
            `${_SERVIDOR}/pagos/${id}`
        );
    }
}