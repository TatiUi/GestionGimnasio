<?php
declare(strict_types=1);

namespace App\Validators;

use Respect\Validation\ValidatorBuilder as v;

final class MembresiaValidator
{
    private function reglas(): array
    {
        return [
            'usuario_id' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'Debe seleccionar un usuario válido.',
            ],
            'plan_id' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'Debe seleccionar un plan válido.',
            ],
            'fecha_inicio' => [
                'regla' => v::dateTime('Y-m-d H:i:s'),
                'mensaje' => 'La fecha de inicio debe tener un formato válido.',
            ],
            'fecha_fin' => [
                'regla' => v::dateTime('Y-m-d H:i:s'),
                'mensaje' => 'La fecha de fin debe tener un formato válido.',
            ],
            'estado' => [
                'regla' => v::in(['Activa', 'Vencida', 'Cancelada']),
                'mensaje' => 'El estado de la membresía no es válido.',
            ],
        ];
    }

    public function validate(array $data): array
    {
        $errores = [];

        foreach ($this->reglas() as $campo => $config) {
            $valor = $data[$campo] ?? null;

            if ($campo === 'estado' && $valor === null) {
                continue;
            }

            if ($config['regla']->validate($valor)->hasFailed()) {
                $errores[$campo] = $config['mensaje'];
            }
        }

        return $errores;
    }
}
