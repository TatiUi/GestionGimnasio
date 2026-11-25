<?php
declare(strict_types=1);

namespace App\Validators;

use Respect\Validation\ValidatorBuilder as v;

final class UserValidator
{
    private function reglas(): array
    {
        return [
            'rol_id' => [
                'regla' => v::intType()->positive(),
                'mensaje' => 'Debe seleccionar un rol válido.',
            ],
            'nombre' => [
                'regla' => v::stringType()->notBlank()->length(v::between(1, 50)),
                'mensaje' => 'El nombre es obligatorio y debe tener máximo 50 caracteres.',
            ],
            'apellido' => [
                'regla' => v::stringType()->notBlank()->length(v::between(1, 50)),
                'mensaje' => 'El apellido es obligatorio y debe tener máximo 50 caracteres.',
            ],
            'cedula' => [
                'regla' => v::stringType()->notBlank()->length(v::between(1, 20)),
                'mensaje' => 'La cédula es obligatoria y debe tener máximo 20 caracteres.',
            ],
            'correo_electronico' => [
                'regla' => v::email()->length(v::between(1, 100)),
                'mensaje' => 'Debe proporcionar un correo electrónico válido de máximo 100 caracteres.',
            ],
            'telefono' => [
                'regla' => v::stringType()->notBlank()->length(v::between(1, 20)),
                'mensaje' => 'El teléfono es obligatorio y debe tener máximo 20 caracteres.',
            ],
            'password' => [
                'regla' => v::stringType()->notBlank()->length(v::between(8, 255)),
                'mensaje' => 'La contraseña debe tener entre 8 y 255 caracteres.',
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
