export interface ClaseModel {
    id?: number;
    entrenador_id: number;
    nombre: string;
    descripcion: string;
    capacidad: number;
    fecha_hora_inicio: string;
    fecha_hora_fin: string;
    estado?: 'Programada' | 'Finalizada' | 'Cancelada';
}

export type ClaseCreateInput = Omit<ClaseModel, 'id'>;

export type ClaseUpdateInput = Partial<Omit<ClaseModel, 'id'>> & {id: number};