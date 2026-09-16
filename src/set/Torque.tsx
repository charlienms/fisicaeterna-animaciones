import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from '../comun/Fondo';
import { COLOR, FUENTE, TAM } from '../theme';
import { tamTitulo } from '../utiles/texto';
import { useFrameDeDiseno } from '../utiles/ritmo';

/**
 * SET · `torque`
 *
 * Por qué el mismo empujón hace girar más o menos según DÓNDE y CÓMO se aplica.
 *
 * La pieza recorre las tres variables de τ = r · F · sen θ en este orden, que es el
 * orden en que se entienden:
 *
 *   1. La misma fuerza en el extremo de una llave larga.
 *   2. La misma fuerza, más cerca del eje → gira menos. Esto es lo que todo el mundo
 *      ya sabe con el cuerpo («agarra la llave más al final») y sirve de ancla.
 *   3. La misma fuerza en el mismo punto, pero torcida → gira menos otra vez. Ésta es
 *      la parte que no es intuitiva, y por eso va al final y no al principio.
 *
 * ⚠️ **La barra y el número salen del cálculo, no están escritos al lado del dibujo.**
 * `tau` se computa de la geometría que se está dibujando en ese mismo fotograma, así que
 * si el dibujo miente, el número miente con él y se nota. Es la razón de hacer esto en
 * Remotion y no en un editor de video.
 *
 * El brazo de palanca efectivo (`r·sen θ`) se dibuja además como una línea punteada
 * desde el eje hasta la recta de acción de la fuerza: es la interpretación geométrica
 * del `sen θ`, y sin ella la tercera fase se ve como magia.
 */
export type PropsTorque = {
  /** `true` = degradado del canal; `false` = transparente para superponer. */
  fondo: boolean;
  titulo: string;
  /** Módulo de la fuerza, en newtons. Constante durante toda la pieza: ése es el punto. */
  fuerzaN: number;
  /** Largo total de la llave, en metros. */
  largoLlaveM: number;
  /** Fracción del largo donde se aplica la fuerza en la fase 2 (0-1). */
  fraccionCorta: number;
  /** Ángulo final entre la llave y la fuerza en la fase 3, en grados. */
  anguloFinalGrados: number;
  etiquetaFuerza: string;
  etiquetaBrazo: string;
  etiquetaAngulo: string;
  etiquetaTorque: string;
  notaAlPie: string;
};

export const propsTorque: PropsTorque = {
  fondo: true,
  titulo: 'Por qué importa dónde empujas',
  fuerzaN: 100,
  largoLlaveM: 0.4,
  fraccionCorta: 0.45,
  anguloFinalGrados: 30,
  etiquetaFuerza: 'Fuerza',
  etiquetaBrazo: 'Distancia al eje',
  etiquetaAngulo: 'Ángulo',
  etiquetaTorque: 'Torque',
  notaAlPie: 'τ = r · F · sen θ — FísicaEterna, CC BY 4.0',
};

/** Fotogramas para los que está escrita la animación. */
const DISENO = 360;

/** Píxeles por metro, para dibujar la llave a escala. */
const PX_POR_M = 900;

const EJE = { x: 620, y: 620 };

const grados = (rad: number) => (rad * 180) / Math.PI;
const radianes = (deg: number) => (deg * Math.PI) / 180;

export const Torque: React.FC<PropsTorque> = ({
  fondo,
  titulo,
  fuerzaN,
  largoLlaveM,
  fraccionCorta,
  anguloFinalGrados,
  etiquetaFuerza,
  etiquetaBrazo,
  etiquetaAngulo,
  etiquetaTorque,
  notaAlPie,
}) => {
  const { durationInFrames } = useVideoConfig();
  const f = useFrameDeDiseno(DISENO, useCurrentFrame(), durationInFrames);

  // ── Las tres fases ────────────────────────────────────────────────────────
  // Fase 1 (0-110): fuerza perpendicular en el extremo.
  // Fase 2 (110-220): el punto de aplicación se acerca al eje.
  // Fase 3 (220-360): vuelve al extremo y la fuerza se tuerce.
  const fraccion = interpolate(f, [110, 165, 200, 230], [1, fraccionCorta, fraccionCorta, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const anguloDeg = interpolate(f, [255, 320], [90, anguloFinalGrados], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── La física, calculada del dibujo ───────────────────────────────────────
  const rM = largoLlaveM * fraccion;
  const theta = radianes(anguloDeg);
  const tau = rM * fuerzaN * Math.sin(theta);
  const tauMax = largoLlaveM * fuerzaN; // r máximo, θ = 90°: el techo de la barra.

  // ── Geometría en pantalla ─────────────────────────────────────────────────
  const largoPx = largoLlaveM * PX_POR_M;
  const rPx = rM * PX_POR_M;
  const punto = { x: EJE.x + rPx, y: EJE.y };

  // La fuerza sale del punto de aplicación. θ se mide desde la llave (eje +x hacia
  // arriba), así que en pantalla la componente vertical va con signo negativo.
  const fuerzaPx = 210;
  const ux = Math.cos(theta);
  const uy = -Math.sin(theta);
  const puntaFuerza = { x: punto.x + ux * fuerzaPx, y: punto.y + uy * fuerzaPx };

  /*
   * Brazo de palanca efectivo: la distancia del eje a la RECTA DE ACCIÓN de la fuerza,
   * que es r·sen θ. Su pie es la proyección ortogonal del eje sobre esa recta:
   *
   *   t    = (eje − P) · u = −r·cos θ
   *   pie  = P + t·u = ( x + r·sen²θ , y + r·cos θ·sen θ )
   *
   * Se calcula así y no «a ojo» porque es justo lo que la tercera fase tiene que
   * mostrar: cuando la fuerza se tuerce, lo que se acorta es este segmento. Con θ = 90°
   * el pie cae exactamente sobre el punto de aplicación, que es lo que debe pasar.
   */
  const pieBrazo = {
    x: EJE.x + rPx * Math.sin(theta) * Math.sin(theta),
    y: EJE.y + rPx * Math.cos(theta) * Math.sin(theta),
  };

  const aparece = interpolate(f, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const muestraAngulo = interpolate(f, [240, 265], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Barra de torque ───────────────────────────────────────────────────────
  const barra = { x: 1360, y: 300, ancho: 160, alto: 520 };
  const fraccionBarra = Math.max(0, Math.min(1, tau / tauMax));

  const cifra = (v: number, dec = 1) => v.toFixed(dec).replace('.', ',');

  return (
    <Fondo fondo={fondo}>
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <text
            x={120}
            y={140}
            fill={COLOR.texto}
            fontFamily={FUENTE.titular}
            fontSize={tamTitulo(titulo)}
            opacity={aparece}
          >
            {titulo}
          </text>

          {/* ── La recta de acción de la fuerza, para que el brazo efectivo se entienda ── */}
          <line
            x1={punto.x - ux * 560}
            y1={punto.y - uy * 560}
            x2={punto.x + ux * 360}
            y2={punto.y + uy * 360}
            stroke={COLOR.linea}
            strokeWidth={2}
            strokeDasharray="10 12"
            opacity={aparece * 0.9}
          />

          {/* ── El brazo de palanca efectivo (r·sen θ) ── */}
          <line
            x1={EJE.x}
            y1={EJE.y}
            x2={pieBrazo.x}
            y2={pieBrazo.y}
            stroke={COLOR.dorado}
            strokeWidth={5}
            strokeDasharray="8 10"
            opacity={muestraAngulo}
          />

          {/* Marca de ángulo recto: el brazo efectivo es PERPENDICULAR a la recta de
              acción, y es lo único que explica por qué se acorta al torcer la fuerza. */}
          <g opacity={muestraAngulo * 0.9}>
            <path
              d={`M ${pieBrazo.x - ux * 22} ${pieBrazo.y - uy * 22}
                  L ${pieBrazo.x - ux * 22 + (pieBrazo.x - EJE.x) / Math.max(1, Math.hypot(pieBrazo.x - EJE.x, pieBrazo.y - EJE.y)) * -22}
                    ${pieBrazo.y - uy * 22 + (pieBrazo.y - EJE.y) / Math.max(1, Math.hypot(pieBrazo.x - EJE.x, pieBrazo.y - EJE.y)) * -22}`}
              stroke={COLOR.dorado}
              strokeWidth={3}
              fill="none"
            />
          </g>

          {/* ── La llave ── */}
          <line
            x1={EJE.x}
            y1={EJE.y}
            x2={EJE.x + largoPx}
            y2={EJE.y}
            stroke={COLOR.textoTenue}
            strokeWidth={26}
            strokeLinecap="round"
            opacity={aparece * 0.45}
          />
          <line
            x1={EJE.x}
            y1={EJE.y}
            x2={punto.x}
            y2={punto.y}
            stroke={COLOR.celeste}
            strokeWidth={26}
            strokeLinecap="round"
            opacity={aparece}
          />

          {/* ── El eje (el perno) ── */}
          <circle cx={EJE.x} cy={EJE.y} r={26} fill={COLOR.fondoAlto} stroke={COLOR.texto} strokeWidth={5} opacity={aparece} />
          <circle cx={EJE.x} cy={EJE.y} r={7} fill={COLOR.texto} opacity={aparece} />

          {/* ── La fuerza ── */}
          <defs>
            <marker id="punta" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" fill={COLOR.verde} />
            </marker>
          </defs>
          <line
            x1={punto.x}
            y1={punto.y}
            x2={puntaFuerza.x}
            y2={puntaFuerza.y}
            stroke={COLOR.verde}
            strokeWidth={10}
            markerEnd="url(#punta)"
            opacity={aparece}
          />
          <circle cx={punto.x} cy={punto.y} r={11} fill={COLOR.verde} opacity={aparece} />

          {/* ── Cifras. Van en FUENTE.texto porque llevan símbolos y unidades. ── */}
          <g opacity={aparece} fontFamily={FUENTE.texto}>
            <text x={120} y={330} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaFuerza}
            </text>
            <text x={120} y={390} fill={COLOR.verde} fontSize={TAM.subtitulo}>
              {cifra(fuerzaN, 0)} N
            </text>

            <text x={120} y={480} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaBrazo}
            </text>
            <text x={120} y={540} fill={COLOR.celeste} fontSize={TAM.subtitulo}>
              {cifra(rM, 2)} m
            </text>

            <g opacity={muestraAngulo}>
              <text x={120} y={630} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
                {etiquetaAngulo}
              </text>
              <text x={120} y={690} fill={COLOR.dorado} fontSize={TAM.subtitulo}>
                {cifra(anguloDeg, 0)}°
              </text>
            </g>
          </g>

          {/* ── La barra: el resultado del cálculo ── */}
          <g opacity={aparece}>
            <rect
              x={barra.x}
              y={barra.y}
              width={barra.ancho}
              height={barra.alto}
              fill="none"
              stroke={COLOR.linea}
              strokeWidth={3}
              rx={10}
            />
            <rect
              x={barra.x}
              y={barra.y + barra.alto * (1 - fraccionBarra)}
              width={barra.ancho}
              height={barra.alto * fraccionBarra}
              fill={COLOR.dorado}
              rx={10}
            />
            <text
              x={barra.x + barra.ancho / 2}
              y={barra.y - 34}
              textAnchor="middle"
              fill={COLOR.textoTenue}
              fontFamily={FUENTE.texto}
              fontSize={TAM.etiqueta}
            >
              {etiquetaTorque}
            </text>
            <text
              x={barra.x + barra.ancho / 2}
              y={barra.y + barra.alto + 74}
              textAnchor="middle"
              fill={COLOR.dorado}
              fontFamily={FUENTE.texto}
              fontSize={TAM.subtitulo}
            >
              {cifra(tau)} N·m
            </text>
          </g>

          {/* ── La fórmula, en la fuente que sí tiene griego ── */}
          <text
            x={1640}
            y={180}
            textAnchor="middle"
            fill={COLOR.texto}
            fontFamily={FUENTE.formula}
            fontSize={TAM.destacado}
            opacity={aparece}
          >
            τ = r · F · sen θ
          </text>

          <text
            x={120}
            y={1010}
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
