# Proyecto HTML5 - Demo Canvas

Pequeño proyecto de ejemplo con un canvas y animación de bolas.

Requisitos: Node.js + npm (para usar la utilidad de desarrollo). También puedes abrir `index.html` directamente en un navegador para ver la demo.

Cómo ejecutar (PowerShell):

1. Abrir PowerShell en el directorio del proyecto:

   cd "c:\Users\JavierArmestoGonzále\Documents\BCSummit25\SummitRetroGame\proyecto html5"

2. Instalar dependencias (requiere Node.js y npm):

   npm install

3. Iniciar servidor de desarrollo (usa live-server):

   npm start

Usar la tarea de VS Code (opcional):

- Abrir la paleta de comandos (Ctrl+Shift+P) -> "Tasks: Run Task" -> seleccionar "npm: start".

Try it (PowerShell):

```powershell
cd "c:\Users\JavierArmestoGonzále\Documents\BCSummit25\SummitRetroGame\proyecto html5"
npm install
npm start
```

Contenido:
- `index.html` — Página principal
- `css/styles.css` — Estilos
- `js/main.js` — Lógica de animación
- `assets/` — Carpeta para imágenes y otros activos

Notas:
- Se incluyó un `favicon.ico` mínimo para evitar 404 en el servidor de desarrollo.
- La demo añade una bola al hacer clic en el canvas.

Licencia: MIT
