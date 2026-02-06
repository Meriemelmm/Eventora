import Link from 'next/link';
import EventCard from '@/components/events/EventCard';
import { eventService } from '@/lib/services/events.service';
import { Event } from '@/types'; 

async function getEvents(): Promise<Event[]> {
  try {
    return await eventService.getPublishEvent();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 py-12 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Tous les événements
          </h1>
          <p className="text-gray-600">
            Découvrez notre sélection d'événements et réservez votre place.
          </p>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            {events.length} événement{events.length > 1 ? 's' : ''} disponible{events.length > 1 ? 's' : ''}
          </div>
          
          <select className="text-sm border border-gray-300 rounded-md p-2">
            <option value="date">Trier par date</option>
            <option value="popularity">Popularité</option>
            <option value="places">Places disponibles</option>
          </select>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun événement trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Aucun événement disponible pour le moment.
            </p>
          </div>
        )}

        {/* Simple CTA */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Vous ne trouvez pas ce que vous cherchez ?
          </h3>
          <p className="text-gray-600 mb-4">
            Créez un compte pour recevoir des notifications sur les nouveaux événements.
          </p>
          <Link 
            href="/register" 
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}