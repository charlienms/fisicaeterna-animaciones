# animaciones — las piezas de `/conceptos`

Proyecto de **Remotion** que genera las animaciones de la sección
[`/conceptos`](https://www.fisicaeterna.cl/conceptos). Es un proyecto **aparte** del
sitio: su propio `package.json`, su propio `tsconfig.json` y sus propias dependencias.

> ⚠️ Está **excluido del `tsconfig.json` del sitio** a propósito. En Vercel solo se
> instalan las dependencias de la raíz, así que `animaciones/node_modules` no existe
> ahí: sin esa exclusión, el `tsc -b` del sitio no encontraría `remotion` y **el
> despliegue fallaría**, aunque en local pase.

El código está acá y no en un repositorio privado porque **se publica**: cada concepto
enlaza a su archivo fuente, y eso es justamente lo que convierte la sección en un aporte
y no en un portafolio (ROADMAP §3).

## Los dos comandos que se usan a diario

```bash
npm run dev
```

Abre Remotion Studio, donde se ve la pieza mientras se escribe.

```bash
npm run lint
```

Corre `tsc`. **Nunca renderizar sin que pase.**

## Estructura

```
src/
  theme.ts            ← paleta, tamaños, lienzo. Única fuente de identidad
  fuentes.ts          ← carga de tipografías. Único archivo que las nombra
  Root.tsx            ← registro de composiciones (lo que aparece en el Studio)
  comun/Fondo.tsx     ← degradado del sitio / transparencia
  set/                ← piezas PARAMETRIZADAS, reutilizables entre conceptos
  utiles/
    ritmo.ts          ← duración de cada toma derivada de la narración
    texto.ts          ← tamaño de título que no se desborda
```

La regla que decide si una pieza está en `set/`: **otro concepto la pudo configurar sin
tocar el componente.** No basta con guardarla ahí.

## Un concepto, dos idiomas, UNA fuente

`C01-Torque` y `C01-Torque-EN` son la **misma composición** con props distintas, no dos
archivos. Si se duplicara el componente, cada arreglo habría que hacerlo dos veces y una
de las dos se olvidaría. El idioma es un parámetro.

## Render

```bash
npx remotion render C01-Torque salida/torque-es.mp4 --log=error
```

Transparente, para superponer en el editor (con `fondo: false`):

```bash
npx remotion render C01-Torque salida/torque.mov --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le --concurrency=1 --log=error
```

> ⚠️ Las cuatro banderas del transparente son necesarias. Con solo `--codec` y
> `--prores-profile` el alfa se pierde: hace falta `--image-format=png` (jpeg no tiene
> canal alfa) y `--pixel-format=yuva444p10le`.

### Después del render, SIEMPRE: pasar el video a rango TV

Remotion entrega `yuvj420p` con `color_range=pc` (rango completo). **Safari lava esos
colores.** Es la misma lección que ya costó un rediseño en `/studio` (CLAUDE.md §11):

```bash
ffmpeg -y -i entrada.mp4 -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p \
  -x264opts "colorprim=bt709:transfer=bt709:colormatrix=bt709" \
  -movflags +faststart -an salida.mp4
```

Se comprueba con:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,color_range,color_primaries -of csv=p=0 salida.mp4
```

Tiene que decir `yuv420p,tv,bt709`. Si dice `yuvj420p` o `pc`, no está listo.

El archivo final va a `public/conceptos/` del sitio, junto con una carátula:

```bash
ffmpeg -y -i torque-es.mp4 -ss 2 -frames:v 1 -vf "scale=1280:-1" -q:v 3 torque-es.jpg
```

## Las reglas que salieron de renders que compilaban y salían mal

1. **Mirar el fotograma antes de lanzar la tanda.** Compilar y pasar el lint no dice nada
   sobre lo que se ve:
   ```bash
   npx remotion still C01-Torque _check/torque.png --frame=90
   ```
2. **Usar el `fontFamily` que devuelve `loadFont()`, nunca el nombre a mano.** Escribir
   `fontFamily: 'Anton'` compila igual y renderiza todo en la serif por defecto.
3. **Toda cifra con símbolo va en `FUENTE.texto`**, y las fórmulas en `FUENTE.formula`.
   Una grotesca condensada no tiene `±`, `μ`, `≈`: el navegador sustituye el glifo y el
   `±` puede salir como `÷`, que dice otra cosa. Es un error de rigor, no de estética.
4. **Escribir contra un «tiempo de diseño» y reescalarlo** con `useFrameDeDiseno`. Si no,
   la animación sale truncada (el clip termina antes y el remate no se ve nunca) o
   congelada (la imagen se queda quieta mientras el video sigue).
5. **La pieza calcula, no recibe el resultado.** Si muestra torque, recibe la fuerza y la
   geometría y calcula `r·F·sen θ`. Los números en pantalla son el resultado del cálculo,
   no un texto puesto al lado. Si el dibujo miente, el número miente con él y se nota.
6. **Ningún color ni tamaño fuera de `COLOR` / `TAM`.**
7. **Los ejes con zoom se declaran en la nota al pie.** Recortar un eje para que algo se
   lea es práctica estándar; no decirlo, no.

## Checklist antes de dar una pieza por lista

- [ ] `npm run lint` pasa.
- [ ] Se miró **un still**, no solo el código.
- [ ] Ningún texto se sale del cuadro (títulos por `tamTitulo`).
- [ ] Ninguna fuente nombrada a mano.
- [ ] La animación termina cuando termina el clip: ni truncada ni congelada.
- [ ] Los números en pantalla son resultado del cálculo.
- [ ] El video final es `yuv420p,tv,bt709`.
- [ ] Si va a `set/`: otro concepto la podría configurar sin tocar el componente.

## Licencia

El código de este directorio y las animaciones que produce se publican bajo
**[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es)**. Atribución:
FísicaEterna (fisicaeterna.cl).
