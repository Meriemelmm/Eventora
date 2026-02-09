'use client';

import React, { useState } from 'react';
import { Reservation, ReservationStatus } from '@/types/reservation.types';
import StatusBadge from '../common/StatusBadge';
import { User } from '@/types/auth.type';
import { Event } from '@/types/event.types';

interface ReservationSidePanelProps {
    reservation: Reservation | null;
    onClose: () => void;
    onUpdateStatus: (id: string, status: ReservationStatus) => Promise<void>;
}

const ReservationSidePanel: React.FC<ReservationSidePanelProps> = ({
    reservation,
    onClose,
    onUpdateStatus
}) => {
    const [isUpdating, setIsUpdating] = useState(false);

    if (!reservation) return null;

    const participant = reservation.participantId as User;
    const event = reservation.eventId as Event;

    const handleStatusChange = async (status: ReservationStatus) => {
        try {
            setIsUpdating(true);
            await onUpdateStatus(reservation._id, status);
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const getAvailableActions = () => {
        switch (reservation.status) {
            case ReservationStatus.PENDING:
                return [
                    {
                        label: 'Confirmer',
                        status: ReservationStatus.CONFIRMED,
                        className: 'bg-green-600 hover:bg-green-700 text-white shadow-green-100',
                        icon: (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )
                    },
                    {
                        label: 'Refuser',
                        status: ReservationStatus.REFUSED,
                        className: 'border border-red-200 text-red-700 bg-red-50 hover:bg-red-100',
                        icon: (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        )
                    }
                ];
            case ReservationStatus.CONFIRMED:
                return [
                    {
                        label: 'Annuler',
                        status: ReservationStatus.CANCELED,
                        className: 'border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100',
                        icon: (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        )
                    }
                ];
            default:
                return [];
        }
    };

    const availableActions = getAvailableActions();

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

            <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="relative w-screen max-w-md">
                    <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                        {/* Header */}
                        <div className="px-6 py-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Détails de la réservation</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 px-6 py-8 space-y-8">
                            {/* Status Section */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-sm font-medium text-gray-500">Statut actuel</span>
                                <StatusBadge status={reservation.status} />
                            </div>

                            {/* Participant Section */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Participant</h3>
                                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {typeof participant === 'object' ? participant?.firstName?.charAt(0) : 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {typeof participant === 'object'
                                                ? `${participant?.firstName || ''} ${participant?.lastName || ''}`.trim() || 'Utilisateur sans nom'
                                                : 'Chargement des infos...'
                                            }
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {typeof participant === 'object' ? participant?.email : (typeof participant === 'string' ? participant : 'Participant inconnu')}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Event Section */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Événement</h3>
                                <div className="p-4 bg-white rounded-xl border border-gray-100 space-y-3">
                                    <p className="font-semibold text-gray-900">
                                        {typeof event === 'object' ? event?.title : 'Chargement...'}
                                    </p>
                                    <div className="flex items-center text-sm text-gray-500 gap-2">
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {typeof event === 'object' && event?.dateTime ? new Date(event.dateTime).toLocaleString('fr-FR') : 'Date non définie'}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 gap-2">
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {typeof event === 'object' ? event?.location : (typeof event === 'string' ? event : 'Lieu inconnu')}
                                    </div>
                                </div>
                            </section>

                            {/* Reservation Info */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Information Réservation</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Réservé le</p>
                                        <p className="text-sm font-medium">{new Date(reservation.reservedAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">ID Réservation</p>
                                        <p className="text-sm font-medium">#{reservation._id.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Dates supplémentaires */}
                                {reservation.confirmedAt && (
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                        <p className="text-xs text-green-700">Confirmé le</p>
                                        <p className="text-sm font-medium text-green-900">
                                            {new Date(reservation.confirmedAt).toLocaleDateString('fr-FR')} à {new Date(reservation.confirmedAt).toLocaleTimeString('fr-FR')}
                                        </p>
                                    </div>
                                )}

                                {reservation.canceledAt && (
                                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                        <p className="text-xs text-orange-700">Annulé le</p>
                                        <p className="text-sm font-medium text-orange-900">
                                            {new Date(reservation.canceledAt).toLocaleDateString('fr-FR')} à {new Date(reservation.canceledAt).toLocaleTimeString('fr-FR')}
                                        </p>
                                    </div>
                                )}
                            </section>

                            {/* Timeline historique */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Historique</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Réservation créée</p>
                                            <p className="text-xs text-gray-500">{new Date(reservation.reservedAt).toLocaleString('fr-FR')}</p>
                                        </div>
                                    </div>
                                    {reservation.confirmedAt && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Confirmée</p>
                                                <p className="text-xs text-gray-500">{new Date(reservation.confirmedAt).toLocaleString('fr-FR')}</p>
                                            </div>
                                        </div>
                                    )}
                                    {reservation.canceledAt && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Annulée</p>
                                                <p className="text-xs text-gray-500">{new Date(reservation.canceledAt).toLocaleString('fr-FR')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Actions */}
                        {availableActions.length > 0 && (
                            <div className="p-6 bg-gray-50 border-t border-gray-200 mt-auto">
                                <div className={`grid gap-4 ${availableActions.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {availableActions.map((action) => (
                                        <button
                                            key={action.status}
                                            onClick={() => handleStatusChange(action.status)}
                                            disabled={isUpdating}
                                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm ${action.className} ${
                                                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            {isUpdating ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />
                                            ) : (
                                                action.icon
                                            )}
                                            <span>{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableActions.length === 0 && (
                            <div className="p-6 bg-gray-50 border-t border-gray-200 mt-auto">
                                <p className="text-center text-sm text-gray-500">
                                    Aucune action disponible pour ce statut
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationSidePanel;