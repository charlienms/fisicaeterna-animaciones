import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Fondo } from '../comun/Fondo';
import { COLOR, FUENTE, TAM } from '../theme';
import { tamTitulo } from '../utiles/texto';
import { useFrameDeDiseno } from '../utiles/ritmo';

/**
 * SET · `fourier`
 *
 * Una onda con esquinas, hecha con puras curvas.
 *
 * Se van sumando senos de frecuencia impar creciente. Con uno, la suma es un seno. Con
 * tres ya se adivina un escalón. Con treinta y uno cuesta creer que no haya una sola
 * recta en el dibujo.
 *
 * ⚠️ **Las orejas de los bordes no son un error de la animación: son el fenómeno de
 * Gibbs.** Aparecen solas al sumar la serie y **no se achican** por muchos términos que
 * se agreguen; solo se angostan. Salen del cálculo, y precisamente por eso la pieza
 * puede señalarlas: si el escalón estuviera dibujado a mano, no estarían, y la pieza
 * enseñaría algo falso sin que nadie lo notara.
 *
 * Los armónicos sueltos se dibujan tenues detrás de la suma porque la pregunta que
 * todo el mundo se hace —«¿de dónde sale la esquina?»— se contesta viéndolos: cada uno
 * es una curva suave, y la esquina es lo que queda cuando se cancelan entre ellos.
 */
export type PropsFourier = {
  fondo: boolean;
  titulo: string;
  /** Cuántos armónicos impares se alcanzan al final. */
  terminosFinales: number;
  etiquetaTerminos: string;
  etiquetaObjetivo: string;
  etiquetaSuma: string;
  etiquetaGibbs: string;
  notaAlPie: string;
};

export const propsFourier: PropsFourier = {
  fondo: true,
  titulo: 'Una esquina hecha con puras curvas',
  terminosFinales: 25,
  etiquetaTerminos: 'Armónicos sumados',
  etiquetaObjetivo: 'La onda que se busca',
  etiquetaSuma: 'La suma',
  etiquetaGibbs: 'Fenómeno de Gibbs: no se achica, solo se angosta',
  notaAlPie: 'Serie de Fourier de una onda cuadrada. FísicaEterna, CC BY 4.0',
};

const DISENO = 360;

const G = { x: 220, y: 300, ancho: 1480, alto: 420 };
/** Periodos visibles de lado a lado. */
const PERIODOS = 2;

export const Fourier: React.FC<PropsFourier> = ({
  fondo,
  titulo,
  terminosFinales,
  etiquetaTerminos,
  etiquetaObjetivo,
  etiquetaSuma,
  etiquetaGibbs,
  notaAlPie,
}) => {
  const { durationInFrames } = useVideoConfig();
  const f = useFrameDeDiseno(DISENO, useCurrentFrame(), durationInFrames);

  /*
   * Cuántos armónicos hay ahora. Avanza por SALTOS y no de forma continua: sumar «2,4
   * armónicos» no significa nada, y ver el salto es justamente lo que deja comparar un
   * paso con el siguiente.
   *
   * Avanza con la raíz del tiempo porque los primeros términos cambian mucho el dibujo y
   * los últimos casi nada: repartido lineal, la mitad del clip no mostraría diferencia.
   */
  const avance = interpolate(f, [30, DISENO - 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const nImpares = Math.max(1, Math.round(1 + Math.sqrt(avance) * (terminosFinales - 1)));
  // Solo los impares: 1, 3, 5, 7… Los pares valen cero en una onda cuadrada.
  const impares = Array.from({ length: nImpares }, (_, i) => 2 * i + 1);

  /*
   * La serie:  s(x) = (4/π) · Σ  sen(k·x) / k      con k impar
   *
   * El 4/π no es un ajuste visual: es el coeficiente que hace que la suma tienda a ±1.
   */
  const suma = (x: number) =>
    (4 / Math.PI) * impares.reduce((acc, k) => acc + Math.sin(k * x) / k, 0);

  const armonico = (k: number, x: number) => (4 / Math.PI) * (Math.sin(k * x) / k);

  const y0 = G.y + G.alto / 2;
  const escala = G.alto / 2 - 40;
  const aX = (x: number) => G.x + (x / (PERIODOS * 2 * Math.PI)) * G.ancho;
  const aY = (v: number) => y0 - v * escala;

  const trazar = (fn: (x: number) => number, pasos: number) =>
    Array.from({ length: pasos + 1 }, (_, i) => {
      const x = (i / pasos) * PERIODOS * 2 * Math.PI;
      return `${i === 0 ? 'M' : 'L'} ${aX(x).toFixed(1)} ${aY(fn(x)).toFixed(1)}`;
    }).join(' ');

  // La onda objetivo, con sus saltos verticales explícitos.
  const cuadrada = () => {
    const seg: string[] = [];
    for (let p = 0; p < PERIODOS; p++) {
      const x0 = p * 2 * Math.PI;
      const xm = x0 + Math.PI;
      const x1 = x0 + 2 * Math.PI;
      seg.push(`M ${aX(x0)} ${aY(1)} L ${aX(xm)} ${aY(1)} L ${aX(xm)} ${aY(-1)} L ${aX(x1)} ${aY(-1)}`);
    }
    return seg.join(' ');
  };

  const aparece = interpolate(f, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  // Gibbs solo se señala cuando ya hay términos suficientes para que se vea.
  const muestraGibbs = nImpares >= 5 ? 1 : 0;

  return (
    <Fondo fondo={fondo}>
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <text
            x={220}
            y={140}
            fill={COLOR.texto}
            fontFamily={FUENTE.titular}
            fontSize={tamTitulo(titulo, 1480)}
            opacity={aparece}
          >
            {titulo}
          </text>

          <line x1={G.x} y1={y0} x2={G.x + G.ancho} y2={y0} stroke={COLOR.linea} strokeWidth={2} opacity={aparece} />

          {/* La onda objetivo, detrás: es la referencia contra la que se compara */}
          {/* Punteada y clara: si no se distingue de la suma, no hay con qué comparar,
              y toda la pieza es una comparación. */}
          <path
            d={cuadrada()}
            fill="none"
            stroke={COLOR.textoTenue}
            strokeWidth={3}
            strokeDasharray="12 10"
            opacity={aparece * 0.85}
          />

          {/* Cada armónico suelto, tenue. Acá se ve que todos son curvas. */}
          <g opacity={aparece * 0.28}>
            {impares.slice(0, 9).map((k) => (
              <path
                key={k}
                d={trazar((x) => armonico(k, x), 420)}
                fill="none"
                stroke={COLOR.celeste}
                strokeWidth={2}
              />
            ))}
          </g>

          {/* La suma */}
          <path d={trazar(suma, 1400)} fill="none" stroke={COLOR.dorado} strokeWidth={5} opacity={aparece} />

          {/* Señalar una oreja de Gibbs, justo después del salto */}
          <g opacity={muestraGibbs * aparece}>
            <circle cx={aX(Math.PI + 0.12)} cy={aY(suma(Math.PI + 0.12))} r={26} fill="none" stroke={COLOR.rojo} strokeWidth={3} />
            <line
              x1={aX(Math.PI + 0.12) + 24}
              y1={aY(suma(Math.PI + 0.12)) - 20}
              x2={aX(Math.PI + 0.12) + 180}
              y2={aY(suma(Math.PI + 0.12)) - 96}
              stroke={COLOR.rojo}
              strokeWidth={2}
            />
            <text
              x={aX(Math.PI + 0.12) + 192}
              y={aY(suma(Math.PI + 0.12)) - 100}
              fill={COLOR.rojo}
              fontFamily={FUENTE.texto}
              fontSize={TAM.pie}
            >
              {etiquetaGibbs}
            </text>
          </g>

          {/* ══ Cifras ══ */}
          <g opacity={aparece} fontFamily={FUENTE.texto}>
            <text x={220} y={830} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaTerminos}
            </text>
            <text x={220} y={898} fill={COLOR.dorado} fontSize={TAM.titulo}>
              {nImpares}
            </text>

            <text x={560} y={830} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaObjetivo}
            </text>
            <text x={560} y={880} fill={COLOR.textoTenue} fontSize={TAM.cuerpo}>
              ▬▬
            </text>

            <text x={880} y={830} fill={COLOR.textoTenue} fontSize={TAM.etiqueta}>
              {etiquetaSuma}
            </text>
            <text x={880} y={880} fill={COLOR.dorado} fontSize={TAM.cuerpo}>
              ▬▬
            </text>
          </g>

          {/* La serie, en la fuente que sí tiene griego */}
          <text
            x={1700}
            y={880}
            textAnchor="end"
            fill={COLOR.texto}
            fontFamily={FUENTE.formula}
            fontSize={TAM.destacado}
            opacity={aparece}
          >
            (4/π) · Σ sen(k x) / k
          </text>

          <text
            x={220}
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
