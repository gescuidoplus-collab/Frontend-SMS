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
 * Fetch employee data from CloudNavis API
 * @param idEmpleado - Employee UUID
 * @param token - CloudNavis authentication token
 * @returns CloudnavisEmpleado object
 * @throws Error with specific error codes:
 *   - 'TOKEN_INVALID' for 401 responses
 *   - 'EMPLEADO_NOT_FOUND' for 404 responses
 *   - 'NETWORK_ERROR' for other errors
 */
export async function fetchCloudnavisEmpleado(
  idEmpleado: string,
  token: string
): Promise<CloudnavisEmpleado> {
  const baseUrl = process.env.NEXT_PUBLIC_CLOUDNAVIS_API_URL;

  if (!baseUrl) {
    throw new Error('NETWORK_ERROR');
  }

  const url = `${baseUrl}/api/edades/cuidofam/api/empleados/edit?uuid=${idEmpleado}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        cntoken: token,
      },
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
    return data as CloudnavisEmpleado;
  } catch (error) {
    if (error instanceof Error && ['TOKEN_INVALID', 'EMPLEADO_NOT_FOUND', 'NETWORK_ERROR'].includes(error.message)) {
      throw error;
    }
    throw new Error('NETWORK_ERROR');
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
 */
export async function fetchCloudnavisEmpleador(
  idCliente: string,
  token: string
): Promise<CloudnavisEmpleador> {
  const baseUrl = process.env.NEXT_PUBLIC_CLOUDNAVIS_API_URL;

  if (!baseUrl) {
    throw new Error('NETWORK_ERROR');
  }

  const url = `${baseUrl}/api/edades/cuidofam/api/usuarios/edit?uuid=${idCliente}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        cntoken: token,
      },
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
    return data as CloudnavisEmpleador;
  } catch (error) {
    if (error instanceof Error && ['TOKEN_INVALID', 'EMPLEADOR_NOT_FOUND', 'NETWORK_ERROR'].includes(error.message)) {
      throw error;
    }
    throw new Error('NETWORK_ERROR');
  }
}
