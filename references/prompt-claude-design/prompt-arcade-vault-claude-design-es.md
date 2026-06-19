Crea una aplicación web de portal de juegos arcade retro llamada "ARCADE VAULT" con las siguientes características y dirección visual:

---

### IDIOMA

Todo el texto de la interfaz, etiquetas, botones, navegación, mensajes y contenido de ejemplo debe estar en español. Esto incluye etiquetas de botones ("JUGAR", "VOLVER AL VAULT", "GUARDAR PUNTUACIÓN"), enlaces de navegación ("Biblioteca", "Salón de la Fama"), campos de formulario ("Usuario", "Contraseña", "Correo electrónico"), descripciones de juegos, mensajes de modal ("GAME OVER", "PUNTUACIÓN GUARDADA") y cualquier texto instructivo o descriptivo a lo largo de la aplicación.

---

### ESTÉTICA VISUAL

Tema oscuro de las máquinas recreativas. Fondo negro profundo (#0a0a0f) con colores de acento neón — cian eléctrico (#00f5ff), magenta intenso (#ff006e) y amarillo ácido (#f5ff00). Superposición de textura de píxeles/líneas de escaneo sobre el fondo. Tipografía: una fuente de pantalla en estilo píxel y negrita (como "Press Start 2P" de Google Fonts) para encabezados y títulos de juegos, combinada con una fuente monoespaciada limpia para el cuerpo del texto y elementos de interfaz. Efectos de brillo de monitor CRT en tarjetas y elementos seleccionados. Líneas de cuadrícula animadas en el fondo (cuadrícula de perspectiva sutil, estilo retro-futurista de los años 80).

---

### PÁGINAS Y PANTALLAS

**1. Inicio / Biblioteca de juegos (pantalla principal)**

- Encabezado con el logotipo "ARCADE VAULT" en texto con brillo neón y efecto de parpadeo animado
- Subtítulo: "INSERTA UNA MONEDA PARA JUGAR"
- Cuadrícula de tarjetas de juegos (3–4 columnas en escritorio, 1–2 en móvil), cada tarjeta mostrando:
  - Miniatura / área de ilustración de portada del juego (área de ilustración colorida de estilo retro)
  - Título del juego (p. ej., Arkanoid, Tetris, Snake, Pac-Man, Space Invaders, Asteroids)
  - Descripción corta (1 línea, en español)
  - Botón "JUGAR" con efecto de borde neón al pasar el cursor
  - Insignia de puntuación alta mostrando "MEJOR PUNTUACIÓN"
- Barra de filtro/búsqueda en la parte superior para filtrar juegos por nombre o categoría, texto de marcador en español
- Animaciones suaves al pasar el cursor: las tarjetas se escalan ligeramente, el borde brilla con mayor intensidad

**2. Detalle del juego / Pantalla de lanzamiento**

- Superposición de pantalla completa o página dedicada al seleccionar un juego
- Título grande del juego con brillo neón
- Descripción del juego (2–3 oraciones, en español)
- Panel de clasificación lateral mostrando las 10 mejores puntuaciones (nombre de usuario + puntuación + fecha), etiquetado "MEJORES PUNTUACIONES"
- Botón grande "JUGAR AHORA" (animado, con brillo pulsante)
- Botón "VOLVER AL VAULT"

**3. Pantalla del jugador**

- Diseño limpio sin distracciones
- El juego HTML se renderiza dentro de un contenedor centrado estilizado como el bisel de un monitor CRT (esquinas redondeadas, ligero efecto de curvatura de pantalla con CSS)
- Barra HUD sobre el juego: puntuación actual ("PUNTUACIÓN"), vidas/nivel ("VIDAS" / "NIVEL"), nombre del jugador
- Botones "PAUSA" y "SALIR" en la esquina
- Al terminar el juego: superposición modal con "FIN DEL JUEGO", puntuación final, opción para enviar puntuación ("GUARDAR PUNTUACIÓN") y botones "JUGAR DE NUEVO" / "VOLVER AL VAULT"

**4. Pantalla de autenticación**

- Tarjeta centrada minimalista con el logotipo de ARCADE VAULT
- Alternar entre pestañas "INICIAR SESIÓN" y "CREAR CUENTA"
- Campos: "Usuario", "Contraseña" (y "Correo electrónico" para registro)
- Opción "JUGAR COMO INVITADO" (sin necesidad de cuenta, las puntuaciones no se guardan)
- Botones de inicio de sesión social (Google, GitHub) como opciones secundarias
- Campos de entrada con borde neón y efecto de brillo al enfocar

**5. Página de puntuaciones altas / Salón de la Fama**

- Página completa de clasificación titulada "SALÓN DE LA FAMA"
- Selector de pestañas para cada juego (Arkanoid, Tetris, Snake, etc.)
- Tabla de las 10 mejores puntuaciones globales con columnas: "RANGO", "JUGADOR", "PUNTUACIÓN", "FECHA"
- Los 3 primeros destacados con tratamiento neón dorado/plata/bronce
- La mejor marca personal del usuario actual resaltada si está conectado, etiquetada "TU MEJOR MARCA"
- Entrada animada para las filas (aparición escalonada al cargar)

---

### NAVEGACIÓN

- Barra de navegación fija en la parte superior con: Logotipo (izquierda), enlaces de navegación ("Biblioteca", "Salón de la Fama"), botón de autenticación ("Iniciar Sesión") o avatar del usuario (derecha)
- Móvil: menú hamburguesa con panel deslizante
- Indicador de página activa con subrayado neón

---

### INTERACCIONES Y ANIMACIONES

- Transiciones de página: deslizamiento o fundido rápido
- Hover en tarjeta de juego: elevación + intensificación del borde brillante + ligera rotación (efecto de inclinación 3D)
- Botones: efecto de pulsación estilo píxel al hacer clic (ligera reducción de escala)
- Envío de puntuación: animación de texto estilo máquina de escribir mostrando "PUNTUACIÓN GUARDADA"
- Estados de carga: spinner de píxeles retro o barrido de líneas de escaneo

---

### NOTAS TÉCNICAS

- Aplicación React (o HTML/CSS/JS puro si React no está disponible)
- El área del juego debe ser un iframe en sandbox o contenedor canvas donde se puedan cargar archivos HTML externos de juegos
- Usar localStorage para el seguimiento de puntuaciones de invitados; indicar dónde se conectaría un backend real (API REST o Supabase) para usuarios autenticados
- Totalmente responsivo: móvil, tablet, escritorio
- Usar Google Fonts: "Press Start 2P" + "Courier Prime"
- Todo el contenido de texto a lo largo de la aplicación debe estar en español
