<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Illuminate\Database\QueryException;
use App\Models\Pago;

class PagoController
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
            $pago = Pago::query()->find($args['id']);
            return $this->json($response, ['data' => $pago], 200);
        }

        $pagos = Pago::query()->get()->toArray();
        return $this->json($response, ['data' => $pagos], 200);
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
        $query = Pago::query();
        $membresiaId = trim((string) ($params['membresia_id'] ?? ''));
        $estado = trim((string) ($params['estado'] ?? ''));

        if ($membresiaId !== '') {
            $query->where('membresia_id', $membresiaId);
        }

        if (trim((string) ($params['usuario_id'] ?? '')) !== '') {
            $query->whereHas('membresia', function ($membresiaQuery) use ($params): void {
                $membresiaQuery->where('usuario_id', trim((string) $params['usuario_id']));
            });
        }

        if ($estado !== '') {
            $query->where('estado', $estado);
        }

        $total = (clone $query)->count('id');
        $pagos = $query->orderBy('id')->offset($offset)->limit($limit)->get()->toArray();

        return $this->json($response, [
            'data' => $pagos,
            'pagination' => ['offset' => $offset, 'limit' => $limit, 'total' => $total]
        ], 200);
    }

    public function create(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        $data = $request->getParsedBody();
        $data = is_array($data) ? $data : [];
        $errors = [];
        $membresiaId = filter_var($data['membresia_id'] ?? null, FILTER_VALIDATE_INT);
        $monto = $data['monto'] ?? null;
        $fechaPago = trim((string) ($data['fecha_pago'] ?? ''));
        $metodoPago = trim((string) ($data['metodo_pago'] ?? ''));

        if ($membresiaId === false || $membresiaId < 1) $errors['membresia_id'] = 'Debe ser un entero positivo.';
        if (!is_numeric($monto) || (float) $monto < 0) $errors['monto'] = 'Debe ser un número válido.';
        if ($fechaPago === '') $errors['fecha_pago'] = 'Es obligatoria.';
        if ($metodoPago === '') $errors['metodo_pago'] = 'Es obligatorio.';
        if ($fechaPago !== '' && \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $fechaPago) === false) {
            $errors['fecha_pago'] = 'Debe tener el formato Y-m-d H:i:s.';
        }
        if ($errors !== []) return $this->json($response, ['errors' => $errors], 422);

        try {
            $pago = Pago::create([
                'membresia_id' => $membresiaId,
                'monto' => $monto,
                'fecha_pago' => $fechaPago,
                'metodo_pago' => $metodoPago,
                'estado' => $data['estado'] ?? 'completado'
            ]);
        } catch (QueryException $exception) {
            return $this->json($response, ['error' => 'No fue posible registrar el pago. Verifique la membresía.'], 422);
        }

        return $this->json($response, ['data' => $pago->toArray()], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (!isset($args['id'])) return $this->json($response, ['error' => 'Debe indicar el ID del pago.'], 422);
        $pago = Pago::find($args['id']);
        if ($pago === null) return $this->json($response, ['error' => 'Pago no encontrado.'], 404);
        $data = $request->getParsedBody();
        $data = is_array($data) ? $data : [];

        if (isset($data['membresia_id'])) {
            $membresiaId = filter_var($data['membresia_id'], FILTER_VALIDATE_INT);
            if ($membresiaId === false || $membresiaId < 1) return $this->json($response, ['error' => 'Membresía inválida.'], 422);
            $pago->membresia_id = $membresiaId;
        }

        if (isset($data['monto'])) {
            if (!is_numeric($data['monto']) || (float) $data['monto'] < 0) return $this->json($response, ['error' => 'Monto inválido.'], 422);
            $pago->monto = $data['monto'];
        }

        foreach (['fecha_pago', 'metodo_pago', 'estado'] as $field) {
            if (isset($data[$field])) {
                $value = trim((string) $data[$field]);
                if ($value === '') return $this->json($response, ['error' => "{$field} inválido."], 422);
                $pago->{$field} = $value;
            }
            if (
                isset($data['fecha_pago'])
                && \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', (string) $pago->fecha_pago) === false
            ) {
                return $this->json($response, ['error' => 'La fecha de pago debe tener el formato Y-m-d H:i:s.'], 422);
            }
        }

        try { $pago->save(); } catch (QueryException $exception) { return $this->json($response, ['error' => 'No fue posible actualizar el pago.'], 422); }
        return $this->json($response, ['data' => $pago->toArray()], 200);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $this->container->get('eloquent');
        if (!isset($args['id'])) return $this->json($response, ['error' => 'Debe indicar el ID del pago.'], 422);
        $pago = Pago::find($args['id']);
        if ($pago === null) return $this->json($response, ['error' => 'Pago no encontrado.'], 404);
        try { $pago->delete(); } catch (QueryException $exception) { return $this->json($response, ['error' => 'No se puede eliminar el pago.'], 409); }
        return $this->json($response, ['message' => 'Pago eliminado correctamente.'], 200);
    }

    private function json(Response $response, array $payload, int $status): Response
    {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json;charset=utf-8')->withStatus($status);
    }
}
