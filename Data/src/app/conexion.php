<?php
#Se requiere la interfaz ContainerInterface para poder usarla en la función de conexión a la base de datos
use Psr\Container\ContainerInterface;

#Creamos un contenedor de dependencias
$container->set('base_datos', function(ContainerInterface $c) {
    $conf = $c->get('config_db');

    #Opciones de conexión
    $opc = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_OBJ
    ];

    #Creamos la cadena de conexión
    $dsn = "mysql:host=$conf->host;dbname=$conf->database;charset=$conf->charset";

    #Establecemos la conexión con la base de datos
    try {
        $conexion = new PDO($dsn, $conf->username, $conf->password, $opc);
    }catch (PDOException $e){
        die("Error de conexión " . $e->getMessage());
    }

    return $conexion;
});