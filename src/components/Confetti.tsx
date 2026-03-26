'use client';
import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  shape: 'square' | 'circle' | 'rect';
  shade: string;
}

interface ConfettiProps {
  active: boolean;
  count?: number;
}

export default function Confetti({ active, count = 60 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }
    const shades = ['#ffffff', '#e5e5e5', '#cccccc', '#aaaaaa', '#888888', '#555555'];
    const shapes: ConfettiPiece['shape'][] = ['square', 'circle', 'rect'];
    const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 2 + 2,
      delay: Math.random() * 1.5,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      shade: shades[Math.floor(Math.random() * shades.length)],
    }));
    setPieces(newPieces);
    const timer = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(timer);
  }, [active, count]);

  if (!active && pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${p.x}%`,
            width: p.shape === 'rect' ? p.size * 2 : p.size,
            height: p.size,
            backgroundColor: p.shade,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '1px',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
