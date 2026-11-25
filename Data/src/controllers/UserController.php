<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Illuminate\Database\QueryException;
use App\Models\User;

class UserController {
    private ContainerInterface $container;
    public function __construct(ContainerInterface $container) { $this->container = $container; }

    public function read(Request $request, Response $response, array $args): Response {
        $this->container->get('eloquent');
        $fields = ['id', 'rol_id', 'nombre', 'apellido', 'cedula', 'correo_electronico', 'telefono', 'activo', 'fecha_registro'];

        if (isset($args['id'])) {
            $user = User::query()->select($fields)->find($args['id']);
            return $this->json($response, ['data' => $user], 200);
        }

        $users = User::query()->select($fields)->get()->toArray();
        return $this->json($response, ['data' => $users], 200);
    }

    public function filter(Request $request, Response $response, array $args): Response {
        $this->container->get('eloquent');
        $offset = filter_var($args['offset'] ?? 0, FILTER_VALIDATE_INT);
        $limit = filter_var($args['limit'] ?? 20, FILTER_VALIDATE_INT);

        if ($offset === false || $offset < 0 || $limit === false || $limit < 1 || $limit > 100) {
            return $this->json($response, [
                'error' => 'El offset debe ser mayor o igual a 0 y el limite debe estar entre 1 y 100.'
            ], 422);
        }

        $params = $request->getQueryParams();
        $name = trim((string) ($params['nombre'] ?? ''));
        $email = trim((string) ($params['correo_electronico'] ?? ''));
        $roleId = filter_var($params['rol_id'] ?? null, FILTER_VALIDATE_INT);
        $query = User::query()->select([
            'id', 'rol_id', 'nombre', 'apellido', 'cedula',
            'correo_electronico', 'telefono', 'activo', 'fecha_registro'
        ]);

        if ($name !== '') {
            $query->where(function ($query) use ($name) {
                $query->where('nombre', 'like', "%{$name}%")
                    ->orWhere('apellido', 'like', "%{$name}%");
            });
        }
        if ($email !== '') {
            $query->where('correo_electronico', 'like', "%{$email}%");
        }
        if ($roleId !== false && $roleId !== null) {
            $query->where('rol_id', $roleId);
        }

        $total = (clone $query)->count('id');
        $users = $query->orderBy('id')->offset($offset)->limit($limit)->get()->toArray();

        return $this->json($response, [
            'data' => $users,
            'pagination' => ['offset' => $offset, 'limit' => $limit, 'total' => $total]
        ], 200);
    }

    public function create(Request $request, Response $response, array $args): Response {
        $data = $request->getParsedBody();
        $data = is_array($data) ? $data : [];
        $errors = [];
        $roleId = filter_var($data['rol_id'] ?? null, FILTER_VALIDATE_INT);
        $name = trim((string) ($data['nombre'] ?? ''));
        $lastName = trim((string) ($data['apellido'] ?? ''));
        $cedula = trim((string) ($data['cedula'] ?? ''));
        $email = trim((string) ($data['correo_electronico'] ?? ''));
        $phone = trim((string) ($data['telefono'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        if ($roleId === false || $roleId < 1) $errors['rol_id'] = 'Debe ser un entero positivo.';
        if ($name === '' || mb_strlen($name) > 50) $errors['nombre'] = 'Es obligatorio y debe tener máximo 50 caracteres.';
        if ($lastName === '' || mb_strlen($lastName) > 50) $errors['apellido'] = 'Es obligatorio y debe tener máximo 50 caracteres.';
        if ($cedula === '' || mb_strlen($cedula) > 20) $errors['cedula'] = 'Es obligatoria y debe tener máximo 20 caracteres.';
        if ($email === '' || mb_strlen($email) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['correo_electronico'] = 'Debe ser un correo válido de máximo 100 caracteres.';
        if ($phone === '' || mb_strlen($phone) > 20) $errors['telefono'] = 'Es obligatorio y debe tener máximo 20 caracteres.';
        if (mb_strlen($password) < 8) $errors['password'] = 'Debe tener al menos 8 caracteres.';

        if ($errors !== []) return $this->json($response, ['errors' => $errors], 422);

        try {
            $this->container->get('eloquent');
            $user = User::create([
                'rol_id' => $roleId,
                'nombre' => $name,
                'apellido' => $lastName,
                'cedula' => $cedula,
                'correo_electronico' => $email,
                'telefono' => $phone,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'activo' => true,
            ]);
        } catch (QueryException $exception) {
            if ((int) ($exception->errorInfo[1] ?? 0) === 1062) {
                return $this->json($response, ['error' => 'La cédula o el correo ya está registrado.'], 409);
            }
            throw $exception;
        }

        return $this->json($response, ['data' => $user->makeHidden(['password', 'tkRef'])->toArray()], 201);
    }

    public function update(Request $request, Response $response, array $args): Response {
        $this->container->get('eloquent');
        $user = User::find($args['id']);
        if ($user === null) return $this->json($response, ['error' => 'Usuario no encontrado.'], 404);

        $data = $request->getParsedBody();
        $data = is_array($data) ? $data : [];
        if (array_key_exists('rol_id', $data)) {
            $roleId = filter_var($data['rol_id'], FILTER_VALIDATE_INT);
            if ($roleId === false || $roleId < 1) {
                return $this->json($response, ['error' => 'rol_id debe ser un entero positivo.'], 422);
            }
            $user->rol_id = $roleId;
        }
        foreach (['nombre', 'apellido', 'cedula', 'correo_electronico', 'telefono'] as $field) {
            if (!array_key_exists($field, $data)) {
                continue;
            }
            $value = trim((string) $data[$field]);
            $maxLength = $field === 'correo_electronico' ? 100 : ($field === 'cedula' || $field === 'telefono' ? 20 : 50);
            if ($value === '' || mb_strlen($value) > $maxLength) {
                return $this->json($response, ['error' => "{$field} es obligatorio y debe tener máximo {$maxLength} caracteres."], 422);
            }
            if ($field === 'correo_electronico' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                return $this->json($response, ['error' => 'correo_electronico debe ser un correo válido.'], 422);
            }
            $user->{$field} = $value;
        }
        if (array_key_exists('activo', $data)) {
            $activo = filter_var($data['activo'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($activo === null) {
                return $this->json($response, ['error' => 'activo debe ser booleano.'], 422);
            }
            $user->activo = $activo;
        }
        if (isset($data['password'])) {
            if (mb_strlen((string) $data['password']) < 8) {
                return $this->json($response, ['error' => 'La contraseña debe tener al menos 8 caracteres.'], 422);
            }
            $user->password = password_hash((string) $data['password'], PASSWORD_DEFAULT);
        }

        try {
            $user->save();
        } catch (QueryException $exception) {
            if ((int) ($exception->errorInfo[1] ?? 0) === 1062) {
                return $this->json($response, ['error' => 'La cédula o el correo ya está registrado.'], 409);
            }
            throw $exception;
        }

        return $this->json($response, ['data' => $user->makeHidden(['password', 'tkRef'])->toArray()], 200);
    }

    public function delete(Request $request, Response $response, array $args): Response {
        $this->container->get('eloquent');
        $user = User::find($args['id']);
        if ($user === null) return $this->json($response, ['error' => 'Usuario no encontrado.'], 404);

        try {
            $user->delete();
        } catch (QueryException $exception) {
            return $this->json($response, ['error' => 'No se puede eliminar el usuario porque tiene registros asociados.'], 409);
        }

        return $this->json($response, ['message' => 'Usuario eliminado correctamente.'], 200);
    }

    private function json(Response $response, array $payload, int $status): Response {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8')->withStatus($status);
    }
}
