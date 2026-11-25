CREATE DATABASE IF NOT EXISTS GestionGimnasio_DB;
USE GestionGimnasio_DB;

SET NAMES utf8mb4;

-- Tablas del sistema
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT 1,
    tkRef VARCHAR(255),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE planes_membresias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    duracion_dias INT NOT NULL,
    activo BOOLEAN DEFAULT 1
);

CREATE TABLE membresias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    plan_id INT NOT NULL,
    fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_fin DATETIME NOT NULL,
    estado ENUM('Activa', 'Vencida', 'Cancelada') DEFAULT 'Activa',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (plan_id) REFERENCES planes_membresias(id)
);

CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    membresia_id INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(50) NOT NULL,
    estado ENUM('Pendiente', 'Completado', 'Anulado') DEFAULT 'Completado',
    FOREIGN KEY (membresia_id) REFERENCES membresias(id)
);

CREATE TABLE clases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrenador_id INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    capacidad INT DEFAULT 20,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin DATETIME NOT NULL,
    estado ENUM('Programada', 'Finalizada', 'Cancelada') DEFAULT 'Programada',
    FOREIGN KEY (entrenador_id) REFERENCES usuarios(id)
);

CREATE TABLE inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    clase_id INT NOT NULL,
    fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Inscrito', 'Cancelado') DEFAULT 'Inscrito',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (clase_id) REFERENCES clases(id)
);

CREATE TABLE asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT NOT NULL,
    clase_id INT NOT NULL,
    fecha_asistencia DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Presente', 'Ausente') NOT NULL,
    FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id),
    FOREIGN KEY (clase_id) REFERENCES clases(id)
);

-- Procedimiento para iniciar sesión
DELIMITER //

CREATE PROCEDURE sp_login(
    IN p_correo VARCHAR(100),
    IN p_password VARCHAR(255)
)
BEGIN
    SELECT
        u.id,
        u.nombre,
        u.apellido,
        u.correo_electronico,
        u.password,
        u.rol_id,
        r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    WHERE u.correo_electronico = p_correo
      AND u.password = p_password
      AND u.activo = 1;
END //

-- Procedimiento para crear un usuario
CREATE PROCEDURE sp_crear_usuario(
    IN p_rol_id INT,
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_cedula VARCHAR(20),
    IN p_correo VARCHAR(100),
    IN p_telefono VARCHAR(20),
    IN p_password VARCHAR(255)
)
BEGIN
    INSERT INTO usuarios
        (rol_id, nombre, apellido, cedula, correo_electronico, telefono, password)
    VALUES
        (p_rol_id, p_nombre, p_apellido, p_cedula, p_correo, p_telefono, p_password);

    SELECT * FROM usuarios WHERE id = LAST_INSERT_ID();
END //

-- Procedimiento para listar usuarios con paginación
CREATE PROCEDURE sp_listar_usuarios(
    IN p_inicio INT,
    IN p_limite INT
)
BEGIN
    SELECT u.id, u.nombre, u.apellido, u.cedula,
           u.correo_electronico, u.telefono, u.activo, r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    ORDER BY u.id
    LIMIT p_inicio, p_limite;
END //

-- Procedimiento para crear una membresía
CREATE PROCEDURE sp_crear_membresia(
    IN p_usuario_id INT,
    IN p_plan_id INT,
    IN p_fecha_inicio DATETIME
)
BEGIN
    INSERT INTO membresias
        (usuario_id, plan_id, fecha_inicio, fecha_fin)
    SELECT
        p_usuario_id,
        p_plan_id,
        p_fecha_inicio,
        DATE_ADD(p_fecha_inicio, INTERVAL duracion_dias DAY)
    FROM planes_membresias
    WHERE id = p_plan_id;

    SELECT * FROM membresias WHERE id = LAST_INSERT_ID();
END //

-- Procedimiento para registrar un pago
CREATE PROCEDURE sp_registrar_pago(
    IN p_membresia_id INT,
    IN p_monto DECIMAL(10, 2),
    IN p_metodo_pago VARCHAR(50)
)
BEGIN
    INSERT INTO pagos (membresia_id, monto, metodo_pago)
    VALUES (p_membresia_id, p_monto, p_metodo_pago);

    SELECT * FROM pagos WHERE id = LAST_INSERT_ID();
END //

-- Procedimiento para inscribir un usuario en una clase
CREATE PROCEDURE sp_crear_inscripcion(
    IN p_usuario_id INT,
    IN p_clase_id INT
)
BEGIN
    INSERT INTO inscripciones (usuario_id, clase_id)
    VALUES (p_usuario_id, p_clase_id);

    SELECT * FROM inscripciones WHERE id = LAST_INSERT_ID();
END //

-- Procedimiento para registrar asistencia
CREATE PROCEDURE sp_registrar_asistencia(
    IN p_inscripcion_id INT,
    IN p_clase_id INT,
    IN p_estado VARCHAR(20)
)
BEGIN
    INSERT INTO asistencias (inscripcion_id, clase_id, estado)
    VALUES (p_inscripcion_id, p_clase_id, p_estado);

    SELECT * FROM asistencias WHERE id = LAST_INSERT_ID();
END //

-- Procedimientos para consultar membresías y clases
CREATE PROCEDURE sp_membresias_usuario(IN p_usuario_id INT)
BEGIN
    SELECT m.id, m.fecha_inicio, m.fecha_fin, m.estado,
           p.nombre AS plan, p.precio
    FROM membresias m
    INNER JOIN planes_membresias p ON p.id = m.plan_id
    WHERE m.usuario_id = p_usuario_id
    ORDER BY m.fecha_inicio DESC;
END //

CREATE PROCEDURE sp_inscripciones_clase(IN p_clase_id INT)
BEGIN
    SELECT i.id, i.fecha_inscripcion, i.estado,
           u.nombre, u.apellido, u.correo_electronico
    FROM inscripciones i
    INNER JOIN usuarios u ON u.id = i.usuario_id
    WHERE i.clase_id = p_clase_id
    ORDER BY i.fecha_inscripcion;
END //

DELIMITER ;

-- Datos iniciales
INSERT INTO roles (nombre) VALUES
    ('Administrador'),
    ('Entrenador'),
    ('Cliente');

INSERT INTO usuarios
    (rol_id, nombre, apellido, cedula, correo_electronico, telefono, password)
VALUES
    (1, 'Daniel', 'Castro', '300000001', 'daniel.castro@gmail.com',
     '8888-0101',
     '$2y$12$5joXjViYFO5DyzFnqa9fUOZlcRdEFmRH.B53pB2sd.JF/VAqyrVZ6');

INSERT INTO planes_membresias
    (nombre, descripcion, precio, duracion_dias)
VALUES
    ('Mensual', 'Acceso al gimnasio por 30 dias', 18000, 30),
    ('Trimestral', 'Acceso al gimnasio por 90 dias', 50000, 90),
    ('Anual', 'Acceso al gimnasio por 365 dias', 170000, 365);
