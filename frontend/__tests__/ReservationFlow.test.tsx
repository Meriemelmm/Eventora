import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReservationForm from '@/components/reservations/ReservationForm';
import ReservationList from '@/components/reservations/ReservationList';
import { reservationService } from '@/lib/services/reservation.service';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Role } from '@/types';

// Mock services and hooks
jest.mock('@/lib/services/reservation.service');
jest.mock('@/context/AuthContext');
jest.mock('next/navigation');

describe('Flux Fonctionnel : Réservations (11 Scénarios)', () => {
    const mockRouter = {
        push: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // =========================================================================
    //  Scénarios liés à la création d’une réservation
    // =========================================================================
    describe(' Création d\'une réservation (Scénarios 1-5)', () => {
        const eventProps = {
            eventId: 'event-123',
            eventTitle: 'Super Match de Foot',
        };

        it('Redirige vers /login si l\'utilisateur n\'est pas connecté', async () => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                user: null,
            });

            const user = userEvent.setup({ delay: null });
            render(<ReservationForm {...eventProps} />);

            const submitButton = screen.getByRole('button', { name: /Confirmer la réservation/i });
            await user.click(submitButton);

            expect(mockRouter.push).toHaveBeenCalledWith('/login');
        });

        it(' Affiche un message si l\'utilisateur n\'est pas un PARTICIPANT', () => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                user: { role: Role.ADMIN },
            });

            render(<ReservationForm {...eventProps} />);

            expect(screen.getByText(/Seuls les participants peuvent réserver/i)).toBeInTheDocument();
        });

        it(' Réservation réussie (Appel API, Message, Redirection)', async () => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                user: { role: Role.PARTICIPANT },
            });

            (reservationService.create as jest.Mock).mockResolvedValue({ data: { _id: 'res-1' } });

            const user = userEvent.setup({ delay: null });
            render(<ReservationForm {...eventProps} />);

            const submitButton = screen.getByRole('button', { name: /Confirmer la réservation/i });
            await user.click(submitButton);

         
            expect(reservationService.create).toHaveBeenCalledWith({ eventId: eventProps.eventId });

         
            await waitFor(() => {
                expect(screen.getByText(/Réservation réussie/i)).toBeInTheDocument();
            });

          
            act(() => {
                jest.advanceTimersByTime(1500);
            });
            expect(mockRouter.push).toHaveBeenCalledWith('/reservations');
        });

        it('S4: Erreur serveur lors de la création (ex: événement complet)', async () => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                user: { role: Role.PARTICIPANT },
            });

            (reservationService.create as jest.Mock).mockRejectedValue({
                response: { data: { message: 'Événement complet' } }
            });

            const user = userEvent.setup({ delay: null });
            render(<ReservationForm {...eventProps} />);

            const submitButton = screen.getByRole('button', { name: /Confirmer la réservation/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/Événement complet/i)).toBeInTheDocument();
            });
        });

        it('S5: État de chargement (Bouton désactivé pendant le traitement)', async () => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                user: { role: Role.PARTICIPANT },
            });

            (reservationService.create as jest.Mock).mockReturnValue(new Promise(() => { }));

            const user = userEvent.setup({ delay: null });
            render(<ReservationForm {...eventProps} />);

            const submitButton = screen.getByRole('button', { name: /Confirmer la réservation/i });
            await user.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(screen.getByText(/Traitement.../i)).toBeInTheDocument();
        });
    });

    // =========================================================================
    //  Scénarios liés à la liste des réservations
    // =========================================================================
    describe('Liste des réservations ', () => {
        it('S6: Affiche un message si la liste est vide', async () => {
            (reservationService.getMyReservations as jest.Mock).mockResolvedValue({ data: [] });

            render(<ReservationList />);

            await waitFor(() => {
                expect(screen.getByText(/Vous n'avez pas encore de réservations/i)).toBeInTheDocument();
            });
        });

        it(' Affiche la liste avec les détails des réservations', async () => {
            const mockData = [
                {
                    _id: 'res-1',
                    eventId: { title: 'Concert Rock', location: 'Paris' },
                    status: 'confirmed',
                    reservedAt: new Date().toISOString(),
                }
            ];
            (reservationService.getMyReservations as jest.Mock).mockResolvedValue({ data: mockData });

            render(<ReservationList />);

            await waitFor(() => {
                expect(screen.getByText('Concert Rock')).toBeInTheDocument();
                expect(screen.getByText(/Paris/i)).toBeInTheDocument();
                expect(screen.getByText('confirmed')).toBeInTheDocument();
            });
        });

        it(' Affiche l\'état de chargement lors du fetch', () => {
            (reservationService.getMyReservations as jest.Mock).mockReturnValue(new Promise(() => { }));

            render(<ReservationList />);

            expect(screen.getByText(/Chargement.../i)).toBeInTheDocument();
        });
    });

    // =========================================================================
    //  Scénarios liés à l’annulation
    // =========================================================================
    describe(' Annulation de réservation', () => {
        const mockData = [
            {
                _id: 'res-1',
                eventId: { title: 'Match de Basket', location: 'Lyon' },
                status: 'pending',
                reservedAt: new Date().toISOString(),
            }
        ];

        beforeEach(() => {
            (reservationService.getMyReservations as jest.Mock).mockResolvedValue({ data: mockData });
        });

        it(' Annulation confirmée par l\'utilisateur', async () => {
            (reservationService.cancel as jest.Mock).mockResolvedValue({});
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

            const user = userEvent.setup({ delay: null });
            render(<ReservationList />);

            await waitFor(() => screen.getByText('Match de Basket'));

            const cancelButton = screen.getByRole('button', { name: /Annuler/i });
            await user.click(cancelButton);

            expect(confirmSpy).toHaveBeenCalled();
            expect(reservationService.cancel).toHaveBeenCalledWith('res-1');

            confirmSpy.mockRestore();
        });

        it(' Annulation refusée (Annule la confirmation)', async () => {
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

            const user = userEvent.setup({ delay: null });
            render(<ReservationList />);

            await waitFor(() => screen.getByText('Match de Basket'));

            const cancelButton = screen.getByRole('button', { name: /Annuler/i });
            await user.click(cancelButton);

            expect(confirmSpy).toHaveBeenCalled();
            expect(reservationService.cancel).not.toHaveBeenCalled();

            confirmSpy.mockRestore();
        });

        it(' Erreur lors de l\'annulation (API en erreur)', async () => {
            (reservationService.cancel as jest.Mock).mockRejectedValue(new Error('API Error'));
            jest.spyOn(window, 'confirm').mockReturnValue(true);
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

            const user = userEvent.setup({ delay: null });
            render(<ReservationList />);

            await waitFor(() => screen.getByText('Match de Basket'));

            const cancelButton = screen.getByRole('button', { name: /Annuler/i });
            await user.click(cancelButton);

            await waitFor(() => {
                expect(alertSpy).toHaveBeenCalledWith('Erreur lors de l\'annulation');
            });

            alertSpy.mockRestore();
        });
    });
});
