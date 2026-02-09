'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EventForm from '@/components/events/EventForm';
import { eventService } from '@/lib/services/events.service';
import { Event } from '@/types';

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await eventService.getById(id);
                setEvent(data);
            } catch (err) {
                console.error('Error fetching event:', err);
                setError('Impossible de charger l\'événement.');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchEvent();
    }, [id]);

    const handleSubmit = async (data: any) => {
        try {
            await eventService.update(id, data);
            router.push('/admin/events');
        } catch (err) {
            console.error('Error updating event:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
                {error || 'Événement non trouvé.'}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all text-gray-500 hover:text-gray-900"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Modifier l'Événement</h2>
                    <p className="text-gray-500">Mettez à jour les informations de l'événement.</p>
                </div>
            </div>

            <div className="flex justify-start">
                <EventForm initialData={event} onSubmit={handleSubmit} buttonText="Mettre à jour" />
            </div>
        </div>
    );
}
