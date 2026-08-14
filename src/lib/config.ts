/**
 * Única definición de la base de la API.
 *
 * Estaba repetida a mano en cada pantalla apuntando al backend local, así que
 * al desplegar el navegador intentaba hablar con la máquina de quien lo abría.
 * Aquí se resuelve una sola vez: en producción vale el valor por defecto y en
 * local se cambia con NEXT_PUBLIC_API_URL en .env.local.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backend-sms-production-0b80.up.railway.app/api/v1";
