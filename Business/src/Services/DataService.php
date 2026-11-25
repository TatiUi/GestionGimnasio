<?php
namespace App\Services;

use GuzzleHttp\ClientInterface;
use GuzzleHttp\Client;
use Psr\Http\Message\ResponseInterface;

#Esta clase permite realizar solicitudes HTTP a una API de datos, utilizando la librería GuzzleHttp para enviar las solicitudes y recibir las respuestas
final class DataService{
    private ClientInterface $client;
    public function __construct(object $config){
        $this->client = new Client([
            'base_uri' => rtrim($config->api_data, '/') . '/',
            'timeout' => $config->timeout,
            'connect_timeout' => $config->timeout,
            'http_errors' => false,
            'headers' => [
                'Accept' => 'application/json'
            ]
        ]);
    }

    #Esta funcion permite realizar una solicitud GET a la API de datos, pasando la ruta y los parámetros de consulta como argumentos
    public function get(string $path, array $query = []) {
        return $this->client->request('GET', ltrim($path, '/'),
            ['query' => $query]);
    }

    #Esta funcion permite realizar una solicitud GET a la API de datos, pasando la ruta y los parámetros de consulta como argumentos
    /* public function filter(string $path, array $query = []) {
        return $this->client->request('GET', ltrim($path, '/'),
            ['query' => $query]);
    }*/

    #Esta funcion permite realizar una solicitud POST a la API de datos, pasando la ruta y el cuerpo de la solicitud como argumentos
    public function post(string $path, string $body) {
        return $this->client->request('POST', ltrim($path, '/'),
            ['body' => $body,
             'headers' => ['Content-Type' => 'application/json']
             ]);
    }

    #Esta funcion permite realizar una solicitud PUT a la API de datos, pasando la ruta y el cuerpo de la solicitud como argumentos
    public function put(string $path, string $body) {
        return $this->client->request('PUT', ltrim($path, '/'),
            ['body' => $body,
             'headers' => ['Content-Type' => 'application/json']
             ]);
    }

     public function delete(string $path) {
        return $this->client->request('DELETE', ltrim($path, '/'));
     }

}