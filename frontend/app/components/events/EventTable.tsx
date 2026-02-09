'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { eventService } from '@/lib/services/events.service';
import { Event, EventStatus } from '@/types';

export default function EventTable() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await eventService.getAll();
            setEvents(data);
        } catch (err) {
            console.error('Error fetching events:', err);
            const message = err instanceof Error ? err.message : 'Impossible de charger les événements.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
        
        try {
            await eventService.delete(id);
            setEvents(events.filter(e => e._id !== id));
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur lors de la suppression.';
            setError(message);
        }
    };

    const toggleStatus = async (event: Event) => {
        const newStatus = event.status === EventStatus.PUBLISHED 
            ? EventStatus.DRAFT 
            : EventStatus.PUBLISHED;
        
        try {
            await eventService.updateStatus(event._id, newStatus);
            setEvents(events.map(e => 
                e._id === event._id ? { ...e, status: newStatus } : e
            ));
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut.';
            setError(message);
        }
    };

  
    const handleCancel = async (event: Event) => {
       
        
        try {
            await eventService.updateStatus(event._id, EventStatus.CANCELED);
            setEvents(events.map(e => 
                e._id === event._id ? { ...e, status: EventStatus.CANCELED } : e
            ));
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur lors de l\'annulation de l\'événement.';
            setError(message);
        }
    };

    const getStatusBadge = (status: EventStatus) => {
        const config = {
            [EventStatus.PUBLISHED]: { 
                bg: 'bg-green-100', 
                text: 'text-green-800', 
                label: 'Publié' 
            },
            [EventStatus.CANCELED]: { 
                bg: 'bg-red-100', 
                text: 'text-red-800', 
                label: 'Annulé' 
            },
            [EventStatus.DRAFT]: { 
                bg: 'bg-gray-100', 
                text: 'text-gray-800', 
                label: 'Brouillon' 
            },
        };

        const { bg, text, label } = config[status];
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${bg} ${text}`}>
                {label}
            </span>
        );
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
                <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center justify-between rounded-lg">
                    <div className="flex items-center gap-3">
                        <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            className="text-red-600"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="text-red-700 font-medium">{error}</span>
                    </div>
                    <button 
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        aria-label="Fermer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Événement</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Date & Lieu</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Capacité</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Statut</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {events.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Aucun événement trouvé. Commencez par en créer un !
                                    </td>
                                </tr>
                            ) : (
                                events.map((event) => (
                                    <tr key={event._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                               
                                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                    </div>
                                                
                                                <p className="font-medium text-gray-900">{event.title}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">
                                                {new Date(event.dateTime).toLocaleDateString('fr-FR')}
                                            </p>
                                            <p className="text-xs text-gray-500">{event.location}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-900">
                                                    {event.currentBookings}/{event.maxCapacity}
                                                </span>
                                                <div className="flex-1 max-w-[60px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 transition-all"
                                                        style={{ 
                                                            width: `${Math.min((event.currentBookings / event.maxCapacity) * 100, 100)}%` 
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                           {event.status ? getStatusBadge(event.status) : (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Brouillon
        </span>
    )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                              
                                                <button
                                                    onClick={() => toggleStatus(event)}
                                                    disabled={event.status === EventStatus.CANCELED}
                                                    title={event.status === EventStatus.PUBLISHED ? 'Mettre en brouillon' : 'Publier'}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        event.status === EventStatus.CANCELED
                                                            ? 'text-gray-300 cursor-not-allowed'
                                                            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                                    }`}
                                                    aria-label={event.status === EventStatus.PUBLISHED ? 'Mettre en brouillon' : 'Publier'}
                                                >
                                                    {event.status === EventStatus.PUBLISHED ? (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                            <line x1="1" y1="1" x2="23" y2="23" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    )}
                                                </button>

                                  
                                                {event.status !== EventStatus.CANCELED && (
                                                    <button
                                                        onClick={() => handleCancel(event)}
                                                        title="Annuler l'événement"
                                                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        aria-label="Annuler l'événement"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="15" y1="9" x2="9" y2="15" />
                                                            <line x1="9" y1="9" x2="15" y2="15" />
                                                        </svg>
                                                    </button>
                                                )}

                                             {event.status!=EventStatus.CANCELED&&
                                             ( <Link
                                                    href={`/admin/events/edit/${event._id}`}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    aria-label="Modifier"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </Link>  )
                                             }
                                               

                                              
                                                <button
                                                    onClick={() => handleDelete(event._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    aria-label="Supprimer"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        <line x1="10" y1="11" x2="10" y2="17" />
                                                        <line x1="14" y1="11" x2="14" y2="17" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}