<?php
namespace App\controllers;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use Slim\Routing\RouteCollectorProxy;

$app->get('/', function (Request $request, Response $response, array $args) {
    
    $response->getBody()->write("Hola Slim");
    return $response;
});
$app->get('/hello/{name}', function (Request $request, Response $response, array $args) {
    $name = $args['name'];
    $response->getBody()->write("Hello, $name");
    return $response;
});

$app->group('/api', function(RouteCollectorProxy $api) {
    $api->group('/auth', function(RouteCollectorProxy $endpoint) {
        $endpoint->post('/credentials', Auth::class . ':credentials');  
        $endpoint->put('/tkref/{id}', Auth::class . ':updateTokenRef');
        $endpoint->post('/verify_token/{id}', Auth::class . ':verifyToken');
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
   
});
