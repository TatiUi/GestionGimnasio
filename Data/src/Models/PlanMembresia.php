<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanMembresia extends Model{
    protected $table = 'planes_membresias';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'precio',
        'duracion_dias',
        'activo'
    ];

    protected $casts = [
        'id' => 'integer',
        'precio' => 'decimal:2',
        'duracion_dias' => 'integer',
        'activo' => 'integer',
    ];

    public function membresias(){
        return $this->hasMany(Membresia::class, 'plan_id');
    }
}
