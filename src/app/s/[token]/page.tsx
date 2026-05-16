import { PRODUCTS, CATEGORIES, RETAIL_MULTIPLIER } from "@/lib/products";
import SurveyClient from "./SurveyClient";

export const dynamic = "force-dynamic";

export default function SurveyPage({ params }: { params: { token: string } }) {
  const expected = process.env.SURVEY_ACCESS_TOKEN;

  if (!expected || params.token !== expected) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-red-600">Enlace no válido</h1>
          <p className="mt-3 text-stone-600">
            Este enlace de encuesta no es válido o fue dado de baja. Pedí el
            enlace actualizado a quien te lo compartió.
          </p>
        </div>
      </main>
    );
  }

  const products = PRODUCTS.map((p) => ({
    code: p.code,
    name: p.name,
    category: p.category,
    gender: p.gender,
    retail: p.retail,
    sizes: p.sizes,
  }));

  return (
    <SurveyClient
      token={params.token}
      products={products}
      categories={CATEGORIES}
      multiplier={RETAIL_MULTIPLIER}
    />
  );
}
