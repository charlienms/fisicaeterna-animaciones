import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from '../comun/Fondo';
import { COLOR, FUENTE, TAM } from '../theme';
import { tamTitulo } from '../utiles/texto';
import { useFrameDeDiseno } from '../utiles/ritmo';

/**
 * SET · `paralaje`
 *
 * Cómo se mide la distancia a una estrella sin salir de la Tierra.
 *
 * Dos paneles que hay que mirar a la vez, y por eso están uno al lado del otro:
 *
 *   - **Izquierda, el mecanismo.** La Tierra en su órbita, la estrella cercana, y las
 *     dos líneas de visión desde enero y desde julio. Es la vista que nadie tiene.
 *   - **Derecha, el dato.** Lo que se ve por el telescopio: la estrella cercana
 *     baila contra un fondo que no se mueve. Es la vista que sí se tiene, y es la única
 *     medición real.
 *
 * El argumento entero de la pieza es que el panel derecho **se deduce** del izquierdo, y
 * por eso el desplazamiento de la derecha se calcula de la geometría de la izquierda en
 * vez de animarse por separado. Si se dibujaran por su cuenta, la pieza podría mostrar
 * un baile que no corresponde a esa distancia y nadie lo notaría.
 *
 * ⚠️ **El ángulo va con zoom brutal y eso se declara en la nota al pie.** La paralaje de
 * la estrella más cercana es 0,77 segundos de arco: a escala real, los dos rayos serían
 * la misma línea y el panel derecho estaría quieto. Recortar la escala es lo que hace
 * visible el fenómeno; no decirlo sería hacer creer que se ve así por un telescopio.
 */
export type PropsParalaje = {
  fondo: boolean;
  titulo: string;
  /** Distancia a la estrella cercana, en pársecs. La paralaje sale de acá: p = 1/d. */
  distanciaPc: number;
  nombreEstrella: string;
  etiquetaDistancia: string;
  etiquetaParalaje: string;
  etiquetaBase: string;
  etiquetaEnero: string;
  etiquetaJulio: string;
  rotuloMecanismo: string;
  rotuloTelescopio: string;
  notaAlPie: string;
};

export const propsParalaje: PropsParalaje = {
  fondo: true,
  titulo: 'Medir una estrella con los dos ojos de la Tierra',
  distanciaPc: 1.3,
  nombreEstrella: 'Próxima Centauri',
  etiquetaDistancia: 'Distancia',
  etiquetaParalaje: 'Paralaje',
  etiquetaBase: 'Base: 2 UA (la órbita entera)',
  etiquetaEnero: 'Enero',
  etiquetaJulio: 'Julio',
  rotuloMecanismo: 'Lo que pasa',
  rotuloTelescopio: 'Lo que se ve',
  notaAlPie:
    'Ángulo exagerado ~10.000×: la paralaje real es de 0,77″. FísicaEterna, CC BY 4.0',
};

const DISENO = 360;

/** Panel izquierdo: el Sol al centro, la órbita, la estrella arriba. */
const SOL = { x: 420, y: 700 };
const RADIO_ORBITA = 180;
const ESTRELLA = { x: 420, y: 250 };

/** Panel derecho: el campo del telescopio. */
const CAMPO = { x: 1320, y: 560, r: 290 };

export const Paralaje: React.FC<PropsParalaje> = ({
  fondo,
  titulo,
  distanciaPc,
  nombreEstrella,
  etiquetaDistancia,
  etiquetaParalaje,
  etiquetaBase,
  etiquetaEnero,
  etiquetaJulio,
  rotuloMecanismo,
  rotuloTelescopio,
  notaAlPie,
}) => {
  const { durationInFrames } = useVideoConfig();
  const f = useFrameDeDiseno(DISENO, useCurrentFrame(), durationInFrames);

  // ── La física ─────────────────────────────────────────────────────────────
  // Por definición de pársec: una estrella a d pársecs tiene paralaje de 1/d
  // segundos de arco. Es el dato que la animación existe para explicar.
  const paralajeArcsec = 1 / distanciaPc;

  // ── El vaivén de la Tierra ────────────────────────────────────────────────
  // Va de enero (izquierda) a julio (derecha) y vuelve. El resto de la pieza
  // se deduce de este único número.
  const vaiven = Math.sin(interpolate(f, [30, DISENO], [0, Math.PI * 3], {
    extrapolateLeft: 'clamp',
  }));
  const tierra = { x: SOL.x + vaiven * RADIO_ORBITA, y: SOL.y };

  // La estrella cercana se ve proyectada contra el fondo lejano. El desplazamiento
  // angular es proporcional a la base (la posición de la Tierra) e inversamente
  // proporcional a la distancia: ésa es toda la paralaje.
  const AMPLIFICACION = 120; // píxeles por unidad de (base / distancia)
  /*
   * ⚠️ El signo va NEGADO, y no es un detalle de dibujo: es el fenómeno.
   *
   * Cuando el observador se mueve a la izquierda, lo cercano se ve desplazado hacia la
   * DERECHA contra el fondo — es el pulgar que salta al cerrar un ojo y abrir el otro.
   * Con el signo directo la animación mostraba la estrella siguiendo a la Tierra, que es
   * exactamente lo contrario de lo que se observa por un telescopio.
   */
  const desplazamiento = -(vaiven / distanciaPc) * AMPLIFICACION;
  const estrellaVista = { x: CAMPO.x + desplazamiento, y: CAMPO.y };

  const aparece = interpolate(f, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const muestraRayos = interpolate(f, [40, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Estrellas de fondo con semilla fija: tienen que ser IDÉNTICAS en todo fotograma,
  // porque el argumento es justamente que el fondo no se mueve.
  const fondoEstrellas = Array.from({ length: 34 }, (_, i) => {
    const a = random(`bg-a-${i}`) * Math.PI * 2;
    const r = Math.sqrt(random(`bg-r-${i}`)) * (CAMPO.r - 24);
    return {
      x: CAMPO.x + Math.cos(a) * r,
      y: CAMPO.y + Math.sin(a) * r,
      s: 1 + random(`bg-s-${i}`) * 1.8,
    };
  });

  const cifra = (v: number, dec: number) => v.toFixed(dec).replace('.', ',');

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

          {/* ══ PANEL IZQUIERDO — el mecanismo ══ */}
          <g opacity={aparece}>
            <text x={100} y={200} fill={COLOR.textoTenue} fontFamily={FUENTE.subtitular} fontSize={TAM.etiqueta}>
              {rotuloMecanismo}
            </text>

            {/* Órbita */}
            <ellipse
              cx={SOL.x}
              cy={SOL.y}
              rx={RADIO_ORBITA}
              ry={44}
              fill="none"
              stroke={COLOR.linea}
              strokeWidth={2}
              strokeDasharray="7 9"
            />

            {/* Las dos líneas de visión, desde los extremos de la órbita */}
            <g opacity={muestraRayos}>
              {[-1, 1].map((lado) => (
                <line
                  key={lado}
                  x1={SOL.x + lado * RADIO_ORBITA}
                  y1={SOL.y}
                  x2={ESTRELLA.x}
                  y2={ESTRELLA.y}
                  stroke={COLOR.linea}
                  strokeWidth={2}
                  strokeDasharray="5 8"
                />
              ))}
              {/* La base: lo que hace posible la medición */}
              <line
                x1={SOL.x - RADIO_ORBITA}
                y1={SOL.y}
                x2={SOL.x + RADIO_ORBITA}
                y2={SOL.y}
                stroke={COLOR.dorado}
                strokeWidth={4}
              />
              <text
                x={SOL.x}
                y={SOL.y + 86}
                textAnchor="middle"
                fill={COLOR.dorado}
                fontFamily={FUENTE.texto}
                fontSize={TAM.pie}
              >
                {etiquetaBase}
              </text>
            </g>

            {/* La línea de visión actual: la que de verdad se está midiendo */}
            <line
              x1={tierra.x}
              y1={tierra.y}
              x2={ESTRELLA.x}
              y2={ESTRELLA.y}
              stroke={COLOR.celeste}
              strokeWidth={3}
            />

            {/* Sol */}
            <circle cx={SOL.x} cy={SOL.y} r={17} fill={COLOR.dorado} />

            {/* Tierra */}
            <circle cx={tierra.x} cy={tierra.y} r={11} fill={COLOR.celeste} />
            <text
              x={tierra.x}
              y={tierra.y - 26}
              textAnchor="middle"
              fill={COLOR.celeste}
              fontFamily={FUENTE.texto}
              fontSize={TAM.pie}
            >
              {vaiven < 0 ? etiquetaEnero : etiquetaJulio}
            </text>

            {/* La estrella cercana */}
            <circle cx={ESTRELLA.x} cy={ESTRELLA.y} r={13} fill={COLOR.verde} />
            <text
              x={ESTRELLA.x}
              y={ESTRELLA.y - 32}
              textAnchor="middle"
              fill={COLOR.verde}
              fontFamily={FUENTE.texto}
              fontSize={TAM.etiqueta}
            >
              {nombreEstrella}
            </text>
          </g>

          {/* ══ PANEL DERECHO — lo que ve el telescopio ══ */}
          <g opacity={aparece}>
            <text
              x={CAMPO.x - CAMPO.r}
              y={200}
              fill={COLOR.textoTenue}
              fontFamily={FUENTE.subtitular}
              fontSize={TAM.etiqueta}
            >
              {rotuloTelescopio}
            </text>

            <circle
              cx={CAMPO.x}
              cy={CAMPO.y}
              r={CAMPO.r}
              fill={COLOR.fondo}
              stroke={COLOR.linea}
              strokeWidth={3}
            />

            {/* El fondo lejano: quieto, siempre igual. Ése es el punto. */}
            {fondoEstrellas.map((e, i) => (
              <circle key={i} cx={e.x} cy={e.y} r={e.s} fill={COLOR.textoTenue} opacity={0.75} />
            ))}

            {/* Los dos extremos del recorrido, para que el baile se lea como medición */}
            <g opacity={muestraRayos * 0.55}>
              {[-1, 1].map((lado) => (
                <circle
                  key={lado}
                  cx={CAMPO.x + (lado / distanciaPc) * AMPLIFICACION}
                  cy={CAMPO.y}
                  r={9}
                  fill="none"
                  stroke={COLOR.verde}
                  strokeWidth={2}
                  strokeDasharray="4 5"
                />
              ))}
              <line
                x1={CAMPO.x - (1 / distanciaPc) * AMPLIFICACION}
                y1={CAMPO.y + 44}
                x2={CAMPO.x + (1 / distanciaPc) * AMPLIFICACION}
                y2={CAMPO.y + 44}
                stroke={COLOR.verde}
                strokeWidth={3}
              />
              <text
                x={CAMPO.x}
                y={CAMPO.y + 80}
                textAnchor="middle"
                fill={COLOR.verde}
                fontFamily={FUENTE.texto}
                fontSize={TAM.pie}
              >
                2p
              </text>
            </g>

            {/* La estrella cercana, desplazada por la paralaje */}
            <circle cx={estrellaVista.x} cy={estrellaVista.y} r={13} fill={COLOR.verde} />
          </g>

          {/* ══ Las cifras ══ */}
          <g opacity={aparece} fontFamily={FUENTE.texto}>
            <text x={760} y={880} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaParalaje}
            </text>
            <text x={760} y={942} fill={COLOR.verde} fontSize={TAM.subtitulo}>
              {cifra(paralajeArcsec, 2)}″
            </text>

            <text x={1120} y={880} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaDistancia}
            </text>
            <text x={1120} y={942} fill={COLOR.celeste} fontSize={TAM.subtitulo}>
              {cifra(distanciaPc, 1)} pc
            </text>
          </g>

          {/* La relación, en la fuente que sí tiene los símbolos */}
          <text
            x={1560}
            y={930}
            textAnchor="middle"
            fill={COLOR.texto}
            fontFamily={FUENTE.formula}
            fontSize={TAM.destacado}
            opacity={aparece}
          >
            d = 1 / p
          </text>

          <text
            x={100}
            y={1030}
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
