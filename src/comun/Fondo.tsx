import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FONDO_DEGRADADO } from '../theme';

/**
 * Fondo de una pieza.
 *
 * `fondo: false` no pinta nada, y es lo que deja salir el ProRes 4444 con transparencia
 * real para superponer la animación sobre el presentador en el editor.
 */
export const Fondo: React.FC<{ fondo: boolean; children?: React.ReactNode }> = ({
  fondo,
  children,
}) => {
  if (!fondo) return <AbsoluteFill>{children}</AbsoluteFill>;
  return <AbsoluteFill style={{ background: FONDO_DEGRADADO }}>{children}</AbsoluteFill>;
};
