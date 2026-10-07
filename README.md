# TechStore - Sistema de Gestión de Inventario

Proyecto de Laboratorio Calificado para la asignatura **Desarrollo de Soluciones en la Nube**.

## 📌 Contexto
TechStore es una cadena de tiendas de tecnología que requiere un sistema centralizado de gestión de inventario con control de acceso basado en roles (RBAC) y seguridad robusta.

## 🛡️ Características de Seguridad
- **Registro e Inicio de Sesión**: Contraseñas con políticas complejas y tokens JWT.
- **Protección Fuerza Bruta**: Bloqueo tras 5 intentos fallidos de login.
- **Autenticación Multi-Factor (MFA)**: Código de 6 dígitos enviado por Email (válido por 5 minutos, máx. 3 intentos).
- **Login Social**: OAuth 2.0 con Google y GitHub.
- **Control de Acceso (RBAC)**: Administrador, Gerente de Tienda, Empleado de Ventas y Auditor.

## 🛠️ Stack Tecnológico
- **Backend**: Node.js / Express
- **Base de Datos**: SQLite / PostgreSQL
- **Autenticación**: JWT, Nodemailer (MFA por Email)

##  🧸 Diagrama de Arquitectura
```mermaid
graph TD
    %% Estilos de Nodos
    classDef client fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b;
    classDef server fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100;
    classDef security fill:#ffebee,stroke:#d32f2f,stroke-width:2px,color:#b71c1c;
    classDef db fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#1b5e20;
    classDef ext fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c;

    %% Capas
    subgraph ClientLayer [" 📱 Capa de Cliente "]
        CLIENT["Cliente (Frontend / cURL / Postman)"]:::client
    end

    subgraph BackendLayer [" 🚀 Servidor Backend (Node.js + Express) "]
        APP["src/app.js (Servidor Principal)"]:::server
        
        subgraph Routes [" 🛣️ Rutas API "]
            AUTH_R["/api/auth"]:::server
            PROD_R["/api/products"]:::server
        end

        subgraph Security [" 🛡️ Capa de Seguridad & Middlewares "]
            JWT_M["JWT Auth Middleware"]:::security
            RBAC_M["RBAC Role Checker"]:::security
        end

        subgraph Controllers [" ⚙️ Controladores "]
            AUTH_C["authController.js"]:::server
            PROD_C["productController.js"]:::server
        end

        subgraph Services [" ✉️ Útiles & Lógica MFA "]
            MFA_U["mfa.js (Generador Códigos 6 dígitos)"]:::server
            MAIL_U["mailer.js (Nodemailer)"]:::server
        end
    end

    subgraph ExternalLayer [" 💾 Persistencia y Servicios Externos "]
        DB[("Base de Datos SQLite (techstore.db)")]:::db
        GMAIL["Servidor SMTP Gmail"]:::ext
    end

    %% Flujos de Conexión
    CLIENT -->|"1. Petición HTTP / Headers Authorization"| APP
    APP --> AUTH_R
    APP --> PROD_R

    AUTH_R --> AUTH_C
    PROD_R --> JWT_M --> RBAC_M --> PROD_C

    AUTH_C --> MFA_U
    AUTH_C --> MAIL_U -->|"2. Envía Correo con Código"| GMAIL
    GMAIL -->|"3. Entrega Código MFA"| CLIENT

    AUTH_C -->|"Consultas / Modificaciones"| DB
    PROD_C -->|"Consultas / Modificaciones RBAC"| DB
```