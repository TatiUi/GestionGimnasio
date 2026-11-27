export interface UsuarioModel {
    id?: number;
    rol_id: number;
    nombre: string;
    apellido: string;
    cedula: string;
    correo_electronico: string;
    telefono: string;
    password?: string;
    activo?: number;
    fecha_registro?: string;
}

export type UsuarioCreateInput = Omit<UsuarioModel, 'id' | 'activo' | 'fecha_registro' | 'password'> & {password: string};

export type UsuarioUpdateInput = Partial<Omit<UsuarioModel, 'id' | 'fecha_registro' | 'activo'>> & {id: number; activo?: boolean};