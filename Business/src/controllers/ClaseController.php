<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use App\Services\DataService;
use App\Validators\ClaseValidator;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;

class ClaseController
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
            $path = isset($args['id']) ? 'clases/' . rawurlencode($args['id']) : 'clases';
            $query = $request->getQueryParams();
            $token = $request->getAttribute('token');
            $rolId = is_object($token) ? (int) ($token->rol_id ?? 0) : (int) (($token['rol_id'] ?? 0));
            $usuarioId = is_object($token) ? (int) ($token->sub ?? 0) : (int) (($token['sub'] ?? 0));

            if ($rolId === 2 && !isset($args['id'])) {
                $query['entrenador_id'] = $usuarioId;
            }

            $upstream = $dataService->get($path, $query);

            if ($rolId === 2 && isset($args['id'])) {
                $data = json_decode((string) $upstream->getBody(), true);
                $ownerId = (int) ($data['data']['entrenador_id'] ?? 0);

                if ($ownerId !== $usuarioId) {
                    return $this->json($response, ['error' => 'No tiene permisos para consultar esta clase.'], 403);
                }

                $upstream = $dataService->get($path, $query);
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
            $path = 'clases/filter/' . rawurlencode($args['offset']) . '/' . rawurlencode($args['limit']);
            $upstream = $dataService->get($path, $request->getQueryParams());
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
            $data = json_decode((string) $request->getBody(), true);

            if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
                return $this->json($response, ['errors' => ['body' => 'Debe enviar un objeto JSON válido']], 422);
            }

            $token = $request->getAttribute('token');
            $rolId = is_object($token) ? (int) ($token->rol_id ?? 0) : (int) (($token['rol_id'] ?? 0));
            $usuarioId = is_object($token) ? (int) ($token->sub ?? 0) : (int) (($token['sub'] ?? 0));

            if ($rolId === 2) {
                $data['entrenador_id'] = $usuarioId;
            }

            $errors = (new ClaseValidator())->validate($data);

            if ($errors !== []) {
                return $this->json($response, ['errors' => $errors], 422);
            }

            $dataService = $this->container->get(DataService::class);
            $upstream = $dataService->post('clases', json_encode($data, JSON_THROW_ON_ERROR));

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
            $token = $request->getAttribute('token');
            $rolId = is_object($token) ? (int) ($token->rol_id ?? 0) : (int) (($token['rol_id'] ?? 0));
            $usuarioId = is_object($token) ? (int) ($token->sub ?? 0) : (int) (($token['sub'] ?? 0));
            $path = 'clases/' . rawurlencode($args['id']);

            if ($rolId === 2) {
                $record = $dataService->get($path);
                $recordData = json_decode((string) $record->getBody(), true);

                if ($record->getStatusCode() !== 200 || (int) ($recordData['data']['entrenador_id'] ?? 0) !== $usuarioId) {
                    return $this->json($response, ['error' => 'No tiene permisos para modificar esta clase.'], 403);
                }
            }

            $upstream = $dataService->put($path, (string) $request->getBody());

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
            $token = $request->getAttribute('token');
            $rolId = is_object($token) ? (int) ($token->rol_id ?? 0) : (int) (($token['rol_id'] ?? 0));
            $usuarioId = is_object($token) ? (int) ($token->sub ?? 0) : (int) (($token['sub'] ?? 0));
            $path = 'clases/' . rawurlencode($args['id']);

            if ($rolId === 2) {
                $record = $dataService->get($path);
                $recordData = json_decode((string) $record->getBody(), true);

                if ($record->getStatusCode() !== 200 || (int) ($recordData['data']['entrenador_id'] ?? 0) !== $usuarioId) {
                    return $this->json($response, ['error' => 'No tiene permisos para eliminar esta clase.'], 403);
                }
            }

            $upstream = $dataService->delete($path);

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
