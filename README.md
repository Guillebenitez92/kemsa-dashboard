# Encuesta de Catálogo — Mormaii Sports (Verão 27)

Web para que la gente arme su selección de productos del catálogo de
**training/fitness** (línea "MORMAII SPORTS") y vos veas el **consolidado**
de qué quiere comprar la mayoría, antes de decidir tu compra.

- Los precios **retail** se calculan como **costo (US$) × 3,8** (solo la hoja
  "MORMAII SPORTS" de la lista de precios).
- Cada persona marca **"Me interesa"** y elige **el talle**.
- Antes de enviar responde una mini encuesta: **género, rango de edad y
  frecuencia de entrenamiento** (+ datos opcionales).
- El **enlace es secreto**: aunque lo reenvíen, nadie puede ver las
  respuestas de los demás ni el consolidado. Eso solo lo ves vos con
  contraseña en `/admin`.

---

## Qué necesitás (todo gratis, una sola vez)

1. Una cuenta en **GitHub** (este repo).
2. Una cuenta en **Supabase** (base de datos): https://supabase.com
3. Una cuenta en **Vercel** (publica la web): https://vercel.com

---

## Paso 1 — Crear la base de datos (Supabase)

1. Entrá a https://supabase.com → **New project**. Elegí nombre y una
   contraseña de base de datos (guardala). Esperá ~2 minutos.
2. En el menú izquierdo: **SQL Editor → New query**.
3. Abrí el archivo `supabase.sql` de este repo, copiá TODO y pegalo. **Run**.
4. Andá a **Project Settings → API** y copiá:
   - **Project URL** → será tu `SUPABASE_URL`
   - En **Project API keys**, la clave **`service_role`** (la secreta, NO la
     `anon`) → será tu `SUPABASE_SERVICE_ROLE_KEY`

> La `service_role` es secreta. No la compartas. Solo se usa en el servidor.

---

## Paso 2 — Publicar la web (Vercel)

1. Entrá a https://vercel.com → **Add New → Project** → importá este
   repositorio de GitHub (`guillebenitez92/kemsa-dashboard`).
2. Antes de hacer **Deploy**, abrí **Environment Variables** y cargá estas 5
   (mirá `.env.example` como referencia):

   | Variable | Qué poner |
   |---|---|
   | `SUPABASE_URL` | El Project URL de Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | La clave `service_role` de Supabase |
   | `SURVEY_ACCESS_TOKEN` | Un texto largo y secreto inventado por vos |
   | `ADMIN_PASSWORD` | La contraseña para entrar a tu panel |
   | `APP_SECRET` | Otro texto largo aleatorio cualquiera |

3. **Deploy**. En 1–2 minutos tenés la web online, por ejemplo:
   `https://kemsa-dashboard.vercel.app`

---

## Paso 3 — Usarla

- **Enlace para encuestar a la gente** (este es el que compartís por
  WhatsApp):

  ```
  https://TU-SITIO.vercel.app/s/EL_VALOR_DE_SURVEY_ACCESS_TOKEN
  ```

  Ejemplo: si `SURVEY_ACCESS_TOKEN=mormaii-verano-2027-x9f3k`, el enlace es
  `https://TU-SITIO.vercel.app/s/mormaii-verano-2027-x9f3k`

  Cualquiera con ese enlace puede completar la encuesta, pero **nadie puede
  ver los resultados**. Si en algún momento querés "invalidar" el enlace,
  cambiá `SURVEY_ACCESS_TOKEN` en Vercel y compartí el enlace nuevo.

- **Tu panel privado con el consolidado:**

  ```
  https://TU-SITIO.vercel.app/admin
  ```

  Entrás con `ADMIN_PASSWORD`. Ahí ves: ranking de productos más deseados,
  talles pedidos, % de coincidencia, filtros por género/edad, gráficos
  demográficos y botón para **descargar CSV**.

---

## Fotos de los productos (galería por SKU desde tu Drive)

Las fotos NO se copian al repo (son archivos de 2–13 MB cada una). En su
lugar, la web las muestra **directo desde tu Google Drive** usando un
mapeo `public/products/manifest.json` (código de producto → fotos de ese
SKU: todos los ángulos y colores, tipo galería de e-commerce).

**Importante — compartir la carpeta de Drive:** para que las fotos se vean
para quien complete la encuesta, la carpeta **"Mormaii training"** (la que
tiene las imágenes) tiene que estar compartida así:

1. En Drive, clic derecho sobre la carpeta **Mormaii training → Compartir**.
2. En "Acceso general" elegí **"Cualquier persona con el enlace"** y rol
   **"Lector"**. Guardar.

Si no la compartís, las tarjetas siguen funcionando pero se ven con el
recuadro de color en vez de la foto (no se rompe nada).

> Nota: con esto, las fotos del catálogo quedan visibles para quien abra la
> encuesta. La encuesta en sí sigue protegida por el token; el consolidado
> solo lo ves vos con contraseña.

El consolidado en `/admin` también muestra, por producto, **qué foto/color
eligió la gente como favorita** (para tu análisis de compra).

---

## Probar en tu compu (opcional)

```bash
cp .env.example .env.local   # completá los valores
npm install
npm run dev                  # http://localhost:3000
```

Encuesta: `http://localhost:3000/s/EL_TOKEN` · Panel: `http://localhost:3000/admin`
