<?php

namespace App\controllers;

use App\Services\DataService;
use App\Validators\InscripcionValidator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;

class InscripcionController
{
    private ContainerInterface $container;

    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }

    public function read(Request $request, Response $response, array $args): Response
    {
        try {
            $service = $this->container->get(DataService::class);
            $path = 'inscripciones';

            if (isset($args['id'])) {
                $path .= '/' . rawurlencode($args['id']);
            }

            $query = $request->getQueryParams();
            $token = $request->getAttribute('token');
            $rolId = is_object($token) ? (int) ($token->rol_id ?? 0) : (int) (($token['rol_id'] ?? 0));
            $usuarioId = is_object($token) ? (int) ($token->sub ?? 0) : (int) (($token['sub'] ?? 0));

            if ($rolId === 3 && $usuarioId > 0) {
                $query['usuario_id'] = $usuarioId;
            }

            $upstream = $service->get($path, $query);

            if (isset($args['id']) && in_array($rolId, [2, 3], true)) {
                $data = json_decode((string) $upstream->getBody(), true);
                $record = $data['data'] ?? null;

                if (!is_array($record)) {
                    return $this->json($response, ['error' => 'Inscripción no encontrada.'], 404);
                }

                if ($rolId === 3 && (int) ($record['usuario_id'] ?? 0) !== $usuarioId) {
                    return $this->json($response, ['error' => 'No tiene permisos para consultar esta inscripción.'], 403);
                }

                if ($rolId === 2) {
                    $clase = $service->get('clases/' . rawurlencode((string) ($record['clase_id'] ?? 0)));
                    $claseData = json_decode((string) $clase->getBody(), true);

                    if ($clase->getStatusCode() !== 200
                        || (int) ($claseData['data']['entrenador_id'] ?? 0) !== $usuarioId) {
                        return $this->json($response, ['error' => 'No tiene permisos para consultar esta inscripción.'], 403);
                    }
                }

                $upstream = $service->get($path, $query);
            }

            $response->getBody()->write((string) $upstream->getBody());

            return $response
                ->withHeader('Content-Type', $upstream->getHeaderLine('Content-Type') ?: 'application/json;charset=utf-8')
                ->withStatus($upstream->getStatusCode());
        } catch (ConnectException $exception) {
            return $this->json($response, ['error' => 'El servicio de datos no está disponible'], 502);
        } catch (RequestException $exception) {
            return $this->json($response, ['error' => 'No se pudo consultar el servicio de datos'], 502);
        }
    }

    public function filter(Request $request, Response $response, array $args): Response
    {
        try {
            $service = $this->container->get(DataService::class);
            $path = 'inscripciones/filter/' . rawurlencode($args['offset']) . '/' . rawurlencode($args['limit']);
            $query = $request->getQueryParams();
            $token = $request->getAttribute('token');
            $rolId = is_object($token) ? (int) ($token->rol_id ?? 0) : (int) (($token['rol_id'] ?? 0));
            $usuarioId = is_object($token) ? (int) ($token->sub ?? 0) : (int) (($token['sub'] ?? 0));

            if ($rolId === 3 && $usuarioId > 0) {
                $query['usuario_id'] = $usuarioId;
            }

            if ($rolId === 2 && $usuarioId > 0) {
                $query['entrenador_id'] = $usuarioId;
            }

            $upstream = $service->get($path, $query);
            $response->getBody()->write((string) $upstream->getBody());

            return $response
                ->withHeader('Content-Type', $upstream->getHeaderLine('Content-Type') ?: 'application/json;charset=utf-8')
                ->withStatus($upstream->getStatusCode());
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

            if ($rolId === 3) {
                if ($usuarioId < 1) {
                    return $this->json($response, ['error' => 'No fue posible identificar al usuario autenticado.'], 403);
                }

                $data['usuario_id'] = $usuarioId;
            }

            $errors = (new InscripcionValidator())->validate($data);

            if ($errors !== []) {
                return $this->json($response, ['errors' => $errors], 422);
            }

            $service = $this->container->get(DataService::class);
            $upstream = $service->post('inscripciones', json_encode($data, JSON_THROW_ON_ERROR));

            return $this->json(
                $response,
                json_decode((string) $upstream->getBody(), true),
                $upstream->getStatusCode()
            );
        } catch (ConnectException $exception) {
            return $this->json($response, ['error' => 'El servicio de datos no está disponible'], 502);
        } catch (RequestException $exception) {
            return $this->json($response, ['error' => 'No se pudo consultar el servicio de datos'], 502);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $service = $this->container->get(DataService::class);
            $path = 'inscripciones/' . rawurlencode($args['id']);
            $upstream = $service->put($path, (string) $request->getBody());
            $response->getBody()->write((string) $upstream->getBody());

            return $response
                ->withHeader('Content-Type', $upstream->getHeaderLine('Content-Type') ?: 'application/json;charset=utf-8')
                ->withStatus($upstream->getStatusCode());
        } catch (ConnectException $exception) {
            return $this->json($response, ['error' => 'El servicio de datos no está disponible'], 502);
        } catch (RequestException $exception) {
            return $this->json($response, ['error' => 'No se pudo consultar el servicio de datos'], 502);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $service = $this->container->get(DataService::class);
            $path = 'inscripciones/' . rawurlencode($args['id']);

            $token = $request->getAttribute('token');
            $rolId = is_object($token) ? (int) ($token->rol_id ?? 0) : (int) (($token['rol_id'] ?? 0));
            $usuarioId = is_object($token) ? (int) ($token->sub ?? 0) : (int) (($token['sub'] ?? 0));

            if ($rolId === 3) {
                $record = $service->get($path);
                $data = json_decode((string) $record->getBody(), true);
                $ownerId = (int) ($data['data']['usuario_id'] ?? 0);

                if ($record->getStatusCode() !== 200 || $ownerId !== $usuarioId) {
                    return $this->json($response, ['error' => 'No tiene permisos para modificar esta inscripción.'], 403);
                }
            }

            $upstream = $service->delete($path);

            return $this->json(
                $response,
                json_decode((string) $upstream->getBody(), true),
                $upstream->getStatusCode()
            );
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
