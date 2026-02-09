import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';


jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));


jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));


jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

describe('LoginForm', () => {
 
    let mockLogin: jest.Mock;
    let mockPush: jest.Mock;

    beforeEach(() => {
        
        jest.clearAllMocks();

     
        mockLogin = jest.fn();
        mockPush = jest.fn();

       
        (useAuth as jest.Mock).mockReturnValue({
            login: mockLogin,
        });

       
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
    });

    // ==========================================
    // SCÉNARIO 1 : AFFICHAGE INITIAL
    // ==========================================
    describe('Affichage initial', () => {
        it('affiche tous les éléments du formulaire', () => {
            render(<LoginForm />);

            // Vérifier les champs
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();

          
            expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();

           
            expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
        });

        it('affiche le lien "Créer un compte"', () => {
            render(<LoginForm />);

            const createAccountLink = screen.getByText('Créer un compte');
            expect(createAccountLink).toBeInTheDocument();
            expect(createAccountLink.closest('a')).toHaveAttribute('href', '/register');
        });

        it('affiche le lien "Mot de passe oublié"', () => {
            render(<LoginForm />);

            const forgotPasswordLink = screen.getByText('Mot de passe oublié ?');
            expect(forgotPasswordLink).toBeInTheDocument();
            expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
        });

        it('affiche la checkbox "Se souvenir de moi"', () => {
            render(<LoginForm />);

            expect(screen.getByText('Se souvenir de moi')).toBeInTheDocument();
            expect(screen.getByRole('checkbox')).toBeInTheDocument();
        });

        it('ne affiche PAS de message d\'erreur au départ', () => {
            render(<LoginForm />);

            // Chercher un élément avec la classe text-red-600
            const errorMessages = screen.queryByText(/invalides/i);
            expect(errorMessages).not.toBeInTheDocument();
        });
    });

    // ==========================================
    // SCÉNARIO 2 : SAISIE DANS LES CHAMPS
    // ==========================================
    describe('Saisie dans les champs', () => {
        it('permet de taper dans le champ email', async () => {
            const user = userEvent.setup();
            render(<LoginForm />);

            const emailInput = screen.getByLabelText('Email');

            await user.type(emailInput, 'test@example.com');

            expect(emailInput).toHaveValue('test@example.com');
        });

        it('permet de taper dans le champ mot de passe', async () => {
            const user = userEvent.setup();
            render(<LoginForm />);

            const passwordInput = screen.getByLabelText('Mot de passe');

            await user.type(passwordInput, 'motdepasse123');

            expect(passwordInput).toHaveValue('motdepasse123');
        });

        it('met à jour les deux champs indépendamment', async () => {
            const user = userEvent.setup();
            render(<LoginForm />);

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');

            await user.type(emailInput, 'marie@test.com');
            await user.type(passwordInput, 'secret123');

            expect(emailInput).toHaveValue('marie@test.com');
            expect(passwordInput).toHaveValue('secret123');
        });
    });

    // ==========================================
    // SCÉNARIO 3 : SOUMISSION RÉUSSIE
    // ==========================================
    describe('Soumission réussie', () => {
        it('appelle login avec les bonnes données', async () => {
            const user = userEvent.setup();
            mockLogin.mockResolvedValue({});

            render(<LoginForm />);

        
            await user.type(screen.getByLabelText('Email'), 'john@example.com');
            await user.type(screen.getByLabelText('Mot de passe'), 'password123');

         
            await user.click(screen.getByRole('button', { name: 'Se connecter' }));

         
            expect(mockLogin).toHaveBeenCalledTimes(1);
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'john@example.com',
                password: 'password123',
            });
        });

        it('affiche "Connexion..." pendant le chargement', async () => {
            const user = userEvent.setup();

          
            mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(<LoginForm />);

           
            await user.type(screen.getByLabelText('Email'), 'test@example.com');
            await user.type(screen.getByLabelText('Mot de passe'), 'password');
            await user.click(screen.getByRole('button', { name: 'Se connecter' }));

           
            expect(screen.getByText('Connexion...')).toBeInTheDocument();

          
            await waitFor(() => {
                expect(screen.getByText('Se connecter')).toBeInTheDocument();
            });
        });

        it('désactive le bouton pendant le chargement', async () => {
            const user = userEvent.setup();

         
            mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(<LoginForm />);

            const submitButton = screen.getByRole('button', { name: 'Se connecter' });

           
            expect(submitButton).not.toBeDisabled();

           
            await user.type(screen.getByLabelText('Email'), 'test@example.com');
            await user.type(screen.getByLabelText('Mot de passe'), 'password');
            await user.click(submitButton);

           
            expect(submitButton).toBeDisabled();

            await waitFor(() => {
                expect(submitButton).not.toBeDisabled();
            });
        });

        it('désactive les champs pendant le chargement', async () => {
            const user = userEvent.setup();

            mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(<LoginForm />);

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password');
            await user.click(screen.getByRole('button', { name: 'Se connecter' }));

           
            expect(emailInput).toBeDisabled();
            expect(passwordInput).toBeDisabled();

        
            await waitFor(() => {
                expect(emailInput).not.toBeDisabled();
                expect(passwordInput).not.toBeDisabled();
            });
        });
    });

    // ==========================================
    // SCÉNARIO 4 : GESTION DES ERREURS
    // ==========================================
    describe('Gestion des erreurs', () => {
        it('affiche un message d\'erreur si login échoue', async () => {
            const user = userEvent.setup();

          
            mockLogin.mockRejectedValue({
                response: {
                    data: {
                        message: 'Email ou mot de passe incorrect'
                    }
                }
            });

            render(<LoginForm />);

          
            await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
            await user.type(screen.getByLabelText('Mot de passe'), 'wrongpassword');
            await user.click(screen.getByRole('button', { name: 'Se connecter' }));

        
            await waitFor(() => {
                expect(screen.getByText('Email ou mot de passe incorrect')).toBeInTheDocument();
            });
        });

        it('affiche un message d\'erreur par défaut si pas de message serveur', async () => {
            const user = userEvent.setup();

            
            mockLogin.mockRejectedValue(new Error('Network error'));

            render(<LoginForm />);

            await user.type(screen.getByLabelText('Email'), 'test@example.com');
            await user.type(screen.getByLabelText('Mot de passe'), 'password');
            await user.click(screen.getByRole('button', { name: 'Se connecter' }));

           
            await waitFor(() => {
                expect(screen.getByText('Identifiants invalides. Veuillez réessayer.')).toBeInTheDocument();
            });
        });

        it('efface le message d\'erreur lors d\'une nouvelle soumission', async () => {
            const user = userEvent.setup();

         
            mockLogin.mockRejectedValueOnce({
                response: { data: { message: 'Erreur' } }
            });

            render(<LoginForm />);

            await user.type(screen.getByLabelText('Email'), 'test@example.com');
            await user.type(screen.getByLabelText('Mot de passe'), 'password');
            await user.click(screen.getByRole('button', { name: 'Se connecter' }));

         
            await waitFor(() => {
                expect(screen.getByText('Erreur')).toBeInTheDocument();
            });

          
            mockLogin.mockResolvedValueOnce({});

            await user.click(screen.getByRole('button', { name: 'Se connecter' }));

        
            await waitFor(() => {
                expect(screen.queryByText('Erreur')).not.toBeInTheDocument();
            });
        });
    });

    // ==========================================
    // SCÉNARIO 5 : VALIDATION
    // ==========================================
    describe('Validation des champs', () => {
        it('les champs email et password sont requis', () => {
            render(<LoginForm />);

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Mot de passe');

            expect(emailInput).toBeRequired();
            expect(passwordInput).toBeRequired();
        });

        it('le champ email a le type "email"', () => {
            render(<LoginForm />);

            const emailInput = screen.getByLabelText('Email');

            expect(emailInput).toHaveAttribute('type', 'email');
        });

        it('le champ password a le type "password"', () => {
            render(<LoginForm />);

            const passwordInput = screen.getByLabelText('Mot de passe');

            expect(passwordInput).toHaveAttribute('type', 'password');
        });
    });

    // ==========================================
    // SCÉNARIO 6 : TESTS SUPPLÉMENTAIRES
    // ==========================================
    describe('Fonctionnalités supplémentaires', () => {
        it('la checkbox "Se souvenir de moi" peut être cochée', async () => {
            const user = userEvent.setup();
            render(<LoginForm />);

            const checkbox = screen.getByRole('checkbox');

            expect(checkbox).not.toBeChecked();

            await user.click(checkbox);

            expect(checkbox).toBeChecked();
        });

        it('ne soumet pas le formulaire si les champs sont vides', async () => {
            const user = userEvent.setup();
            render(<LoginForm />);

            const submitButton = screen.getByRole('button', { name: 'Se connecter' });

            await user.click(submitButton);

          
            expect(mockLogin).not.toHaveBeenCalled();
        });
    });
});