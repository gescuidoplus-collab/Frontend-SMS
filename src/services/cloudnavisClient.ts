import { CLOUDNAVIS_URL } from "@/lib/config";
// CloudNavis API Client
// Interfaces and functions for fetching employee and employer data from CloudNavis

export interface CloudnavisEmpleado {
  id: string;
  dni: string;
  nombre: string;
  apellidos: string;
  sexo: string;
  email: string;
  fechaNacimiento: string;
  direccion: string;
  provincia: string;
  municipio: string;
  codigoPostal: string;
  cuentaCorriente: string;
  nacionalidad: string;
  nivelEstudios: string;
}

export interface CloudnavisEmpleador {
  id: string;
  dni: string;
  nombre: string;
  apellidos: string;
  email: string;
  direccion: string;
  provincia: string;
  municipio: string;
  codigoPostal: string;
}

/**
 * Validate that an object has the required fields for CloudnavisEmpleado
 */
function validateCloudnavisEmpleado(data: unknown): data is CloudnavisEmpleado {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.dni === 'string' &&
    typeof obj.nombre === 'string'
  );
}

/**
 * Validate that an object has the required fields for CloudnavisEmpleador
 */
function validateCloudnavisEmpleador(data: unknown): data is CloudnavisEmpleador {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.dni === 'string' &&
    typeof obj.nombre === 'string'
  );
}

/**
 * Fetch employee data from CloudNavis API
 * @param idEmpleado - Employee UUID
 * @param token - CloudNavis authentication token
 * @returns CloudnavisEmpleado object
 * @throws Error with specific error codes:
 *   - 'TOKEN_INVALID' for 401 responses
 *   - 'EMPLEADO_NOT_FOUND' for 404 responses
 *   - 'NETWORK_ERROR' for other errors
 *   - 'MALFORMED_RESPONSE' for invalid response data
 */
export async function fetchCloudnavisEmpleado(
  idEmpleado: string,
  token: string
): Promise<CloudnavisEmpleado> {
  const baseUrl = CLOUDNAVIS_URL;

  if (!baseUrl) {
    throw new Error('NETWORK_ERROR');
  }

  // Validate base URL format
  try {
    new URL(baseUrl);
  } catch {
    throw new Error('NETWORK_ERROR');
  }

  const encodedId = encodeURIComponent(idEmpleado);
  const url = `${baseUrl}/api/edades/cuidofam/api/empleados/edit?uuid=${encodedId}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        cntoken: token,
      },
      signal: controller.signal,
    });

    if (response.status === 401) {
      throw new Error('TOKEN_INVALID');
    }

    if (response.status === 404) {
      throw new Error('EMPLEADO_NOT_FOUND');
    }

    if (!response.ok) {
      throw new Error('NETWORK_ERROR');
    }

    const data = await response.json();

    // Validate response structure before type casting
    if (!validateCloudnavisEmpleado(data)) {
      throw new Error('MALFORMED_RESPONSE');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('NETWORK_ERROR');
    }
    if (error instanceof Error && ['TOKEN_INVALID', 'EMPLEADO_NOT_FOUND', 'NETWORK_ERROR', 'MALFORMED_RESPONSE'].includes(error.message)) {
      throw error;
    }
    throw new Error('NETWORK_ERROR');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch employer data from CloudNavis API
 * @param idCliente - Employer/Client UUID
 * @param token - CloudNavis authentication token
 * @returns CloudnavisEmpleador object
 * @throws Error with specific error codes:
 *   - 'TOKEN_INVALID' for 401 responses
 *   - 'EMPLEADOR_NOT_FOUND' for 404 responses
 *   - 'NETWORK_ERROR' for other errors
 *   - 'MALFORMED_RESPONSE' for invalid response data
 */
export async function fetchCloudnavisEmpleador(
  idCliente: string,
  token: string
): Promise<CloudnavisEmpleador> {
  const baseUrl = CLOUDNAVIS_URL;

  if (!baseUrl) {
    throw new Error('NETWORK_ERROR');
  }

  // Validate base URL format
  try {
    new URL(baseUrl);
  } catch {
    throw new Error('NETWORK_ERROR');
  }

  const encodedId = encodeURIComponent(idCliente);
  const url = `${baseUrl}/api/edades/cuidofam/api/usuarios/edit?uuid=${encodedId}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        cntoken: token,
      },
      signal: controller.signal,
    });

    if (response.status === 401) {
      throw new Error('TOKEN_INVALID');
    }

    if (response.status === 404) {
      throw new Error('EMPLEADOR_NOT_FOUND');
    }

    if (!response.ok) {
      throw new Error('NETWORK_ERROR');
    }

    const data = await response.json();

    // Validate response structure before type casting
    if (!validateCloudnavisEmpleador(data)) {
      throw new Error('MALFORMED_RESPONSE');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('NETWORK_ERROR');
    }
    if (error instanceof Error && ['TOKEN_INVALID', 'EMPLEADOR_NOT_FOUND', 'NETWORK_ERROR', 'MALFORMED_RESPONSE'].includes(error.message)) {
      throw error;
    }
    throw new Error('NETWORK_ERROR');
  } finally {
    clearTimeout(timeoutId);
  }
}
