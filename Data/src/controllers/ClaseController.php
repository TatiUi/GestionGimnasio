<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Illuminate\Database\QueryException;
use App\Models\Clase;

class ClaseController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }

    public function read(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (isset($args['id'])) return $this->json($response, ['data' => Clase::query()->find($args['id'])], 200);
        return $this->json($response, ['data' => Clase::query()->get()->toArray()], 200);
    }

    public function filter(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        $offset = filter_var($args['offset'] ?? 0, FILTER_VALIDATE_INT);
        $limit = filter_var($args['limit'] ?? 20, FILTER_VALIDATE_INT);
        if ($offset === false || $offset < 0 || $limit === false || $limit < 1 || $limit > 100) return $this->json($response, ['error' => 'El offset debe ser mayor o igual a 0 y el limite debe estar entre 1 y 100.'], 422);
        $params = $request->getQueryParams();
        $query = Clase::query();
        if (trim((string) ($params['entrenador_id'] ?? '')) !== '') $query->where('entrenador_id', trim((string) $params['entrenador_id']));
        if (trim((string) ($params['nombre'] ?? '')) !== '') $query->where('nombre', 'like', '%' . trim((string) $params['nombre']) . '%');
        $total = (clone $query)->count('id');
        $clases = $query->orderBy('id')->offset($offset)->limit($limit)->get()->toArray();
        return $this->json($response, ['data' => $clases, 'pagination' => ['offset' => $offset, 'limit' => $limit, 'total' => $total]], 200);
    }

    public function create(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        $data = $request->getParsedBody(); $data = is_array($data) ? $data : []; $errors = [];
        $entrenadorId = filter_var($data['entrenador_id'] ?? null, FILTER_VALIDATE_INT);
        $nombre = trim((string) ($data['nombre'] ?? ''));
        $descripcion = trim((string) ($data['descripcion'] ?? ''));
        $capacidad = filter_var($data['capacidad'] ?? null, FILTER_VALIDATE_INT);
        $inicio = trim((string) ($data['fecha_hora_inicio'] ?? ''));
        $fin = trim((string) ($data['fecha_hora_fin'] ?? ''));
        
        if ($entrenadorId === false || $entrenadorId < 1) $errors['entrenador_id'] = 'Debe ser un entero positivo.';
        if ($nombre === '') $errors['nombre'] = 'Es obligatorio.';
        if ($descripcion === '') $errors['descripcion'] = 'Es obligatoria.';
        if ($capacidad === false || $capacidad < 1) $errors['capacidad'] = 'Debe ser un entero positivo.';
        if ($inicio === '') $errors['fecha_hora_inicio'] = 'Es obligatoria.';
        if ($fin === '') $errors['fecha_hora_fin'] = 'Es obligatoria.';
        if ($inicio !== '' && $fin !== '') {
            $inicioFecha = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $inicio);
            $finFecha = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $fin);

            if (
                $inicioFecha === false
                || $finFecha === false
                || $finFecha <= $inicioFecha
            ) {
                $errors['fecha_hora_fin'] = 'La fecha de fin debe ser posterior a la fecha de inicio.';
            }
        }
        if ($errors !== []) return $this->json($response, ['errors' => $errors], 422);
        $horarioOcupado = Clase::query()
            ->where('entrenador_id', $entrenadorId)
            ->where('estado', '!=', 'Cancelada')
            ->where('fecha_hora_inicio', '<', $fin)
            ->where('fecha_hora_fin', '>', $inicio)
            ->exists();

        if ($horarioOcupado) {
            return $this->json($response, ['error' => 'El entrenador ya tiene una clase en ese horario.'], 409);
        }

        try {
            $clase = Clase::create([
                'entrenador_id' => $entrenadorId,
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'capacidad' => $capacidad,
                'fecha_hora_inicio' => $inicio,
                'fecha_hora_fin' => $fin,
                'estado' => $data['estado'] ?? 'Programada'
            ]);
        } catch (QueryException $exception) {
            return $this->json($response, ['error' => 'No fue posible registrar la clase. Verifique el entrenador.'], 422);
        }
        return $this->json($response, ['data' => $clase->toArray()], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (!isset($args['id'])) return $this->json($response, ['error' => 'Debe indicar el ID de la clase.'], 422);
        $clase = Clase::find($args['id']);
        if ($clase === null) return $this->json($response, ['error' => 'Clase no encontrada.'], 404);
        $data = $request->getParsedBody(); $data = is_array($data) ? $data : [];
        foreach (['entrenador_id', 'capacidad'] as $field) if (isset($data[$field])) { $value = filter_var($data[$field], FILTER_VALIDATE_INT); if ($value === false || $value < 1) return $this->json($response, ['error' => "{$field} inválido."], 422); $clase->{$field} = $value; }
        foreach (['nombre', 'descripcion', 'fecha_hora_inicio', 'fecha_hora_fin', 'estado'] as $field) if (isset($data[$field])) { $value = trim((string) $data[$field]); if ($value === '') return $this->json($response, ['error' => "{$field} inválido."], 422); $clase->{$field} = $value; }
        if ($clase->fecha_hora_inicio !== null && $clase->fecha_hora_fin !== null) {
            $inicio = (string) $clase->fecha_hora_inicio;
            $fin = (string) $clase->fecha_hora_fin;
            $inicioFecha = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $inicio);
            $finFecha = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $fin);

            if (
                $inicioFecha === false
                || $finFecha === false
                || $finFecha <= $inicioFecha
            ) {
                return $this->json($response, ['error' => 'La fecha de fin debe ser posterior a la fecha de inicio.'], 422);
            }

            $horarioOcupado = Clase::query()
                ->where('entrenador_id', $clase->entrenador_id)
                ->where('id', '!=', $clase->id)
                ->where('estado', '!=', 'Cancelada')
                ->where('fecha_hora_inicio', '<', $fin)
                ->where('fecha_hora_fin', '>', $inicio)
                ->exists();

            if ($horarioOcupado) {
                return $this->json($response, ['error' => 'El entrenador ya tiene una clase en ese horario.'], 409);
            }
        }
        try { $clase->save(); } catch (QueryException $exception) { return $this->json($response, ['error' => 'No fue posible actualizar la clase.'], 422); }
        return $this->json($response, ['data' => $clase->toArray()], 200);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (!isset($args['id'])) return $this->json($response, ['error' => 'Debe indicar el ID de la clase.'], 422);
        $clase = Clase::find($args['id']);
        if ($clase === null) return $this->json($response, ['error' => 'Clase no encontrada.'], 404);
        try { $clase->delete(); } catch (QueryException $exception) { return $this->json($response, ['error' => 'No se puede eliminar porque tiene inscripciones asociadas.'], 409); }
        return $this->json($response, ['message' => 'Clase eliminada correctamente.'], 200);
    }

    private function json(Response $response, array $payload, int $status): Response
    {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json;charset=utf-8')->withStatus($status);
    }
}
