'use client';

import { Reservation, ReservationStatus } from '@/types';
import { reservationService } from '@/lib/services/reservation.service';

export default function ReservationCard({
    reservation,
    onCancel
}: {
    reservation: Reservation,
    onCancel: (id: string) => void
}) {
    const event = reservation.eventId as any;

    const getStatusColor = (status: ReservationStatus) => {
        switch (status) {
            case ReservationStatus.CONFIRMED: return 'bg-green-100 text-green-800';
            case ReservationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
            case ReservationStatus.CANCELED: return 'bg-red-100 text-red-800';
            case ReservationStatus.REFUSED: return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const bookingDate = new Date(reservation.reservedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-bold text-lg text-gray-900">{event?.title || 'Événement'}</h4>
                    <p className="text-sm text-gray-500">Réservé le {bookingDate}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(reservation.status)}`}>
                    {reservation.status}
                </span>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                    Lieu: <span className="font-medium">{event?.location || 'N/A'}</span>
                </div>
                {reservation.status !== ReservationStatus.CANCELED &&
                    reservation.status !== ReservationStatus.REFUSED && (
                        <button
                            onClick={() => onCancel(reservation._id)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                        >
                            Annuler
                        </button>
                    )}

            </div>
        </div>
    );
}
