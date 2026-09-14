import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import UrgencyBadge from '../UrgencyBadge';
import { Clock, Image as ImageIcon } from 'lucide-react';

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
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col gap-4"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {getShortId(ticket.id)}
            </span>
            <span className="text-sm font-semibold text-gray-900">
              Unit {ticket.unitNumber}
            </span>
          </div>
          <p className="text-gray-700 text-sm line-clamp-2 mt-2 leading-relaxed">
            {ticket.description}
          </p>
        </div>
        {ticket.thumbnailUrl && (
          <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 border border-gray-200 overflow-hidden flex items-center justify-center">
            <img 
              src={`http://localhost:5030${ticket.thumbnailUrl.startsWith('/') ? '' : '/'}${ticket.thumbnailUrl}`} 
              alt="Thumbnail" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <UrgencyBadge urgency={ticket.urgencyLevel} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium shrink-0">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(ticket.createdAt)}
        </div>
      </div>
    </div>
  );
}
