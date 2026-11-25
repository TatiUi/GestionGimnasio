<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inscripcion extends Model{
    protected $table = 'inscripciones';
    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'clase_id',
        'fecha_inscripcion',
        'estado'
    ];

    protected $casts = [
        'id' => 'integer',
        'usuario_id' => 'integer',
        'clase_id' => 'integer',
        'fecha_inscripcion' => 'datetime',
    ];

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function usuario(){
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function clase(){
        return $this->belongsTo(Clase::class, 'clase_id');
    }

    public function asistencias(){
        return $this->hasMany(Asistencia::class, 'inscripcion_id');
    }
}
