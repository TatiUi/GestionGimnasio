<?php
namespace App\controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Routing\RouteCollectorProxy;

$app->group('/api', function(RouteCollectorProxy $api) use ($app) {
    $api->group('/auth', function(RouteCollectorProxy $endpoint) {
        $endpoint->post('/login', Auth::class . ':login');
        $endpoint->delete('/loggout/{id}', Auth::class . ':loggout');
        $endpoint->post('/refresh-session/{id}', Auth::class . ':refreshSession');
    });
    $api->group('/roles', function(RouteCollectorProxy $endpoint) {
        $endpoint->get('[/{id}]', Role::class . ':read');
        $endpoint->get('/filter/{offset}/{limit}', Role::class . ':filter');
        $endpoint->post('', Role::class . ':create');
        $endpoint->put('/{id}', Role::class . ':update');
        $endpoint->delete('/{id}', Role::class . ':delete');
    });
    $api->group('/usuarios', function(RouteCollectorProxy $endpoint) {
        $endpoint->get('[/{id}]', UserController::class . ':read');
        $endpoint->get('/filter/{offset}/{limit}', UserController::class . ':filter');
        $endpoint->post('', UserController::class . ':create');
        $endpoint->put('/{id}', UserController::class . ':update');
        $endpoint->delete('/{id}', UserController::class . ':delete');
    });
    $api->group('/planes_membresias', function(RouteCollectorProxy $endpoint) {
        $endpoint->get('/filter/{offset}/{limit}', PlanMembresiaController::class . ':filter');
        $endpoint->get('[/{id}]', PlanMembresiaController::class . ':read');
        $endpoint->post('', PlanMembresiaController::class . ':create');
        $endpoint->put('/{id}', PlanMembresiaController::class . ':update');
        $endpoint->delete('/{id}', PlanMembresiaController::class . ':delete');
    });
    $api->group('/membresias', function(RouteCollectorProxy $endpoint) {
        $endpoint->get('/filter/{offset}/{limit}', MembresiaController::class . ':filter');
        $endpoint->get('[/{id}]', MembresiaController::class . ':read');
        $endpoint->post('', MembresiaController::class . ':create');
        $endpoint->put('/{id}', MembresiaController::class . ':update');
        $endpoint->delete('/{id}', MembresiaController::class . ':delete');
    });
    $api->group('/pagos', function(RouteCollectorProxy $endpoint) {
        $endpoint->get('/filter/{offset}/{limit}', PagoController::class . ':filter');
        $endpoint->get('[/{id}]', PagoController::class . ':read');
        $endpoint->post('', PagoController::class . ':create');
        $endpoint->put('/{id}', PagoController::class . ':update');
        $endpoint->delete('/{id}', PagoController::class . ':delete');
    });
    $api->group('/clases', function(RouteCollectorProxy $endpoint) {
        $endpoint->get('/filter/{offset}/{limit}', ClaseController::class . ':filter');
        $endpoint->get('[/{id}]', ClaseController::class . ':read');
        $endpoint->post('', ClaseController::class . ':create');
        $endpoint->put('/{id}', ClaseController::class . ':update');
        $endpoint->delete('/{id}', ClaseController::class . ':delete');
    });
    $api->group('/inscripciones', function(RouteCollectorProxy $endpoint) {
        $endpoint->get('/filter/{offset}/{limit}', InscripcionController::class . ':filter');
        $endpoint->get('[/{id}]', InscripcionController::class . ':read');
        $endpoint->post('', InscripcionController::class . ':create');
        $endpoint->put('/{id}', InscripcionController::class . ':update');
        $endpoint->delete('/{id}', InscripcionController::class . ':delete');
    });
    $api->group('/asistencias', function(RouteCollectorProxy $endpoint) {
        $endpoint->get('/filter/{offset}/{limit}', AsistenciaController::class . ':filter');
        $endpoint->get('[/{id}]', AsistenciaController::class . ':read');
        $endpoint->post('', AsistenciaController::class . ':create');
        $endpoint->put('/{id}', AsistenciaController::class . ':update');
        $endpoint->delete('/{id}', AsistenciaController::class . ':delete');
    });

    $app->add(function (Request $request, \Psr\Http\Server\RequestHandlerInterface $handler) use ($app): Response {
        $token = $request->getAttribute('token');
        $rolId = is_object($token)
            ? (int) ($token->rol_id ?? 0)
            : (int) (($token['rol_id'] ?? 0));
        $path = $request->getUri()->getPath();
        $method = strtoupper($request->getMethod());

        if (str_contains($path, '/api/auth/')) {
            return $handler->handle($request);
        }

        $administrador = $rolId === 1;
        $entrenador = $rolId === 2;
        $cliente = $rolId === 3;
        $permitido = $administrador;

        if ($entrenador) {
            if (str_contains($path, '/clases')) {
                $permitido = true;
            } elseif (str_contains($path, '/inscripciones')) {
                $permitido = $method === 'GET';
            } elseif (str_contains($path, '/asistencias')) {
                $permitido = in_array($method, ['GET', 'POST'], true);
            } else {
                $permitido = false;
            }
        }

        if ($cliente) {
            $permitido =
                str_contains($path, '/planes_membresias')
                || str_contains($path, '/membresias')
                || str_contains($path, '/pagos')
                || str_contains($path, '/clases')
                || str_contains($path, '/inscripciones');

            if ($permitido && str_contains($path, '/inscripciones') && !in_array($method, ['GET', 'POST', 'DELETE'], true)) {
                $permitido = false;
            }

            if ($permitido && !str_contains($path, '/inscripciones') && $method !== 'GET') {
                $permitido = false;
            }
        }

        if (!$permitido) {
            $response = $app->getResponseFactory()->createResponse(403);
            $response->getBody()->write(json_encode([
                'error' => 'No tiene permisos para realizar esta operación.'
            ], JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
        }

        return $handler->handle($request);
    });
});
