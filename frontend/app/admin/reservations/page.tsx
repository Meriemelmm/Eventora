import React from 'react';
import ReservationTable from '@/components/reservations/ReservationTable';

export const metadata = {
    title: 'Gestion des Réservations - Eventora Admin',
    description: 'Voir et gérer toutes les réservations d\'événements',
};

export default function AdminReservationsPage() {
    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Réservations</h1>
                    <p className="text-gray-500 mt-1">Gérez et suivez toutes les réservations de la plateforme.</p>
                </div>


            </header>

            <section className="bg-white rounded-2xl border border-gray-100 p-1 shadow-sm overflow-hidden">
                <ReservationTable />
            </section>
        </div>
    );
}
