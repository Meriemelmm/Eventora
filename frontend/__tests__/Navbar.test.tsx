import { render, screen ,fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';  // ← MIEUX que fireEvent
import Navbar from '@/components/common/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

describe('Navbar', () => {
   
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Utilisateur non authentifié', () => {
        beforeEach(() => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                user: null,
                logout: jest.fn(),
                loading: false,
            });
        });

        it('affiche le logo Eventra', () => {
            render(<Navbar />);
            
            expect(screen.getByText('E')).toBeInTheDocument();
            expect(screen.getByText('ventra')).toBeInTheDocument();
        });

        it('affiche les liens de navigation principaux', () => {
            render(<Navbar />);
            
            expect(screen.getByText('Événements')).toBeInTheDocument();
            expect(screen.getByText('À propos')).toBeInTheDocument();
            expect(screen.getByText('Contact')).toBeInTheDocument();
        });

        it('affiche les boutons Connexion et S\'inscrire', () => {
            render(<Navbar />);
            
            expect(screen.getByText('Connexion')).toBeInTheDocument();
            expect(screen.getByText("S'inscrire")).toBeInTheDocument();
        });

        it('ne affiche PAS le lien "Mes réservations"', () => {
            render(<Navbar />);
            
            expect(screen.queryByText('Mes réservations')).not.toBeInTheDocument();
        });
    });

    describe('Utilisateur authentifié (PARTICIPANT)', () => {
        beforeEach(() => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                user: { 
                    firstName: 'Marie',
                    role: Role.PARTICIPANT 
                },
                logout: jest.fn(),
                loading: false,
            });
        });

        it('affiche le prénom de l\'utilisateur', () => {
            render(<Navbar />);
            
            expect(screen.getByText('Marie')).toBeInTheDocument();
        });

        it('affiche le bouton Déconnexion', () => {
            render(<Navbar />);
            
            expect(screen.getByText('Déconnexion')).toBeInTheDocument();
        });

        it('ne affiche PAS les boutons Connexion et S\'inscrire', () => {
            render(<Navbar />);
            
            expect(screen.queryByText('Connexion')).not.toBeInTheDocument();
            expect(screen.queryByText("S'inscrire")).not.toBeInTheDocument();
        });

        it('affiche le lien "Mes réservations" pour un participant', () => {
            render(<Navbar />);
            
            expect(screen.getByText('Mes réservations')).toBeInTheDocument();
        });

        it('appelle logout quand on clique sur Déconnexion', async () => {
            const logoutMock = jest.fn();
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                user: { firstName: 'Marie', role: Role.PARTICIPANT },
                logout: logoutMock,
                loading: false,
            });

            const user = userEvent.setup();  // ← Meilleure pratique
            render(<Navbar />);

            const logoutButton = screen.getByRole('button', { name: 'Déconnexion' });
            await user.click(logoutButton);

            expect(logoutMock).toHaveBeenCalledTimes(1);
        });
    });

   describe('Utilisateur authentifié (ADMIN)', () => {
    it('affiche le lien Dashboard Admin pour un admin', async () => {  // ← Ajouter async
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: true,
            user: { 
                firstName: 'Admin',
                role: Role.ADMIN 
            },
            logout: jest.fn(),
            loading: false,
        });

        const user = userEvent.setup();  // ← Ajouter setup
        render(<Navbar />);
        
        // Ce lien n'apparaît que sur mobile, on doit ouvrir le menu
        const menuButton = screen.getByText('☰');
        await user.click(menuButton);  // ← Utiliser userEvent avec await
        
        expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
    });
});

    describe('Menu mobile', () => {
        beforeEach(() => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                user: null,
                logout: jest.fn(),
                loading: false,
            });
        });

        it('ouvre et ferme le menu mobile', async () => {
            const user = userEvent.setup();
            render(<Navbar />);

            // Menu fermé au départ (les liens ne sont pas visibles sur mobile)
            const menuButton = screen.getByText('☰');
            
            // Ouvrir le menu
            await user.click(menuButton);
            
            // Vérifier qu'on voit les liens
            const mobileLinks = screen.getAllByText('Événements');
            expect(mobileLinks.length).toBeGreaterThan(1); // Desktop + Mobile
            
            // Fermer le menu
            await user.click(menuButton);
        });
    });

    describe('État de chargement', () => {
        it('ne affiche rien pendant le chargement', () => {
            (useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                user: null,
                logout: jest.fn(),
                loading: true,  
            });

            const { container } = render(<Navbar />);
            
            expect(container.firstChild).toBeNull();
        });
    });
});