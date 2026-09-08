# SISEBT — Frontend

Interfaz del **Sistema de Seguimiento de Egresados y Bolsa de Trabajo**.

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · shadcn/ui · TanStack Query 5 · Vitest + MSW · Playwright

---

## Requisitos

| Herramienta | Version |
|---|---|
| Node.js | **>= 24** (ver `.nvmrc`) |
| pnpm | **12.x** (`corepack enable` lo instala solo) |

```bash
nvm use          # o fnm use  -> lee .nvmrc
corepack enable  # habilita el pnpm fijado en package.json#packageManager
```

---

## Puesta en marcha

```bash
cp .env.example .env.local
pnpm install
pnpm dev         # http://localhost:3000
```

La home muestra **"Backend Status: Online / Offline"** consultando
`GET /health` de la API. Para verla en `Online`, arranca antes el backend
(`sisebt-backend`, puerto 4000).

---

## Variables de entorno

| Variable | Por defecto | Descripcion |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | URL base de la API |

### `NEXT_PUBLIC_*` se resuelve en TIEMPO DE BUILD

Next.js **inlinea** estas variables dentro del bundle al compilar; no se leen en
runtime. Consecuencias practicas:

- Pasarla con `docker run -e NEXT_PUBLIC_API_URL=...` **no tiene ningun efecto**.
- La imagen debe construirse con el valor definitivo:

  ```bash
  docker build --build-arg NEXT_PUBLIC_API_URL=https://api.sisebt.mx/api/v1 -t sisebt-frontend:prod .
  ```

- Un entorno distinto (staging, produccion) necesita **su propia imagen**.

Ademas, la peticion a `/health` la hace el **navegador**, no el servidor de
Next. Por eso el valor correcto es la URL publica de la API
(`http://localhost:4000/api/v1` en local), no el hostname interno de Docker
`sisebt-backend`.

---

## Cliente HTTP

`src/lib/api-client.ts` expone una instancia de axios con dos interceptores:

- **Request** — adjunta `Authorization: Bearer <token>` leyendo el token del
  store de Zustand (`src/lib/auth-store.ts`, persistido en `localStorage`). Si
  no hay sesion, elimina el header para que no se arrastre uno viejo.
- **Response** — ante un **401** limpia la sesion y redirige a `/login`.

> La ruta `/login` todavia no existe en este scaffold; se creara junto con el
> modulo de autenticacion. La redireccion vive en `src/lib/navigation.ts` para
> que los tests puedan mockearla sin manipular `window.location`.

`src/providers/query-provider.tsx` monta el `QueryClientProvider` y esta
integrado en `src/app/layout.tsx`.

---

## Tests

Next.js no trae runner; este repo usa **Vitest + Testing Library + MSW** para
unitarios e integracion, y **Playwright** para E2E.

```bash
pnpm test        # unitarios e integracion (jsdom)
pnpm test:watch  # en watch
pnpm test:cov    # con cobertura (umbral: 60% de lineas)
pnpm test:e2e    # Playwright
```

### Unitarios / integracion

**No necesitan el backend corriendo**: MSW intercepta las llamadas HTTP.

| Archivo | Que cubre |
|---|---|
| `src/app/page.test.tsx` | Estado de carga inicial; `Online` con 200; `Offline` con 503 y con error de red |
| `src/lib/api-client.test.ts` | El interceptor adjunta (o no) el header `Authorization`; un 401 limpia sesion y redirige |

Piezas de apoyo:

- `src/test/setup.ts` — registra `@testing-library/jest-dom` y el ciclo de vida
  del server de MSW (`onUnhandledRequest: "error"`, para que ningun test se
  escape a un backend real).
- `src/test/msw/` — server y handlers.
- `src/test/render-with-providers.tsx` — helper `renderWithProviders` que
  envuelve en `QueryClientProvider` con **`retry: false`**; sin eso, cada test
  de error esperaria los reintentos con backoff de TanStack Query.

### E2E (Playwright)

```bash
pnpm exec playwright install chromium   # solo la primera vez
pnpm test:e2e
```

`playwright.config.ts` levanta `pnpm dev` automaticamente (`webServer`). El
smoke test de `e2e/smoke.spec.ts` no exige que la API este arriba: verifica que
el badge de estado se renderiza y resuelve a uno de sus tres estados.

---

## Docker (produccion)

```bash
docker build -t sisebt-frontend:local .
docker run --rm -p 3000:3000 sisebt-frontend:local
```

Imagen multi-stage sobre `node:24-alpine` con la salida **standalone** de Next
(`output: "standalone"` en `next.config.ts`), usuario no-root y `HEALTHCHECK`.

`HOSTNAME=0.0.0.0` es obligatorio: sin el, el server standalone escucha solo en
`localhost` y queda inalcanzable desde fuera del contenedor.

---

## Estructura

```
sisebt-frontend/
├── .github/workflows/ci.yml
├── e2e/smoke.spec.ts                  # Playwright
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # QueryProvider + Toaster
│   │   ├── page.tsx                   # Backend Status: Online / Offline
│   │   └── page.test.tsx
│   ├── components/ui/                 # shadcn/ui: button, input, card, sonner, table
│   ├── lib/
│   │   ├── api-client.ts              # axios + interceptores
│   │   ├── api-client.test.ts
│   │   ├── auth-store.ts              # Zustand + persist
│   │   ├── health.ts
│   │   └── navigation.ts
│   ├── providers/query-provider.tsx
│   └── test/                          # setup, MSW y renderWithProviders
├── Dockerfile
├── playwright.config.ts
└── vitest.config.ts
```
