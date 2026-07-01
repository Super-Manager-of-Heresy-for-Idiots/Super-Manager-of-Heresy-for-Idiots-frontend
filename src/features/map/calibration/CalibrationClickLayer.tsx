import type { PointerEvent as ReactPointerEvent } from 'react';
import type { ImagePoint } from '../types';
import { useMapViewportContext } from '../components/MapViewportContext';
import s from './calibration.module.css';

interface CalibrationClickLayerProps {
  instruction: string;
  onPick: (point: ImagePoint) => void;
}

export function CalibrationClickLayer({ instruction, onPick }: CalibrationClickLayerProps) {
  const { viewport, imageSize } = useMapViewportContext();
  if (!imageSize) return null;

  const pick = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    onPick({
      imageX: (e.clientX - rect.left) / viewport.scale,
      imageY: (e.clientY - rect.top) / viewport.scale,
    });
  };

  return (
    <button
      type="button"
      className={s.clickLayer}
      style={{ width: imageSize.width, height: imageSize.height }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onPointerUp={pick}
      aria-label={instruction}
      title={instruction}
    >
      <span className={s.clickInstruction}>{instruction}</span>
    </button>
  );
}
