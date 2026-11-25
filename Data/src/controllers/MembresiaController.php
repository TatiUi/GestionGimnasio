<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Illuminate\Database\QueryException;
use App\Models\Membresia;

class MembresiaController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }

    public function read(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (isset($args['id'])) return $this->json($response, ['data' => Membresia::query()->find($args['id'])], 200);
        return $this->json($response, ['data' => Membresia::query()->get()->toArray()], 200);
    }

    public function filter(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        $offset = filter_var($args['offset'] ?? 0, FILTER_VALIDATE_INT);
        $limit = filter_var($args['limit'] ?? 20, FILTER_VALIDATE_INT);
        if ($offset === false || $offset < 0 || $limit === false || $limit < 1 || $limit > 100) return $this->json($response, ['error' => 'El offset debe ser mayor o igual a 0 y el limite debe estar entre 1 y 100.'], 422);
        $params = $request->getQueryParams();
        $query = Membresia::query();
        if (trim((string) ($params['usuario_id'] ?? '')) !== '') $query->where('usuario_id', trim((string) $params['usuario_id']));
        if (trim((string) ($params['plan_id'] ?? '')) !== '') $query->where('plan_id', trim((string) $params['plan_id']));
        if (trim((string) ($params['estado'] ?? '')) !== '') $query->where('estado', trim((string) $params['estado']));
        $total = (clone $query)->count('id');
        $membresias = $query->orderBy('id')->offset($offset)->limit($limit)->get()->toArray();
        return $this->json($response, ['data' => $membresias, 'pagination' => ['offset' => $offset, 'limit' => $limit, 'total' => $total]], 200);
    }

    public function create(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        $data = $request->getParsedBody(); $data = is_array($data) ? $data : []; $errors = [];
        $usuarioId = filter_var($data['usuario_id'] ?? null, FILTER_VALIDATE_INT);
        $planId = filter_var($data['plan_id'] ?? null, FILTER_VALIDATE_INT);
        $fechaInicio = trim((string) ($data['fecha_inicio'] ?? ''));
        $fechaFin = trim((string) ($data['fecha_fin'] ?? ''));
        if ($usuarioId === false || $usuarioId < 1) $errors['usuario_id'] = 'Debe ser un entero positivo.';
        if ($planId === false || $planId < 1) $errors['plan_id'] = 'Debe ser un entero positivo.';
        if ($fechaInicio === '') $errors['fecha_inicio'] = 'Es obligatoria.';
        if ($fechaFin === '') $errors['fecha_fin'] = 'Es obligatoria.';
        $inicioFecha = $fechaInicio !== '' ? \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $fechaInicio) : false;
        $finFecha = $fechaFin !== '' ? \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $fechaFin) : false;
        if ($inicioFecha === false) $errors['fecha_inicio'] = 'Debe tener el formato Y-m-d H:i:s.';
        if ($finFecha === false) $errors['fecha_fin'] = 'Debe tener el formato Y-m-d H:i:s.';
        if ($inicioFecha !== false && $finFecha !== false && $finFecha <= $inicioFecha) {
            $errors['fecha_fin'] = 'Debe ser posterior a la fecha de inicio.';
        }
        if ($errors !== []) return $this->json($response, ['errors' => $errors], 422);
        try {
            $membresia = Membresia::create([
                'usuario_id' => $usuarioId,
                'plan_id' => $planId,
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
                'estado' => $data['estado'] ?? 'Activa'
            ]);
        } catch (QueryException $exception) {
            return $this->json($response, ['error' => 'No fue posible registrar la membresía. Verifique sus referencias.'], 422);
        }
        return $this->json($response, ['data' => $membresia->toArray()], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (!isset($args['id'])) return $this->json($response, ['error' => 'Debe indicar el ID de la membresía.'], 422);
        $membresia = Membresia::find($args['id']);
        if ($membresia === null) return $this->json($response, ['error' => 'Membresía no encontrada.'], 404);
        $data = $request->getParsedBody(); $data = is_array($data) ? $data : [];
        foreach (['usuario_id', 'plan_id'] as $field) if (isset($data[$field])) { $value = filter_var($data[$field], FILTER_VALIDATE_INT); if ($value === false || $value < 1) return $this->json($response, ['error' => "{$field} inválido."], 422); $membresia->{$field} = $value; }
        foreach (['fecha_inicio', 'fecha_fin', 'estado'] as $field) if (isset($data[$field])) { $value = trim((string) $data[$field]); if ($value === '') return $this->json($response, ['error' => "{$field} inválido."], 422); $membresia->{$field} = $value; }
        $inicioFecha = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', (string) $membresia->fecha_inicio);
        $finFecha = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', (string) $membresia->fecha_fin);
        if ($inicioFecha === false || $finFecha === false || $finFecha <= $inicioFecha) {
            return $this->json($response, ['error' => 'La fecha fin debe tener formato válido y ser posterior a la fecha inicio.'], 422);
        }
        try { $membresia->save(); } catch (QueryException $exception) { return $this->json($response, ['error' => 'No fue posible actualizar la membresía.'], 422); }
        return $this->json($response, ['data' => $membresia->toArray()], 200);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (!isset($args['id'])) return $this->json($response, ['error' => 'Debe indicar el ID de la membresía.'], 422);
        $membresia = Membresia::find($args['id']);
        if ($membresia === null) return $this->json($response, ['error' => 'Membresía no encontrada.'], 404);
        try { $membresia->delete(); } catch (QueryException $exception) { return $this->json($response, ['error' => 'No se puede eliminar porque tiene pagos asociados.'], 409); }
        return $this->json($response, ['message' => 'Membresía eliminada correctamente.'], 200);
    }

    private function json(Response $response, array $payload, int $status): Response
    {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json;charset=utf-8')->withStatus($status);
    }
}
