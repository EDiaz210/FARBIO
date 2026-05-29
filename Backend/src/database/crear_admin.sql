-- SQL para crear el primer usuario ADMINISTRADOR
-- Contraseña: Admin@123456789 (hasheada con bcryptjs)

INSERT INTO usuarios (id, nombre, cedula, email, username, password, rol, created_at, updated_at) 
VALUES (
    1,
    'Elkin Diaz',
    '1727660902',
    'pasante.ti@farbiopaharma.com',
    'ADMIN :)',
    '$2b$10$VCe.aQ1TN9jn30XU5VUyg.I0WaUajFfXoqBmCI1gs7\4oGo\P2Rpy',
    'administrador',
    NOW(),
    NOW()
);

-- Verificar que se insertó
SELECT * FROM usuarios WHERE rol = 'administrador';
