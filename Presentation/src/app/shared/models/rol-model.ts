export interface RolModel {
    id?: number;
    nombre: string;
}

export type RolCreateInput = Omit<RolModel, 'id'>;
export type RolUpdateInput = RolModel & {id: number};