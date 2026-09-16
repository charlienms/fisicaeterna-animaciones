import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from '../comun/Fondo';
import { COLOR, FUENTE, TAM } from '../theme';
import { tamTitulo } from '../utiles/texto';
import { useFrameDeDiseno } from '../utiles/ritmo';

/**
 * SET · `doppler`
 *
 * Por qué la sirena cambia de tono al pasar, aunque la sirena nunca cambió.
 *
 * ## El dibujo ES el cálculo
 *
 * Los frentes de onda **no se dibujan apretados adelante y estirados atrás**. Se emite
 * uno cada `PERIODO_FRAMES` desde donde estaba la fuente en ese instante, y cada uno
 * crece a velocidad constante:
 *
 *     radio(k, t) = c · (t − t_k)      centro = x_fuente(t_k)
 *
 * El apretujamiento aparece solo, porque la fuente alcanza a sus propias ondas. Ése es
 * literalmente el fenómeno, y por eso se calcula en vez de ilustrarse: si los círculos
 * se dibujaran deformados a mano, la pieza podría mostrar una compresión que no
 * corresponde a esa velocidad y nadie lo notaría.
 *
 * ⚠️ **Los centros NO se mueven.** Es el error natural al programar esto: poner todos
 * los círculos centrados en la fuente y agrandarlos. Así no hay efecto Doppler — se ve
 * una diana que sigue al vehículo. La onda, una vez emitida, se olvida de quién la
 * emitió; el centro se congela en el punto de emisión.
 *
 * Las dos frecuencias que se leen abajo salen de la misma velocidad, con la relación
 * exacta, no de dos números escritos a mano.
 *
 * ## ⚠️ Por qué un auto de carrera y no una ambulancia
 *
 * La primera versión usaba una ambulancia a 30 m/s. Es el ejemplo que todo el mundo
 * reconoce y **la animación no servía**: con v/c = 0,09 los frentes salen casi
 * concéntricos y no se ve nada de lo que la pieza viene a mostrar. Físicamente correcto
 * e inútil — se descubrió mirando el fotograma, no el código.
 *
 * A 90 m/s (v/c = 0,26) el apretujamiento es evidente **y las cifras siguen siendo
 * ciertas**: 554 Hz por detrás y 949 por delante. La otra salida era dibujar una
 * ambulancia con la velocidad exagerada, y eso habría hecho que el dibujo dijera una
 * velocidad y los números otra. La ambulancia se queda donde corresponde: en el texto de
 * la página, que es donde se explica que el efecto crece con v/c.
 */
export type PropsDoppler = {
  fondo: boolean;
  titulo: string;
  /** Velocidad del sonido, m/s. */
  velocidadOnda: number;
  /** Velocidad de la fuente, m/s. */
  velocidadFuente: number;
  /** Frecuencia que emite la sirena, Hz. Nunca cambia: ése es el punto. */
  frecuenciaEmitida: number;
  etiquetaEmitida: string;
  etiquetaAdelante: string;
  etiquetaAtras: string;
  rotuloFuente: string;
  notaAlPie: string;
};

export const propsDoppler: PropsDoppler = {
  fondo: true,
  titulo: 'La sirena no cambia. Cambia dónde estás tú',
  velocidadOnda: 343,
  velocidadFuente: 90,
  frecuenciaEmitida: 700,
  etiquetaEmitida: 'Lo que emite',
  etiquetaAdelante: 'Se acerca',
  etiquetaAtras: 'Se aleja',
  rotuloFuente: 'Auto de carrera · 324 km/h',
  notaAlPie: "f' = f · c / (c ∓ v). FísicaEterna, CC BY 4.0",
};

const DISENO = 420;

/** La calle por donde pasa la fuente. */
const CALLE_Y = 560;
const X_INICIO = 300;

/** Velocidad de la onda en píxeles por fotograma de diseño. */
const C_PX = 9;

/** Un frente de onda cada tantos fotogramas. Es el «periodo» de la sirena en pantalla. */
const PERIODO_FRAMES = 18;

/** Los dos oyentes, uno a cada lado de la calle. */
const OYENTE_ADELANTE = { x: 1700, y: CALLE_Y };
const OYENTE_ATRAS = { x: 220, y: CALLE_Y };

export const Doppler: React.FC<PropsDoppler> = ({
  fondo,
  titulo,
  velocidadOnda,
  velocidadFuente,
  frecuenciaEmitida,
  etiquetaEmitida,
  etiquetaAdelante,
  etiquetaAtras,
  rotuloFuente,
  notaAlPie,
}) => {
  const { durationInFrames } = useVideoConfig();
  const f = useFrameDeDiseno(DISENO, useCurrentFrame(), durationInFrames);

  // ── La física ─────────────────────────────────────────────────────────────
  // Relación exacta de Doppler para fuente en movimiento y observador quieto.
  // Adelante el denominador se achica (tono más alto); atrás crece (más grave).
  const fAdelante = (frecuenciaEmitida * velocidadOnda) / (velocidadOnda - velocidadFuente);
  const fAtras = (frecuenciaEmitida * velocidadOnda) / (velocidadOnda + velocidadFuente);

  /*
   * La velocidad de la fuente EN PANTALLA se deriva de la razón real v/c, no se elige.
   * Así la compresión que se ve corresponde a la velocidad del rótulo: si se eligiera un
   * número cómodo, el dibujo diría una velocidad y las cifras de abajo otra.
   */
  const vPx = C_PX * (velocidadFuente / velocidadOnda);

  const xFuente = (t: number) => X_INICIO + vPx * t;
  const xAhora = xFuente(f);

  // ── Los frentes de onda ───────────────────────────────────────────────────
  // Cada uno recuerda DÓNDE fue emitido. El centro no vuelve a moverse nunca.
  const frentes: { cx: number; r: number; edad: number }[] = [];
  for (let k = 0; k * PERIODO_FRAMES <= f; k++) {
    const tEmision = k * PERIODO_FRAMES;
    const r = C_PX * (f - tEmision);
    if (r <= 0 || r > 1500) continue;
    frentes.push({ cx: xFuente(tEmision), r, edad: f - tEmision });
  }

  const aparece = interpolate(f, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  // Los oyentes entran cuando ya hay ondas que llegarles.
  const muestraOyentes = interpolate(f, [90, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cifra = (v: number) => Math.round(v).toLocaleString('es-CL');

  return (
    <Fondo fondo={fondo}>
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <defs>
            {/* Las ondas se recortan al cuadro: sin esto, los círculos viejos siguen
                creciendo por fuera y el navegador dibuja arcos gigantes que no aportan. */}
            <clipPath id="cuadro">
              <rect x={80} y={210} width={1760} height={640} />
            </clipPath>
          </defs>

          <text
            x={100}
            y={120}
            fill={COLOR.texto}
            fontFamily={FUENTE.titular}
            fontSize={tamTitulo(titulo, 1720)}
            opacity={aparece}
          >
            {titulo}
          </text>

          <g clipPath="url(#cuadro)" opacity={aparece}>
            {/* La calle */}
            <line
              x1={120}
              y1={CALLE_Y}
              x2={1800}
              y2={CALLE_Y}
              stroke={COLOR.linea}
              strokeWidth={2}
              strokeDasharray="14 12"
            />

            {/* Los frentes. El color dice de qué lado se apretaron. */}
            {frentes.map((o, i) => (
              <circle
                key={i}
                cx={o.cx}
                cy={CALLE_Y}
                r={o.r}
                fill="none"
                stroke={COLOR.celeste}
                strokeWidth={2.5}
                opacity={Math.max(0.12, 1 - o.edad / 260)}
              />
            ))}

            {/* El punto de emisión de cada onda, para que se vea que quedan atrás */}
            {frentes.map((o, i) => (
              <circle key={`c-${i}`} cx={o.cx} cy={CALLE_Y} r={2.5} fill={COLOR.linea} />
            ))}

            {/* La fuente */}
            <circle cx={xAhora} cy={CALLE_Y} r={15} fill={COLOR.dorado} />
            <text
              x={xAhora}
              y={CALLE_Y - 34}
              textAnchor="middle"
              fill={COLOR.dorado}
              fontFamily={FUENTE.texto}
              fontSize={TAM.pie}
            >
              {rotuloFuente}
            </text>
          </g>

          {/* ══ Los dos oyentes ══ */}
          <g opacity={muestraOyentes}>
            {[
              { p: OYENTE_ADELANTE, color: COLOR.verde, txt: etiquetaAdelante, anchor: 'end' as const, dx: -30 },
              { p: OYENTE_ATRAS, color: COLOR.rojo, txt: etiquetaAtras, anchor: 'start' as const, dx: 30 },
            ].map((o) => (
              <g key={o.txt}>
                <circle cx={o.p.x} cy={o.p.y} r={13} fill={o.color} />
                <text
                  x={o.p.x + o.dx}
                  y={o.p.y - 30}
                  textAnchor={o.anchor}
                  fill={o.color}
                  fontFamily={FUENTE.subtitular}
                  fontSize={TAM.etiqueta}
                >
                  {o.txt}
                </text>
              </g>
            ))}
          </g>

          {/* ══ Las tres frecuencias ══
              La del medio es la que emite la sirena y no se mueve nunca: es la
              referencia contra la que se leen las otras dos. */}
          <g opacity={aparece} fontFamily={FUENTE.texto}>
            {[
              { x: 300, label: etiquetaAtras, valor: fAtras, color: COLOR.rojo },
              { x: 880, label: etiquetaEmitida, valor: frecuenciaEmitida, color: COLOR.textoTenue },
              { x: 1460, label: etiquetaAdelante, valor: fAdelante, color: COLOR.verde },
            ].map((c) => (
              <g key={c.label}>
                <text x={c.x} y={910} textAnchor="middle" fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
                  {c.label}
                </text>
                <text x={c.x} y={980} textAnchor="middle" fill={c.color} fontSize={TAM.subtitulo}>
                  {cifra(c.valor)} Hz
                </text>
              </g>
            ))}
          </g>

          <text
            x={100}
            y={1046}
            fill={COLOR.textoTenue}
            fontFamily={FUENTE.formula}
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
