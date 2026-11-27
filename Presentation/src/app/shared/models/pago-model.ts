export interface PagoModel {
    id?: number;
    membresia_id: number;
    monto: number | string;
    fecha_pago: string;
    metodo_pago: string;
    estado?: 'Pendiente' | 'Completado' | 'Anulado';
}

export type PagoCreateInput = Omit<PagoModel, 'id'>;

export type PagoUpdateInput = Partial<Omit<PagoModel, 'id'>> & {id: number};