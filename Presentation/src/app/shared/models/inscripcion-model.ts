export interface InscripcionModel {
    id?: number;
    usuario_id: number;
    clase_id: number;
    fecha_inscripcion: string;
    estado: 'Inscrito' | 'Cancelado';
}

export type InscripcionCreateInput = Omit<InscripcionModel, 'id'>;

export type InscripcionUpdateInput = Partial<Omit<InscripcionModel, 'id'>> & {id: number};