<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Illuminate\Database\QueryException;
use App\Models\PlanMembresia;

class PlanMembresiaController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }

    public function read(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');

        if (isset($args['id'])) {
            $plan = PlanMembresia::query()->find($args['id']);
            return $this->json($response, ['data' => $plan], 200);
        }

        $planes = PlanMembresia::query()->get()->toArray();
        return $this->json($response, ['data' => $planes], 200);
    }

    public function filter(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        $offset = filter_var($args['offset'] ?? 0, FILTER_VALIDATE_INT);
        $limit = filter_var($args['limit'] ?? 20, FILTER_VALIDATE_INT);

        if ($offset === false || $offset < 0 || $limit === false || $limit < 1 || $limit > 100) {
            return $this->json($response, ['error' => 'El offset debe ser mayor o igual a 0 y el limite debe estar entre 1 y 100.'], 422);
        }

        $params = $request->getQueryParams();
        $nombre = trim((string) ($params['nombre'] ?? ''));
        $query = PlanMembresia::query();

        if ($nombre !== '') {
            $query->where('nombre', 'like', "%{$nombre}%");
        }

        $total = (clone $query)->count('id');
        $planes = $query->orderBy('id')->offset($offset)->limit($limit)->get()->toArray();

        return $this->json($response, [
            'data' => $planes,
            'pagination' => ['offset' => $offset, 'limit' => $limit, 'total' => $total]
        ], 200);
    }

    public function create(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        $data = $request->getParsedBody();
        $data = is_array($data) ? $data : [];
        $errors = [];
        $nombre = trim((string) ($data['nombre'] ?? ''));
        $descripcion = trim((string) ($data['descripcion'] ?? ''));
        $precio = $data['precio'] ?? null;
        $duracionDias = filter_var($data['duracion_dias'] ?? null, FILTER_VALIDATE_INT);

        if ($nombre === '') $errors['nombre'] = 'Es obligatorio.';
        if ($descripcion === '') $errors['descripcion'] = 'Es obligatoria.';
        if (!is_numeric($precio) || (float) $precio < 0) $errors['precio'] = 'Debe ser un número válido.';
        if ($duracionDias === false || $duracionDias < 1) $errors['duracion_dias'] = 'Debe ser un entero positivo.';
        if ($errors !== []) return $this->json($response, ['errors' => $errors], 422);

        try {
            $plan = PlanMembresia::create([
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'precio' => $precio,
                'duracion_dias' => $duracionDias,
                'activo' => $data['activo'] ?? true
            ]);
        } catch (QueryException $exception) {
            return $this->json($response, ['error' => 'No fue posible registrar el plan.'], 422);
        }

        return $this->json($response, ['data' => $plan->toArray()], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (!isset($args['id'])) return $this->json($response, ['error' => 'Debe indicar el ID del plan.'], 422);
        $plan = PlanMembresia::find($args['id']);
        if ($plan === null) return $this->json($response, ['error' => 'Plan no encontrado.'], 404);
        $data = $request->getParsedBody();
        $data = is_array($data) ? $data : [];

        if (isset($data['nombre'])) {
            $nombre = trim((string) $data['nombre']);
            if ($nombre === '') return $this->json($response, ['error' => 'Nombre inválido.'], 422);
            $plan->nombre = $nombre;
        }
        if (isset($data['descripcion'])) $plan->descripcion = trim((string) $data['descripcion']);
        if (isset($data['precio'])) {
            if (!is_numeric($data['precio']) || (float) $data['precio'] < 0) return $this->json($response, ['error' => 'Precio inválido.'], 422);
            $plan->precio = $data['precio'];
        }
        if (isset($data['duracion_dias'])) {
            $duracionDias = filter_var($data['duracion_dias'], FILTER_VALIDATE_INT);
            if ($duracionDias === false || $duracionDias < 1) return $this->json($response, ['error' => 'Duración inválida.'], 422);
            $plan->duracion_dias = $duracionDias;
        }
        if (array_key_exists('activo', $data)) $plan->activo = $data['activo'];

        try { $plan->save(); } catch (QueryException $exception) { return $this->json($response, ['error' => 'No fue posible actualizar el plan.'], 422); }
        return $this->json($response, ['data' => $plan->toArray()], 200);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (!isset($args['id'])) return $this->json($response, ['error' => 'Debe indicar el ID del plan.'], 422);
        $plan = PlanMembresia::find($args['id']);
        if ($plan === null) return $this->json($response, ['error' => 'Plan no encontrado.'], 404);
        try { $plan->delete(); } catch (QueryException $exception) { return $this->json($response, ['error' => 'No se puede eliminar porque tiene membresías asociadas.'], 409); }
        return $this->json($response, ['message' => 'Plan eliminado correctamente.'], 200);
    }

    private function json(Response $response, array $payload, int $status): Response
    {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json;charset=utf-8')->withStatus($status);
    }
}
