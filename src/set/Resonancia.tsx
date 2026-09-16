import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from '../comun/Fondo';
import { COLOR, FUENTE, TAM } from '../theme';
import { tamTitulo } from '../utiles/texto';
import { useFrameDeDiseno } from '../utiles/ritmo';

/**
 * SET · `resonancia`
 *
 * Por qué una estructura aguanta un empujón fuerte y se cae con uno suave.
 *
 * El empujón **no cambia de tamaño en toda la pieza**: lo único que cambia es cada
 * cuánto llega. Esa es la idea entera, y por eso la fuerza se dibuja siempre igual.
 *
 * Dos paneles que se explican mutuamente:
 *
 *   - **Arriba, la curva de respuesta**, que se va trazando a medida que barre la
 *     frecuencia. Es el mapa: dice de antemano dónde está el peligro.
 *   - **Abajo, el edificio**, oscilando con la amplitud que la curva marca en ese
 *     instante. Es el territorio.
 *
 * ⚠️ **La amplitud del edificio NO se anima aparte: sale de la misma función que dibuja
 * la curva.** Si se animaran por separado, el edificio podría sacudirse donde la curva
 * dice que no pasa nada, y la pieza estaría mintiendo sin que se note. Acá el punto
 * rojo sobre la curva y el temblor de abajo son el mismo número.
 *
 * El amortiguamiento es un parámetro y no una constante escrita adentro porque es
 * justamente lo que un ingeniero diseña: con ζ grande el pico se aplasta, y eso es lo
 * que hace un amortiguador de masa sintonizada en un rascacielos.
 */
export type PropsResonancia = {
  fondo: boolean;
  titulo: string;
  /** Frecuencia propia de la estructura, en hercios. */
  frecuenciaPropiaHz: number;
  /** Razón de amortiguamiento ζ. Bajo = pico alto y angosto. */
  amortiguamiento: number;
  etiquetaImpulso: string;
  etiquetaFrecuencia: string;
  etiquetaAmplitud: string;
  etiquetaPropia: string;
  textoLejos: string;
  textoCerca: string;
  notaAlPie: string;
};

export const propsResonancia: PropsResonancia = {
  fondo: true,
  titulo: 'La misma fuerza, a distinto ritmo',
  frecuenciaPropiaHz: 1,
  amortiguamiento: 0.06,
  etiquetaImpulso: 'Fuerza aplicada',
  etiquetaFrecuencia: 'Ritmo del empujón',
  etiquetaAmplitud: 'Cuánto se mueve',
  etiquetaPropia: 'Frecuencia propia',
  textoLejos: 'Fuera de su ritmo, la estructura apenas responde.',
  textoCerca: 'En su frecuencia propia, cada empujón llega justo a tiempo y se suman.',
  notaAlPie: 'Oscilador forzado con amortiguamiento ζ = 0,06. FísicaEterna, CC BY 4.0',
};

const DISENO = 360;

/** Caja de la curva de respuesta. */
const G = { x: 980, y: 250, ancho: 780, alto: 380 };
/** El edificio. */
const BASE = { x: 420, y: 880 };
const PISOS = 6;
const ALTO_PISO = 88;
const ANCHO = 190;

export const Resonancia: React.FC<PropsResonancia> = ({
  fondo,
  titulo,
  frecuenciaPropiaHz,
  amortiguamiento,
  etiquetaImpulso,
  etiquetaFrecuencia,
  etiquetaAmplitud,
  etiquetaPropia,
  textoLejos,
  textoCerca,
  notaAlPie,
}) => {
  const { durationInFrames } = useVideoConfig();
  const f = useFrameDeDiseno(DISENO, useCurrentFrame(), durationInFrames);

  /*
   * Respuesta de un oscilador forzado, normalizada a la respuesta estática:
   *
   *     A(r) = 1 / √( (1 − r²)² + (2ζr)² )      con  r = ω / ω₀
   *
   * Es UNA función y la usan los dos paneles: la curva de arriba la evalúa en todo el
   * rango, y el edificio de abajo la evalúa en la frecuencia actual. De ahí que no
   * puedan contradecirse.
   */
  const respuesta = (razon: number) =>
    1 / Math.sqrt((1 - razon * razon) ** 2 + (2 * amortiguamiento * razon) ** 2);

  const R_MAX = 2.2;
  const A_MAX = respuesta(1); // el pico: fija la escala del eje

  // ── El barrido ────────────────────────────────────────────────────────────
  const razon = interpolate(f, [30, DISENO], [0.25, R_MAX], { extrapolateLeft: 'clamp' });
  const amplitudRelativa = respuesta(razon) / A_MAX;
  const frecuenciaHz = razon * frecuenciaPropiaHz;
  const cerca = Math.abs(razon - 1) < 0.16;

  // ── Dibujo de la curva ────────────────────────────────────────────────────
  const cX = (r: number) => G.x + (r / R_MAX) * G.ancho;
  const cY = (a: number) => G.y + G.alto - (a / A_MAX) * (G.alto - 20);

  const trazo = (hasta: number) => {
    const pasos = 260;
    const pts: string[] = [];
    for (let i = 0; i <= pasos; i++) {
      const r = (i / pasos) * R_MAX;
      if (r > hasta) break;
      pts.push(`${pts.length === 0 ? 'M' : 'L'} ${cX(r).toFixed(1)} ${cY(respuesta(r)).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  // ── El edificio ───────────────────────────────────────────────────────────
  // Oscila a la frecuencia del empujón, con la amplitud que manda la curva.
  const fase = (f / 30) * frecuenciaHz * 2 * Math.PI;
  const DESVIO_MAX = 150;
  const desvio = Math.sin(fase) * amplitudRelativa * DESVIO_MAX;

  const aparece = interpolate(f, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const cifra = (v: number, dec = 2) => v.toFixed(dec).replace('.', ',');

  return (
    <Fondo fondo={fondo}>
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <text
            x={110}
            y={130}
            fill={COLOR.texto}
            fontFamily={FUENTE.titular}
            fontSize={tamTitulo(titulo, 1700)}
            opacity={aparece}
          >
            {titulo}
          </text>

          {/* ══ El edificio ══ */}
          <g opacity={aparece}>
            {/* Suelo */}
            <line
              x1={BASE.x - 260}
              y1={BASE.y}
              x2={BASE.x + 260}
              y2={BASE.y}
              stroke={COLOR.linea}
              strokeWidth={5}
            />

            {Array.from({ length: PISOS }, (_, i) => {
              // Cada piso se desplaza proporcionalmente a su altura: los de arriba
              // acumulan todo el movimiento de los de abajo.
              const frac = (i + 1) / PISOS;
              const dx = desvio * frac;
              const dxPrev = desvio * (i / PISOS);
              const y = BASE.y - (i + 1) * ALTO_PISO;
              const yPrev = BASE.y - i * ALTO_PISO;
              return (
                <g key={i}>
                  {/* Columnas */}
                  <line x1={BASE.x - ANCHO / 2 + dxPrev} y1={yPrev} x2={BASE.x - ANCHO / 2 + dx} y2={y} stroke={COLOR.textoTenue} strokeWidth={7} />
                  <line x1={BASE.x + ANCHO / 2 + dxPrev} y1={yPrev} x2={BASE.x + ANCHO / 2 + dx} y2={y} stroke={COLOR.textoTenue} strokeWidth={7} />
                  {/* Losa */}
                  <line x1={BASE.x - ANCHO / 2 + dx} y1={y} x2={BASE.x + ANCHO / 2 + dx} y2={y} stroke={cerca ? COLOR.rojo : COLOR.celeste} strokeWidth={11} strokeLinecap="round" />
                </g>
              );
            })}

            {/* La fuerza: SIEMPRE del mismo tamaño. Ése es el argumento. */}
            <g>
              <defs>
                <marker id="pf" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                  <path d="M0,0 L9,4.5 L0,9 Z" fill={COLOR.verde} />
                </marker>
              </defs>
              <line
                x1={BASE.x - ANCHO / 2 + desvio - 190}
                y1={BASE.y - PISOS * ALTO_PISO}
                x2={BASE.x - ANCHO / 2 + desvio - 30}
                y2={BASE.y - PISOS * ALTO_PISO}
                stroke={COLOR.verde}
                strokeWidth={9}
                markerEnd="url(#pf)"
                opacity={0.35 + 0.65 * Math.max(0, Math.sin(fase))}
              />
              <text
                x={BASE.x - ANCHO / 2 - 110}
                y={BASE.y - PISOS * ALTO_PISO - 34}
                textAnchor="middle"
                fill={COLOR.verde}
                fontFamily={FUENTE.texto}
                fontSize={TAM.pie}
              >
                {etiquetaImpulso}
              </text>
            </g>
          </g>

          {/* ══ La curva de respuesta ══ */}
          <g opacity={aparece}>
            <line x1={G.x} y1={G.y + G.alto} x2={G.x + G.ancho} y2={G.y + G.alto} stroke={COLOR.linea} strokeWidth={2} />
            <line x1={G.x} y1={G.y} x2={G.x} y2={G.y + G.alto} stroke={COLOR.linea} strokeWidth={2} />

            {/* La frecuencia propia: la vertical del peligro */}
            <line
              x1={cX(1)}
              y1={G.y}
              x2={cX(1)}
              y2={G.y + G.alto}
              stroke={COLOR.rojo}
              strokeWidth={2}
              strokeDasharray="7 9"
              opacity={0.75}
            />
            <text
              x={cX(1)}
              y={G.y - 16}
              textAnchor="middle"
              fill={COLOR.rojo}
              fontFamily={FUENTE.texto}
              fontSize={TAM.pie}
            >
              {etiquetaPropia}
            </text>

            <path d={trazo(razon)} fill="none" stroke={COLOR.dorado} strokeWidth={4} />
            <circle cx={cX(razon)} cy={cY(respuesta(razon))} r={10} fill={cerca ? COLOR.rojo : COLOR.dorado} />

            {/* El eje horizontal se rotula con lo que VARÍA (el ritmo), no con la
                respuesta: ésa ya tiene su cifra abajo y repetirla confundía. */}
            <text
              x={G.x + G.ancho}
              y={G.y + G.alto + 42}
              textAnchor="end"
              fill={COLOR.textoTenue}
              fontFamily={FUENTE.texto}
              fontSize={TAM.pie}
            >
              {etiquetaFrecuencia} →
            </text>
          </g>

          {/* ══ Cifras ══ */}
          <g opacity={aparece} fontFamily={FUENTE.texto}>
            <text x={980} y={760} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaFrecuencia}
            </text>
            <text x={980} y={820} fill={cerca ? COLOR.rojo : COLOR.dorado} fontSize={TAM.subtitulo}>
              {cifra(frecuenciaHz)} Hz
            </text>

            <text x={1380} y={760} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaAmplitud}
            </text>
            <text x={1380} y={820} fill={cerca ? COLOR.rojo : COLOR.celeste} fontSize={TAM.subtitulo}>
              {cifra(respuesta(razon), 1)}×
            </text>
          </g>

          <text
            x={980}
            y={900}
            fill={cerca ? COLOR.rojo : COLOR.textoTenue}
            fontFamily={FUENTE.texto}
            fontSize={TAM.cuerpo}
            opacity={aparece}
          >
            {cerca ? textoCerca : textoLejos}
          </text>

          <text
            x={110}
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
