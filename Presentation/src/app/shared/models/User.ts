export class User {
    id: string;
    correo_electronico: string;
    rol_id: number;

    constructor(usr?: User) {
        this.id = usr !== undefined ? usr.id : '';
        this.correo_electronico = usr !== undefined ? usr.correo_electronico : '';
        this.rol_id = usr !== undefined ? usr.rol_id : -1;
    }
}