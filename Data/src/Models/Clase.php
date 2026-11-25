<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Clase extends Model{
    protected $table = 'clases';
    public $timestamps = false;

    protected $fillable = [
        'entrenador_id',
        'nombre',
        'descripcion',
        'capacidad',
        'fecha_hora_inicio',
        'fecha_hora_fin',
        'estado'
    ];

    protected $casts = [
        'id' => 'integer',
        'entrenador_id' => 'integer',
        'capacidad' => 'integer',
        'fecha_hora_inicio' => 'datetime',
        'fecha_hora_fin' => 'datetime',
    ];

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function entrenador(){
        return $this->belongsTo(User::class, 'entrenador_id');
    }

    public function inscripciones(){
        return $this->hasMany(Inscripcion::class, 'clase_id');
    }

    public function asistencias(){
        return $this->hasMany(Asistencia::class, 'clase_id');
    }
}
