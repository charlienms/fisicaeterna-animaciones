#!/usr/bin/env bash
# Renderiza las composiciones nuevas y las deja listas para el sitio.
#
# Dos pasos por pieza, y el segundo NO es opcional: Remotion entrega el video en rango
# COMPLETO (`yuvj420p`, `color_range=pc`) y Safari lava esos colores. Ver el README.
set -u
SALIDA=salida
mkdir -p "$SALIDA"
fallos=0

for par in "$@"; do
  id="${par%%:*}"; archivo="${par##*:}"
  echo "→ $id"
  if ! npx remotion render "$id" "$SALIDA/$archivo.raw.mp4" --log=error; then
    echo "   FALLO el render de $id"; fallos=$((fallos+1)); continue
  fi
  # El filtro `scale` es lo que CONVIERTE el rango; los `x264opts` solo lo ETIQUETAN.
  # Con el tageo solo, el archivo sale `yuvj420p,pc` con etiqueta bt709 —o sea, mintiendo
  # sobre su propio rango— y Safari lo lava igual. Hacen falta los dos.
  ffmpeg -y -i "$SALIDA/$archivo.raw.mp4" -vf "scale=in_range=pc:out_range=tv" \
    -c:v libx264 -crf 20 -preset slow \
    -pix_fmt yuv420p -x264opts "colorprim=bt709:transfer=bt709:colormatrix=bt709" \
    -movflags +faststart -an "$SALIDA/$archivo.mp4" -loglevel error \
    && rm -f "$SALIDA/$archivo.raw.mp4" \
    || { echo "   FALLO la conversion de $id"; fallos=$((fallos+1)); }
done

echo "--- comprobacion de rango de color ---"
for par in "$@"; do
  archivo="${par##*:}"
  if [ -f "$SALIDA/$archivo.mp4" ]; then
    printf '%-20s %s\n' "$archivo" "$(ffprobe -v error -select_streams v:0 \
      -show_entries stream=pix_fmt,color_range,color_primaries -of csv=p=0 "$SALIDA/$archivo.mp4")"
  else
    printf '%-20s FALTA\n' "$archivo"; fallos=$((fallos+1))
  fi
done
echo "fallos: $fallos"
