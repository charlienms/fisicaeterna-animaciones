import React from 'react';
import { Composition } from 'remotion';
import { LIENZO } from './theme';
import { framesDeSegundos } from './utiles/ritmo';
import { Torque, propsTorque } from './set/Torque';
import { Paralaje, propsParalaje } from './set/Paralaje';
import { Aliasing, propsAliasing } from './set/Aliasing';
import { Resonancia, propsResonancia } from './set/Resonancia';
import { Fourier, propsFourier } from './set/Fourier';
import { Doppler, propsDoppler } from './set/Doppler';
import { Trilateracion, propsTrilateracion } from './set/Trilateracion';
import { Aislamiento, propsAislamiento } from './set/Aislamiento';
import { Ecografia, propsEcografia } from './set/Ecografia';

/**
 * Registro de composiciones: lo que aparece en el Studio y lo que lee el render.
 *
 * Convención de IDs: `C<nn>-<Pieza>` y `C<nn>-<Pieza>-EN`. El nombre es interfaz, no
 * decoración: de acá salen los nombres de archivo y los comandos de render.
 *
 * ⚠️ **Cada concepto son DOS composiciones y UN componente.** Lo único que cambia entre
 * los dos idiomas son las props de texto. Si alguna vez hay que duplicar el componente
 * para traducirlo, es señal de que algo se escribió adentro que debería ser una prop.
 *
 * `durationInFrames` sale de `framesDeSegundos(<segundos>)`, y esos segundos salen de
 * contar las palabras que se dicen encima ÷ 2,7. Ningún número elegido a mano.
 */
export const RemotionRoot: React.FC = () => {
  const base = { width: LIENZO.ancho, height: LIENZO.alto, fps: LIENZO.fps } as const;
  return (
    <>
      {/* ── C01 · Ingeniería — torque ── */}
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

      {/* ── C02 · Ciencia — paralaje estelar ── */}
      <Composition
        id="C02-Paralaje"
        component={Paralaje}
        durationInFrames={framesDeSegundos(14)}
        {...base}
        defaultProps={propsParalaje}
      />
      <Composition
        id="C02-Paralaje-EN"
        component={Paralaje}
        durationInFrames={framesDeSegundos(14)}
        {...base}
        defaultProps={{
          ...propsParalaje,
          titulo: "Measuring a star with Earth's two eyes",
          etiquetaDistancia: 'Distance',
          etiquetaParalaje: 'Parallax',
          etiquetaBase: 'Baseline: 2 AU (the whole orbit)',
          etiquetaEnero: 'January',
          etiquetaJulio: 'July',
          rotuloMecanismo: 'What happens',
          rotuloTelescopio: 'What you see',
          notaAlPie:
            'Angle exaggerated ~10,000×: the real parallax is 0.77″. FísicaEterna, CC BY 4.0',
        }}
      />

      {/* ── C03 · Tecnología — aliasing ── */}
      <Composition
        id="C03-Aliasing"
        component={Aliasing}
        durationInFrames={framesDeSegundos(14)}
        {...base}
        defaultProps={propsAliasing}
      />
      <Composition
        id="C03-Aliasing-EN"
        component={Aliasing}
        durationInFrames={framesDeSegundos(14)}
        {...base}
        defaultProps={{
          ...propsAliasing,
          titulo: 'The frequency nobody played',
          etiquetaSenal: 'Real signal',
          etiquetaMuestreo: 'Sampling rate',
          etiquetaAlias: 'What gets reconstructed',
          avisoNyquist: 'Nyquist limit: 2 × 10 Hz = 20 Hz',
          textoSeguro: 'With sampling to spare, the dots trace the real wave.',
          textoRoto: 'Below the limit, the same dots trace another wave. Slower. False.',
          notaAlPie: 'This is why audio is digitised at 44,100 Hz. FísicaEterna, CC BY 4.0',
        }}
      />

      {/* ── C04 · Ingeniería — resonancia ── */}
      <Composition
        id="C04-Resonancia"
        component={Resonancia}
        durationInFrames={framesDeSegundos(14)}
        {...base}
        defaultProps={propsResonancia}
      />
      <Composition
        id="C04-Resonancia-EN"
        component={Resonancia}
        durationInFrames={framesDeSegundos(14)}
        {...base}
        defaultProps={{
          ...propsResonancia,
          titulo: 'The same force, at a different rhythm',
          etiquetaImpulso: 'Applied force',
          etiquetaFrecuencia: 'Rhythm of the push',
          etiquetaAmplitud: 'How much it moves',
          etiquetaPropia: 'Natural frequency',
          textoLejos: 'Away from its rhythm, the structure barely responds.',
          textoCerca: 'At its natural frequency, every push lands on time and they add up.',
          notaAlPie: 'Driven oscillator with damping ζ = 0.06. FísicaEterna, CC BY 4.0',
        }}
      />

      {/* ── C05 · Matemática — series de Fourier ── */}
      <Composition
        id="C05-Fourier"
        component={Fourier}
        durationInFrames={framesDeSegundos(14)}
        {...base}
        defaultProps={propsFourier}
      />
      <Composition
        id="C05-Fourier-EN"
        component={Fourier}
        durationInFrames={framesDeSegundos(14)}
        {...base}
        defaultProps={{
          ...propsFourier,
          titulo: 'A corner built from nothing but curves',
          etiquetaTerminos: 'Harmonics added',
          etiquetaObjetivo: 'The wave we are after',
          etiquetaSuma: 'The sum',
          etiquetaGibbs: 'Gibbs phenomenon: it never shrinks, only narrows',
          notaAlPie: 'Fourier series of a square wave. FísicaEterna, CC BY 4.0',
        }}
      />

      {/* ── C06 · Ciencia — efecto Doppler ── */}
      <Composition
        id="C06-Doppler"
        component={Doppler}
        durationInFrames={framesDeSegundos(14)}
        {...base}
        defaultProps={propsDoppler}
      />
      <Composition
        id="C06-Doppler-EN"
        component={Doppler}
        durationInFrames={framesDeSegundos(14)}
        {...base}
        defaultProps={{
          ...propsDoppler,
          titulo: 'The siren never changed. Your position did',
          etiquetaEmitida: 'What it emits',
          etiquetaAdelante: 'Coming towards you',
          etiquetaAtras: 'Going away',
          rotuloFuente: 'Race car · 324 km/h',
          notaAlPie: "f' = f · c / (c ∓ v). FísicaEterna, CC BY 4.0",
        }}
      />

      {/* ── C07 · Tecnología — trilateración (GPS) ── */}
      <Composition
        id="C07-Trilateracion"
        component={Trilateracion}
        durationInFrames={framesDeSegundos(18)}
        {...base}
        defaultProps={propsTrilateracion}
      />
      <Composition
        id="C07-Trilateracion-EN"
        component={Trilateracion}
        durationInFrames={framesDeSegundos(18)}
        {...base}
        defaultProps={{
          ...propsTrilateracion,
          titulo: 'Three distances and they know where you are',
          pasos: [
            'With one satellite: you are somewhere on this circle',
            'With two: two candidates left',
            'With three: only one is left',
            'If your clock runs late, the three circles stop meeting',
          ] as [string, string, string, string],
          etiquetaSatelite: 'Satellite',
          etiquetaTu: 'You',
          etiquetaCandidato: 'Candidate',
          etiquetaError: 'Clock error',
          notaAlPie:
            'A 2D sketch of a 3D problem: in space they are spheres. FísicaEterna, CC BY 4.0',
        }}
      />

      {/* ── C08 · Tu casa — aislamiento sísmico ── */}
      <Composition
        id="C08-Aislamiento"
        component={Aislamiento}
        durationInFrames={framesDeSegundos(16)}
        {...base}
        defaultProps={propsAislamiento}
      />
      <Composition
        id="C08-Aislamiento-EN"
        component={Aislamiento}
        durationInFrames={framesDeSegundos(16)}
        {...base}
        defaultProps={{
          ...propsAislamiento,
          titulo: 'The same earthquake, two identical buildings',
          rotuloEmpotrado: 'Fixed to the ground',
          rotuloAislado: 'On base isolators',
          etiquetaPeriodo: 'Natural period',
          etiquetaAmplifica: 'Moves the top',
          etiquetaSuelo: 'The ground moves like this',
          etiquetaAislador: 'This is doing the work',
          notaAlPie:
            'Transmissibility of a base-excited oscillator. FísicaEterna, CC BY 4.0',
        }}
      />

      {/* ── C09 · Tu cuerpo — ecografía ── */}
      <Composition
        id="C09-Ecografia"
        component={Ecografia}
        durationInFrames={framesDeSegundos(18)}
        {...base}
        defaultProps={propsEcografia}
      />
      <Composition
        id="C09-Ecografia-EN"
        component={Ecografia}
        durationInFrames={framesDeSegundos(18)}
        {...base}
        defaultProps={{
          ...propsEcografia,
          titulo: 'A machine that only knows how to time echoes',
          etiquetasFronteras: ['Fat', 'Wall of the womb', 'The baby'] as [string, string, string],
          etiquetaTransductor: 'Probe',
          etiquetaEcos: 'The only thing that comes back',
          ejeProfundidad: 'Depth',
          ejeTiempo: 'Time since the pulse',
          etiquetaReconstruido: 'What the machine works out',
          pasos: [
            'A pulse of sound goes in and travels down',
            'At each boundary part of it bounces, and the rest keeps going',
            'From the arrival times it solves for the depths',
          ] as [string, string, string],
          notaAlPie:
            'A-mode (one line). The hospital image sweeps hundreds. It assumes 1540 m/s everywhere, exactly as the real machine does. FísicaEterna, CC BY 4.0',
        }}
      />
    </>
  );
};
