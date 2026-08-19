/**
 * Provincias, municipios y códigos postales de España.
 *
 * Los datos salen del callejero del INE (edición 2026-07) y del diccionario de
 * municipios 2026: 52 provincias, 8.132 municipios y 10.797 códigos postales.
 * Van embebidos a propósito, para poder rellenar el contrato sin depender de
 * ningún servicio externo ni de buscar el código a mano.
 *
 * Ojo: el código postal NO siempre empieza por el código de la provincia. Hay
 * una treintena de municipios fronterizos y enclaves (Condado de Treviño,
 * Petilla de Aragón…) cuyo CP pertenece al rango de la provincia vecina, así
 * que los códigos se guardan enteros y nunca se deducen del prefijo.
 */

import datos from "./codigosPostales.json";

export interface Provincia {
  codigo: string;
  nombre: string;
}

/** Municipio como par [nombre, códigos postales]. */
type MunicipioTupla = [string, string[]];

// TypeScript lee los pares del JSON como (string | string[])[], no como tupla,
// así que hay que afirmar la forma real del dato.
const MUNICIPIOS = datos.municipios as unknown as Record<string, MunicipioTupla[]>;

/** Las 52 provincias, ya ordenadas alfabéticamente. */
export const PROVINCIAS: Provincia[] = datos.provincias;

/** Municipios de una provincia, ordenados alfabéticamente. */
export const municipiosDe = (codigoProvincia?: string): MunicipioTupla[] =>
  (codigoProvincia && MUNICIPIOS[codigoProvincia]) || [];

/** Códigos postales de un municipio concreto. */
export const codigosDe = (codigoProvincia?: string, municipio?: string): string[] => {
  if (!codigoProvincia || !municipio) return [];
  return municipiosDe(codigoProvincia).find(([nombre]) => nombre === municipio)?.[1] ?? [];
};

/**
 * Provincia y municipio a los que pertenece un código postal, para poder
 * reconstruir los desplegables cuando el código llega ya relleno desde fuera.
 * Devuelve la primera coincidencia: un mismo CP puede cubrir varios municipios.
 */
export const ubicacionDe = (
  codigoPostal?: string
): { provincia: string; municipio: string } | null => {
  if (!codigoPostal) return null;

  for (const provincia of Object.keys(MUNICIPIOS)) {
    for (const [municipio, codigos] of MUNICIPIOS[provincia]) {
      if (codigos.includes(codigoPostal)) return { provincia, municipio };
    }
  }
  return null;
};
