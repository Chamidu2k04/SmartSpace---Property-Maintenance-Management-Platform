import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import UrgencyBadge from '../UrgencyBadge';
import { Clock } from 'lucide-react';

export default function TicketCard({ ticket }) {
  const navigate = useNavigate();
  
  const getShortId = (id) => {
    if (!id) return '';
    return `#T-${id.substring(0, 8).toUpperCase()}`;
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div 
      onClick={() => navigate(`/tenant/ticket/${ticket.id}`)}
      className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 group"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              {getShortId(ticket.id)}
            </span>
            <span className="text-xs font-bold text-slate-900 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md">
              Unit {ticket.unitNumber || '—'}
            </span>
          </div>
          <p className="text-slate-800 text-sm font-medium line-clamp-2 mt-2 leading-relaxed">
            {ticket.description}
          </p>
        </div>
        {ticket.thumbnailUrl && (
          <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0 border border-slate-200 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
            <img 
              src={`http://localhost:5030${ticket.thumbnailUrl.startsWith('/') ? '' : '/'}${ticket.thumbnailUrl}`} 
              alt="Thumbnail" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={ticket.status} />
          <UrgencyBadge urgency={ticket.urgencyLevel} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDate(ticket.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
