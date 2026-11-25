<?php
declare(strict_types=1);

namespace App\Validators;

use Respect\Validation\ValidatorBuilder as v;

final class InscripcionValidator
{
    private function reglas(): array
    {
        return [
            'usuario_id' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'Debe seleccionar un usuario válido.',
            ],
            'clase_id' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'Debe seleccionar una clase válida.',
            ],
            'fecha_inscripcion' => [
                'regla' => v::dateTime('Y-m-d H:i:s'),
                'mensaje' => 'La fecha de inscripción debe tener un formato válido.',
            ],
            'estado' => [
                'regla' => v::in(['Inscrito', 'Cancelado']),
                'mensaje' => 'El estado de la inscripción no es válido.',
            ],
        ];
    }

    public function validate(array $data): array
    {
        $errores = [];

        foreach ($this->reglas() as $campo => $config) {
            $valor = $data[$campo] ?? null;

            if (
                in_array($campo, ['fecha_inscripcion', 'estado'], true)
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
