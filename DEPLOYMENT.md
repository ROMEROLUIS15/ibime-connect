# Guía de Despliegue — IBIME Connect

**Servidor:** Linux Debian · IP local: 192.168.0.41  
**Dominio público:** http://www.ibime.gob.ve (accesible desde internet)  
**Stack:** React + Vite · Node.js + Express · Redis · Supabase (cloud)  
**Credenciales:** en `frontend/.env` y `backend/.env` del proyecto clonado  
**Root password:** 123456

---

## Arquitectura objetivo

```
Internet
   │
   ▼
Router (ibime.gob.ve → 192.168.0.41)
   │
   ▼
Apache :80  (192.168.0.41)
   ├── /          → /var/www/html/  (build React estático)
   └── /api/*     → proxy → Node.js :3000

Node.js + PM2 :3000  (backend Express)
Redis :6379           (caché)

Servicios externos (no se tocan):
   Supabase · Groq · Gemini · Cloudinary
```

---

## PREGUNTAS PARA EL DEPARTAMENTO DE INFORMÁTICA

Antes de iniciar el despliegue, necesitas conseguir estas respuestas.
Llévalas contigo cuando vayas a hacer la instalación.

### Sobre el servidor actual (donde corre ibime.gob.ve)

1. **¿Cuál es la IP pública del servidor?**
   _(La IP que se ve desde internet, no la de la red interna)_

2. **¿El servidor es el mismo computador con IP 192.168.0.41, o es otro equipo?**
   _(Importante para saber si el servidor está en la red local o es externo)_

3. **¿Cuál es el sistema operativo exacto del servidor?**
   _(Ejemplo: Debian 11, Debian 12, Ubuntu 22.04)_
   ```bash
   cat /etc/os-release
   ```

4. **¿Qué software tiene instalado actualmente?**
   _(Apache, Nginx, PHP, MySQL, etc. — para saber qué reemplazar)_

5. **¿Dónde están los archivos de la página vieja?**
   _(Ejemplo: /var/www/html, /srv/www, etc.)_

6. **¿Quién administra el servidor actualmente y cómo acceden a él?**
   _(Usuario SSH, panel de control, acceso físico, etc.)_

### Sobre el acceso SSH

7. **¿El puerto SSH (22) está abierto hacia internet?**
   _(¿Se puede hacer `ssh usuario@IP_PUBLICA` desde fuera de la oficina?)_

8. **¿Cuál es el usuario y contraseña para entrar por SSH?**
   _(O si usan llave SSH en lugar de contraseña)_

9. **¿Hay firewall o lista blanca de IPs que bloquee conexiones SSH externas?**

### Sobre el dominio y DNS

10. **¿Quién controla el dominio ibime.gob.ve?**
    _(¿Lo gestiona informática internamente, CANTV, o un registrador externo?)_

11. **¿El DNS de ibime.gob.ve apunta directamente a la IP del servidor, o hay un router/proxy en el medio?**

12. **¿Hay certificado SSL instalado o solo HTTP?**
    _(Si quieren pasar a HTTPS en el futuro, necesitarán Certbot o un certificado)_

### Sobre la infraestructura de red

13. **¿El servidor tiene acceso directo a internet (IP pública propia) o está detrás de un router con NAT?**
    _(Si está detrás de un router, ¿qué puertos están redirigidos hacia el servidor?)_

14. **¿El servidor puede hacer peticiones salientes a internet sin restricciones?**
    _(Necesario para conectarse a Supabase, Groq, Gemini y GitHub)_

15. **¿Hay algún proxy corporativo que deba configurarse para el acceso a internet?**

### Sobre permisos y políticas

16. **¿Se puede instalar software nuevo en el servidor? ¿Se necesita aprobación?**
    _(Se instalará: PM2, Redis si no está, módulos de Apache)_

17. **¿Hay política de backups del servidor? ¿Hacen snapshot antes de cambios grandes?**

18. **¿Quién debe estar presente o dar autorización cuando se reemplace la página vieja?**

---

### Checklist — Información que debes tener lista antes de empezar

- [ ] IP pública del servidor
- [ ] Usuario y contraseña SSH
- [ ] Sistema operativo exacto (versión de Debian)
- [ ] Ruta donde están los archivos de la página vieja
- [ ] Confirmación de que el servidor tiene acceso a internet
- [ ] Autorización de informática para instalar software y reemplazar la página

---

## PASO 1 — Conectarse al servidor

Desde cualquier máquina en la misma red local:

```bash
ssh root@192.168.0.41
# contraseña: 123456
```

Desde internet (si el puerto 22 está abierto hacia afuera):

```bash
ssh root@IP_PUBLICA_DEL_SERVIDOR
```

Para saber la IP pública del servidor, ejecutar dentro de él:

```bash
curl -s ifconfig.me
```

---

## PASO 2 — Verificar el estado actual del servidor

Ejecutar uno por uno:

```bash
# Dónde está el proyecto clonado
find / -name "ibime-connect" -type d 2>/dev/null | head -5

# Qué hay instalado
node -v
npm -v
apache2 -v
redis-cli ping
pm2 -v

# Si Apache está corriendo
systemctl status apache2

# Si Redis está corriendo
systemctl status redis-server
```

---

## PASO 3 — Instalar lo que falte

```bash
sudo apt update && sudo apt upgrade -y

# Apache (si no está)
sudo apt install -y apache2

# Redis (si no está)
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# PM2 (si no está)
sudo npm install -g pm2

# Módulos de Apache para proxy y React Router
sudo a2enmod proxy proxy_http rewrite headers
sudo systemctl restart apache2
```

---

## PASO 4 — Ubicar y preparar el proyecto

```bash
# Encontrar la ruta exacta del proyecto
find / -name "ibime-connect" -type d 2>/dev/null | head -5

# Entrar al proyecto (reemplazar RUTA con la que encontraste)
cd /RUTA/ibime-connect

# Verificar que los .env existen
ls -la backend/.env
ls -la frontend/.env
```

Si los `.env` no están en el servidor, cópialos desde tu máquina:

```bash
# Ejecutar desde tu Windows (en PowerShell, con la IP pública del servidor)
scp frontend/.env root@IP_PUBLICA:/RUTA/ibime-connect/frontend/.env
scp backend/.env root@IP_PUBLICA:/RUTA/ibime-connect/backend/.env
```

Verificar que `backend/.env` tenga estas líneas con valores reales:

```
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://www.ibime.gob.ve
```

Verificar que `frontend/.env` tenga:

```
VITE_API_URL=http://www.ibime.gob.ve/api
```

---

## PASO 5 — Compilar y levantar el backend

```bash
cd /RUTA/ibime-connect/backend

npm install
npm run build

# Levantar con PM2
pm2 start dist/src/index.js --name ibime-backend
pm2 save
pm2 startup
# Ejecutar el comando que muestre pm2 startup

# Verificar
pm2 status
curl http://localhost:3000/
```

---

## PASO 6 — Compilar el frontend

```bash
cd /RUTA/ibime-connect/frontend

npm install
npm run build

# Copiar el build a Apache
sudo cp -r dist/* /var/www/html/

# Verificar
ls /var/www/html/index.html
```

---

## PASO 7 — Configurar Apache

```bash
sudo nano /etc/apache2/sites-available/ibime.conf
```

Pegar exactamente:

```apache
<VirtualHost *:80>
    ServerName www.ibime.gob.ve
    ServerAlias ibime.gob.ve
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>

    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:3000/api
    ProxyPassReverse /api http://127.0.0.1:3000/api

    ErrorLog ${APACHE_LOG_DIR}/ibime-error.log
    CustomLog ${APACHE_LOG_DIR}/ibime-access.log combined
</VirtualHost>
```

Guardar `Ctrl+O`, salir `Ctrl+X`, luego:

```bash
sudo a2ensite ibime.conf
sudo a2dissite 000-default.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

---

## PASO 8 — Verificación completa

```bash
redis-cli ping                   # → PONG
curl http://localhost:3000/      # → respuesta del backend
curl http://localhost/           # → HTML del React
curl http://localhost/api/       # → respuesta del backend via Apache
pm2 status                       # → ibime-backend: online
```

Abrir en el navegador: http://www.ibime.gob.ve

---

## PASO 9 — CI/CD (despliegue automático desde GitHub)

### 9.1 Verificar si SSH está accesible desde internet

Desde tu máquina en casa (Windows, PowerShell):

```powershell
# Reemplazar con la IP pública del servidor
ssh root@IP_PUBLICA_DEL_SERVIDOR
```

Si conecta → usar **Opción A (SSH directo)**  
Si no conecta → usar **Opción B (Self-hosted Runner)**

---

### Opción A — GitHub Actions con SSH (si hay acceso SSH público)

En GitHub: **Settings → Secrets → Actions → New repository secret**

| Secret | Valor |
|--------|-------|
| `SERVER_HOST` | IP pública del servidor |
| `SERVER_USER` | root |
| `SERVER_PASS` | contraseña del servidor |
| `SERVER_PROJECT_PATH` | ruta del proyecto en el servidor |
| `VITE_API_URL` | http://www.ibime.gob.ve/api |
| `VITE_SUPABASE_URL` | valor del frontend/.env |
| `VITE_SUPABASE_PROJECT_ID` | valor del frontend/.env |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | valor del frontend/.env |
| `VITE_CLOUDINARY_CLOUD_NAME` | valor del frontend/.env |

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PROJECT_ID: ${{ secrets.VITE_SUPABASE_PROJECT_ID }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          VITE_CLOUDINARY_CLOUD_NAME: ${{ secrets.VITE_CLOUDINARY_CLOUD_NAME }}
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Deploy backend
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          password: ${{ secrets.SERVER_PASS }}
          script: |
            cd ${{ secrets.SERVER_PROJECT_PATH }}
            git pull origin main
            cd backend
            npm install
            npm run build
            pm2 restart ibime-backend

      - name: Copiar frontend
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          password: ${{ secrets.SERVER_PASS }}
          source: "frontend/dist/*"
          target: "/var/www/html/"
          strip_components: 2
```

---

### Opción B — Self-hosted Runner (si el servidor NO tiene SSH público)

Esta opción funciona con IP privada: el servidor se conecta a GitHub, no al revés.

En GitHub: **Settings → Actions → Runners → New self-hosted runner**  
Seleccionar: **Linux / x64**  
Copiar y ejecutar los comandos que muestra GitHub en el servidor.

Instalar como servicio para que arranque solo:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted

    steps:
      - uses: actions/checkout@v4

      - name: Deploy backend
        run: |
          cd backend
          npm install
          npm run build
          pm2 restart ibime-backend

      - name: Build y deploy frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PROJECT_ID: ${{ secrets.VITE_SUPABASE_PROJECT_ID }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          VITE_CLOUDINARY_CLOUD_NAME: ${{ secrets.VITE_CLOUDINARY_CLOUD_NAME }}
        run: |
          cd frontend
          npm install
          npm run build
          sudo cp -r dist/* /var/www/html/
```

---

## Comandos de mantenimiento

```bash
# Estado general
pm2 status
systemctl status apache2
systemctl status redis-server

# Logs en tiempo real
pm2 logs ibime-backend
sudo tail -f /var/log/apache2/ibime-error.log

# Reiniciar servicios
pm2 restart ibime-backend
sudo systemctl restart apache2
sudo systemctl restart redis-server

# Actualizar manualmente (sin CI/CD)
cd /RUTA/ibime-connect
git pull origin main
cd backend && npm install && npm run build && pm2 restart ibime-backend
cd ../frontend && npm install && npm run build && sudo cp -r dist/* /var/www/html/
```

---

---

## PROMPT PARA USAR EN LA OFICINA

> Copia este bloque completo y pégalo como primer mensaje a Claude Code
> cuando estés frente al computador Linux de la oficina.

---

```
Estoy en el servidor Linux Debian de mi oficina (IP local 192.168.0.41).
Necesito que me ayudes a desplegar el proyecto ibime-connect de principio
a fin y dejar configurado CI/CD con GitHub Actions.

Contexto del proyecto:
- Es una plataforma institucional: React + Vite (frontend) + Node.js +
  Express + TypeScript (backend) + Redis (caché) + Supabase (base de datos
  cloud, no se migra)
- El dominio es http://www.ibime.gob.ve y es accesible desde internet
- El proyecto ya está clonado en este servidor (necesito encontrar la ruta)
- Los archivos .env del frontend y backend ya existen en el proyecto clonado
- Node.js y npm están instalados; falta verificar Apache, Redis, PM2

Lo que necesito que hagas conmigo paso a paso:
1. Encontrar la ruta exacta del proyecto clonado
2. Verificar qué está instalado (Apache, Redis, PM2) e instalar lo que falte
3. Revisar y corregir los .env: REDIS_URL debe ser redis://localhost:6379,
   FRONTEND_URL debe ser http://www.ibime.gob.ve,
   VITE_API_URL debe ser http://www.ibime.gob.ve/api
4. Compilar el backend (TypeScript) y levantarlo con PM2
5. Compilar el frontend (Vite) y copiar el build a /var/www/html/
6. Configurar Apache: Virtual Host con proxy reverso /api/* → Node.js :3000
   y FallbackResource para React Router
7. Verificar que todo responde: Redis, backend, frontend, proxy
8. Obtener la IP pública del servidor (curl ifconfig.me) y configurar CI/CD:
   - Si SSH es accesible desde internet: GitHub Actions con SSH
   - Si no: GitHub Self-hosted Runner
9. Crear el archivo .github/workflows/deploy.yml correspondiente

La contraseña de root es 123456.
El repositorio está en GitHub (dame el paso para configurar los secrets).
Guíame comando por comando y espera mi confirmación en cada paso antes
de continuar con el siguiente.
```
