/**
 * Identidad visual de las animaciones. **Ningún componente escribe un color en
 * hexadecimal ni un tamaño en píxeles sueltos**: todo sale de acá, para que el día que
 * la identidad cambie, cambie en un archivo.
 *
 * Los colores salen de `styles/tokens.css` del sitio, para que una animación puesta
 * dentro de una página de FísicaEterna no se vea como un cuerpo extraño.
 */
export const COLOR = {
  fondo: '#0B0F14',
  fondoAlto: '#141C26',
  texto: '#F2F4F3',
  textoTenue: '#8B98A5',
  linea: '#1E2A36',
  // Acentos del sitio.
  verde: '#6FCF97',
  celeste: '#79ADE4',
  dorado: '#E3AC4E',
  rojo: '#C4553F',
} as const;

export const LIENZO = { ancho: 1920, alto: 1080, fps: 30 } as const;

export { FUENTE } from './fuentes';

/** Escala pensada para leerse en un teléfono con el video a 1080p. */
export const TAM = {
  titulazo: 150,
  titulo: 96,
  subtitulo: 64,
  destacado: 52,
  cuerpo: 40,
  etiqueta: 32,
  pie: 26,
} as const;

export const FONDO_DEGRADADO =
  `radial-gradient(120% 100% at 50% 0%, ${COLOR.fondoAlto} 0%, ${COLOR.fondo} 62%)`;
