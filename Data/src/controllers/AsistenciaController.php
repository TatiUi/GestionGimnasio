<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Illuminate\Database\QueryException;
use App\Models\Asistencia;
use App\Models\Inscripcion;

class AsistenciaController
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
            $asistencia = Asistencia::query()->find($args['id']);
            return $this->json($response, ['data' => $asistencia], 200);
        }

        $asistencias = Asistencia::query()->get()->toArray();
        return $this->json($response, ['data' => $asistencias], 200);
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
        $query = Asistencia::query();
        if (trim((string) ($params['inscripcion_id'] ?? '')) !== '') $query->where('inscripcion_id', trim((string) $params['inscripcion_id']));
        if (trim((string) ($params['clase_id'] ?? '')) !== '') $query->where('clase_id', trim((string) $params['clase_id']));
        if (trim((string) ($params['entrenador_id'] ?? '')) !== '') {
            $query->whereHas('clase', function ($claseQuery) use ($params): void {
                $claseQuery->where('entrenador_id', trim((string) $params['entrenador_id']));
            });
        }
        if (trim((string) ($params['estado'] ?? '')) !== '') $query->where('estado', trim((string) $params['estado']));
        $total = (clone $query)->count('id');
        $asistencias = $query->orderBy('id')->offset($offset)->limit($limit)->get()->toArray();

        return $this->json($response, ['data' => $asistencias, 'pagination' => ['offset' => $offset, 'limit' => $limit, 'total' => $total]], 200);
    }

    public function create(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        $data = $request->getParsedBody(); $data = is_array($data) ? $data : []; $errors = [];
        $inscripcionId = filter_var($data['inscripcion_id'] ?? null, FILTER_VALIDATE_INT);
        $claseId = filter_var($data['clase_id'] ?? null, FILTER_VALIDATE_INT);
        $fecha = trim((string) ($data['fecha_asistencia'] ?? ''));
        $estado = trim((string) ($data['estado'] ?? ''));
        if ($inscripcionId === false || $inscripcionId < 1) $errors['inscripcion_id'] = 'Debe ser un entero positivo.';
        if ($claseId === false || $claseId < 1) $errors['clase_id'] = 'Debe ser un entero positivo.';
        if ($fecha === '') $errors['fecha_asistencia'] = 'Es obligatoria.';
        if ($estado === '') $errors['estado'] = 'Es obligatorio.';
        if ($fecha !== '' && \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $fecha) === false) {
            $errors['fecha_asistencia'] = 'Debe tener el formato Y-m-d H:i:s.';
        }
        if ($errors !== []) return $this->json($response, ['errors' => $errors], 422);

        $inscripcion = Inscripcion::find($inscripcionId);

        if ($inscripcion === null || (int) $inscripcion->clase_id !== $claseId) {
            return $this->json($response, ['error' => 'La inscripción no corresponde a la clase indicada.'], 422);
        }

        $asistenciaExistente = Asistencia::query()
            ->where('inscripcion_id', $inscripcionId)
            ->whereDate('fecha_asistencia', substr($fecha, 0, 10))
            ->exists();

        if ($asistenciaExistente) {
            return $this->json($response, ['error' => 'Ya existe una asistencia registrada para esta inscripción en esa fecha.'], 409);
        }

        try {
            $asistencia = Asistencia::create(['inscripcion_id' => $inscripcionId, 'clase_id' => $claseId, 'fecha_asistencia' => $fecha, 'estado' => $estado]);
        } catch (QueryException $exception) {
            return $this->json($response, ['error' => 'No fue posible registrar la asistencia. Verifique sus referencias.'], 422);
        }

        return $this->json($response, ['data' => $asistencia->toArray()], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (!isset($args['id'])) return $this->json($response, ['error' => 'Debe indicar el ID de la asistencia.'], 422);
        $asistencia = Asistencia::find($args['id']);
        if ($asistencia === null) return $this->json($response, ['error' => 'Asistencia no encontrada.'], 404);
        $data = $request->getParsedBody(); $data = is_array($data) ? $data : [];
        foreach (['inscripcion_id', 'clase_id'] as $field) if (isset($data[$field])) { $value = filter_var($data[$field], FILTER_VALIDATE_INT); if ($value === false || $value < 1) return $this->json($response, ['error' => "{$field} inválido."], 422); $asistencia->{$field} = $value; }
        foreach (['fecha_asistencia', 'estado'] as $field) if (isset($data[$field])) { $value = trim((string) $data[$field]); if ($value === '') return $this->json($response, ['error' => "{$field} inválido."], 422); $asistencia->{$field} = $value; }
        if (
            isset($data['fecha_asistencia'])
            && \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', (string) $asistencia->fecha_asistencia) === false
        ) {
            return $this->json($response, ['error' => 'La fecha de asistencia debe tener el formato Y-m-d H:i:s.'], 422);
        }
        try { $asistencia->save(); } catch (QueryException $exception) { return $this->json($response, ['error' => 'No fue posible actualizar la asistencia.'], 422); }
        return $this->json($response, ['data' => $asistencia->toArray()], 200);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (!isset($args['id'])) return $this->json($response, ['error' => 'Debe indicar el ID de la asistencia.'], 422);
        $asistencia = Asistencia::find($args['id']);
        if ($asistencia === null) return $this->json($response, ['error' => 'Asistencia no encontrada.'], 404);
        try { $asistencia->delete(); } catch (QueryException $exception) { return $this->json($response, ['error' => 'No se puede eliminar la asistencia.'], 409); }
        return $this->json($response, ['message' => 'Asistencia eliminada correctamente.'], 200);
    }

    private function json(Response $response, array $payload, int $status): Response
    {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json;charset=utf-8')->withStatus($status);
    }
}
