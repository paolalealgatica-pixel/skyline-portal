# Skyline — Portal Cliente

App separada **solo del portal de clientes**. Usa el **mismo Supabase** que el panel interno (Ctrl), pero se despliega aparte con su propia URL. Los clientes entran por su correo Google (con `access_email` en la tabla `clients`) y solo ven lo suyo (RLS).

## Variables de entorno (.env.local y en Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=...        # el MISMO del panel interno
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # el MISMO del panel interno
```

## Correr local
```
npm install
npm run dev
```

## Desplegar (pasos en tu cuenta)
1. Crea un repo nuevo en GitHub (ej. `skyline-portal`) y sube esta carpeta.
2. En Vercel: New Project → importa ese repo.
3. En Vercel → Settings → Environment Variables: agrega las 2 variables de arriba.
4. (Opcional) Conecta un dominio propio (ej. `portal.tudominio.com`).
5. En Supabase → Authentication → URL Configuration → Redirect URLs:
   agrega `https://<tu-portal>.vercel.app/auth/callback` (y el dominio si pones uno).

## Notas
- El equipo (`@skylinemedia.io`) que entre aquí es redirigido al panel interno.
- No contiene NADA del panel interno: los clientes no pueden navegar a /dashboard.
- La seguridad de datos sigue siendo por RLS (mismo Supabase).
