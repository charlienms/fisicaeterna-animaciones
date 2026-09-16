import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from '../comun/Fondo';
import { COLOR, FUENTE, TAM } from '../theme';
import { tamTitulo } from '../utiles/texto';
import { useFrameDeDiseno } from '../utiles/ritmo';

/**
 * SET · `trilateracion`
 *
 * Cómo un teléfono sabe dónde está sin preguntarle a nadie.
 *
 * ## El dibujo ES el cálculo
 *
 * Los radios **no se eligen para que los círculos se corten donde queremos**: se mide la
 * distancia real del satélite al receptor y ése es el radio. Los círculos se cortan en
 * el punto correcto **por construcción**, que es exactamente lo que hace un GPS.
 *
 * Los dos candidatos del segundo paso tampoco se ponen a ojo: se resuelve la
 * intersección de dos circunferencias. Si el dibujo y la cuenta discreparan, se vería.
 *
 * ## El remate es el reloj, y es lo que casi nadie sabe
 *
 * En la última parte se le suma a los TRES radios el mismo error: el que introduce un
 * reloj de receptor adelantado o atrasado. Los círculos dejan de tener un punto común —
 * y eso es visible, no hay que creerlo. Por eso un GPS necesita un satélite MÁS que
 * incógnitas: el cuarto no aporta geometría, despeja el reloj.
 *
 * ⚠️ **Es un esquema en 2D de un problema en 3D**, y la nota al pie lo dice. En el
 * espacio son esferas y hacen falta tres para dejar dos puntos (uno de ellos absurdo,
 * fuera de la Tierra). Aplanarlo es lo que lo hace explicable; callarlo sería hacer
 * creer que el GPS trabaja en un plano.
 */
export type PropsTrilateracion = {
  fondo: boolean;
  titulo: string;
  /** Error del reloj del receptor, en microsegundos. De acá sale el desvío en km. */
  errorRelojUs: number;
  pasos: [string, string, string, string];
  etiquetaSatelite: string;
  etiquetaTu: string;
  etiquetaCandidato: string;
  etiquetaError: string;
  notaAlPie: string;
};

export const propsTrilateracion: PropsTrilateracion = {
  fondo: true,
  titulo: 'Tres distancias y ya saben dónde estás',
  errorRelojUs: 40,
  pasos: [
    'Con un satélite: estás en algún punto de este círculo',
    'Con dos: quedan dos candidatos',
    'Con tres: queda uno solo',
    'Si tu reloj se atrasa, los tres círculos dejan de cortarse',
  ],
  etiquetaSatelite: 'Satélite',
  etiquetaTu: 'Tú',
  etiquetaCandidato: 'Candidato',
  etiquetaError: 'Error de reloj',
  notaAlPie:
    'Esquema en 2D de un problema en 3D: en el espacio son esferas. FísicaEterna, CC BY 4.0',
};

const DISENO = 480;

/** Dónde está de verdad el receptor. Todo lo demás se deduce de acá. */
/*
 * ⚠️ La geometría va APRETADA a propósito, y costo una tanda de render.
 *
 * La primera versión tenía los satélites en las esquinas y radios de ~750 px: los tres
 * círculos se salían del cuadro y lo único que se veía eran arcos cruzando el texto. El
 * remate de la pieza —que con el reloj desfasado los círculos DEJAN de cortarse— no se
 * puede ver si los círculos no caben enteros en pantalla.
 */
const TU = { x: 960, y: 600 };

const SATELITES = [
  { x: 780, y: 430 },
  { x: 1140, y: 410 },
  { x: 1180, y: 760 },
];

const distancia = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Los dos puntos donde se cortan dos circunferencias, o `null` si no se cortan.
 * Es la cuenta de toda la vida; está acá para que los «dos candidatos» del paso 2 sean
 * el resultado de resolverlo y no dos puntos puestos a ojo.
 */
const interseccion = (
  c1: { x: number; y: number },
  r1: number,
  c2: { x: number; y: number },
  r2: number
): { x: number; y: number }[] => {
  const d = distancia(c1, c2);
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - a * a;
  if (h2 < 0) return [];
  const h = Math.sqrt(h2);
  const mx = c1.x + (a * (c2.x - c1.x)) / d;
  const my = c1.y + (a * (c2.y - c1.y)) / d;
  const rx = (-(c2.y - c1.y) * h) / d;
  const ry = ((c2.x - c1.x) * h) / d;
  return [
    { x: mx + rx, y: my + ry },
    { x: mx - rx, y: my - ry },
  ];
};

export const Trilateracion: React.FC<PropsTrilateracion> = ({
  fondo,
  titulo,
  errorRelojUs,
  pasos,
  etiquetaSatelite,
  etiquetaTu,
  etiquetaCandidato,
  etiquetaError,
  notaAlPie,
}) => {
  const { durationInFrames } = useVideoConfig();
  const f = useFrameDeDiseno(DISENO, useCurrentFrame(), durationInFrames);

  // ── Las distancias reales ─────────────────────────────────────────────────
  // El radio de cada círculo ES la distancia al receptor. No hay ningún ajuste.
  const radiosBase = SATELITES.map((s) => distancia(s, TU));

  // ── El error de reloj ─────────────────────────────────────────────────────
  // Un reloj desfasado hace creer que la señal tardó de más: el receptor sobreestima
  // TODAS las distancias en la misma cantidad, c · Δt.
  const C_KM_POR_US = 0.299792458; // km que recorre la luz en un microsegundo
  const errorKm = errorRelojUs * C_KM_POR_US;
  /*
   * El error EN PANTALLA no sale de una escala en km, y no es un descuido.
   *
   * Un satélite GPS está a ~20.000 km: con estos píxeles, cualquier cifra en kilómetros
   * para las distancias dibujadas sería falsa por tres órdenes de magnitud. Así que las
   * distancias NO se rotulan, y lo único que se dice en unidades reales es el error de
   * reloj —que sí es exacto: c · Δt— porque es el remate de la pieza.
   */
  const errorPx = 78;

  // Cuánto del error se está aplicando en este instante (el cuarto tramo).
  const fraccionError = interpolate(f, [330, 430], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const radios = radiosBase.map((r) => r + errorPx * fraccionError);

  /** Cuántos satélites se han sumado ya. */
  const visibles = f < 110 ? 1 : f < 220 ? 2 : 3;
  const paso = f < 110 ? 0 : f < 220 ? 1 : f < 330 ? 2 : 3;

  const candidatos =
    visibles === 2 ? interseccion(SATELITES[0], radios[0], SATELITES[1], radios[1]) : [];

  const aparece = interpolate(f, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const colores = [COLOR.celeste, COLOR.verde, COLOR.dorado];

  const cifra = (v: number, dec = 0) => v.toFixed(dec).replace('.', ',');

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
            {/* Los círculos de distancia. El grosor sube en el que acaba de entrar. */}
            {SATELITES.slice(0, visibles).map((s, i) => (
              <circle
                key={`r-${i}`}
                cx={s.x}
                cy={s.y}
                r={radios[i]}
                fill="none"
                stroke={colores[i]}
                strokeWidth={i === visibles - 1 ? 3.5 : 2}
                strokeDasharray={fraccionError > 0 ? '10 8' : undefined}
                opacity={0.9}
              />
            ))}

            {/* La distancia medida, del satélite al receptor */}
            {SATELITES.slice(0, visibles).map((s, i) => (
              <g key={`l-${i}`}>
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={TU.x}
                  y2={TU.y}
                  stroke={colores[i]}
                  strokeWidth={1.5}
                  strokeDasharray="5 9"
                  opacity={0.6}
                />
              </g>
            ))}

            {/* Los satélites */}
            {SATELITES.slice(0, visibles).map((s, i) => (
              <g key={`s-${i}`}>
                <rect x={s.x - 13} y={s.y - 13} width={26} height={26} fill={colores[i]} rx={4} />
                <text
                  x={s.x}
                  y={s.y - 30}
                  textAnchor="middle"
                  fill={colores[i]}
                  fontFamily={FUENTE.texto}
                  fontSize={TAM.pie}
                >
                  {etiquetaSatelite} {i + 1}
                </text>
              </g>
            ))}

            {/* Los dos candidatos del paso 2, resueltos de verdad */}
            {candidatos.map((p, i) => (
              <g key={`c-${i}`}>
                <circle cx={p.x} cy={p.y} r={14} fill="none" stroke={COLOR.texto} strokeWidth={2.5} />
                <text
                  x={p.x}
                  y={p.y + 44}
                  textAnchor="middle"
                  fill={COLOR.texto}
                  fontFamily={FUENTE.texto}
                  fontSize={TAM.pie}
                >
                  {etiquetaCandidato}
                </text>
              </g>
            ))}

            {/* El receptor. Se apaga cuando el reloj miente: con el error, ese punto
                ya no es solución de nada — que es justamente lo que hay que ver. */}
            <circle
              cx={TU.x}
              cy={TU.y}
              r={16}
              fill={COLOR.texto}
              opacity={1 - fraccionError * 0.75}
            />
            <text
              x={TU.x}
              y={TU.y + 52}
              textAnchor="middle"
              fill={COLOR.texto}
              fontFamily={FUENTE.subtitular}
              fontSize={TAM.etiqueta}
              opacity={1 - fraccionError * 0.75}
            >
              {etiquetaTu}
            </text>
          </g>

          {/* ══ El paso en que va ══ */}
          <text
            x={100}
            y={930}
            fill={paso === 3 ? COLOR.rojo : COLOR.texto}
            fontFamily={FUENTE.subtitular}
            fontSize={TAM.destacado}
            opacity={aparece}
          >
            {pasos[paso]}
          </text>

          {/* El error, en las unidades en que de verdad se mide */}
          {fraccionError > 0 && (
            <text
              x={100}
              y={995}
              fill={COLOR.rojo}
              fontFamily={FUENTE.texto}
              fontSize={TAM.etiqueta}
              opacity={fraccionError}
            >
              {etiquetaError}: {cifra(errorRelojUs * fraccionError)} µs ={' '}
              {cifra(errorKm * fraccionError, 1)} km
            </text>
          )}

          <text
            x={100}
            y={1050}
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
