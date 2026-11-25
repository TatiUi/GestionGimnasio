<?php
declare(strict_types=1);

namespace App\Validators;

use Respect\Validation\ValidatorBuilder as v;

final class PlanMembresiaValidator
{
    private function reglas(): array
    {
        return [
            'nombre' => [
                'regla' => v::stringType()->notBlank()->length(v::between(1, 50)),
                'mensaje' => 'El nombre es obligatorio y debe tener máximo 50 caracteres.',
            ],
            'descripcion' => [
                'regla' => v::stringType()->notBlank()->length(v::between(1, 255)),
                'mensaje' => 'La descripción es obligatoria y debe tener máximo 255 caracteres.',
            ],
            'precio' => [
                'regla' => v::numericVal()->greaterThanOrEqual(0),
                'mensaje' => 'El precio debe ser un número no negativo.',
            ],
            'duracion_dias' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'La duración debe ser un entero positivo.',
            ],
        ];
    }

    public function validate(array $data): array
    {
        $errores = [];

        foreach ($this->reglas() as $campo => $config) {
            if ($config['regla']->validate($data[$campo] ?? null)->hasFailed()) {
                $errores[$campo] = $config['mensaje'];
            }
        }

        return $errores;
    }
}
