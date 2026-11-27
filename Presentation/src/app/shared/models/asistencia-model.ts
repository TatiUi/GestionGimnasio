export interface AsistenciaModel {
    id?: number;
    inscripcion_id: number;
    clase_id: number;
    fecha_asistencia: string;
    estado: 'Presente' | 'Ausente';
}

export type AsistenciaCreateInput = Omit<AsistenciaModel, 'id'>;

export type AsistenciaUpdateInput = Partial<Omit<AsistenciaModel, 'id'>> & {id: number};