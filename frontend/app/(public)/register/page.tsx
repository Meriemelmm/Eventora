import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="min-h-screen pt-24 pb-12 bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 mt-2">Rejoignez Eventra pour vos réservations</p>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}
