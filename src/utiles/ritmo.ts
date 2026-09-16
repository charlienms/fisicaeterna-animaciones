/**
 * La duración de una toma no se elige a ojo: la manda el texto que se dice encima.
 * Con una cadencia medida de narración (2,7 palabras/segundo ≈ 162 palabras/min), la
 * duración sale de contar palabras.
 */
export const PALABRAS_POR_SEGUNDO = 2.7;

export const contarPalabras = (texto: string): number => {
  const m = texto.match(/[\wÁÉÍÓÚÜÑáéíóúüñ'’-]+/g);
  return m ? m.length : 0;
};

export const segundosDeTexto = (t: string): number => contarPalabras(t) / PALABRAS_POR_SEGUNDO;
export const framesDeTexto = (t: string, fps = 30): number =>
  Math.round(segundosDeTexto(t) * fps);

/** Duración de una composición cuyos segundos ya vienen dados. `cola` deja dónde cortar. */
export const framesDeSegundos = (segundos: number, fps = 30, colaFrames = 24): number =>
  Math.ceil(segundos * fps) + colaFrames;

/**
 * Reescala el tiempo real del clip al tiempo para el que se escribió la animación.
 *
 * Las piezas se escriben con fotogramas absolutos (`interpolate(f, [24, 190], …)`), o sea
 * suponiendo un clip de ~200 frames. Pero la duración real sale de la narración y puede
 * ir de 90 a 2.200. De ahí salen dos fallos que ni `tsc`, ni el lint, ni un still
 * detectan:
 *
 * - **Truncado** — el clip termina antes que la animación: el remate no se ve nunca.
 * - **Congelado** — la animación termina mucho antes que el clip: la imagen se queda
 *   quieta mientras el video sigue corriendo.
 *
 * Con esto la pieza se sigue escribiendo para su «tiempo de diseño» y ocupa el clip
 * entero, dure lo que dure.
 */
export const useFrameDeDiseno = (
  diseno: number,
  frameActual: number,
  duracionClip: number,
  cola = 24
): number => {
  const util = Math.max(1, duracionClip - cola);
  return (frameActual * diseno) / util;
};

/** Fotograma en que entra cada línea, estirando el conjunto para llenar el clip. */
export const entradasEnClip = (
  textos: string[],
  duracionClip: number,
  desde = 12,
  fps = 30,
  cola = 24,
  minimo = 14
): number[] => {
  if (textos.length === 0) return [];
  const pesos = textos.map((t) => Math.max(minimo, framesDeTexto(t, fps)));
  const suma = pesos.reduce((a, b) => a + b, 0);
  const k = Math.max(1, duracionClip - cola - desde) / suma;
  const salida: number[] = [];
  let t = desde;
  for (const w of pesos) {
    salida.push(Math.round(t));
    t += w * k;
  }
  return salida;
};
