import Link from 'next/link';
import {Event} from '@/types'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.dateTime);
  const formattedDate = eventDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  
  const remainingSeats = event.maxCapacity - event.currentBookings;
  const fillPercentage = (event.currentBookings / event.maxCapacity) * 100;
  const isFull = remainingSeats === 0;
  const isAlmostFull = remainingSeats > 0 && remainingSeats <= 5;

  return (
    <Link 
      href={`/events/${event._id}`} 
      className="block bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header avec date */}
      <div className="flex items-start justify-between p-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
              <path d="M14 3H4a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2zM2 7h14M6 3v2M12 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>{formattedDate}</span>
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
        </div>
        
        {/* Badge status */}
        {isFull && (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Complet
          </span>
        )}
        {isAlmostFull && !isFull && (
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
            Bientôt complet
          </span>
        )}
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>
        
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-400 flex-shrink-0">
            <path d="M7 13s5-4 5-9A5 5 0 107 4.5 5 5 0 002 4c0 5 5 9 5 9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="line-clamp-1">{event.location}</span>
        </div>

        {/* Capacité - Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-900">
              {remainingSeats} place{remainingSeats > 1 ? 's' : ''} libre{remainingSeats > 1 ? 's' : ''}
            </span>
            <span className="text-gray-500">
              {event.currentBookings}/{event.maxCapacity}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isFull ? 'bg-red-500' : 
                isAlmostFull ? 'bg-orange-500' : 
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>
          
          {/* Pourcentage */}
          <div className="text-xs text-gray-400 text-right">
            {Math.round(fillPercentage)}% rempli
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-600">
            Voir détails
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue-600">
            <path d="M3 8h10m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  );
}