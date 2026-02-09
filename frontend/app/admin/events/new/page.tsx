'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import EventForm from '@/components/events/EventForm';
import { eventService } from '@/lib/services/events.service';
import { CreateEventDto } from '@/types';

export default function NewEventPage() {
    const router = useRouter();

    const handleSubmit = async (data: CreateEventDto) => {
        try {
            await eventService.create(data);
            router.push('/admin/events');
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

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
                    <h2 className="text-2xl font-bold text-gray-900">Créer un Événement</h2>
                    <p className="text-gray-500">Remplissez les informations pour lancer votre nouvel événement.</p>
                </div>
            </div>

            <div className="flex justify-start">
                <EventForm onSubmit={handleSubmit} buttonText="Créer l'événement" />
            </div>
        </div>
    );
}
