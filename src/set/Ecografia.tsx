import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from '../comun/Fondo';
import { COLOR, FUENTE, TAM } from '../theme';
import { tamTitulo } from '../utiles/texto';
import { useFrameDeDiseno } from '../utiles/ritmo';

/**
 * SET · `ecografia`
 *
 * Cómo una máquina dibuja lo que hay dentro de un cuerpo usando solamente sonido y un
 * cronómetro.
 *
 * ## El dibujo ES el cálculo, en los dos sentidos
 *
 * Esta pieza cierra un círculo y por eso funciona:
 *
 * 1. **De la profundidad al tiempo.** Cada frontera está dibujada a su profundidad real
 *    (`cm · PX_POR_CM`). El eco de esa frontera aparece en el eje de tiempo en
 *    `t = 2d/c` — calculado, no puesto a ojo.
 * 2. **Del tiempo de vuelta a la profundidad.** En el remate, la máquina hace lo único
 *    que sabe hacer: mide los tiempos y despeja `d = c·t/2`. Las marcas reconstruidas se
 *    dibujan **desde ese resultado**, no desde la constante original.
 *
 * Que las marcas caigan encima de las fronteras no está forzado: es la ida y la vuelta
 * de la misma cuenta. Si el dibujo mintiera, no coincidirían y se vería.
 *
 * ## Un pulso, varios ecos — no uno por frontera
 *
 * El pulso NO se detiene en la primera frontera. En cada una se refleja una parte y el
 * resto sigue bajando; por eso los ecos nacen en momentos distintos y llegan en orden de
 * profundidad. Modelarlo como «un pulso, un eco» habría sido más fácil de animar y
 * habría enseñado algo falso: la ecografía entera depende de que un solo disparo
 * devuelva la columna completa.
 *
 * ⚠️ **Es una sola línea, y la nota al pie lo dice.** Esto es el modo A: una columna de
 * profundidad. La imagen que se ve en pantalla en el hospital es el modo B, que barre
 * cientos de estas líneas en abanico y pinta cada eco como un punto más o menos brillante.
 * Mostrar una línea es lo que lo hace explicable; callar que la imagen son cientos sería
 * hacer creer que se ve un bebé con un solo disparo.
 *
 * ⚠️ La velocidad es **una sola para todo el cuerpo** (1540 m/s), que es justamente lo
 * que supone la máquina real. Esa suposición es la fuente de error de la ecografía: la
 * grasa transmite a ~1450 m/s y el músculo a ~1580, así que las profundidades salen
 * ligeramente corridas. También está en la nota al pie.
 */
export type PropsEcografia = {
  fondo: boolean;
  titulo: string;
  /** Velocidad del sonido en tejido blando, en m/s. De acá sale TODO lo demás. */
  velocidadMs: number;
  /** Profundidad real de cada frontera, en cm. */
  profundidadesCm: [number, number, number];
  etiquetasFronteras: [string, string, string];
  etiquetaTransductor: string;
  etiquetaEcos: string;
  ejeProfundidad: string;
  ejeTiempo: string;
  etiquetaReconstruido: string;
  pasos: [string, string, string];
  notaAlPie: string;
};

export const propsEcografia: PropsEcografia = {
  fondo: true,
  titulo: 'Una máquina que solo sabe cronometrar ecos',
  velocidadMs: 1540,
  profundidadesCm: [2, 5, 9],
  etiquetasFronteras: ['Grasa', 'Pared del útero', 'El bebé'],
  etiquetaTransductor: 'Transductor',
  etiquetaEcos: 'Lo único que llega de vuelta',
  ejeProfundidad: 'Profundidad',
  ejeTiempo: 'Tiempo desde el disparo',
  etiquetaReconstruido: 'Lo que la máquina deduce',
  pasos: [
    'Un pulso de sonido entra y baja',
    'En cada frontera rebota una parte, y el resto sigue',
    'Con los tiempos de llegada despeja las profundidades',
  ],
  notaAlPie:
    'Modo A (una línea). La imagen del hospital barre cientos. Se supone 1540 m/s en todo el cuerpo, como hace la máquina real. FísicaEterna, CC BY 4.0',
};

const DISENO = 420;

/* ── La geometría del cuadro ──────────────────────────────────────────────────
 * La columna de tejido y el eje de tiempo comparten altura para que el eco y su
 * frontera se lean a la misma altura, sin tener que seguir una línea con el dedo. */
const COLUMNA = { x: 190, ancho: 300, arriba: 250, abajo: 910 };
const PROFUNDIDAD_MAX_CM = 12;
const PX_POR_CM = (COLUMNA.abajo - COLUMNA.arriba) / PROFUNDIDAD_MAX_CM;

/*
 * ⚠️ El eje ocupa SOLO la mitad de abajo, y la mitad de arriba es para el remate.
 * La primera versión tenía el eje a lo alto del cuadro y el cálculo debajo, en y=1178:
 * o sea fuera de los 1080 px del lienzo, pisando la nota al pie. No lo dice el
 * compilador ni el lint — se ve mirando el fotograma, que es para lo que existe esa
 * regla del README.
 */
/*
 * ⚠️ `altoCursor` es 260 y no 330 por una colisión que solo se vio en la CARÁTULA en
 * inglés: el tercer resultado del panel («116,9 µs → 9,0 cm») caía justo encima del
 * rótulo del eje. En castellano las dos frases son más cortas y el choque pasaba
 * desapercibido — o sea que mirar un still en un solo idioma no alcanza.
 */
const EJE = { x0: 900, x1: 1810, base: 910, altoCursor: 260 };
const PANEL = { y: 300 };
const TIEMPO_MAX_US = 150;

const yDeProfundidad = (cm: number) => COLUMNA.arriba + cm * PX_POR_CM;
const xDeTiempo = (us: number) => EJE.x0 + (us / TIEMPO_MAX_US) * (EJE.x1 - EJE.x0);

const cifra = (v: number, dec = 1) => v.toFixed(dec).replace('.', ',');

export const Ecografia: React.FC<PropsEcografia> = ({
  fondo,
  titulo,
  velocidadMs,
  profundidadesCm,
  etiquetasFronteras,
  etiquetaTransductor,
  etiquetaEcos,
  ejeProfundidad,
  ejeTiempo,
  etiquetaReconstruido,
  pasos,
  notaAlPie,
}) => {
  const { durationInFrames } = useVideoConfig();
  const f = useFrameDeDiseno(DISENO, useCurrentFrame(), durationInFrames);

  // ── La física, entera ─────────────────────────────────────────────────────
  // 1540 m/s = 0,154 cm/µs. Todo lo que sigue sale de esta sola conversión.
  const cCmPorUs = velocidadMs / 10000;

  /** Cuándo el pulso ALCANZA cada frontera, y cuándo vuelve su eco. */
  const tIda = profundidadesCm.map((cm) => cm / cCmPorUs);
  const tEco = profundidadesCm.map((cm) => (2 * cm) / cCmPorUs);

  // ── El tiempo simulado ────────────────────────────────────────────────────
  // El barrido ocupa el grueso del clip; el remate reconstruye.
  const tau = interpolate(f, [40, 280], [0, TIEMPO_MAX_US], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  /** Dónde va el pulso descendente, si todavía está dentro. */
  const profundidadPulso = tau * cCmPorUs;
  const pulsoDentro = profundidadPulso <= PROFUNDIDAD_MAX_CM;

  const aparece = interpolate(f, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const reconstruye = interpolate(f, [300, 380], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const paso = f < 140 ? 0 : f < 300 ? 1 : 2;
  const colores = [COLOR.celeste, COLOR.verde, COLOR.dorado];

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
            {/* ══ La columna de tejido ══ */}
            <rect
              x={COLUMNA.x}
              y={COLUMNA.arriba}
              width={COLUMNA.ancho}
              height={COLUMNA.abajo - COLUMNA.arriba}
              fill={COLOR.fondoAlto}
              stroke={COLOR.linea}
              strokeWidth={2}
              rx={6}
            />
            <text
              x={COLUMNA.x}
              y={COLUMNA.arriba - 90}
              fill={COLOR.textoTenue}
              fontFamily={FUENTE.subtitular}
              fontSize={TAM.etiqueta}
            >
              {ejeProfundidad}
            </text>

            {/* El transductor: donde entra el pulso y donde se cronometra */}
            <rect
              x={COLUMNA.x + 40}
              y={COLUMNA.arriba - 46}
              width={COLUMNA.ancho - 80}
              height={32}
              fill={COLOR.texto}
              rx={5}
            />
            <text
              x={COLUMNA.x + COLUMNA.ancho / 2}
              y={COLUMNA.arriba - 58}
              textAnchor="middle"
              fill={COLOR.texto}
              fontFamily={FUENTE.texto}
              fontSize={TAM.pie}
            >
              {etiquetaTransductor}
            </text>

            {/* Las fronteras, cada una a su profundidad REAL */}
            {profundidadesCm.map((cm, i) => (
              <g key={`fr-${i}`}>
                <line
                  x1={COLUMNA.x}
                  y1={yDeProfundidad(cm)}
                  x2={COLUMNA.x + COLUMNA.ancho}
                  y2={yDeProfundidad(cm)}
                  stroke={colores[i]}
                  strokeWidth={3}
                />
                <text
                  x={COLUMNA.x + COLUMNA.ancho + 16}
                  y={yDeProfundidad(cm) + 9}
                  fill={colores[i]}
                  fontFamily={FUENTE.texto}
                  fontSize={TAM.pie}
                >
                  {etiquetasFronteras[i]} · {cifra(cm)} cm
                </text>
              </g>
            ))}

            {/* El pulso que baja */}
            {pulsoDentro && tau > 0 && (
              <rect
                x={COLUMNA.x + 6}
                y={yDeProfundidad(profundidadPulso) - 7}
                width={COLUMNA.ancho - 12}
                height={14}
                fill={COLOR.texto}
                opacity={0.95}
                rx={7}
              />
            )}

            {/* Los ecos que suben. Cada uno nace cuando el pulso toca SU frontera y
                llega al transductor en 2d/c: la posición es la cuenta, no una animación
                escrita a mano. */}
            {profundidadesCm.map((cm, i) => {
              if (tau < tIda[i] || tau > tEco[i]) return null;
              const subido = (tau - tIda[i]) * cCmPorUs;
              return (
                <rect
                  key={`eco-${i}`}
                  x={COLUMNA.x + 40}
                  y={yDeProfundidad(cm - subido) - 5}
                  width={COLUMNA.ancho - 80}
                  height={10}
                  fill={colores[i]}
                  opacity={0.9}
                  rx={5}
                />
              );
            })}

            {/* ══ El eje de tiempo: lo ÚNICO que la máquina mide ══ */}
            <text
              x={EJE.x0}
              y={EJE.base - EJE.altoCursor - 34}
              fill={COLOR.textoTenue}
              fontFamily={FUENTE.subtitular}
              fontSize={TAM.etiqueta}
            >
              {etiquetaEcos}
            </text>
            <line
              x1={EJE.x0}
              y1={EJE.base}
              x2={EJE.x1}
              y2={EJE.base}
              stroke={COLOR.linea}
              strokeWidth={2}
            />
            <text
              x={EJE.x1}
              y={EJE.base + 42}
              textAnchor="end"
              fill={COLOR.textoTenue}
              fontFamily={FUENTE.texto}
              fontSize={TAM.pie}
            >
              {ejeTiempo} · µs
            </text>

            {/* El cursor del cronómetro */}
            {tau > 0 && (
              <line
                x1={xDeTiempo(tau)}
                y1={EJE.base - EJE.altoCursor}
                x2={xDeTiempo(tau)}
                y2={EJE.base}
                stroke={COLOR.textoTenue}
                strokeWidth={1.5}
                strokeDasharray="6 8"
              />
            )}

            {/* Cada eco recibido, en su tiempo calculado */}
            {tEco.map((t, i) => {
              if (tau < t) return null;
              const alto = 150 - i * 26; // más profundo, eco más débil
              return (
                <g key={`sp-${i}`}>
                  <line
                    x1={xDeTiempo(t)}
                    y1={EJE.base}
                    x2={xDeTiempo(t)}
                    y2={EJE.base - alto}
                    stroke={colores[i]}
                    strokeWidth={5}
                  />
                  <text
                    x={xDeTiempo(t)}
                    y={EJE.base - alto - 16}
                    textAnchor="middle"
                    fill={colores[i]}
                    fontFamily={FUENTE.texto}
                    fontSize={TAM.pie}
                  >
                    {cifra(t)} µs
                  </text>
                </g>
              );
            })}

            {/* ══ El remate: la vuelta de la cuenta ══
                Las marcas se colocan desde `c·t/2`, NO desde `profundidadesCm`. Que
                caigan sobre las fronteras es el resultado, no el punto de partida. */}
            {reconstruye > 0 && (
              <g opacity={reconstruye}>
                <text
                  x={EJE.x0}
                  y={PANEL.y}
                  fill={COLOR.texto}
                  fontFamily={FUENTE.subtitular}
                  fontSize={TAM.etiqueta}
                >
                  {etiquetaReconstruido}
                </text>
                <text
                  x={EJE.x0}
                  y={PANEL.y + 74}
                  fill={COLOR.texto}
                  fontFamily={FUENTE.formula}
                  fontSize={TAM.subtitulo}
                >
                  d = c · t / 2
                </text>
                {tEco.map((t, i) => {
                  const dDeducida = (cCmPorUs * t) / 2;
                  return (
                    <g key={`rec-${i}`}>
                      {/* La cuenta, escrita: el tiempo medido y la profundidad que sale
                          de él. Es lo que conecta el eje de la derecha con la columna
                          de la izquierda sin que haya que creerlo. */}
                      <text
                        x={EJE.x0}
                        y={PANEL.y + 146 + i * 52}
                        fill={colores[i]}
                        fontFamily={FUENTE.texto}
                        fontSize={TAM.etiqueta}
                      >
                        {cifra(t)} µs → {cifra(dDeducida)} cm
                      </text>
                      <line
                        x1={COLUMNA.x - 54}
                        y1={yDeProfundidad(dDeducida)}
                        x2={COLUMNA.x - 8}
                        y2={yDeProfundidad(dDeducida)}
                        stroke={colores[i]}
                        strokeWidth={4}
                      />
                      <text
                        x={COLUMNA.x - 66}
                        y={yDeProfundidad(dDeducida) + 9}
                        textAnchor="end"
                        fill={colores[i]}
                        fontFamily={FUENTE.texto}
                        fontSize={TAM.pie}
                      >
                        {cifra(dDeducida)} cm
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>

          {/* ══ El paso en que va ══ */}
          <text
            x={100}
            y={990}
            fill={COLOR.texto}
            fontFamily={FUENTE.subtitular}
            fontSize={TAM.destacado}
            opacity={aparece}
          >
            {pasos[paso]}
          </text>

          <text
            x={100}
            y={1046}
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
