<?php
declare(strict_types=1); #Permite especificar que los tipos de datos deben ser estrictos

use Illuminate\Database\Capsule\Manager as Capsule; #Permite usar la clase Capsule de Illuminate\Database para manejar la conexión a la base de datos y realizar operaciones de Eloquent ORM
use Psr\Container\ContainerInterface; #Permitirá acceder a la interfaz ContainerInterface para poder usarla en la función de conexión a la base de datos

$container->set('eloquent', function(ContainerInterface $c): Capsule {
    $config = $c->get('config_db'); #Obtiene la configuración de la base de datos desde el contenedor
    $capsule = new Capsule(); #Crea una nueva instancia de Capsule

    $capsule->addConnection([
        'driver' => 'mysql',
        'host' => $config->host,
        'database' => $config->database,
        'username' => $config->username,
        'password' => $config->password,
        'charset' => $config->charset,
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => ''
    ]);
    $capsule->setAsGlobal(); #Establece la instancia de Capsule como global para que pueda ser utilizada en cualquier parte de la aplicación
    $capsule->bootEloquent(); #Inicia Eloquent ORM para que pueda ser utilizado en la aplicación
    return $capsule;
});
