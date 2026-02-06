'use client';

import { useState } from 'react';
import { reservationService } from '@/lib/services/reservation.service';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {Role} from '@/types';



export default function ReservationForm({ eventId, eventTitle }: { eventId: string, eventTitle: string }) {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            await reservationService.create({
                eventId
            });
            setMessage({ type: 'success', text: 'Réservation réussie !' });
            // Small delay to show success message before redirect
            setTimeout(() => {
                router.push('/reservations');
            }, 1500);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de la réservation' });
        } finally {
            setLoading(false);
        }
    };

    if (isAuthenticated && user?.role !== Role.PARTICIPANT) {
        return (
            <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 text-sm">
                Seuls les participants peuvent réserver des places.
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Réserver une place</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                    Voulez-vous réserver une place pour l'événement <strong>{eventTitle}</strong> ?
                </p>

                {message && (
                    <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {loading ? 'Traitement...' : 'Confirmer la réservation'}
                </button>
            </form>

            {!isAuthenticated && (
                <p className="mt-4 text-sm text-center text-gray-500">
                    Veuillez vous <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => router.push('/login')}>connecter</span> pour réserver.
                </p>
            )}
        </div>
    );
}
