<?php
declare(strict_types=1); #Permite especificar que los tipos de datos deben ser estrictos

namespace App\Models; #Permite definir un espacio de nombres para la clase User, lo que ayuda a organizar el código y evitar conflictos de nombres con otras clases

use Illuminate\Database\Eloquent\Model; #Permite usar la clase Model de Eloquent ORM para definir la clase User como un modelo de base de datos

class User extends Model{
    protected $table = 'usuarios'; #Especifica el nombre de la tabla en la base de datos que corresponde a este modelo
    public $timestamps = false; #Indica que la tabla no tiene columnas de marca de tiempo (created_at y updated_at)

    protected $fillable = [
        'rol_id', #Permite asignar masivamente el valor de la columna rol_id
        'nombre', #Permite asignar masivamente el valor de la columna nombre
        'apellido', #Permite asignar masivamente el valor de la columna apellido
        'cedula', #Permite asignar masivamente el valor de la columna cedula
        'correo_electronico', #Permite asignar masivamente el valor de la columna correo_electronico
        'telefono', #Permite asignar masivamente el valor de la columna telefono
        'password', #Permite asignar masivamente el valor de la columna password
        'activo', #Permite asignar masivamente el valor de la columna activo
        'tkRef', #Permite asignar masivamente el valor de la columna tkRef
        'fecha_registro', #Permite asignar masivamente el valor de la columna fecha_registro
    ];  

    protected $hidden = [
        'password', #Oculta la columna password al convertir el modelo a un array o JSON
    ];

    protected $casts = [
        'id' => 'integer', #Convierte el valor de la columna id a un tipo de dato entero
        'rol_id' => 'integer', #Convierte el valor de la columna rol_id a un tipo de dato entero
        'activo' => 'integer', #Convierte el valor de la columna activo a un tipo de dato entero
        'fecha_registro' => 'datetime', #Convierte el valor de la columna fecha_registro a una fecha
    ];

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function rol(){
        return $this->belongsTo(Role::class, 'rol_id');
    }

    public function membresias(){
        return $this->hasMany(Membresia::class, 'usuario_id');
    }

    public function clases(){
        return $this->hasMany(Clase::class, 'entrenador_id');
    }

    public function inscripciones(){
        return $this->hasMany(Inscripcion::class, 'usuario_id');
    }

 }