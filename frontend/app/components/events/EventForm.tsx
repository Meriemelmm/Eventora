'use client';

import React, { useState } from 'react';
import { CreateEventDto, Event, EventStatus } from '@/types';

interface EventFormProps {
    initialData?: Partial<Event>;
    onSubmit: (data: CreateEventDto | any) => Promise<void>;
    buttonText?: string;
}

export default function EventForm({ initialData, onSubmit, buttonText = 'Enregistrer' }: EventFormProps) {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        dateTime: initialData?.dateTime ? new Date(initialData.dateTime).toISOString().slice(0, 16) : '',
        location: initialData?.location || '',
        maxCapacity: initialData?.maxCapacity || 0,
        status: initialData?.status || EventStatus.DRAFT,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setError(null); // Reset error on change
        setFormData(prev => ({
            ...prev,
            [name]: name === 'maxCapacity' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
           
            if (formData.title.length < 3) {
                setError('Le titre doit faire au moins 3 caractères.');
                setLoading(false);
                return;
            }
            if (formData.description.length < 6) {
                setError('La description doit faire au moins 6 caractères.');
                setLoading(false);
                return;
            }
            if (formData.maxCapacity < 1) {
                setError('La capacité doit être d\'au moins 1.');
                setLoading(false);
                return;
            }

            const submissionData = {
                title: formData.title,
                description: formData.description,
                dateTime: new Date(formData.dateTime).toISOString(),
                location: formData.location,
                maxCapacity: formData.maxCapacity,
                status: formData.status,
            };

            await onSubmit(submissionData);
        } catch (err: any) {
            console.error('Submission error:', err);
            
            const message = err.response?.data?.message || err.message || 'Une erreur est survenue lors de la soumission.';
            const finalMessage = Array.isArray(message) ? message.join(', ') : message;
            setError(finalMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 max-w-2xl w-full space-y-6">
            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Titre */}
                <div className="md:col-span-2 space-y-1.5">
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-700">Titre de l'événement</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        minLength={3}
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Ex: Conférence Annuelle"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm"
                    />
                </div>

                {/* Statut */}
                <div className="md:col-span-2 space-y-1.5">
                    <label htmlFor="status" className="block text-sm font-semibold text-gray-700">Statut actuel</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white shadow-sm"
                    >
                        <option value={EventStatus.DRAFT}>Brouillon (Non visible)</option>
                        <option value={EventStatus.PUBLISHED}>Publié (Visible par tous)</option>
                        <option value={EventStatus.CANCELED}>Annulé</option>
                    </select>
                </div>

              
                <div className="space-y-1.5">
                    <label htmlFor="dateTime" className="block text-sm font-semibold text-gray-700">Date et Heure</label>
                    <input
                        type="datetime-local"
                        id="dateTime"
                        name="dateTime"
                        required
                        value={formData.dateTime}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm"
                    />
                </div>

               
                <div className="space-y-1.5">
                    <label htmlFor="maxCapacity" className="block text-sm font-semibold text-gray-700">Capacité (Places)</label>
                    <input
                        type="number"
                        id="maxCapacity"
                        name="maxCapacity"
                        required
                        min="1"
                        value={formData.maxCapacity}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm"
                    />
                </div>

                {/* Lieu */}
                <div className="md:col-span-2 space-y-1.5">
                    <label htmlFor="location" className="block text-sm font-semibold text-gray-700">Lieu / Plateforme</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        required
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Ex: Paris, France ou Zoom"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm"
                    />
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-1.5">
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700">Description détaillée</label>
                    <textarea
                        id="description"
                        name="description"
                        required
                        minLength={6}
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Présentez votre événement en quelques lignes..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none shadow-sm"
                    ></textarea>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                    {loading && (
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {buttonText}
                </button>
            </div>
        </form>
    );
}
