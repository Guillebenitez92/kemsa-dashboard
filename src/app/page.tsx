export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-brand">Catálogo Mormaii</h1>
        <p className="mt-3 text-stone-600">
          Catálogo mayorista por invitación. Necesitás el enlace completo con
          tu código de acceso para ingresar.
        </p>
        <p className="mt-4 text-sm text-stone-400">
          Si tenés el enlace, abrilo tal cual te lo enviaron.
        </p>
      </div>
    </main>
  );
}
