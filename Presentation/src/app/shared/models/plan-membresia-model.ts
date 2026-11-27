export interface PlanMembresiaModel {
    id?: number;
    nombre: string;
    descripcion: string;
    precio: number | string;
    duracion_dias: number;
    activo?: number;
}

export type PlanMembresiaCreateInput = Omit<PlanMembresiaModel, 'id'>;

export type PlanMembresiaUpdateInput = Partial<Omit<PlanMembresiaModel, 'id'>> & {id: number};