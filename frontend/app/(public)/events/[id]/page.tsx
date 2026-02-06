import Link from 'next/link';
import { eventService } from '@/lib/services/events.service';
import { Event } from '@/types'
import ReservationForm from '@/components/reservations/ReservationForm';



export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let event: Event | null = null;

    try {
        event = await eventService.getById(id);
    } catch (error) {
        console.error('Error fetching event:', error);
    }

    if (!event) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Événement non trouvé</h1>
                <p className="text-gray-600 mb-8">
                    L'événement que vous recherchez n'existe pas ou a été supprimé.
                </p>
                <Link
                    href="/events"
                    className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
                >
                    Retour aux événements
                </Link>
            </div>
        );
    }

    const eventDate = new Date(event.dateTime);
    const formattedDate = eventDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const formattedTime = eventDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const remainingPlaces = event.maxCapacity - event.currentBookings;
    const fillPercentage = (event.currentBookings / event.maxCapacity) * 100;

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <div className="px-4 py-4 border-b">
                <div className="max-w-6xl mx-auto">
                    <div className="text-sm text-gray-600">
                        <Link href="/" className="hover:text-blue-600">Accueil</Link>
                        <span className="mx-2">/</span>
                        <Link href="/events" className="hover:text-blue-600">Événements</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 truncate">{event.title}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {event.title}
                            </h1>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Description
                            </h2>
                            <div className="prose max-w-none">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {event.description}
                                </p>
                            </div>
                        </div>

                        {/* Key Information */}
                        <div className="bg-gray-50 p-6 rounded-lg mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Détails de l'événement
                            </h3>
                             <div></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <div className="text-sm text-gray-500">Date</div>
                                        <div className="font-medium text-gray-900">{formattedDate}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <div className="text-sm text-gray-500">Heure</div>
                                        <div className="font-medium text-gray-900">{formattedTime}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <div className="text-sm text-gray-500">Lieu</div>
                                        <div className="font-medium text-gray-900">{event.location}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 0A9 9 0 018.99 4.99m13 0a9 9 0 01-13 13" />
                                    </svg>
                                    <div>
                                        <div className="text-sm text-gray-500">Capacité</div>
                                        <div className="font-medium text-gray-900">{event.maxCapacity} personnes</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Booking */}
                    <div className="lg:sticky lg:top-8">
                        <div className="bg-white border border-gray-300 rounded-lg p-6">
                        
                            <ReservationForm eventId={event._id} eventTitle={event.title} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}