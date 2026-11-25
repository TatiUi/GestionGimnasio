<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Membresia extends Model{
    protected $table = 'membresias';
    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'plan_id',
        'fecha_inicio',
        'fecha_fin',
        'estado'
    ];

    protected $casts = [
        'id' => 'integer',
        'usuario_id' => 'integer',
        'plan_id' => 'integer',
        'fecha_inicio' => 'datetime',
        'fecha_fin' => 'datetime',
    ];

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function usuario(){
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function plan(){
        return $this->belongsTo(PlanMembresia::class, 'plan_id');
    }

    public function pagos(){
        return $this->hasMany(Pago::class, 'membresia_id');
    }
}
