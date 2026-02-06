import api from '../api';
import { ReservationResponse, ReservationsResponse, CreateReservationDto, ReservationStatus } from '../../types/reservation.types';

export const reservationService = {
    create: async (data: CreateReservationDto): Promise<ReservationResponse> => {
        const response = await api.post('/reservations', data);
        return response.data;
    },

    getMyReservations: async (): Promise<ReservationsResponse> => {
        const response = await api.get('/reservations/me');
        return response.data;
    },

    getAll: async (params?: { eventId?: string; participantId?: string; status?: string }): Promise<ReservationsResponse> => {
        const response = await api.get('/reservations', { params });
        return response.data;
    },

    cancel: async (id: string): Promise<ReservationResponse> => {
        const response = await api.patch(`/reservations/${id}/cancel`);
        return response.data;
    },

    updateStatus: async (id: string, status: ReservationStatus): Promise<ReservationResponse> => {
        const response = await api.patch(`/reservations/${id}/status`, { status });
        return response.data;
    }
};
