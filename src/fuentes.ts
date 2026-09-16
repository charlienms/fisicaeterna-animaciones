import { loadFont as cargarAnton } from '@remotion/google-fonts/Anton';
import { loadFont as cargarBarlow } from '@remotion/google-fonts/Barlow';
import { loadFont as cargarBarlowCondensed } from '@remotion/google-fonts/BarlowCondensed';
import { loadFont as cargarSTIX } from '@remotion/google-fonts/STIXTwoText';

/**
 * Carga de tipografías. Es el único archivo que las nombra, y evita tres errores que
 * cuestan un render entero:
 *
 * 1. **Usar el `fontFamily` que devuelve `loadFont()`, nunca el nombre a mano.**
 *    Escribir `fontFamily: 'Anton'` compila igual y renderiza todo en la serif por
 *    defecto. Solo se ve mirando el fotograma.
 * 2. **Una grotesca condensada no tiene `±`, `μ`, `≈`, `≤`.** El navegador sustituye el
 *    glifo y el `±` puede salir como `÷`, que dice otra cosa. Toda cifra con símbolo va
 *    en `FUENTE.texto`. Es un error de rigor, no de estética.
 * 3. **El griego no está en el subconjunto `latin`.** Escribir `τ` o `θ` en Barlow sale
 *    con cuadraditos, o con una serif distinta en cada máquina. Para eso existe
 *    `FUENTE.formula`, que se usa SOLO para fórmulas.
 *
 * Se declaran solo los pesos y subconjuntos que se usan: sin eso, cada render hace
 * cientos de peticiones para traer variantes que nunca se dibujan.
 */
const anton = cargarAnton('normal', { weights: ['400'], subsets: ['latin'] });
const barlow = cargarBarlow('normal', { weights: ['400', '600'], subsets: ['latin'] });
const barlowCondensed = cargarBarlowCondensed('normal', {
  weights: ['400', '600'],
  subsets: ['latin'],
});
// Griego y operadores matemáticos: Anton y Barlow NO los traen.
const stix = cargarSTIX('normal', { weights: ['400', '600'], subsets: ['latin', 'greek'] });

export const FUENTE = {
  titular: anton.fontFamily,
  subtitular: barlowCondensed.fontFamily,
  texto: barlow.fontFamily,
  formula: stix.fontFamily,
} as const;

export const esperarFuentes = async (): Promise<void> => {
  await Promise.all([
    anton.waitUntilDone(),
    barlow.waitUntilDone(),
    barlowCondensed.waitUntilDone(),
    stix.waitUntilDone(),
  ]);
};
