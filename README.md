# Airbnb Yucatan - Hospedaje App

Plataforma de hospedaje tipo Airbnb. Setup inicial, base de datos y sistema de autenticacion completo.

## Stack Tecnologico

- Frontend: React.js + Vite + Tailwind CSS v3
- Backend: Node.js + Express.js
- Base de Datos: MySQL + Sequelize ORM
- Autenticacion: JWT + bcrypt
- Email: Nodemailer
- Testing: Jest (backend) / Vitest (frontend)

## Requisitos Previos

- Node.js v18 o superior
- MySQL v8 o superior
- npm v9 o superior

## Instalacion y Ejecucion Local

### 1. Entrar al directorio del proyecto

```bash
cd hospedaje-app
```

### 2. Crear la base de datos MySQL

Ejecutar las siguientes sentencias en tu servidor local de MySQL:

```sql
CREATE DATABASE hospedaje_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE hospedaje_db_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar variables de entorno

En el directorio backend, crea tu archivo de entorno y configura tu usuario y contrasena de MySQL:

```bash
cd backend
# Crea un archivo .env basado en .env.example y edita las credenciales
```

### 4. Instalar dependencias e iniciar el Backend

```bash
cd backend
npm install
npm run dev
```

### 5. Instalar dependencias e iniciar el Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estara disponible en http://localhost:5173 y el backend en http://localhost:5000.

## Ejecutar Pruebas (Tests)

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```
