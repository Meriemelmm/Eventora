'use client';

import React, { useState, useEffect } from 'react';
import { reservationService } from '@/lib/services/reservation.service';
import { Reservation, ReservationStatus } from '@/types/reservation.types';
import StatusBadge from '../common/StatusBadge';
import ReservationSidePanel from './ReservationSidePanel';
import { User } from '@/types/auth.type';
import { Event } from '@/types/event.types';

export default function ReservationTable() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await reservationService.getAll();
            setReservations(response.data);
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setError('Impossible de charger les réservations.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: ReservationStatus) => {
        try {
            setActionLoading(id);
            await reservationService.updateStatus(id, status);
            setReservations(prev => prev.map(res =>
                res._id === id ? { ...res, status } : res
            ));
            setSelectedReservation(null);
        } catch (err: any) {
            console.error('Error updating status:', err);
            setError(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleQuickAction = async (e: React.MouseEvent, id: string, status: ReservationStatus) => {
        e.stopPropagation();
        
        const confirmMessages: Record<string, string> = {
            [ReservationStatus.CONFIRMED]: 'Voulez-vous confirmer cette réservation ?',
            [ReservationStatus.REFUSED]: 'Voulez-vous refuser cette réservation ?',
            [ReservationStatus.CANCELED]: 'Voulez-vous annuler cette réservation ?',
        };

        if (window.confirm(confirmMessages[status])) {
            await handleUpdateStatus(id, status);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-center justify-between">
                    <span className="text-red-700">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900">ID</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Événement</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Participant</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">Statut</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reservations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Aucune réservation trouvée.
                                    </td>
                                </tr>
                            ) : (
                                reservations.map((res) => {
                                    const participant = res.participantId as User;
                                    const event = res.eventId as Event;
                                    const isLoading = actionLoading === res._id;
                                    
                                    return (
                                        <tr
                                            key={res._id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedReservation(res)}
                                        >
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                #{res._id.slice(-6).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 truncate max-w-[200px]">
                                                    {typeof event === 'object' ? event?.title : 'Événement inconnu'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {typeof participant === 'object'
                                                    ? `${participant?.firstName || ''} ${participant?.lastName || ''}`.trim() || participant?.email
                                                    : participant || 'Utilisateur inconnu'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {res.reservedAt ? new Date(res.reservedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={res.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isLoading ? (
                                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600" />
                                                    ) : (
                                                        <>
                                                            {/* Bouton Confirmer - visible si PENDING */}
                                                            {res.status === ReservationStatus.PENDING && (
                                                                <button
                                                                    onClick={(e) => handleQuickAction(e, res._id, ReservationStatus.CONFIRMED)}
                                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Confirmer"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </button>
                                                            )}

                                                            {/* Bouton Refuser - visible si PENDING */}
                                                            {res.status === ReservationStatus.PENDING && (
                                                                <button
                                                                    onClick={(e) => handleQuickAction(e, res._id, ReservationStatus.REFUSED)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Refuser"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <circle cx="12" cy="12" r="10" />
                                                                        <line x1="15" y1="9" x2="9" y2="15" />
                                                                        <line x1="9" y1="9" x2="15" y2="15" />
                                                                    </svg>
                                                                </button>
                                                            )}

                                                            {/* Bouton Annuler - visible si CONFIRMED */}
                                                            {res.status === ReservationStatus.CONFIRMED && (
                                                                <button
                                                                    onClick={(e) => handleQuickAction(e, res._id, ReservationStatus.CANCELED)}
                                                                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                    title="Annuler"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                    </svg>
                                                                </button>
                                                            )}

                                                            {/* Bouton Détails - toujours visible */}
                                                            <button
                                                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedReservation(res);
                                                                }}
                                                            >
                                                                Détails
                                                                <svg className="ml-1.5 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ReservationSidePanel
                reservation={selectedReservation}
                onClose={() => setSelectedReservation(null)}
                onUpdateStatus={handleUpdateStatus}
            />
        </div>
    );
}