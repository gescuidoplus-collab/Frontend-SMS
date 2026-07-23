import dayjs from 'dayjs';
import type { CloudnavisEmpleado, CloudnavisEmpleador } from './cloudnavisClient';

/**
 * Form values for Documentos Grupo
 */
export interface DocumentosGrupoFormValues {
  primerApellido?: string;
  segundoApellido?: string;
  nombres?: string;
  nif?: string;
  sexo?: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  diaNacimiento?: number;
  mesNacimiento?: number;
  anioNacimiento?: number;
  tipoVia?: string;
  nombreVia?: string;
  bloque?: string;
  numero?: string;
  puerta?: string;
  codPostal?: string;
  municipio?: string;
  provincia?: string;
  pais?: string;
  codigoSwift?: string;
  numeroCuenta?: string;
  cuentaCotizacion?: string;
  lugarFirma?: string;
  fechaFirma?: string;
}

/**
 * Form values for Contrato
 */
export interface ContratoFormValues {
  nomempleador?: string;
  nifempleador?: string;
  correoempleador?: string;
  regimen?: string;
  codigo?: string;
  prov?: string;
  numero?: string;
  dig?: string;
  contr?: string;
  domicilio?: string;
  municipio?: string;
  nombretrabajador?: string;
  niftrabajador?: string;
  correotrabajador?: string;
  numafiliaciontrabajador?: string;
  nivelformativotrabajador?: string;
  nacionalidadtrabajador?: string;
  municipiodomtrabaajdor?: string;
  paisdomtrabajador?: string;
  fechacontrato?: string;
  montobruto?: number;
  lugarfirma?: string;
  mesfirma?: string;
  diafirma?: string;
  anofirma?: string;
  fechanactrabajador?: string;
}

/**
 * Form values for Finiquito
 */
export interface FiniquitoFormValues {
  nomempleada?: string;
  niempleada?: string;
  correoempleada?: string;
  nomempleador?: string;
  correoempleador?: string;
}

/**
 * Split apellidos into primer y segundo apellido
 * Splits on the first whitespace
 */
function splitApellidos(apellidos: string): { primerApellido: string; segundoApellido: string } {
  const parts = apellidos.trim().split(/\s+/, 2);
  return {
    primerApellido: parts[0] || '',
    segundoApellido: parts[1] || '',
  };
}

/**
 * Map sexo from CloudNavis format to form format
 * "Mujer" → "F", "Hombre" → "M"
 */
function mapSexo(sexo: string): string {
  if (!sexo) return '';
  const normalized = sexo.toLowerCase().trim();
  if (normalized === 'mujer') return 'F';
  if (normalized === 'hombre') return 'M';
  return sexo; // return original if not recognized
}

/**
 * Parse a date string in YYYY-MM-DD format and return day, month, year
 */
function parseFecha(
  fechaStr: string
): { dia: number; mes: number; anio: number } | null {
  if (!fechaStr) return null;
  const parsed = dayjs(fechaStr, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) return null;
  return {
    dia: parsed.date(),
    mes: parsed.month() + 1, // dayjs months are 0-indexed
    anio: parsed.year(),
  };
}

/**
 * Map CloudNavis Empleado to DocumentosGrupo form values
 *
 * Mappings:
 * - nombre → nombres
 * - apellidos → split → primerApellido + segundoApellido
 * - dni → nif
 * - sexo → "Mujer"→"F", "Hombre"→"M"
 * - fechaNacimiento (YYYY-MM-DD) → diaNacimiento, mesNacimiento, anioNacimiento
 * - direccion → nombreVia (all together)
 * - provincia, municipio, codigoPostal, cuentaCorriente → direct mapping
 */
export function mapEmpleadoToDocumentosGrupo(
  data: CloudnavisEmpleado
): Partial<DocumentosGrupoFormValues> {
  const result: Partial<DocumentosGrupoFormValues> = {};

  if (data.nombre) {
    result.nombres = data.nombre;
  }

  if (data.apellidos) {
    const { primerApellido, segundoApellido } = splitApellidos(data.apellidos);
    result.primerApellido = primerApellido;
    result.segundoApellido = segundoApellido;
  }

  if (data.dni) {
    result.nif = data.dni;
  }

  if (data.sexo) {
    result.sexo = mapSexo(data.sexo);
  }

  if (data.fechaNacimiento) {
    const fechaParts = parseFecha(data.fechaNacimiento);
    if (fechaParts) {
      result.diaNacimiento = fechaParts.dia;
      result.mesNacimiento = fechaParts.mes;
      result.anioNacimiento = fechaParts.anio;
    }
  }

  if (data.direccion) {
    result.nombreVia = data.direccion;
  }

  if (data.provincia) {
    result.provincia = data.provincia;
  }

  if (data.municipio) {
    result.municipio = data.municipio;
  }

  if (data.codigoPostal) {
    result.codPostal = data.codigoPostal;
  }

  if (data.cuentaCorriente) {
    result.numeroCuenta = data.cuentaCorriente;
  }

  return result;
}

/**
 * Map CloudNavis Empleado to Contrato form values
 *
 * Mappings:
 * - nombre + apellidos → nombretrabajador (concatenated with space)
 * - dni → niftrabajador
 * - email → correotrabajador
 * - fechaNacimiento (YYYY-MM-DD) → fechanactrabajador (dayjs object)
 * - nacionalidad → nacionalidadtrabajador
 * - nivelEstudios → nivelformativotrabajador
 * - municipio → municipiodomtrabaajdor
 * - nacionalidad → paisdomtrabajador
 */
export function mapEmpleadoToContrato(
  data: CloudnavisEmpleado
): Partial<ContratoFormValues> {
  const result: Partial<ContratoFormValues> = {};

  if (data.nombre && data.apellidos) {
    result.nombretrabajador = `${data.nombre} ${data.apellidos}`;
  } else if (data.nombre) {
    result.nombretrabajador = data.nombre;
  }

  if (data.dni) {
    result.niftrabajador = data.dni;
  }

  if (data.email) {
    result.correotrabajador = data.email;
  }

  if (data.fechaNacimiento) {
    result.fechanactrabajador = data.fechaNacimiento;
  }

  if (data.nacionalidad) {
    result.nacionalidadtrabajador = data.nacionalidad;
    result.paisdomtrabajador = data.nacionalidad;
  }

  if (data.nivelEstudios) {
    result.nivelformativotrabajador = data.nivelEstudios;
  }

  if (data.municipio) {
    result.municipiodomtrabaajdor = data.municipio;
  }

  return result;
}

/**
 * Map CloudNavis Empleador to Contrato form values
 *
 * Mappings:
 * - nombre + apellidos → nomempleador (concatenated with space)
 * - dni → nifempleador
 * - email → correoempleador
 * - direccion → domicilio
 * - provincia → prov
 * - municipio → municipio
 */
export function mapEmpleadorToContrato(
  data: CloudnavisEmpleador
): Partial<ContratoFormValues> {
  const result: Partial<ContratoFormValues> = {};

  if (data.nombre && data.apellidos) {
    result.nomempleador = `${data.nombre} ${data.apellidos}`;
  } else if (data.nombre) {
    result.nomempleador = data.nombre;
  }

  if (data.dni) {
    result.nifempleador = data.dni;
  }

  if (data.email) {
    result.correoempleador = data.email;
  }

  if (data.direccion) {
    result.domicilio = data.direccion;
  }

  if (data.provincia) {
    result.prov = data.provincia;
  }

  if (data.municipio) {
    result.municipio = data.municipio;
  }

  return result;
}
