import React from 'react';

const STATUS_CONFIG = {
  Submitted: {
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.10)',
    border: 'rgba(107, 114, 128, 0.20)',
    label: 'Submitted',
  },
  Analyzing: {
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.10)',
    border: 'rgba(59, 130, 246, 0.20)',
    label: 'Analyzing',
  },
  PendingApproval: {
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.10)',
    border: 'rgba(139, 92, 246, 0.20)',
    label: 'Pending Approval',
  },
  Scheduled: {
    color: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.10)',
    border: 'rgba(14, 165, 233, 0.20)',
    label: 'Scheduled',
  },
  Completed: {
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.10)',
    border: 'rgba(16, 185, 129, 0.20)',
    label: 'Completed',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Submitted;

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
        }}
      />
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
