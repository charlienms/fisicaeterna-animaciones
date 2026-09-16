import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from '../comun/Fondo';
import { COLOR, FUENTE, TAM } from '../theme';
import { tamTitulo } from '../utiles/texto';
import { useFrameDeDiseno } from '../utiles/ritmo';

/**
 * SET · `aliasing`
 *
 * De dónde sale una frecuencia que nadie tocó.
 *
 * Una señal de frecuencia fija, muestreada cada vez más lento. Mientras el muestreo va
 * sobrado, los puntos reconstruyen la onda. Cuando baja del doble de la frecuencia —el
 * límite de Nyquist— **los mismos puntos empiezan a describir una onda distinta y más
 * lenta, que no existe en la señal original**. Eso es el aliasing, y es la razón de que
 * el audio se digitalice a 44.100 Hz y de que las ruedas giren al revés en los videos.
 *
 * ⚠️ **La onda falsa NO está dibujada a mano: se calcula.** `frecuenciaAlias` sale de
 * plegar la frecuencia real contra la de muestreo, y la curva naranja se dibuja con esa
 * frecuencia. Por eso la curva pasa por los puntos: si no pasara, el cálculo estaría
 * mal y se vería. Dibujar «una onda más lenta» a ojo habría quedado igual de bonito y
 * no habría demostrado nada.
 *
 * El barrido va de rápido a lento y no al revés a propósito: el espectador ve primero
 * el caso que funciona, y así el momento en que se rompe tiene con qué compararse.
 */
export type PropsAliasing = {
  fondo: boolean;
  titulo: string;
  /** Frecuencia de la señal real, en hercios. Constante: ese es el punto. */
  frecuenciaHz: number;
  /** Frecuencia de muestreo al empezar y al terminar, en hercios. */
  muestreoInicialHz: number;
  muestreoFinalHz: number;
  etiquetaSenal: string;
  etiquetaMuestreo: string;
  etiquetaAlias: string;
  avisoNyquist: string;
  textoSeguro: string;
  textoRoto: string;
  notaAlPie: string;
};

export const propsAliasing: PropsAliasing = {
  fondo: true,
  titulo: 'La frecuencia que nadie tocó',
  frecuenciaHz: 10,
  muestreoInicialHz: 46,
  muestreoFinalHz: 11,
  etiquetaSenal: 'Señal real',
  etiquetaMuestreo: 'Muestreo',
  etiquetaAlias: 'Lo que se reconstruye',
  avisoNyquist: 'Límite de Nyquist: 2 × 10 Hz = 20 Hz',
  textoSeguro: 'Con muestreo de sobra, los puntos describen la onda real.',
  textoRoto: 'Bajo el límite, los mismos puntos describen otra onda. Más lenta. Falsa.',
  notaAlPie: 'Por esto el audio se digitaliza a 44.100 Hz. FísicaEterna, CC BY 4.0',
};

const DISENO = 360;

/** Caja del gráfico. */
const G = { x: 170, y: 330, ancho: 1580, alto: 380 };
/** Segundos de señal que se muestran de lado a lado. */
const VENTANA_S = 0.6;

export const Aliasing: React.FC<PropsAliasing> = ({
  fondo,
  titulo,
  frecuenciaHz,
  muestreoInicialHz,
  muestreoFinalHz,
  etiquetaSenal,
  etiquetaMuestreo,
  etiquetaAlias,
  avisoNyquist,
  textoSeguro,
  textoRoto,
  notaAlPie,
}) => {
  const { durationInFrames } = useVideoConfig();
  const f = useFrameDeDiseno(DISENO, useCurrentFrame(), durationInFrames);

  // ── El barrido del muestreo ───────────────────────────────────────────────
  const fs = interpolate(f, [50, 300], [muestreoInicialHz, muestreoFinalHz], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── La física ─────────────────────────────────────────────────────────────
  const nyquist = 2 * frecuenciaHz;
  const rompe = fs < nyquist;

  /*
   * La frecuencia aparente. Muestrear a `fs` pliega el eje de frecuencias cada `fs`:
   * lo que se reconstruye es la distancia de `f` al múltiplo de `fs` más cercano.
   *
   *     f_alias = | f − round(f / fs) · fs |
   *
   * Por encima de Nyquist `round(f/fs)` es 0 y el resultado es la propia `f`: la misma
   * fórmula cubre los dos casos, sin un `if` que decida qué dibujar. Eso importa: el
   * momento en que la curva se despega de la real sale del cálculo, no de un umbral
   * escrito a mano.
   */
  const aliasConSigno = frecuenciaHz - Math.round(frecuenciaHz / fs) * fs;
  const frecuenciaAlias = Math.abs(aliasConSigno);

  // ── Dibujo ────────────────────────────────────────────────────────────────
  const y0 = G.y + G.alto / 2;
  const amplitud = G.alto / 2 - 24;
  const aX = (t: number) => G.x + (t / VENTANA_S) * G.ancho;
  const aY = (v: number) => y0 - v * amplitud;

  const curva = (hz: number, pasos = 700) =>
    Array.from({ length: pasos + 1 }, (_, i) => {
      const t = (i / pasos) * VENTANA_S;
      return `${i === 0 ? 'M' : 'L'} ${aX(t).toFixed(1)} ${aY(Math.sin(2 * Math.PI * hz * t)).toFixed(1)}`;
    }).join(' ');

  // Las muestras: donde el reloj del conversor mira la señal.
  const muestras = Array.from(
    { length: Math.floor(VENTANA_S * fs) + 1 },
    (_, i) => {
      const t = i / fs;
      return { t, v: Math.sin(2 * Math.PI * frecuenciaHz * t) };
    }
  ).filter((m) => m.t <= VENTANA_S);

  const aparece = interpolate(f, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const muestraAlias = rompe ? 1 : 0;

  const cifra = (v: number, dec = 0) => v.toFixed(dec).replace('.', ',');

  return (
    <Fondo fondo={fondo}>
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <text
            x={170}
            y={140}
            fill={COLOR.texto}
            fontFamily={FUENTE.titular}
            fontSize={tamTitulo(titulo, 1580)}
            opacity={aparece}
          >
            {titulo}
          </text>

          {/* Eje */}
          <line x1={G.x} y1={y0} x2={G.x + G.ancho} y2={y0} stroke={COLOR.linea} strokeWidth={2} opacity={aparece} />

          {/* La señal real: siempre la misma, nunca cambia */}
          <path d={curva(frecuenciaHz)} fill="none" stroke={COLOR.celeste} strokeWidth={3} opacity={aparece * 0.85} />

          {/*
            * La onda reconstruida. Se dibuja con `frecuenciaAlias`, que es un cálculo,
            * no una decisión de diseño: por eso pasa por los puntos.
            */}
          {/*
            * Se dibuja con el alias CON SIGNO, no con su módulo. Un alias negativo es una
            * frecuencia reflejada, y reflejar invierte la fase: con el módulo la curva
            * salía especular y NO pasaba por las muestras, que es justo lo único que esta
            * pieza tiene que demostrar.
            */}
          <path
            d={curva(aliasConSigno)}
            fill="none"
            stroke={COLOR.rojo}
            strokeWidth={5}
            opacity={muestraAlias * aparece}
          />

          {/* Las muestras */}
          {muestras.map((m, i) => (
            <circle
              key={i}
              cx={aX(m.t)}
              cy={aY(m.v)}
              r={7}
              fill={COLOR.dorado}
              opacity={aparece}
            />
          ))}

          {/* ══ Cifras ══ */}
          <g opacity={aparece} fontFamily={FUENTE.texto}>
            <text x={170} y={820} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaSenal}
            </text>
            <text x={170} y={880} fill={COLOR.celeste} fontSize={TAM.subtitulo}>
              {cifra(frecuenciaHz)} Hz
            </text>

            <text x={620} y={820} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaMuestreo}
            </text>
            <text x={620} y={880} fill={rompe ? COLOR.rojo : COLOR.dorado} fontSize={TAM.subtitulo}>
              {cifra(fs, 1)} Hz
            </text>

            <g opacity={muestraAlias}>
              <text x={1060} y={820} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
                {etiquetaAlias}
              </text>
              <text x={1060} y={880} fill={COLOR.rojo} fontSize={TAM.subtitulo}>
                {cifra(frecuenciaAlias, 1)} Hz
              </text>
            </g>
          </g>

          {/* El límite, siempre a la vista: es contra lo que hay que comparar */}
          <text
            x={1750}
            y={128}
            textAnchor="end"
            fill={COLOR.textoTenue}
            fontFamily={FUENTE.texto}
            fontSize={TAM.pie}
            opacity={aparece}
          >
            {avisoNyquist}
          </text>
          <text
            x={1750}
            y={196}
            textAnchor="end"
            fill={rompe ? COLOR.rojo : COLOR.verde}
            fontFamily={FUENTE.texto}
            fontSize={TAM.cuerpo}
            opacity={aparece}
          >
            {cifra(fs, 1)} Hz {rompe ? '<' : '>'} {cifra(nyquist)} Hz
          </text>

          {/* La frase cambia cuando cambia el fenómeno, no antes */}
          <text
            x={170}
            y={978}
            fill={rompe ? COLOR.rojo : COLOR.textoTenue}
            fontFamily={FUENTE.texto}
            fontSize={TAM.cuerpo}
            opacity={aparece}
          >
            {rompe ? textoRoto : textoSeguro}
          </text>

          <text
            x={170}
            y={1034}
            fill={COLOR.textoTenue}
            fontFamily={FUENTE.texto}
            fontSize={TAM.pie}
            opacity={aparece}
          >
            {notaAlPie}
          </text>
        </svg>
      </AbsoluteFill>
    </Fondo>
  );
};
