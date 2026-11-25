<?php

namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use App\Services\DataService;
use App\Validators\UserValidator;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;

class UserController
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
            $path = isset($args['id']) ? 'usuarios/' . rawurlencode($args['id']) : 'usuarios';
            $upstream = $dataService->get($path, $request->getQueryParams());
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
            $path = 'usuarios/filter/' . rawurlencode($args['offset']) . '/' . rawurlencode($args['limit']);
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
            $body = (string) $request->getBody();
            $data = json_decode($body, true);

            if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
                return $this->json($response, ['errors' => ['body' => 'Debe enviar un objeto JSON válido']], 422);
            }

            $errors = (new UserValidator())->validate($data);

            if ($errors !== []) {
                return $this->json($response, ['errors' => $errors], 422);
            }

            $dataService = $this->container->get(DataService::class);
            $upstream = $dataService->post('usuarios', json_encode($data, JSON_THROW_ON_ERROR));
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
            $upstream = $dataService->put('usuarios/' . rawurlencode($args['id']), (string) $request->getBody());
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
            $upstream = $dataService->delete('usuarios/' . rawurlencode($args['id']));
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
