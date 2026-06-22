# Juego de Arkanoid

Juego de Arkanoid en HTML, CSS y JavaScript puro, sin dependencias. Corre completamente en el navegador.

## Cómo ejecutar

Abrir `index.html` con un servidor estático local para evitar restricciones CORS:

```bash
npx serve .
```

O usar la extensión **Live Server** de VS Code.

## Controles

| Tecla / acción | Efecto |
|----------------|--------|
| ← → / ratón | Mover la paleta |
| P | Pausar / reanudar |
| M | Silenciar / activar sonido |

## Características

- 10 niveles de dificultad creciente con layouts aleatorios
- Animaciones de explosión al romper bloques
- Sonidos de rebote y ruptura
- Pausa con selección de nivel mediante `<select>` HTML
- Canvas fijo 800×600, rendering con sprites
