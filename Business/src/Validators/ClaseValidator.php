<?php
declare(strict_types=1);

namespace App\Validators;

use Respect\Validation\ValidatorBuilder as v;

final class ClaseValidator
{
    private function reglas(): array
    {
        return [
            'entrenador_id' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'Debe seleccionar un entrenador válido.',
            ],
            'nombre' => [
                'regla' => v::stringType()->notBlank()->length(v::between(1, 50)),
                'mensaje' => 'El nombre es obligatorio y debe tener máximo 50 caracteres.',
            ],
            'descripcion' => [
                'regla' => v::stringType()->notBlank()->length(v::between(1, 255)),
                'mensaje' => 'La descripción es obligatoria y debe tener máximo 255 caracteres.',
            ],
            'capacidad' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'La capacidad debe ser un entero positivo.',
            ],
            'fecha_hora_inicio' => [
                'regla' => v::dateTime('Y-m-d H:i:s'),
                'mensaje' => 'La fecha de inicio debe tener un formato válido.',
            ],
            'fecha_hora_fin' => [
                'regla' => v::dateTime('Y-m-d H:i:s'),
                'mensaje' => 'La fecha de fin debe tener un formato válido.',
            ],
            'estado' => [
                'regla' => v::in(['Programada', 'Finalizada', 'Cancelada']),
                'mensaje' => 'El estado de la clase no es válido.',
            ],
        ];
    }

    public function validate(array $data): array
    {
        $errores = [];

        foreach ($this->reglas() as $campo => $config) {
            $valor = $data[$campo] ?? null;

            if (
                in_array($campo, ['capacidad', 'estado'], true)
                && $valor === null
            ) {
                continue;
            }

            if ($config['regla']->validate($valor)->hasFailed()) {
                $errores[$campo] = $config['mensaje'];
            }
        }

        return $errores;
    }
}
