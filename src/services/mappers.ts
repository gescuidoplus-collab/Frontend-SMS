import dayjs from 'dayjs';
import type {
  CloudnavisEmpleado,
  CloudnavisEmpleador,
  CloudnavisServicio,
} from './cloudnavisClient';

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
  naf?: string;
  correo?: string;
  telefono?: string;
  razonSocial?: string;
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
  municipiodomtrabajador?: string;
  paisdomtrabajador?: string;
  fechacontrato?: dayjs.Dayjs;
  montobruto?: number;
  lugarfirma?: string;
  mesfirma?: string;
  diafirma?: string;
  anofirma?: string;
  fechanactrabajador?: dayjs.Dayjs;
  cuentaCotizacion?: string;
  interExterno?: string;
  // Cláusulas que se pueden deducir del servicio
  clausulaPuesto?: string;
  clausulaDistribucion?: string;
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
  fechadesde?: dayjs.Dayjs;
  fechasalariofinalconanio?: dayjs.Dayjs;
  salarioNeto?: number;
  tipoJornada?: 'lv' | 'finde';
}

/**
 * Une nombre y apellidos en una sola línea.
 *
 * CloudNavis devuelve los campos con espacios sobrantes ("Luis Maria ",
 * " Jimenez Arias "), y sin limpiarlos el nombre sale con espacios dobles en
 * el contrato y en el finiquito.
 */
function nombreCompleto(nombre?: string, apellidos?: string): string {
  return [nombre, apellidos]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split apellidos into primer and segundo apellido
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
 * Deduce el tipo de documento a partir del propio número.
 *
 * El NIE español empieza por X, Y o Z; cualquier otra cosa se trata como DNI.
 * CloudNavis no distingue entre uno y otro, así que hay que mirarlo aquí.
 */
export function tipoDeDocumento(dni: string): 'dni' | 'nie' {
  return /^[XYZ]/i.test(dni.trim()) ? 'nie' : 'dni';
}

/**
 * Datos del cliente para el paquete de documentos de alta.
 *
 * Este formulario va a nombre del empleador (el cliente), no de la empleada:
 * los tres modelos que genera son suyos, y por eso su enlace lleva idCliente.
 */
export function mapClienteToDocumentosGrupo(
  data: CloudnavisEmpleador
): Partial<DocumentosGrupoFormValues> {
  const result: Partial<DocumentosGrupoFormValues> = {};

  if (data.nombre) {
    result.nombres = data.nombre.replace(/\s+/g, ' ').trim();
  }

  if (data.apellidos) {
    const { primerApellido, segundoApellido } = splitApellidos(data.apellidos);
    result.primerApellido = primerApellido;
    result.segundoApellido = segundoApellido;
  }

  if (data.dni) {
    const documento = data.dni.trim();
    result.nif = documento;
    // El modelo TA1 pide el documento por separado, con su tipo marcado.
    result.numeroDocumento = documento;
    result.tipoDocumento = tipoDeDocumento(documento);
  }

  if (data.sexo) {
    result.sexo = mapSexo(data.sexo);
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

  // La cuenta corriente del cliente NO se copia: el IBAN del SEPA es el de la
  // cuenta de adeudo, que se escribe a mano en su apartado.

  if (data.codigoCuentaCotizacion) {
    result.cuentaCotizacion = data.codigoCuentaCotizacion;
  }

  if (data.naf) {
    result.naf = data.naf;
  }

  if (data.email) {
    result.correo = data.email;
  }

  if (data.telefono1) {
    result.telefono = data.telefono1;
  }

  // En el empleo de hogar el empleador es una persona física, así que su
  // nombre completo hace de razón social en el modelo FR con CCC.
  const nombre = nombreCompleto(data.nombre, data.apellidos);
  if (nombre) {
    result.razonSocial = nombre;
  }

  // El municipio es también donde se firma, igual que en el contrato.
  if (data.municipio) {
    result.lugarFirma = data.municipio;
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
 * - municipio → municipiodomtrabajador
 * - nacionalidad → paisdomtrabajador
 */
export function mapEmpleadoToContrato(
  data: CloudnavisEmpleado
): Partial<ContratoFormValues> {
  const result: Partial<ContratoFormValues> = {};

  const nombretrabajador = nombreCompleto(data.nombre, data.apellidos);
  if (nombretrabajador) {
    result.nombretrabajador = nombretrabajador;
  }

  if (data.dni) {
    result.niftrabajador = data.dni;
  }

  if (data.email) {
    result.correotrabajador = data.email;
  }

  if (data.fechaNacimiento) {
    result.fechanactrabajador = dayjs(data.fechaNacimiento, 'YYYY-MM-DD');
  }

  if (data.nacionalidad) {
    result.nacionalidadtrabajador = data.nacionalidad;
    result.paisdomtrabajador = data.nacionalidad;
  }

  if (data.nivelEstudios) {
    result.nivelformativotrabajador = data.nivelEstudios;
  }

  if (data.municipio) {
    result.municipiodomtrabajador = data.municipio;
  }

  // El número de afiliación viene como `naf` y se pedía a mano.
  if (data.naf) {
    result.numafiliaciontrabajador = data.naf;
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

  const nomempleador = nombreCompleto(data.nombre, data.apellidos);
  if (nomempleador) {
    result.nomempleador = nomempleador;
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

  // Es el campo que se reparte entre las casillas de la cuenta de cotización;
  // no tiene longitud fija (el de ejemplo trae 15 dígitos).
  if (data.codigoCuentaCotizacion) {
    result.cuentaCotizacion = data.codigoCuentaCotizacion;
  }

  return result;
}

/**
 * La descripción del servicio ("Externa 1 h L-V", "Interna fin de semana"…)
 * indica de paso si la jornada es interna o externa y si es de fin de semana.
 */
function interExternoDeDescripcion(descripcion?: string): string | undefined {
  if (!descripcion) return undefined;

  const texto = descripcion.toLowerCase();
  const esFinde = /fin(es)?\s+de\s+semana|finde/.test(texto);

  if (texto.includes('interna')) return esFinde ? 'Interna fin de semana' : 'Interna';
  if (texto.includes('externa')) return esFinde ? 'Externa fin de semana' : 'Externa';
  return undefined;
}

/**
 * Datos del contrato que salen del propio servicio: las condiciones económicas
 * y de jornada, que antes había que teclear a mano.
 */
export function mapServicioToContrato(
  data: CloudnavisServicio
): Partial<ContratoFormValues> {
  const result: Partial<ContratoFormValues> = {};

  if (data.fechaInicio) {
    result.fechacontrato = dayjs(data.fechaInicio, 'YYYY-MM-DD');
  }

  // El contrato recoge el bruto; el neto de fin de semana solo aplica a esas
  // jornadas y es el que manda cuando viene informado.
  const bruto = data.sueldoNetoFinSemana ?? data.sueldoBruto;
  if (typeof bruto === 'number' && bruto > 0) {
    result.montobruto = bruto;
  }

  const interExterno = interExternoDeDescripcion(data.descripcion);
  if (interExterno) {
    result.interExterno = interExterno;
  }

  if (data.horario) {
    result.clausulaDistribucion = data.horario;
  }

  if (data.funciones) {
    result.clausulaPuesto = data.funciones;
  }

  return result;
}

/**
 * Datos del finiquito que salen del servicio: el alta, la baja y el salario
 * sobre el que se calcula todo.
 */
export function mapServicioToFiniquito(
  data: CloudnavisServicio
): Partial<FiniquitoFormValues> {
  const result: Partial<FiniquitoFormValues> = {};

  if (data.fechaInicio) {
    result.fechadesde = dayjs(data.fechaInicio, 'YYYY-MM-DD');
  }

  if (data.fechaFin) {
    result.fechasalariofinalconanio = dayjs(data.fechaFin, 'YYYY-MM-DD');
  }

  // El finiquito se calcula siempre sobre el neto.
  const neto = data.sueldoNetoFinSemana ?? data.sueldoNeto;
  if (typeof neto === 'number' && neto > 0) {
    result.salarioNeto = neto;
  }

  // Una descripción de fin de semana cambia el precio del día del último período.
  const interExterno = interExternoDeDescripcion(data.descripcion);
  if (interExterno?.includes('fin de semana')) {
    result.tipoJornada = 'finde';
  } else if (interExterno) {
    result.tipoJornada = 'lv';
  }

  return result;
}

/**
 * Map CloudNavis Empleado to Finiquito form values
 *
 * Mappings:
 * - nombre + apellidos → nomempleada (concatenated with space)
 * - dni → niempleada
 * - email → correoempleada
 */
export function mapEmpleadoToFiniquito(
  data: CloudnavisEmpleado
): Partial<FiniquitoFormValues> {
  const result: Partial<FiniquitoFormValues> = {};

  const nomempleada = nombreCompleto(data.nombre, data.apellidos);
  if (nomempleada) {
    result.nomempleada = nomempleada;
  }

  if (data.dni) {
    result.niempleada = data.dni;
  }

  if (data.email) {
    result.correoempleada = data.email;
  }

  return result;
}

/**
 * Map CloudNavis Empleador to Finiquito form values
 *
 * Mappings:
 * - nombre + apellidos → nomempleador (concatenated with space)
 * - email → correoempleador
 */
export function mapEmpleadorToFiniquito(
  data: CloudnavisEmpleador
): Partial<FiniquitoFormValues> {
  const result: Partial<FiniquitoFormValues> = {};

  const nomempleador = nombreCompleto(data.nombre, data.apellidos);
  if (nomempleador) {
    result.nomempleador = nomempleador;
  }

  if (data.email) {
    result.correoempleador = data.email;
  }

  return result;
}
