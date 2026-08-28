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
  /** Número de afiliación a la Seguridad Social */
  naf?: string;
  telefono1?: string;
}

export interface CloudnavisEmpleador {
  id: string;
  dni: string;
  nombre: string;
  apellidos: string;
  sexo?: string;
  email: string;
  direccion: string;
  provincia: string;
  municipio: string;
  codigoPostal: string;
  cuentaCorriente?: string;
  /** Cuenta de cotización del empleador; no tiene longitud fija */
  codigoCuentaCotizacion?: string;
  naf?: string;
  telefono1?: string;
}

/**
 * Asignación de una empleada a un servicio. El servicio puede tener varias a
 * lo largo del tiempo, así que la del enlace se localiza por su `id`.
 */
export interface CloudnavisAsignacion {
  id: string;
  idEmpleado: string;
  dniEmpleado: string | null;
  nombreEmpleado: string;
  apellidosEmpleado: string;
  fechaInicio: string;
  fechaFin: string;
}

/**
 * Servicio contratado. Es el punto de entrada de los enlaces: de aquí salen el
 * cliente (`idUsuario`), la empleada (dentro de `asignaciones`) y las
 * condiciones económicas del contrato.
 */
export interface CloudnavisServicio {
  id: string;
  idUsuario: string;
  idEmpleado: string | null;
  nombreUsuario: string;
  apellidosUsuario: string;
  dniUsuario: string;
  sueldoNeto: number | null;
  sueldoBruto: number | null;
  sueldoNetoFinSemana: number | null;
  regimenServicio: string;
  fechaInicio: string;
  fechaFin: string;
  horario: string;
  funciones: string;
  descripcion: string;
  horasMensuales: number | null;
  precioHora: number | null;
  asignaciones: CloudnavisAsignacion[];
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
 * Descarga un servicio de CloudNavis.
 *
 * Es la primera llamada de los enlaces de contrato y finiquito: de su
 * respuesta salen el id del cliente y, dentro de `asignaciones`, el de la
 * empleada, que hay que buscar por el `idAsignacion` que viene en la URL.
 *
 * @throws 'TOKEN_INVALID' | 'SERVICIO_NOT_FOUND' | 'NETWORK_ERROR' | 'MALFORMED_RESPONSE'
 */
export async function fetchCloudnavisServicio(
  idServicio: string,
  token: string
): Promise<CloudnavisServicio> {
  const baseUrl = CLOUDNAVIS_URL;

  if (!baseUrl) {
    throw new Error('NETWORK_ERROR');
  }

  try {
    new URL(baseUrl);
  } catch {
    throw new Error('NETWORK_ERROR');
  }

  const encodedId = encodeURIComponent(idServicio);
  const url = `${baseUrl}/api/edades/cuidofam/api/servicios/edit?uuid=${encodedId}`;

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
      throw new Error('SERVICIO_NOT_FOUND');
    }

    if (!response.ok) {
      throw new Error('NETWORK_ERROR');
    }

    const data = await response.json();

    if (typeof data !== 'object' || data === null || typeof (data as CloudnavisServicio).id !== 'string') {
      throw new Error('MALFORMED_RESPONSE');
    }

    const servicio = data as CloudnavisServicio;
    // El campo puede llegar a null; el resto del código asume una lista.
    return { ...servicio, asignaciones: servicio.asignaciones ?? [] };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('NETWORK_ERROR');
    }
    if (
      error instanceof Error &&
      ['TOKEN_INVALID', 'SERVICIO_NOT_FOUND', 'NETWORK_ERROR', 'MALFORMED_RESPONSE'].includes(error.message)
    ) {
      throw error;
    }
    throw new Error('NETWORK_ERROR');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Localiza la empleada del enlace dentro de las asignaciones del servicio.
 *
 * Si el `idAsignacion` no aparece se devuelve null en lugar de tirar de la
 * primera: asignar el contrato a otra persona sería un error grave y silencioso.
 */
export function idEmpleadoDeAsignacion(
  servicio: CloudnavisServicio,
  idAsignacion: string
): string | null {
  const asignacion = servicio.asignaciones.find((a) => a.id === idAsignacion);
  return asignacion?.idEmpleado || null;
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
