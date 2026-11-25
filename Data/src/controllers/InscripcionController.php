<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Illuminate\Database\QueryException;
use App\Models\Inscripcion;
use App\Models\Clase;

class InscripcionController
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
            $inscripcion = Inscripcion::query()
                ->find($args['id']);

            return $this->json($response, ['data' => $inscripcion], 200);
        }

        $inscripciones = Inscripcion::query()
            ->get()
            ->toArray();

        return $this->json($response, ['data' => $inscripciones], 200);
    }

    public function filter(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');

        $offset = filter_var($args['offset'] ?? 0, FILTER_VALIDATE_INT);
        $limit = filter_var($args['limit'] ?? 20, FILTER_VALIDATE_INT);

        if ($offset === false || $offset < 0 || $limit === false || $limit < 1 || $limit > 100) {
            return $this->json($response, [
                'error' => 'El offset debe ser mayor o igual a 0 y el limite debe estar entre 1 y 100.'
            ], 422);
        }

        $params = $request->getQueryParams();
        $usuarioId = trim((string) ($params['usuario_id'] ?? ''));
        $claseId = trim((string) ($params['clase_id'] ?? ''));
        $estado = trim((string) ($params['estado'] ?? ''));

        $query = Inscripcion::query();

        if ($usuarioId !== '') {
            $query->where('usuario_id', $usuarioId);
        }

        if ($claseId !== '') {
            $query->where('clase_id', $claseId);
        }

        if (trim((string) ($params['entrenador_id'] ?? '')) !== '') {
            $query->whereHas('clase', function ($claseQuery) use ($params): void {
                $claseQuery->where('entrenador_id', trim((string) $params['entrenador_id']));
            });
        }

        if ($estado !== '') {
            $query->where('estado', $estado);
        }

        $total = (clone $query)->count('id');

        $inscripciones = $query
            ->orderBy('id')
            ->offset($offset)
            ->limit($limit)
            ->get()
            ->toArray();

        return $this->json($response, [
            'data' => $inscripciones,
            'pagination' => [
                'offset' => $offset,
                'limit' => $limit,
                'total' => $total
            ]
        ], 200);
    }

    public function create(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');

        $data = $request->getParsedBody();
        $data = is_array($data) ? $data : [];
        $errors = [];

        $usuarioId = filter_var($data['usuario_id'] ?? null, FILTER_VALIDATE_INT);
        $claseId = filter_var($data['clase_id'] ?? null, FILTER_VALIDATE_INT);
        $fechaInscripcion = trim((string) ($data['fecha_inscripcion'] ?? ''));
        $estado = trim((string) ($data['estado'] ?? ''));

        if ($usuarioId === false || $usuarioId === null || $usuarioId < 1) {
            $errors['usuario_id'] = 'Debe ser un entero positivo.';
        }

        if ($claseId === false || $claseId === null || $claseId < 1) {
            $errors['clase_id'] = 'Debe ser un entero positivo.';
        }

        if ($fechaInscripcion === '') {
            $errors['fecha_inscripcion'] = 'Es obligatoria.';
        }

        if (
            $fechaInscripcion !== ''
            && \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $fechaInscripcion) === false
        ) {
            $errors['fecha_inscripcion'] = 'Debe tener el formato Y-m-d H:i:s.';
        }

        if ($estado === '') {
            $errors['estado'] = 'Es obligatorio.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $clase = Clase::find($claseId);

        if ($clase === null) {
            return $this->json($response, ['error' => 'La clase no existe.'], 422);
        }

        $inscripcionExistente = Inscripcion::query()
            ->where('usuario_id', $usuarioId)
            ->where('clase_id', $claseId)
            ->where('estado', 'Inscrito')
            ->exists();

        if ($inscripcionExistente) {
            return $this->json($response, ['error' => 'El usuario ya está inscrito en esta clase.'], 409);
        }

        $inscritos = Inscripcion::query()
            ->where('clase_id', $claseId)
            ->where('estado', 'Inscrito')
            ->count();

        if ($inscritos >= (int) $clase->capacidad) {
            return $this->json($response, ['error' => 'La clase ya alcanzó su capacidad máxima.'], 409);
        }

        try {
            $inscripcion = Inscripcion::create([
                'usuario_id' => $usuarioId,
                'clase_id' => $claseId,
                'fecha_inscripcion' => $fechaInscripcion,
                'estado' => $estado
            ]);
        } catch (QueryException $exception) {
            return $this->json($response, [
                'error' => 'No fue posible registrar la inscripción. Verifique sus referencias.'
            ], 422);
        }

        return $this->json($response, ['data' => $inscripcion->toArray()], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');

        if (!isset($args['id'])) {
            return $this->json($response, ['error' => 'Debe indicar el ID de la inscripción.'], 422);
        }

        $inscripcion = Inscripcion::find($args['id']);

        if ($inscripcion === null) {
            return $this->json($response, ['error' => 'Inscripción no encontrada.'], 404);
        }

        $data = $request->getParsedBody();
        $data = is_array($data) ? $data : [];

        if (isset($data['usuario_id'])) {
            $usuarioId = filter_var($data['usuario_id'], FILTER_VALIDATE_INT);

            if ($usuarioId === false || $usuarioId < 1) {
                return $this->json($response, ['error' => 'Usuario inválido.'], 422);
            }

            $inscripcion->usuario_id = $usuarioId;
        }

        if (isset($data['clase_id'])) {
            $claseId = filter_var($data['clase_id'], FILTER_VALIDATE_INT);

            if ($claseId === false || $claseId < 1) {
                return $this->json($response, ['error' => 'Clase inválida.'], 422);
            }

            $inscripcion->clase_id = $claseId;
        }

        if (isset($data['fecha_inscripcion'])) {
            $fechaInscripcion = trim((string) $data['fecha_inscripcion']);

            if ($fechaInscripcion === '') {
                return $this->json($response, ['error' => 'Fecha de inscripción inválida.'], 422);
            }

            $inscripcion->fecha_inscripcion = $fechaInscripcion;

            if (\DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $fechaInscripcion) === false) {
                return $this->json($response, ['error' => 'La fecha de inscripción debe tener el formato Y-m-d H:i:s.'], 422);
            }
        }

        if (isset($data['estado'])) {
            $estado = trim((string) $data['estado']);

            if ($estado === '') {
                return $this->json($response, ['error' => 'Estado inválido.'], 422);
            }

            $inscripcion->estado = $estado;
        }

        try {
            $inscripcion->save();
        } catch (QueryException $exception) {
            return $this->json($response, [
                'error' => 'No fue posible actualizar la inscripción.'
            ], 422);
        }

        return $this->json($response, ['data' => $inscripcion->toArray()], 200);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');

        if (!isset($args['id'])) {
            return $this->json($response, ['error' => 'Debe indicar el ID de la inscripción.'], 422);
        }

        $inscripcion = Inscripcion::find($args['id']);

        if ($inscripcion === null) {
            return $this->json($response, ['error' => 'Inscripción no encontrada.'], 404);
        }

        try {
            $inscripcion->delete();
        } catch (QueryException $exception) {
            return $this->json($response, [
                'error' => 'No se puede eliminar porque tiene asistencias asociadas.'
            ], 409);
        }

        return $this->json($response, [
            'message' => 'Inscripción eliminada correctamente.'
        ], 200);
    }

    private function json(Response $response, array $payload, int $status): Response
    {
        $response->getBody()->write(json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        ));

        return $response
            ->withHeader('Content-Type', 'application/json;charset=utf-8')
            ->withStatus($status);
    }
}
