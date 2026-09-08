import React from 'react';

const URGENCY_CONFIG = {
  Emergency: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.25)',
    label: 'Emergency',
    pulse: true,
  },
  High: {
    color: '#F97316',
    bg: 'rgba(249, 115, 22, 0.10)',
    border: 'rgba(249, 115, 22, 0.20)',
    label: 'High',
    pulse: false,
  },
  Medium: {
    color: '#EAB308',
    bg: 'rgba(234, 179, 8, 0.10)',
    border: 'rgba(234, 179, 8, 0.20)',
    label: 'Medium',
    pulse: false,
  },
  Low: {
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.10)',
    border: 'rgba(34, 197, 94, 0.20)',
    label: 'Low',
    pulse: false,
  },
};

export default function UrgencyBadge({ urgency }) {
  const config = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.Low;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '1',
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.color,
          flexShrink: 0,
          animation: config.pulse ? 'urgencyPulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      {config.label}

      {/* Inline keyframes for emergency pulse animation */}
      {config.pulse && (
        <style>{`
          @keyframes urgencyPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.6); }
          }
        `}</style>
      )}
    </span>
  );
}

export { URGENCY_CONFIG };
