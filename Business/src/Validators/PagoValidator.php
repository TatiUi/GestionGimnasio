<?php
declare(strict_types=1);

namespace App\Validators;

use Respect\Validation\ValidatorBuilder as v;

final class PagoValidator
{
    private function reglas(): array
    {
        return [
            'membresia_id' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'Debe seleccionar una membresía válida.',
            ],
            'monto' => [
                'regla' => v::numericVal()->greaterThanOrEqual(0),
                'mensaje' => 'El monto debe ser un número no negativo.',
            ],
            'fecha_pago' => [
                'regla' => v::dateTime('Y-m-d H:i:s'),
                'mensaje' => 'La fecha de pago debe tener un formato válido.',
            ],
            'metodo_pago' => [
                'regla' => v::stringType()->notBlank()->length(v::between(1, 50)),
                'mensaje' => 'El método de pago es obligatorio y debe tener máximo 50 caracteres.',
            ],
            'estado' => [
                'regla' => v::in(['Pendiente', 'Completado', 'Anulado']),
                'mensaje' => 'El estado del pago no es válido.',
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
