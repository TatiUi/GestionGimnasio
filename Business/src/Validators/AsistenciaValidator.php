<?php
declare(strict_types=1);

namespace App\Validators;

use Respect\Validation\ValidatorBuilder as v;

final class AsistenciaValidator
{
    private function reglas(): array
    {
        return [
            'inscripcion_id' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'Debe seleccionar una inscripción válida.',
            ],
            'clase_id' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'Debe seleccionar una clase válida.',
            ],
            'fecha_asistencia' => [
                'regla' => v::dateTime('Y-m-d H:i:s'),
                'mensaje' => 'La fecha de asistencia debe tener un formato válido.',
            ],
            'estado' => [
                'regla' => v::in(['Presente', 'Ausente']),
                'mensaje' => 'El estado de la asistencia no es válido.',
            ],
        ];
    }

    public function validate(array $data): array
    {
        $errores = [];

        foreach ($this->reglas() as $campo => $config) {
            $valor = $data[$campo] ?? null;

            if ($campo === 'fecha_asistencia' && $valor === null) {
                continue;
            }

            if ($config['regla']->validate($valor)->hasFailed()) {
                $errores[$campo] = $config['mensaje'];
            }
        }

        return $errores;
    }
}
