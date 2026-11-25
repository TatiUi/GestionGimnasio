<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asistencia extends Model{
    protected $table = 'asistencias';
    public $timestamps = false;

    protected $fillable = [
        'inscripcion_id',
        'clase_id',
        'fecha_asistencia',
        'estado'
    ];

    protected $casts = [
        'id' => 'integer',
        'inscripcion_id' => 'integer',
        'clase_id' => 'integer',
        'fecha_asistencia' => 'datetime',
    ];

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function inscripcion(){
        return $this->belongsTo(Inscripcion::class, 'inscripcion_id');
    }

    public function clase(){
        return $this->belongsTo(Clase::class, 'clase_id');
    }
}
