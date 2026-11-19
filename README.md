# Mi Grupo (PWA para jefe de grupo)

## 1. Google Sheets + Apps Script
1. Crea una hoja de cálculo y renombra la pestaña a `Alumnos` (o cambia `SHEET_NAME` en `Code.gs`). Fila 1: `No. Control | Apellido Paterno | Apellido Materno | Nombres | Teléfono | Correo`.
2. Extensiones → Apps Script → pega `Code.gs`. Opcional: define `TOKEN`.
3. Implementar → Nueva implementación → Aplicación web → Ejecutar como: **Yo**, Acceso: **Cualquier persona** → copia la URL que termina en `/exec`.
4. Si cambias `Code.gs`, crea una **nueva versión** de la implementación.

## 2. GitHub Pages
1. Sube estos archivos a un repositorio (`index.html`, `app.js`, `sw.js`, `manifest.json`, `icon-192.png`, `icon-512.png`). La URL y el token **no** están en el código.
2. Settings → Pages → Deploy from branch → `main` / root.
3. Abre `https://TU-USUARIO.github.io/TU-REPO/` en Safari.

## 3. Instalar en iPhone
Safari → Compartir → **Agregar a pantalla de inicio**. Abre la app → Ajustes → pega la URL `/exec` (y el token) → Guardar y sincronizar.
Abre la app una vez con internet para que quede disponible sin conexión.
