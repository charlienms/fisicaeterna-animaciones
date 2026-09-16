import React from 'react';
import { Composition } from 'remotion';
import { LIENZO } from './theme';
import { framesDeSegundos } from './utiles/ritmo';
import { Torque, propsTorque } from './set/Torque';

/**
 * Registro de composiciones: lo que aparece en el Studio y lo que lee el render.
 *
 * Convención de IDs: `<código>-<Pieza>`. El nombre es interfaz, no decoración.
 *
 * `durationInFrames` sale de `framesDeSegundos(<segundos de la toma>)`, y esos segundos
 * salen de contar las palabras que se dicen encima ÷ 2,7. Ningún número a mano.
 */
export const RemotionRoot: React.FC = () => {
  const base = { width: LIENZO.ancho, height: LIENZO.alto, fps: LIENZO.fps } as const;
  return (
    <>
      {/* ── CONCEPTO 01 — torque ── */}
      <Composition
        id="C01-Torque"
        component={Torque}
        durationInFrames={framesDeSegundos(12)}
        {...base}
        defaultProps={propsTorque}
      />
      <Composition
        id="C01-Torque-EN"
        component={Torque}
        durationInFrames={framesDeSegundos(12)}
        {...base}
        defaultProps={{
          ...propsTorque,
          titulo: 'Why where you push matters',
          etiquetaFuerza: 'Force',
          etiquetaBrazo: 'Distance to the axis',
          etiquetaAngulo: 'Angle',
          etiquetaTorque: 'Torque',
          notaAlPie: 'τ = r · F · sin θ — FísicaEterna, CC BY 4.0',
        }}
      />
    </>
  );
};
