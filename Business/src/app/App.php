<?php

use Slim\Factory\AppFactory; #Permite usar la clase AppFactory de Slim para crear una instancia de la aplicación
use DI\Container; #Permite usar la clase Container de PHP-DI para crear un contenedor de dependencias
use JimTools\JwtAuth\Decoder\FirebaseDecoder; #Permite usar la clase FirebaseDecoder de JimTools\JwtAuth para decodificar tokens JWT
use JimTools\JwtAuth\Exceptions\AuthorizationException; #Permite usar la clase AuthorizationException de JimTools\JwtAuth para manejar excepciones de autorización
use JimTools\JwtAuth\Middleware\JwtAuthentication; #Permite usar la clase JwtAuthMiddleware de JimTools\JwtAuth para manejar la autenticación JWT
use JimTools\JwtAuth\Options;
use JimTools\JwtAuth\Rules\RequestPathRule;
use JimTools\JwtAuth\Secret;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

require __DIR__ . '/../../vendor/autoload.php';

#::=>se usa para acceder a métodos estáticos de una clase
$container = new Container();
$dotenv = Dotenv\Dotenv::createImmutable('/var/www/html');
$dotenv->load();

AppFactory::setContainer($container);

$app = AppFactory::create();
$app->addRoutingMiddleware();
$app->addBodyParsingMiddleware();

require_once "routes.php";
require_once "config.php";

$app->add(new JwtAuthentication(
    new Options(isSecure:false),
        new FirebaseDecoder(new Secret($_ENV['KEY'], 'HS256')),
        [new RequestPathRule(['/'], ['/api/auth'])],
));

$errorMiddleware = $app->addErrorMiddleware(true, true, true);
$errorMiddleware->setErrorHandler(AuthorizationException::class,
function ($request, AuthorizationException $exception, bool $displayErrorDetails) use ($app){
    $response = $app->getResponseFactory()->createResponse(401);
    $response->getBody()->write(json_encode([
        'error' => 'Token inválido o ausente',
    ], JSON_UNESCAPED_UNICODE));
    return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
    }
);

$app->add(function (Request $request, RequestHandler $handler) use ($app): Response {
    $allowedOrigin = $_ENV['CORS_ALLOWED_ORIGIN'] ?? 'http://localhost:4200';
    $origin = $request->getHeaderLine('Origin');

    if ($request->getMethod() === 'OPTIONS' && $origin === $allowedOrigin) {
        $response = $app->getResponseFactory()->createResponse(204);
    } else {
        $response = $handler->handle($request);
    }

    if ($origin !== $allowedOrigin) {
        return $response;
    }

    return $response
        ->withHeader('Access-Control-Allow-Origin', $allowedOrigin)
        ->withHeader('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, Origin, X-Requested-With')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Credentials', 'true')
        ->withHeader('Vary', 'Origin');
});

$app->run();

#require_once
#include
#include_once