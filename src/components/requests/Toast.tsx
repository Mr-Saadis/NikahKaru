'use client';

import { useEffect, useState } from 'react';

// ============================================================
// Toast — Ephemeral notification pill (absolute inside left col)
// ============================================================

interface ToastProps {
  message: string | null;
  onDone: () => void;
}

export default function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 350);
    }, 1400);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 28,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '8px'})`,
        opacity: visible ? 1 : 0,
        transition: 'opacity .3s, transform .3s',
        background: '#111',
        color: '#fff',
        fontSize: 12,
        fontWeight: 500,
        padding: '9px 18px',
        borderRadius: 9999,
        whiteSpace: 'nowrap',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  );
}
