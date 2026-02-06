'use client';

import { useEffect, useState } from 'react';
import { reservationService } from '@/lib/services/reservation.service';
import { Reservation } from '@/types';
import ReservationCard from './ReservationCard';

export default function ReservationList() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReservations = async () => {
        try {
            const response = await reservationService.getMyReservations();
            console.log("show reservations",reservations);
            setReservations(response.data);
        } catch (err: any) {
            setError('Impossible de charger vos réservations.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleCancel = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

        try {
            await reservationService.cancel(id);
            
           
        } catch (err) {
            alert('Erreur lors de l\'annulation');
        }
    };

    if (loading) return <div className="py-10 text-center">Chargement...</div>;
    if (error) return <div className="py-10 text-center text-red-500">{error}</div>;
    if (reservations.length === 0) {
        return (
            <div className="bg-gray-50 rounded-lg p-10 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-500">Vous n'avez pas encore de réservations.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reservations.map((reservation) => (
                <ReservationCard
                    key={reservation._id}
                    reservation={reservation}
                    onCancel={handleCancel}
                />
            ))}
        </div>
    );
}
