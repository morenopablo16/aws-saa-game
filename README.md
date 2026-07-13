# 🎮 AWS Architect: Training Grounds

Modo juego para practicar el examen **SAA-C03** sobre el banco de 623 preguntas existente.
El quiz clásico ([quiz.html](quiz.html)) sigue funcionando igual que siempre; el juego vive en [game.html](game.html).

## Cómo ejecutar

Es 100% estático y offline. Dos opciones:

```powershell
# Opción A: abrir directamente
start game.html

# Opción B: servidor local (recomendado)
npx -y http-server -p 8123 -c-1 .
# → http://localhost:8123/game.html
```

## Validaciones

```powershell
node game-selftest.js   # 33 comprobaciones de la lógica del juego
```

## El loop de juego

1. **Entras** → el dashboard te muestra 3 misiones diarias (deterministas por fecha) y tu racha de días.
2. **Juegas una ronda** → cada respuesta da XP (más si es rápida, difícil o llevas racha). Fallar da 2 XP simbólicos y nunca resta.
3. **Desbloqueas** → cofre cada 10 respuestas (monedas, XP o XP doble), level-ups, rangos y jefes por servicio.
4. **Ves progreso** → resumen de sesión, barra de XP, dominio por categoría, áreas débiles marcadas en rojo.
5. **Las falladas vuelven** → repetición espaciada (cajas Leitner: 10 min → 1 → 3 → 7 → 14 días) en el modo Repaso.
6. **"Solo una ronda más"** → misión a medias + racha diaria + jefe pendiente.

## Modos

| Modo | Qué es |
|---|---|
| ⚡ Ronda rápida | 10 preguntas adaptativas: prioriza repasos pendientes, no vistas y categorías con <70% de acierto |
| 🗺️ Campaña | 10 preguntas de un servicio concreto (EC2, S3, VPC, IAM…), detectado automáticamente por palabras clave |
| ⚔️ Boss battle | 5 preguntas difíciles de un servicio; 4/5 para vencer (+150 XP, +40 🪙, corona permanente) |
| 📖 En orden | Recorre el pool activo secuencialmente desde el nº que elijas (por defecto, la primera no vista); ideal para completar packs sin repetir |
| ❤️ Supervivencia | 3 vidas, cada fallo cuesta una |
| 🔁 Repaso | Falladas + marcadas (★) + repasos programados que tocan hoy |

**Rangos:** Cloud Intern (1) → Junior Architect (5) → Solutions Architect (10) → Principal Architect (18) → AWS Legend (30).

**Teclado:** `A`–`E` marcan opciones, `Enter` responde/avanza.

## Arquitectura

| Archivo | Rol |
|---|---|
| `game-core.js` | Lógica pura sin DOM: XP, niveles, categorización, misiones, Leitner, selección de preguntas. Testeable con Node. |
| `game.js` | Capa de UI: vistas, sesión, overlays, persistencia. |
| `game.html` / `game.css` | Estructura y estética (HUD, combo "heat", barra segmentada). |
| `game-selftest.js` | Validaciones ejecutables (`node game-selftest.js`). |

### Persistencia

- Todo el estado del juego vive en `localStorage` bajo `aws_saa_game_v1` (con campo `v` para futuras migraciones).
- **Migración**: al primer arranque importa las claves del quiz clásico (`aws_saa_seen_ids_v1`, `aws_saa_wrong_ids_v1`) sin borrarlas.
- **Sincronización**: cada respuesta en el juego actualiza también las claves clásicas, así ambos modos comparten vistas/falladas.
- **Reinicio**: botón "Reiniciar" en el HUD (solo borra el juego, no el historial clásico).

### Datos

No se modificó `quiz-data-all.js`. Las preguntas ya traen `explanation` y se muestra tras cada respuesta; si falta, la UI indica dónde añadirla (campo `explanation` de la pregunta).

## Jugar desde el móvil

La app está publicada como sitio estático en GitHub Pages (ver pasos abajo si hay que republicar).
El progreso es **por dispositivo** (localStorage): el móvil y el PC tienen cada uno su personaje.
Para moverlo, usa los botones **⬇ Exportar / ⬆ Importar** del HUD (genera/lee un JSON).

Publicación (una vez):

```powershell
# 1) Crear repo público "aws-saa-game" en https://github.com/new (sin README)
git remote add origin https://github.com/<TU_USUARIO>/aws-saa-game.git
git push -u origin main
# 2) En GitHub: Settings → Pages → Source: Deploy from a branch → main / (root)
# 3) URL final: https://morenopablo16.github.io/aws-saa-game/
```

Actualizar tras cambios locales: `git add -A; git commit -m "update"; git push`.
Nota: el PDF del libro está en `.gitignore` a propósito (copyright); no se publica.

## Mejoras futuras recomendadas

1. **Explicaciones enriquecidas**: muchas explicaciones son solo la respuesta repetida; un pase con IA sobre `quiz-data-all.js` para redactar el *porqué* real daría mucho valor.
2. **Jefe final**: mini-examen de 25 preguntas difíciles mixtas desbloqueado al vencer N jefes de categoría.
3. **Tienda de monedas**: gastar 🪙 en "pistas" (descartar una opción), "congelar racha" o skins del HUD.
4. **Gráfica de historial**: `state.history` ya guarda las últimas 100 sesiones; falta pintarla (sparkline de precisión/XP por día).
5. **Export/import de progreso**: botón para descargar/cargar el JSON del estado (útil al cambiar de navegador, ya que OneDrive no sincroniza localStorage).
6. **Dificultad adaptativa más fina**: usar la tasa de fallo global por pregunta para calibrar `isHard` en vez de heurísticas.
7. **Sonido opcional**: un "ding" sutil en aciertos/level-up (Web Audio, sin dependencias).
