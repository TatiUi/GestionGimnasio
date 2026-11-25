<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use App\Services\DataService;
use App\Validators\PagoValidator;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;

class PagoController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }

    public function read(Request $request, Response $response, array $args): Response
    {
        try {
            $dataService = $this->container->get(DataService::class);
            $path = isset($args['id']) ? 'pagos/' . rawurlencode($args['id']) : 'pagos';
            $query = $request->getQueryParams();
            $token = $request->getAttribute('token');
            $rolId = is_object($token) ? (int) ($token->rol_id ?? 0) : (int) (($token['rol_id'] ?? 0));
            $usuarioId = is_object($token) ? (int) ($token->sub ?? 0) : (int) (($token['sub'] ?? 0));

            if ($rolId === 3) {
                $query['usuario_id'] = $usuarioId;
            }

            $upstream = $dataService->get($path, $query);

            if ($rolId === 3 && isset($args['id'])) {
                $data = json_decode((string) $upstream->getBody(), true);
                $membresiaId = (int) ($data['data']['membresia_id'] ?? 0);
                $membresia = $dataService->get('membresias/' . $membresiaId);
                $membresiaData = json_decode((string) $membresia->getBody(), true);
                $ownerId = (int) (($membresiaData['data']['usuario_id'] ?? 0));

                if ($membresia->getStatusCode() !== 200 || $ownerId !== $usuarioId) {
                    return $this->json($response, ['error' => 'No tiene permisos para consultar este pago.'], 403);
                }
            }

            $response->getBody()->write((string) $upstream->getBody());

            return $response->withHeader('Content-Type', $upstream->getHeaderLine('Content-Type') ?: 'application/json;charset=utf-8')->withStatus($upstream->getStatusCode());
        } catch (ConnectException $exception) {
            return $this->json($response, ['error' => 'El servicio de datos no está disponible'], 502);
        } catch (RequestException $exception) {
            return $this->json($response, ['error' => 'No se pudo consultar el servicio de datos'], 502);
        }
    }

    public function filter(Request $request, Response $response, array $args): Response
    {
        try {
            $dataService = $this->container->get(DataService::class);
            $path = 'pagos/filter/' . rawurlencode($args['offset']) . '/' . rawurlencode($args['limit']);
            $query = $request->getQueryParams();
            $token = $request->getAttribute('token');
            $rolId = is_object($token) ? (int) ($token->rol_id ?? 0) : (int) (($token['rol_id'] ?? 0));
            $usuarioId = is_object($token) ? (int) ($token->sub ?? 0) : (int) (($token['sub'] ?? 0));

            if ($rolId === 3) {
                $query['usuario_id'] = $usuarioId;
            }

            $upstream = $dataService->get($path, $query);
            $response->getBody()->write((string) $upstream->getBody());

            return $response->withHeader('Content-Type', $upstream->getHeaderLine('Content-Type') ?: 'application/json;charset=utf-8')->withStatus($upstream->getStatusCode());
        } catch (ConnectException $exception) {
            return $this->json($response, ['error' => 'El servicio de datos no está disponible'], 502);
        } catch (RequestException $exception) {
            return $this->json($response, ['error' => 'No se pudo consultar el servicio de datos'], 502);
        }
    }

    public function create(Request $request, Response $response, array $args): Response
    {
        try {
            $request->getBody()->rewind();
            $body = (string) $request->getBody();
            $data = json_decode($body, true);

            if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
                return $this->json($response, ['errors' => ['body' => 'Debe enviar un objeto JSON válido']], 422);
            }

            $errors = (new PagoValidator())->validate($data);

            if ($errors !== []) {
                return $this->json($response, ['errors' => $errors], 422);
            }

            $dataService = $this->container->get(DataService::class);
            $upstream = $dataService->post('pagos', json_encode($data, JSON_THROW_ON_ERROR));

            return $this->json($response, json_decode((string) $upstream->getBody(), true), $upstream->getStatusCode());
        } catch (ConnectException $exception) {
            return $this->json($response, ['error' => 'El servicio de datos no está disponible'], 502);
        } catch (RequestException $exception) {
            return $this->json($response, ['error' => 'No se pudo consultar el servicio de datos'], 502);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $dataService = $this->container->get(DataService::class);
            $upstream = $dataService->put('pagos/' . rawurlencode($args['id']), (string) $request->getBody());

            return $this->json($response, json_decode((string) $upstream->getBody(), true), $upstream->getStatusCode());
        } catch (ConnectException $exception) {
            return $this->json($response, ['error' => 'El servicio de datos no está disponible'], 502);
        } catch (RequestException $exception) {
            return $this->json($response, ['error' => 'No se pudo consultar el servicio de datos'], 502);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $dataService = $this->container->get(DataService::class);
            $upstream = $dataService->delete('pagos/' . rawurlencode($args['id']));

            return $this->json($response, json_decode((string) $upstream->getBody(), true), $upstream->getStatusCode());
        } catch (ConnectException $exception) {
            return $this->json($response, ['error' => 'El servicio de datos no está disponible'], 502);
        } catch (RequestException $exception) {
            return $this->json($response, ['error' => 'No se pudo consultar el servicio de datos'], 502);
        }
    }

    private function json(Response $response, array $payload, int $status): Response
    {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json;charset=utf-8')->withStatus($status);
    }
}
