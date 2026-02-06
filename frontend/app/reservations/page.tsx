import ReservationList from '@/components/reservations/ReservationList';

export default function MyReservationsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mes Réservations</h1>
                    <p className="text-gray-600 mt-2">
                        Gérez vos réservations pour les événements à venir.
                    </p>
                </div>

                <ReservationList />
            </div>
        </div>
    );
}
