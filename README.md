This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy (Vercel – Agosto 2025)

1. Crea un nuevo proyecto en Vercel e importa este repositorio.
2. En la sección Environment Variables agrega:
   - `NEXT_PUBLIC_API_BASE_URL` -> URL pública de tu backend (ej: https://api.mi-dominio.com)
3. (Opcional) Ajusta `vercel.json` si necesitas otra región o más variables.
4. Build Command: (por defecto) `npm run build` – ya definido.
5. Output Directory: `.next`
6. Framework detectado automáticamente (Next.js 15+).

### Variables de entorno locales
Copia `.env.example` a `.env.local` y modifica valores:
```
cp .env.example .env.local
```

### Seguridad / Headers
Se añadieron headers de seguridad y una política CSP básica en `next.config.ts`. Ajusta dominios (por ejemplo para fuentes, imágenes externas) si agregas nuevos orígenes.

### Imágenes remotas
Actualiza la sección `images.remotePatterns` en `next.config.ts` si tu API u otros dominios entregan imágenes.

### Optimización
- `optimizePackageImports` para antd (Next 15 / Agosto 2025) reduce el bundle.
- React Strict Mode habilitado.

### Troubleshooting
- Error 403 a la API: confirma que `NEXT_PUBLIC_API_BASE_URL` apunta al host correcto y que CORS en backend permite origen del dominio Vercel.
- CSP bloquea recursos: revisa consola del navegador y añade el dominio faltante en la cadena `Content-Security-Policy`.
