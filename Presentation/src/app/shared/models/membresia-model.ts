export interface MembresiaModel {
    id?: number;
    usuario_id: number;
    plan_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado?: 'Activa' | 'Vencida' | 'Cancelada';
}

export type MembresiaCreateInput = Omit<MembresiaModel, 'id'>;

export type MembresiaUpdateInput = Partial<Omit<MembresiaModel, 'id'>> & {id: number};