<?php

use Slim\Factory\AppFactory; #Permite usar la clase AppFactory de Slim para crear una instancia de la aplicación
use DI\Container; #Permite usar la clase Container de PHP-DI para crear un contenedor de dependencias

require __DIR__ . '/../../vendor/autoload.php';

#::=>se usa para acceder a métodos estáticos de una clase
$container = new Container();
$dotenv = Dotenv\Dotenv::createImmutable('/var/www/html');
$dotenv->load();

AppFactory::setContainer($container);

$app = AppFactory::create();
$app->addBodyParsingMiddleware();


require_once "routes.php";
require_once "config.php";
require_once "conexion.php";
require_once "eloquent.php";

$app->run();