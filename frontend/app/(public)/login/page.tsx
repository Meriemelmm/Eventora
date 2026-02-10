import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
    return (
        <main className="min-h-screen pt-24 pb-12 bg-gray-50 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Bienvenue</h1>
                    <p className="text-gray-500 mt-2">Connectez-vous à votre compte Eventra</p>
                </div>

                <LoginForm />
            </div>
        </main>
    );
}
