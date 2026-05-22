import CatalogClient from "./CatalogClient";

export const dynamic = "force-dynamic";

export default function CatalogoPage({ params }: { params: { token: string } }) {
  const expected = process.env.SURVEY_ACCESS_TOKEN;

  if (!expected || params.token !== expected) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-red-600">Enlace no válido</h1>
          <p className="mt-3 text-stone-600">
            Este enlace no es válido o fue dado de baja. Pedí el enlace
            actualizado a quien te lo compartió.
          </p>
        </div>
      </main>
    );
  }

  return <CatalogClient token={params.token} />;
}
