import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from '../comun/Fondo';
import { COLOR, FUENTE, TAM } from '../theme';
import { tamTitulo } from '../utiles/texto';
import { useFrameDeDiseno } from '../utiles/ritmo';

/**
 * SET · `aislamiento`
 *
 * Dos edificios iguales, el mismo terremoto, y uno casi no se entera.
 *
 * ## El dibujo ES el cálculo
 *
 * Los dos edificios **no se animan por separado con amplitudes elegidas a ojo**. Cada
 * uno es el mismo oscilador de un grado de libertad movido por el suelo, y lo que se
 * dibuja sale de la **transmisibilidad**:
 *
 *     T(r, ζ) = √( (1 + (2ζr)²) / ((1 − r²)² + (2ζr)²) )     con r = T_propio / T_suelo
 *
 * Lo único distinto entre los dos es `T_propio`. De ahí sale todo: que el empotrado
 * amplifique ~8 veces el movimiento del suelo y el aislado lo reduzca a ~1/20. Si
 * alguien cambia los periodos, los dibujos cambian solos y el argumento se sostiene o
 * se cae por su cuenta.
 *
 * ## Lo que hay que entender, y es contraintuitivo
 *
 * **Aislar NO es hacer el edificio más fuerte: es hacerlo más LENTO.** Los aisladores lo
 * ablandan a propósito, y con eso su periodo propio se aleja del periodo donde el
 * terremoto tiene su energía. La estructura deja de estar en sintonía con el suelo.
 *
 * Por eso la pieza es hermana de `Resonancia.tsx`: es la misma física —qué pasa cuando
 * el ritmo que llega coincide con el ritmo propio— vista desde el otro lado, el de
 * quien tiene que evitarlo.
 *
 * ⚠️ **El desplazamiento del aislador se ve, y tiene que verse.** La gente imagina que
 * un edificio aislado no se mueve; lo que no se mueve es la parte de arriba. Abajo, la
 * capa de aisladores se deforma decenas de centímetros, y ése es justamente el trabajo
 * que está haciendo. Esconderlo contaría la mitad de la historia.
 */
export type PropsAislamiento = {
  fondo: boolean;
  titulo: string;
  /** Periodo donde el terremoto concentra su energía, en segundos. */
  periodoSuelo: number;
  /** Periodo propio del edificio empotrado. Cerca del del suelo: ahí está el problema. */
  periodoEmpotrado: number;
  /** Periodo propio del edificio aislado. Lejos: ahí está la solución. */
  periodoAislado: number;
  /** Amortiguamiento, adimensional. */
  amortiguamiento: number;
  rotuloEmpotrado: string;
  rotuloAislado: string;
  etiquetaPeriodo: string;
  etiquetaAmplifica: string;
  etiquetaSuelo: string;
  etiquetaAislador: string;
  notaAlPie: string;
};

export const propsAislamiento: PropsAislamiento = {
  fondo: true,
  titulo: 'El mismo terremoto, dos edificios iguales',
  periodoSuelo: 0.5,
  periodoEmpotrado: 0.5,
  periodoAislado: 2.5,
  amortiguamiento: 0.06,
  rotuloEmpotrado: 'Empotrado al suelo',
  rotuloAislado: 'Sobre aisladores',
  etiquetaPeriodo: 'Periodo propio',
  etiquetaAmplifica: 'Mueve la punta',
  etiquetaSuelo: 'El suelo se mueve así',
  etiquetaAislador: 'Acá está trabajando',
  notaAlPie:
    'Transmisibilidad de un oscilador movido por su base. FísicaEterna, CC BY 4.0',
};

const DISENO = 460;

/** Geometría de cada edificio. */
const PISOS = 6;
const ALTO_PISO = 78;
const ANCHO = 190;
const SUELO_Y = 830;
const ALTO_AISLADOR = 34;

const CENTRO_EMPOTRADO = 620;
const CENTRO_AISLADO = 1300;

/** Amplitud del suelo en píxeles. Todo lo demás es un múltiplo de esto. */
const AMPLITUD_SUELO = 26;

/**
 * Cuánto amplifica la punta respecto del suelo. Es la transmisibilidad de un oscilador
 * movido por la base: la misma fórmula para los dos edificios, con distinto periodo.
 */
const transmisibilidad = (periodoPropio: number, periodoSuelo: number, z: number): number => {
  const r = periodoPropio / periodoSuelo;
  const num = 1 + (2 * z * r) ** 2;
  const den = (1 - r * r) ** 2 + (2 * z * r) ** 2;
  return Math.sqrt(num / den);
};

export const Aislamiento: React.FC<PropsAislamiento> = ({
  fondo,
  titulo,
  periodoSuelo,
  periodoEmpotrado,
  periodoAislado,
  amortiguamiento,
  rotuloEmpotrado,
  rotuloAislado,
  etiquetaPeriodo,
  etiquetaAmplifica,
  etiquetaSuelo,
  etiquetaAislador,
  notaAlPie,
}) => {
  const { durationInFrames } = useVideoConfig();
  const f = useFrameDeDiseno(DISENO, useCurrentFrame(), durationInFrames);

  // ── La física ─────────────────────────────────────────────────────────────
  const ampEmpotrado = transmisibilidad(periodoEmpotrado, periodoSuelo, amortiguamiento);
  const ampAislado = transmisibilidad(periodoAislado, periodoSuelo, amortiguamiento);

  // El suelo, sacudiéndose. Entra suave para que se lea de dónde sale el movimiento.
  const arranque = interpolate(f, [20, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fase = (f / 30) * ((2 * Math.PI) / periodoSuelo);
  const xSuelo = Math.sin(fase) * AMPLITUD_SUELO * arranque;

  /*
   * La punta de cada edificio se desplaza `xSuelo × transmisibilidad`.
   *
   * El empotrado arrastra su base con el suelo: se deforma entero. El aislado casi no
   * se mueve arriba, así que toda la diferencia entre el suelo y la estructura se la
   * come la capa de aisladores — que es exactamente su función.
   */
  const puntaEmpotrado = xSuelo * ampEmpotrado;
  const puntaAislado = xSuelo * ampAislado;

  const aparece = interpolate(f, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const cifra = (v: number, dec = 1) => v.toFixed(dec).replace('.', ',');

  /**
   * Un edificio. `baseX` es dónde está su base y `puntaX` dónde está su último piso:
   * los pisos intermedios se reparten en línea recta entre ambos, que es la primera
   * forma modal de un edificio de corte.
   */
  const Edificio = ({
    centro,
    baseX,
    puntaX,
    color,
    aislado,
  }: {
    centro: number;
    baseX: number;
    puntaX: number;
    color: string;
    aislado: boolean;
  }) => {
    const yBase = aislado ? SUELO_Y - ALTO_AISLADOR : SUELO_Y;
    return (
      <g>
        {/* La capa de aisladores: se deforma lo que el suelo se movió menos lo que se
            movió la estructura. Es el trabajo que está haciendo, a la vista. */}
        {aislado && (
          <g>
            {[-1, 0, 1].map((k) => {
              const x = centro + k * (ANCHO / 2 - 26);
              return (
                <path
                  key={k}
                  d={`M${x + xSuelo} ${SUELO_Y} C ${x + xSuelo} ${SUELO_Y - 14}, ${x + baseX} ${
                    SUELO_Y - ALTO_AISLADOR + 14
                  }, ${x + baseX} ${SUELO_Y - ALTO_AISLADOR}`}
                  fill="none"
                  stroke={COLOR.dorado}
                  strokeWidth={9}
                  strokeLinecap="round"
                />
              );
            })}
            <text
              x={centro}
              y={SUELO_Y + 42}
              textAnchor="middle"
              fill={COLOR.dorado}
              fontFamily={FUENTE.texto}
              fontSize={TAM.pie}
            >
              {etiquetaAislador}
            </text>
          </g>
        )}

        {/* Los pisos */}
        {Array.from({ length: PISOS }, (_, i) => {
          const k = (i + 1) / PISOS;
          const x = centro + baseX + (puntaX - baseX) * k;
          const y = yBase - (i + 1) * ALTO_PISO;
          return (
            <rect
              key={i}
              x={x - ANCHO / 2}
              y={y}
              width={ANCHO}
              height={ALTO_PISO - 8}
              rx={3}
              fill="none"
              stroke={color}
              strokeWidth={i === PISOS - 1 ? 4 : 2.5}
            />
          );
        })}
      </g>
    );
  };

  return (
    <Fondo fondo={fondo}>
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
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

          <g opacity={aparece}>
            {/* El suelo. Se mueve entero: es la entrada del problema. */}
            <line
              x1={140 + xSuelo}
              y1={SUELO_Y}
              x2={1780 + xSuelo}
              y2={SUELO_Y}
              stroke={COLOR.textoTenue}
              strokeWidth={4}
            />
            {Array.from({ length: 22 }, (_, i) => {
              const x = 160 + i * 76 + xSuelo;
              return (
                <line
                  key={i}
                  x1={x}
                  y1={SUELO_Y}
                  x2={x - 18}
                  y2={SUELO_Y + 22}
                  stroke={COLOR.linea}
                  strokeWidth={2}
                />
              );
            })}
            <text
              x={140}
              y={SUELO_Y - 16}
              fill={COLOR.textoTenue}
              fontFamily={FUENTE.texto}
              fontSize={TAM.pie}
            >
              {etiquetaSuelo}
            </text>

            {/* El empotrado: su base va pegada al suelo. */}
            <Edificio
              centro={CENTRO_EMPOTRADO}
              baseX={xSuelo}
              puntaX={puntaEmpotrado}
              color={COLOR.rojo}
              aislado={false}
            />
            {/* El aislado: su base casi no se mueve; la diferencia se la come el aislador. */}
            <Edificio
              centro={CENTRO_AISLADO}
              baseX={puntaAislado}
              puntaX={puntaAislado}
              color={COLOR.verde}
              aislado
            />
          </g>

          {/* ══ Las cifras, una columna por edificio ══ */}
          <g opacity={aparece} fontFamily={FUENTE.texto}>
            {[
              {
                x: CENTRO_EMPOTRADO,
                rotulo: rotuloEmpotrado,
                periodo: periodoEmpotrado,
                amp: ampEmpotrado,
                color: COLOR.rojo,
              },
              {
                x: CENTRO_AISLADO,
                rotulo: rotuloAislado,
                periodo: periodoAislado,
                amp: ampAislado,
                color: COLOR.verde,
              },
            ].map((c) => (
              <g key={c.rotulo}>
                <text
                  x={c.x}
                  y={920}
                  textAnchor="middle"
                  fill={c.color}
                  fontFamily={FUENTE.subtitular}
                  fontSize={TAM.etiqueta}
                >
                  {c.rotulo}
                </text>
                <text x={c.x} y={968} textAnchor="middle" fill={COLOR.textoTenue} fontSize={TAM.pie}>
                  {etiquetaPeriodo}: {cifra(c.periodo)} s
                </text>
                <text x={c.x} y={1016} textAnchor="middle" fill={c.color} fontSize={TAM.destacado}>
                  {etiquetaAmplifica} ×{c.amp >= 1 ? cifra(c.amp) : cifra(c.amp, 2)}
                </text>
              </g>
            ))}
          </g>

          {/* Al pie y a la IZQUIERDA: anclada a la derecha se montaba encima de la
              cifra del edificio aislado, que está centrada en 1300. */}
          <text
            x={100}
            y={1064}
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
