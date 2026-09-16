import { TAM } from '../theme';

/**
 * Títulos que no se salen del cuadro.
 *
 * A 96 px en una grotesca condensada caben unos 32 caracteres en 1920 px. Los títulos
 * suelen ser frases del guion y pasan de 40. **Nadie lo ve leyendo el código**: se
 * descubre mirando el fotograma.
 */
const CARACTERES_A_96 = 32;

export const tamTitulo = (texto: string, anchoDisponible = 1680): number => {
  const cabenA96 = (CARACTERES_A_96 * anchoDisponible) / 1680;
  if (texto.length <= cabenA96) return TAM.titulo;
  // Nunca baja de `destacado`: si un título llega al piso, la señal es que hay que
  // acortar la frase, no achicar más la letra.
  return Math.max(TAM.destacado, Math.floor((TAM.titulo * cabenA96) / texto.length));
};
