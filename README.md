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

### Rutas

| Ruta | Descripcion |
|---|---|
| `/` | Estado del backend + tarjeta de sesion (la lista de usuarios solo la ve un `ADMIN`) |
| `/login` | Formulario de acceso contra `POST /auth/login`, con enlace a la recuperacion |
| `/forgot-password` | Pide el enlace de recuperacion (`POST /auth/forgot-password`); mensaje generico exista o no la cuenta |
| `/reset-password?token=...` | Define la nueva contrasena (`POST /auth/reset-password`) y vuelve a `/login` |

### Secciones por rol

`<RoleGate roles={["ADMIN"]}>...</RoleGate>` (en `src/components/role-gate.tsx`)
solo renderiza su contenido si el rol de la sesion esta en la lista; `tieneRol()`
(`src/lib/roles.ts`) sirve para condicionar tambien las consultas (`enabled`)
y no pedir datos que el backend respondera con 403. Es solo presentacion: la
autorizacion real la aplica el backend.

Para probar el flujo completo, registra primero un usuario en el backend:

```bash
curl -X POST http://localhost:4000/api/v1/users   -H "Content-Type: application/json"   -d '{"email":"egresado@sisebt.edu.mx","password":"contrasena-segura"}'
```

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

La redireccion vive en `src/lib/navigation.ts` para que los tests puedan
mockearla sin manipular `window.location`.

> **Excepcion importante:** el 401 de `POST /auth/login` **no** dispara la
> redireccion. Unas credenciales incorrectas son un error del formulario, no una
> sesion caducada; si redirigieramos, se recargaria `/login` y el usuario
> perderia lo que escribio. La lista de rutas exentas esta en
> `RUTAS_EXENTAS_DE_REDIRECCION`.

El token se guarda en el store de Zustand con `persist`. Como `localStorage` no
existe en SSR, los componentes leen la sesion con el hook `useSession()`, que
solo la expone tras el montaje para evitar un *hydration mismatch*.

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
| `src/lib/api-client.test.ts` | El interceptor adjunta (o no) el header `Authorization`; un 401 limpia sesion y redirige, salvo si viene del login |
| `src/app/login/page.test.tsx` | Render del formulario; login correcto guarda sesion y redirige; un 401 muestra error sin guardar sesion; enlace a la recuperacion |
| `src/app/forgot-password/page.test.tsx` | Envia el email y muestra el mensaje generico; error de validacion (400) |
| `src/components/auth/reset-password-form.test.tsx` | Sin token, longitud minima, confirmacion, exito (redirige a `/login`) y token rechazado (400) |
| `src/components/session-card.test.tsx` | Un ADMIN ve la tabla de usuarios; GRADUATE y COMPANY no la ven ni consultan `GET /users` |
| `src/lib/roles.test.ts` | `tieneRol()` y las reglas de contrasena |

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

`playwright.config.ts` levanta `pnpm dev` automaticamente (`webServer`). Los
smoke tests de `e2e/smoke.spec.ts` no exigen que la API este arriba: verifican
que el badge de estado se renderiza y resuelve a uno de sus tres estados, y que
el enlace de la home lleva al formulario de `/login`.

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
│   │   ├── login/                     # formulario de acceso + su test
│   │   ├── page.tsx                   # Backend Status: Online / Offline
│   │   └── page.test.tsx
│   ├── components/
│   │   ├── session-card.tsx           # sesion activa, lista protegida y logout
│   │   └── ui/                        # shadcn/ui: button, input, card, sonner, table
│   ├── lib/
│   │   ├── api-client.ts              # axios + interceptores
│   │   ├── api-client.test.ts
│   │   ├── auth.ts                    # login() y fetchUsers()
│   │   ├── auth-store.ts              # Zustand + persist
│   │   ├── health.ts
│   │   ├── navigation.ts
│   │   └── use-session.ts             # lectura de sesion segura en SSR
│   ├── providers/query-provider.tsx
│   └── test/                          # setup, MSW y renderWithProviders
├── Dockerfile
├── playwright.config.ts
└── vitest.config.mts
```
