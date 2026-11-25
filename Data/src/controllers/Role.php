<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Illuminate\Database\QueryException;
use App\Models\Role as RoleModel;

class Role {
    public function __construct(private ContainerInterface $container) { }

    public function read(Request $request, Response $response, array $args): Response {
        $this->container->get('eloquent');

        if (isset($args['id'])) {
            $role = RoleModel::query()
                ->select(['id', 'nombre'])
                ->find($args['id']);
            return $this->json($response, ['data' => $role], 200);
        }

        $roles = RoleModel::query()
            ->select(['id', 'nombre'])
            ->get()
            ->toArray();

        return $this->json($response, ['data' => $roles], 200);
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

        $name = trim((string) ($request->getQueryParams()['nombre'] ?? ''));
        $query = RoleModel::query()->select(['id', 'nombre']);

        if ($name !== '') {
            $query->where('nombre', 'like', "%{$name}%");
        }

        $total = (clone $query)->count('id');
        $roles = $query
            ->orderBy('nombre')
            ->offset($offset)
            ->limit($limit)
            ->get()
            ->toArray();

        return $this->json($response, [
            'data' => $roles,
            'pagination' => [
                'offset' => $offset,
                'limit' => $limit,
                'total' => $total
            ]
        ], 200);
    }

    public function create(Request $request, Response $response, array $args): Response {
        $data = $request->getParsedBody();
        $data = is_array($data) ? $data : [];
        $name = trim((string) ($data['nombre'] ?? ''));

        if ($name === '' || mb_strlen($name) > 50) {
            return $this->json($response, [
                'errors' => ['nombre' => 'Es obligatorio y debe tener máximo 50 caracteres.']
            ], 422);
        }

        try {
            $this->container->get('eloquent');
            $role = RoleModel::create(['nombre' => $name]);
        } catch (QueryException $exception) {
            if ((int) ($exception->errorInfo[1] ?? 0) === 1062) {
                return $this->json($response, ['error' => 'El rol ya está registrado.'], 409);
            }
            throw $exception;
        }

        return $this->json($response, ['data' => $role->toArray()], 201);
    }

    public function update(Request $request, Response $response, array $args): Response {
        $this->container->get('eloquent');
        $role = RoleModel::find($args['id']);

        if ($role === null) {
            return $this->json($response, ['error' => 'Rol no encontrado.'], 404);
        }

        $data = $request->getParsedBody();
        $data = is_array($data) ? $data : [];
        $name = trim((string) ($data['nombre'] ?? ''));

        if ($name === '' || mb_strlen($name) > 50) {
            return $this->json($response, ['error' => 'Nombre inválido.'], 422);
        }

        try {
            $role->nombre = $name;
            $role->save();
        } catch (QueryException $exception) {
            if ((int) ($exception->errorInfo[1] ?? 0) === 1062) {
                return $this->json($response, ['error' => 'El rol ya está registrado.'], 409);
            }
            throw $exception;
        }

        return $this->json($response, ['data' => $role->toArray()], 200);
    }

    public function delete(Request $request, Response $response, array $args): Response {
        $this->container->get('eloquent');
        $role = RoleModel::find($args['id']);

        if ($role === null) {
            return $this->json($response, ['error' => 'Rol no encontrado.'], 404);
        }

        try {
            $role->delete();
        } catch (QueryException $exception) {
            return $this->json($response, [
                'error' => 'No se puede eliminar el rol porque tiene usuarios asociados.'
            ], 409);
        }

        return $this->json($response, ['message' => 'Rol eliminado correctamente.'], 200);
    }

    private function json(Response $response, array $payload, int $status): Response {
        $response->getBody()->write(json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        ));

        return $response
            ->withHeader('Content-Type', 'application/json; charset=utf-8')
            ->withStatus($status);
    }
}
