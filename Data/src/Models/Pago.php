<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model{
    protected $table = 'pagos';
    public $timestamps = false;

    protected $fillable = [
        'membresia_id',
        'monto',
        'fecha_pago',
        'metodo_pago',
        'estado'
    ];

    protected $casts = [
        'id' => 'integer',
        'membresia_id' => 'integer',
        'monto' => 'decimal:2',
        'fecha_pago' => 'datetime',
    ];

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function membresia(){
        return $this->belongsTo(Membresia::class, 'membresia_id');
    }
}
