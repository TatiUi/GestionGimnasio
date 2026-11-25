<?php
declare(strict_types=1);

namespace App\Validators;

use Respect\Validation\ValidatorBuilder as v;

final class RoleValidator
{
    private function reglas(): array
    {
        return [
            'nombre' => [
                'regla' => v::stringType()
                    ->notBlank()
                    ->length(v::between(1, 50)),
                'mensaje' => 'El nombre es obligatorio y debe tener máximo 50 caracteres.',
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
