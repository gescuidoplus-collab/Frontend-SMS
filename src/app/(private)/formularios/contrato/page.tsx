"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Checkbox,
  Alert,
  Button,
  Row,
  Col,
  Card,
  Space,
  Typography,
  message,
  Modal,
  DatePicker,
  Table,
  Tag,
  Empty,
  Spin,
  Divider,
  Descriptions,
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { PROVINCIAS, municipiosDe, codigosDe, ubicacionDe } from "@/data/codigosPostales";
import type { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { useRouter } from "next/navigation";
import { fetchCloudnavisEmpleado, fetchCloudnavisEmpleador } from "@/services/cloudnavisClient";
import { mapEmpleadoToContrato, mapEmpleadorToContrato } from "@/services/mappers";
import CloudnavisErrorModal from "@/components/CloudnavisErrorModal";
import { obtenerToken } from "@/lib/session";
import { API_URL } from "@/lib/config";

const { Title, Text } = Typography;

interface FormValues {
  nomempleador?: string;
  tipoDocumentoEmpleador?: "NIE" | "NIF";
  nifempleador?: string;
  correoempleador?: string;
  cuentaCotizacion?: string;
  domicilio?: string;
  municipio?: string;
  nombretrabajador?: string;
  tipoDocumentoTrabajador?: "NIE" | "NIF";
  niftrabajador?: string;
  numafiliaciontrabajador?: string;
  nivelformativotrabajador?: string;
  nacionalidadtrabajador?: string;
  municipiodomtrabajador?: string;
  paisdomtrabajador?: string;
  codPostal?: string;
  // Solo acotan los desplegables del código postal; no se envían al backend
  cpProvincia?: string;
  cpMunicipio?: string;
  interExterno?:
    | "Interna"
    | "Externa"
    | "Interna fin de semana"
    | "Externa fin de semana";
  jornadaTipo?: "completo" | "parcial";
  horasJornada?: number;
  fechacontrato?: Dayjs;
  montobruto?: number;
  lugarfirma?: string;
  fechanactrabajador?: Dayjs;

  // Cláusulas del documento (los huecos que van en el PDF del contrato)
  clausulaPuesto?: string;
  clausulaLugarTrabajo?: string;
  clausulaDistribucion?: string;
  clausulaPresencia?: "si" | "no";
  clausulaPresenciaHoras?: string;
  clausulaPresenciaReparto?: string;
  clausulaPresenciaModo?: "compensacion" | "retribucion" | "ambas";
  clausulaPeriodoPrueba?: string;
  clausulaPernocta?: "si" | "no";
  clausulaPernoctaNoches?: string;
  clausulaPeriodicidad?: string;
  clausulaConceptosSalariales?: string;
  clausulaEspecie?: "si" | "no";
  clausulaEspecieDetalle?: string;
  clausulaVacaciones?: string;
  clausulaBonificacion?: boolean;
}

interface ContratoRecord {
  _id: string;
  fechacontrato?: string;
  nombretrabajador?: string;
  niftrabajador?: string;
  nomempleador?: string;
  montobruto?: string | number;
  status?: string;
  createdAt?: string;
  correoempleado?: string;
  correoempleador?: string;
  signingLinks?: { role: string; link: string }[];
  lastError?: { stage?: string; message?: string };
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const formatearFecha = (date: Dayjs | undefined, tipo: "completa"): string => {
  if (!date) return "";
  const dia = date.date();
  const mes = MESES[date.month()];
  const anio = date.year();
  return `${dia} de ${mes} ${anio}`;
};

/**
 * Reparte la cuenta de cotización entre las casillas del contrato:
 * Régimen(4) + Cód.(1) + Prov.(1) + Número(variable) + Díg.(1) + Contr.(1).
 *
 * El número no tiene una longitud fija, así que se toma lo que queda entre la
 * provincia y los dos últimos dígitos, que siempre son el dígito de control y
 * el de control de cuenta. La cuadrícula del PDF admite hasta 9 en el número,
 * de ahí el máximo de 17 dígitos en total.
 */
const CUENTA_COTIZACION_MAX = 17;

const splitCuentaCotizacion = (value?: string) => {
  const digits = (value || "").replace(/\D/g, "").slice(0, CUENTA_COTIZACION_MAX);
  const cabecera = {
    regimen: digits.slice(0, 4),
    codigo: digits.slice(4, 5),
    prov: digits.slice(5, 6),
  };

  // Con menos de 9 dígitos (4+1+1+1+1+1) todavía no hay número ni dígitos de
  // control que separar: se muestra lo que haya y el resto queda vacío.
  if (digits.length < 9) {
    return { ...cabecera, numero: digits.slice(6), dig: "", contr: "" };
  }

  return {
    ...cabecera,
    numero: digits.slice(6, -2),
    dig: digits.slice(-2, -1),
    contr: digits.slice(-1),
  };
};

const NIVELES_FORMATIVOS = [
  "Sin estudios",
  "Estudios primarios",
  "Educación Secundaria Obligatoria (ESO)",
  "Bachillerato",
  "Formación Profesional Grado Medio",
  "Formación Profesional Grado Superior",
  "Diplomatura / Grado Universitario",
  "Licenciatura / Máster",
  "Doctorado",
  "Otros",
];

// Lista de referencia — cubre los países más frecuentes; ampliar según necesidad
const NACIONALIDADES = [
  "Afgana", "Albanesa", "Alemana", "Andorrana", "Angoleña", "Antiguana y Barbudense",
  "Argelina", "Argentina", "Armenia", "Australiana", "Austriaca", "Azerbaiyana",
  "Bahameña", "Bahreiní", "Bangladesí", "Barbadense", "Belga", "Beliceña", "Beninesa",
  "Bielorrusa", "Birmana", "Boliviana", "Bosnia", "Botsuana", "Brasileña", "Bruneana",
  "Búlgara", "Burkinesa", "Burundesa", "Butanesa", "Caboverdiana", "Camboyana",
  "Camerunesa", "Canadiense", "Catarí", "Centroafricana", "Chadiana", "Checa",
  "Chilena", "China", "Chipriota", "Colombiana", "Comorense", "Congoleña (Rep. del Congo)",
  "Congoleña (Rep. Dem. del Congo)", "Costarricense", "Croata", "Cubana", "Danesa",
  "Dominiquesa", "Dominicana", "Ecuatoguineana", "Ecuatoriana", "Egipcia", "Emiratí",
  "Eritrea", "Eslovaca", "Eslovena", "Española", "Estadounidense", "Estonia",
  "Esuatinense", "Etíope", "Filipina", "Finlandesa", "Fiyiana", "Francesa", "Gabonesa",
  "Gambiana", "Georgiana", "Ghanesa", "Granadina", "Griega", "Guatemalteca", "Guineana",
  "Guineana-Bisáu", "Guyanesa", "Haitiana", "Hondureña", "Húngara", "India", "Indonesia",
  "Iraquí", "Iraní", "Irlandesa", "Islandesa", "Israelí", "Italiana", "Jamaicana",
  "Japonesa", "Jordana", "Kazaja", "Keniana", "Kirguisa", "Kiribatiana", "Kuwaití",
  "Laosiana", "Lesotense", "Letona", "Libanesa", "Liberiana", "Libia", "Liechtensteiniana",
  "Lituana", "Luxemburguesa", "Macedonia", "Malgache", "Malasia", "Malauí", "Maldiva",
  "Maliense", "Maltesa", "Marfileña", "Marroquí", "Marshalesa", "Mauriciana",
  "Mauritana", "Mexicana", "Micronesia", "Moldava", "Monegasca", "Mongola",
  "Montenegrina", "Mozambiqueña", "Namibia", "Nauruana", "Neerlandesa", "Nepalí",
  "Neozelandesa", "Nicaragüense", "Nigeriana", "Nigerina", "Norcoreana", "Noruega",
  "Omaní", "Pakistaní", "Palauana", "Palestina", "Panameña", "Papú", "Paraguaya",
  "Peruana", "Polaca", "Portuguesa", "Británica", "Rumana", "Rusa", "Ruandesa",
  "Samoana", "Sanmarinense", "Santalucense", "Sancristobaleña", "Saotomense", "Saudí",
  "Senegalesa", "Serbia", "Seychellense", "Sierraleonesa", "Singapurense", "Siria",
  "Somalí", "Esrilanquesa", "Sudafricana", "Sudanesa", "Sursudanesa", "Sueca", "Suiza",
  "Surcoreana", "Surinamesa", "Tailandesa", "Tanzana", "Tayika", "Timorense",
  "Togolesa", "Tonganesa", "Trinitense", "Tunecina", "Turca", "Turcomana", "Tuvaluana",
  "Ucraniana", "Ugandesa", "Uruguaya", "Uzbeka", "Vanuatuense", "Vaticana",
  "Venezolana", "Vicentina", "Vietnamita", "Yemení", "Yibutiana", "Zambiana",
  "Zimbabuense", "Otra",
];

/**
 * Valores de partida de las cláusulas: son los que se repiten en casi todos los
 * contratos, pero se dejan editables porque no siempre aplican. Lo que no lleva
 * valor por defecto se rellena a mano en cada contrato.
 */
const CLAUSULAS_POR_DEFECTO = {
  clausulaPuesto: "Asistente Personal",
  clausulaPeriodoPrueba: "2 meses",
  clausulaPeriodicidad: "mensual",
  clausulaConceptosSalariales: "pagas prorrateadas",
  clausulaVacaciones: "30 días naturales",
  clausulaBonificacion: true,
};

export default function ContratoPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [contratos, setContratos] = useState<ContratoRecord[]>([]);
  const [contratosLoading, setContratosLoading] = useState(false);
  // Provincia y municipio elegidos para el código postal. Solo sirven para ir
  // acotando los desplegables: al backend se le sigue mandando el código.
  const [provinciaCp, setProvinciaCp] = useState<string | undefined>();
  const [municipioCp, setMunicipioCp] = useState<string | undefined>();

  /**
   * Deja provincia y municipio en consonancia con un código postal que llega
   * ya puesto (prellenado de CloudNavis), para que los desplegables no salgan
   * vacíos con un código escrito debajo.
   */
  const sincronizarCodigoPostal = (codPostal?: string) => {
    const ubicacion = ubicacionDe(codPostal);
    if (!ubicacion) return;

    setProvinciaCp(ubicacion.provincia);
    setMunicipioCp(ubicacion.municipio);
    form.setFieldsValue({
      cpProvincia: ubicacion.provincia,
      cpMunicipio: ubicacion.municipio,
    });

    // Solo si viene vacío: aquí el municipio se deduce de un dato ya existente,
    // así que no debe pisar un lugar de firma que ya se hubiera indicado.
    if (!form.getFieldValue("lugarfirma")) {
      form.setFieldValue("lugarfirma", ubicacion.municipio);
    }
  };
  const router = useRouter();


  const cargarContratos = async () => {
    setContratosLoading(true);
    try {
      const token = obtenerToken();
      // Sin limit el backend devuelve solo 10 registros y el historial parece
      // incompleto; la tabla pagina por su cuenta sobre lo que llegue.
      const response = await fetch(
        `${API_URL}/contrato/lista?limit=200`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Sin este aviso la tabla se queda vacía sin explicar por qué (p. ej.
        // con la sesión caducada el backend responde 403).
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Tu sesión ha caducado. Vuelve a iniciar sesión."
            : `El servidor respondió ${response.status}`
        );
      }

      const data = await response.json();
      setContratos(data.data || []);
    } catch (error) {
      console.error("Error cargando contratos:", error);
      message.error(`No se pudo cargar el historial: ${(error as Error).message}`);
    } finally {
      setContratosLoading(false);
    }
  };

  // El historial se carga siempre al abrir la página. Antes solo se pedía
  // dentro del efecto de prellenado de CloudNavis, que corta antes si no vienen
  // los parámetros en la URL, así que entrando de forma normal nunca aparecía.
  useEffect(() => {
    cargarContratos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idEmpleado = params.get("idEmpleado");
    const idCliente = params.get("idCliente");
    const token = params.get("token");

    // Sin parametros se entra a rellenar a mano, que es lo normal.
    if (!idEmpleado && !idCliente && !token) return;

    // Pero si el enlace trae algo y le falta lo esencial, hay que decirlo:
    // antes se salia en silencio y el formulario aparecia vacio sin motivo.
    if (!idEmpleado || !idCliente || !token) {
      setErrorCode("ENLACE_INCOMPLETO");
      return;
    }

    setLoading(true);
    setErrorCode(null);

    (async () => {
      try {
        const [empleado, empleador] = await Promise.all([
          fetchCloudnavisEmpleado(idEmpleado, token),
          fetchCloudnavisEmpleador(idCliente, token),
        ]);

        const mappedEmpleado = mapEmpleadoToContrato(empleado);
        const mappedEmpleador = mapEmpleadorToContrato(empleador);

        form.setFieldsValue({ ...mappedEmpleado, ...mappedEmpleador });
        sincronizarCodigoPostal(form.getFieldValue("codPostal"));

        // Cargar historial de contratos del empleado
        cargarContratos();
      } catch (err) {
        const error = err as Error;
        if (error.message === "TOKEN_INVALID") {
          setErrorCode("TOKEN_INVALID");
        } else if (error.message === "EMPLEADO_NOT_FOUND") {
          setErrorCode("EMPLEADO_NOT_FOUND");
        } else if (error.message === "EMPLEADOR_NOT_FOUND") {
          setErrorCode("EMPLEADOR_NOT_FOUND");
        } else if (error.message === "NETWORK_ERROR") {
          setErrorCode("NETWORK_ERROR");
        } else {
          setErrorCode("MALFORMED_RESPONSE");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const handleRetryFetch = () => {
    window.location.reload();
  };

  const mostrarEnlacesFirma = (links: { role: string; link: string }[]) => {
    Modal.info({
      title: "Enlaces de firma",
      width: 640,
      okText: "Cerrar",
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>
            Envía cada enlace a la persona correspondiente. Con el enlace puede ver el
            documento y firmarlo, sin necesidad de correo ni de crearse una cuenta.
          </p>
          {links.map((l) => (
            <div key={l.role} style={{ marginBottom: 16 }}>
              <Text strong>{l.role}</Text>
              <Input.TextArea
                value={l.link}
                readOnly
                autoSize
                onFocus={(e) => e.target.select()}
                style={{ marginTop: 4, fontSize: 12 }}
              />
              <Space style={{ marginTop: 4 }}>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(l.link);
                    message.success(`Enlace de ${l.role} copiado`);
                  }}
                >
                  Copiar enlace
                </Button>
                <Button size="small" onClick={() => window.open(l.link, "_blank")}>
                  Abrir
                </Button>
              </Space>
            </div>
          ))}
        </div>
      ),
    });
  };

  const descargarPdf = async (record: ContratoRecord) => {
    const key = `descarga-${record._id}`;
    message.loading({ content: "Generando PDF...", key });
    try {
      const token = obtenerToken();
      const response = await fetch(
        `${API_URL}/contrato/${record._id}/descargar`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const detalle = await response.text();
        throw new Error(`${response.status} — ${detalle.slice(0, 200)}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // El enlace debe estar en el DOM para que el click dispare la descarga
      const link = document.createElement("a");
      link.href = url;
      link.download = `contrato-${record.nombretrabajador || record._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);

      message.success({ content: "PDF descargado", key });
    } catch (err) {
      console.error("Error descargando PDF:", err);
      message.error({
        content: `No se pudo descargar el PDF: ${(err as Error).message}`,
        key,
        duration: 6,
      });
    }
  };

  const eliminarContrato = (record: ContratoRecord) => {
    Modal.confirm({
      title: "Eliminar contrato",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: (
        <div>
          <p>
            Se eliminará el contrato de{" "}
            <strong>{record.nombretrabajador || "esta trabajadora"}</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            Los enlaces de firma dejarán de funcionar y no se podrá recuperar.
          </p>
        </div>
      ),
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const token = obtenerToken();
          const res = await fetch(`${API_URL}/contrato/${record._id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(`${res.status}`);
          message.success("Contrato eliminado");
          cargarContratos();
        } catch (err) {
          console.error("Error eliminando contrato:", err);
          message.error("No se pudo eliminar el contrato");
        }
      },
    });
  };

  const onFinish = async (values: FormValues) => {
    // Validación de fechas
    if (values.fechacontrato) {
      const fechaContrato = values.fechacontrato;
      // Validación adicional si es necesaria
    }

    setLoading(true);
    message.loading({ content: "Enviando contrato...", key: "sending" });

    try {
      const cuenta = splitCuentaCotizacion(values.cuentaCotizacion);
      const diafirma = values.fechacontrato ? String(values.fechacontrato.date()).padStart(2, "0") : "";
      // En la línea de firma el mes va con su nombre ("de Agosto de"), no como
      // número: el hueco del PDF tiene 141 pt y cabe de sobra.
      const mesfirma = values.fechacontrato ? MESES[values.fechacontrato.month()] : "";
      const anofirma = values.fechacontrato ? String(values.fechacontrato.year()).slice(-2) : "";

      const payload = {
        nomempleador: values.nomempleador || "",
        tipoDocumentoEmpleador: values.tipoDocumentoEmpleador || "NIF",
        nifempleador: values.nifempleador || "",
        regimen: cuenta.regimen,
        codigo: cuenta.codigo,
        prov: cuenta.prov,
        numero: cuenta.numero,
        dig: cuenta.dig,
        contr: cuenta.contr,
        domicilio: values.domicilio || "",
        municipio: values.municipio || "",
        nombretrabajador: values.nombretrabajador || "",
        tipoDocumentoTrabajador: values.tipoDocumentoTrabajador || "NIE",
        niftrabajador: values.niftrabajador || "",
        fechanactrabajador: formatearFecha(values.fechanactrabajador, "completa"),
        numafiliaciontrabajador: values.numafiliaciontrabajador || "",
        nivelformativotrabajador: values.nivelformativotrabajador || "",
        nacionalidadtrabajador: values.nacionalidadtrabajador || "",
        municipiodomtrabaajdor: values.municipiodomtrabajador || "",
        paisdomtrabajador: values.paisdomtrabajador || "",
        codPostal: values.codPostal || "",
        interExterno: values.interExterno || "",
        jornadaTipo: values.jornadaTipo || "",
        horasJornada: values.horasJornada || 0,
        fechacontrato: formatearFecha(values.fechacontrato, "completa"),
        montobruto: values.montobruto || 0,
        lugarfirma: values.lugarfirma || "",
        mesfirma,
        diafirma,
        anofirma,

        // Cláusulas del documento
        clausulaPuesto: values.clausulaPuesto || "",
        clausulaLugarTrabajo: values.clausulaLugarTrabajo || "",
        clausulaDistribucion: values.clausulaDistribucion || "",
        clausulaPresencia: values.clausulaPresencia || "",
        clausulaPresenciaHoras: values.clausulaPresenciaHoras || "",
        clausulaPresenciaReparto: values.clausulaPresenciaReparto || "",
        clausulaPresenciaModo: values.clausulaPresenciaModo || "",
        clausulaPeriodoPrueba: values.clausulaPeriodoPrueba || "",
        clausulaPernocta: values.clausulaPernocta || "",
        clausulaPernoctaNoches: values.clausulaPernoctaNoches || "",
        clausulaPeriodicidad: values.clausulaPeriodicidad || "",
        clausulaConceptosSalariales: values.clausulaConceptosSalariales || "",
        clausulaEspecie: values.clausulaEspecie || "",
        clausulaEspecieDetalle: values.clausulaEspecieDetalle || "",
        clausulaVacaciones: values.clausulaVacaciones || "",
        clausulaBonificacion: !!values.clausulaBonificacion,
      };

      const token = obtenerToken();

      const response = await fetch(
        `${API_URL}/contrato/crear`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      message.destroy("sending");

      if (response.ok) {
        const resultado = await response.json();
        const links: { role: string; link: string }[] = resultado?.data?.signingLinks || [];

        message.success("✓ Contrato generado correctamente");
        // Refrescamos ya, para que aparezca en la tabla aunque se cierre el
        // modal sin pulsar "Cerrar".
        cargarContratos();
        setTimeout(() => {
          Modal.success({
            title: "¡Contrato Generado Correctamente!",
            icon: <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 48 }} />,
            width: 640,
            content: (
              <div>
                {links.length > 0 ? (
                  <>
                    <p style={{ marginBottom: 12 }}>
                      Comparte estos enlaces para que cada parte firme. No hace falta
                      correo: con el enlace se puede ver el documento y firmarlo.
                    </p>
                    {links.map((l) => (
                      <div key={l.role} style={{ marginBottom: 12 }}>
                        <Text strong>{l.role}</Text>
                        <Input.TextArea
                          value={l.link}
                          readOnly
                          autoSize
                          onFocus={(e) => e.target.select()}
                          style={{ marginTop: 4, fontSize: 12 }}
                        />
                        <Space style={{ marginTop: 4 }}>
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => {
                              navigator.clipboard.writeText(l.link);
                              message.success(`Enlace de ${l.role} copiado`);
                            }}
                          >
                            Copiar enlace
                          </Button>
                          <Button size="small" onClick={() => window.open(l.link, "_blank")}>
                            Abrir
                          </Button>
                        </Space>
                      </div>
                    ))}
                  </>
                ) : (
                  <p>✓ El contrato se generó correctamente.</p>
                )}
                <p style={{ marginTop: 12, marginBottom: 0 }}>
                  Si cierras esta ventana, puedes volver a ver los enlaces con el botón{" "}
                  <strong>Enlaces</strong> del <strong>Historial de Contratos</strong>.
                </p>
              </div>
            ),
            okText: "Cerrar",
            onOk: () => {
              form.resetFields();
              setProvinciaCp(undefined);
              setMunicipioCp(undefined);
              cargarContratos();
            },
          });
        }, 500);
      } else {
        message.error("Error al enviar contrato");
        Modal.error({
          title: "Error al Enviar el Formulario",
          icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: 48 }} />,
          content: (
            <div>
              <p style={{ marginBottom: 8 }}>
                Hubo un problema al enviar el formulario. Por favor:
              </p>
              <ul style={{ marginLeft: 20 }}>
                <li>Verifica que todos los campos estén completos</li>
                <li>Revisa tu conexión a internet</li>
                <li>Intenta enviar el formulario nuevamente</li>
              </ul>
            </div>
          ),
          okText: "Entendido",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      message.destroy("sending");
      message.error("Error de conexión");
      Modal.error({
        title: "Error de Conexión",
        icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: 48 }} />,
        content: (
          <div>
            <p>No se pudo conectar con el servidor. Por favor:</p>
            <ul style={{ marginLeft: 20 }}>
              <li>Verifica tu conexión a internet</li>
              <li>Intenta nuevamente en unos momentos</li>
            </ul>
          </div>
        ),
        okText: "Entendido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CloudnavisErrorModal
        visible={!!errorCode}
        errorCode={errorCode || ""}
        onRetry={handleRetryFetch}
        onContinue={() => setErrorCode(null)}
      />
    <div style={{ background: "#f5f8ff", minHeight: "100vh", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "24px", borderBottom: "1px solid #f0f0f0" }}>
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/formularios")}
            >
              Volver
            </Button>
          </Space>
        </div>

        <div style={{ padding: "24px" }}>
          <Title level={3} style={{ marginBottom: "8px" }}>
            Contrato de Trabajo
          </Title>
          <Text type="secondary" style={{ display: "block", marginBottom: "24px" }}>
            Completa los datos para generar el contrato de trabajo indefinido
          </Text>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            initialValues={CLAUSULAS_POR_DEFECTO}
          >
            {/* Sección: Datos de Empleador */}
            <Card title="Datos de Empleador o Empleadora" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nombre Completo del Empleador"
                    name="nomempleador"
                    rules={[{ required: true, message: "El nombre del empleador es requerido" }]}
                  >
                    <Input placeholder="Juan García López" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Tipo de Documento"
                    name="tipoDocumentoEmpleador"
                    initialValue="NIF"
                    rules={[{ required: true, message: "Requerido" }]}
                  >
                    <Select>
                      <Select.Option value="NIE">NIE</Select.Option>
                      <Select.Option value="NIF">NIF</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Número de Documento"
                    name="nifempleador"
                    rules={[{ required: true, message: "El documento es requerido" }]}
                  >
                    <Input placeholder="12345678X" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Datos de la Cuenta de Cotización */}
            <Card title="Datos de la Cuenta de Cotización" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Cuenta de Cotización — No requerido"
                    name="cuentaCotizacion"
                    tooltip="Régimen(4) + Código(1) + Provincia(1) + Número + Dígito de control(1) + Contr(1). El número no tiene longitud fija: se reparte solo, tomando los dos últimos dígitos como los de control. Si se deja vacío, esos huecos salen en blanco en el contrato."
                    // Deja de ser obligatoria: hay contratos que se preparan
                    // antes de tener el número de cuenta de cotización. Solo se
                    // acota el máximo, porque a partir de ahí el PDF no tiene
                    // casillas y descartaría los dígitos sin avisar.
                    rules={[
                      {
                        pattern: new RegExp(`^\\d{9,${CUENTA_COTIZACION_MAX}}$`),
                        message: `Solo dígitos, entre 9 y ${CUENTA_COTIZACION_MAX}`,
                      },
                    ]}
                  >
                    <Input
                      placeholder="Ej. 0138011234567"
                      maxLength={CUENTA_COTIZACION_MAX}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Domicilio de la Actividad */}
            <Card title="Domicilio de la Actividad" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Domicilio"
                    name="domicilio"
                    rules={[{ required: true, message: "Este campo es requerido" }]}
                  >
                    <Input placeholder="Ej. Calle Principal 123" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Municipio"
                    name="municipio"
                    rules={[{ required: true, message: "Este campo es requerido" }]}
                  >
                    <Input placeholder="Ej. Madrid" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Datos de la Trabajadora */}
            <Card title="Datos de la Trabajadora" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nombre de la Trabajadora"
                    name="nombretrabajador"
                    rules={[{ required: true, message: "El nombre es requerido" }]}
                  >
                    <Input placeholder="María García López" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Tipo de Documento"
                    name="tipoDocumentoTrabajador"
                    initialValue="NIE"
                    rules={[{ required: true, message: "Requerido" }]}
                  >
                    <Select>
                      <Select.Option value="NIE">NIE</Select.Option>
                      <Select.Option value="NIF">NIF</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Número de Documento"
                    name="niftrabajador"
                    rules={[{ required: true, message: "El documento es requerido" }]}
                  >
                    <Input placeholder="98765432Y" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Fecha de Nacimiento"
                    name="fechanactrabajador"
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Ej. 24 de Abril 2026" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Número de Afiliación"
                    name="numafiliaciontrabajador"
                  >
                    <Input placeholder="Ej. 12345678901234567" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nivel Formativo"
                    name="nivelformativotrabajador"
                  >
                    <Select placeholder="Selecciona el nivel formativo" showSearch>
                      {NIVELES_FORMATIVOS.map((nivel) => (
                        <Select.Option key={nivel} value={nivel}>
                          {nivel}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nacionalidad"
                    name="nacionalidadtrabajador"
                  >
                    <Select
                      placeholder="Selecciona la nacionalidad"
                      showSearch
                      optionFilterProp="children"
                    >
                      {NACIONALIDADES.map((nacionalidad) => (
                        <Select.Option key={nacionalidad} value={nacionalidad}>
                          {nacionalidad}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Municipio de Domicilio"
                    name="municipiodomtrabajador"
                  >
                    <Input placeholder="Ej. Madrid" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="País de Domicilio"
                    name="paisdomtrabajador"
                  >
                    <Input placeholder="Ej. España" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Datos Varios */}
            <Card title="Datos del Contrato" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                {/* Provincia → municipio → código postal. Se eligen en cadena
                    para no tener que buscar el código por fuera. */}
                <Col xs={24} sm={8}>
                  <Form.Item label="Provincia" name="cpProvincia">
                    <Select
                      showSearch
                      allowClear
                      placeholder="Selecciona la provincia"
                      optionFilterProp="label"
                      filterSort={undefined}
                      options={PROVINCIAS.map((p) => ({
                        value: p.codigo,
                        label: p.nombre,
                      }))}
                      onChange={(codigo) => {
                        // Al cambiar de provincia, lo de abajo deja de valer.
                        setProvinciaCp(codigo);
                        setMunicipioCp(undefined);
                        form.setFieldsValue({ cpMunicipio: undefined, codPostal: undefined });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Municipio" name="cpMunicipio">
                    <Select
                      showSearch
                      allowClear
                      disabled={!provinciaCp}
                      placeholder={
                        provinciaCp ? "Selecciona el municipio" : "Elige antes la provincia"
                      }
                      optionFilterProp="label"
                      filterSort={undefined}
                      options={municipiosDe(provinciaCp).map(([nombre]) => ({
                        value: nombre,
                        label: nombre,
                      }))}
                      onChange={(nombre) => {
                        setMunicipioCp(nombre);
                        // La mayoría de municipios tienen un único código, así
                        // que se deja puesto y no hay que tocar el tercer campo.
                        const codigos = codigosDe(provinciaCp, nombre);
                        form.setFieldValue(
                          "codPostal",
                          codigos.length === 1 ? codigos[0] : undefined
                        );
                        // El municipio es también el lugar de firma ("En ...");
                        // se deja escrito para no tener que teclearlo otra vez,
                        // y se puede cambiar si la firma es en otro sitio.
                        if (nombre) form.setFieldValue("lugarfirma", nombre);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Código Postal"
                    name="codPostal"
                    tooltip="Se rellena solo al elegir el municipio. Si el municipio tiene varios códigos, elige el que corresponda."
                  >
                    <Select
                      showSearch
                      allowClear
                      disabled={!municipioCp}
                      placeholder={
                        municipioCp ? "Selecciona el código" : "Elige antes el municipio"
                      }
                      options={codigosDe(provinciaCp, municipioCp).map((codigo) => ({
                        value: codigo,
                        label: codigo,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Interna o Externa"
                    name="interExterno"
                  >
                    <Select placeholder="Selecciona una opción">
                      <Select.Option value="Interna">Interna</Select.Option>
                      <Select.Option value="Externa">Externa</Select.Option>
                      <Select.Option value="Interna fin de semana">
                        Interna fin de semana
                      </Select.Option>
                      <Select.Option value="Externa fin de semana">
                        Externa fin de semana
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Fecha del Contrato"
                    name="fechacontrato"
                    rules={[{ required: true, message: "La fecha del contrato es requerida" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Ej. 24 de Abril 2026" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Monto Bruto Mensual"
                    name="montobruto"
                  >
                    <InputNumber
                      placeholder="Ej. 1200.50"
                      step={0.01}
                      min={0}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Lugar de Firma"
                    name="lugarfirma"
                    tooltip="Es el «En …» de la línea de firma. Se rellena con el municipio que elijas arriba; cámbialo solo si se firma en otro sitio."
                  >
                    <Input placeholder="Se rellena con el municipio" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Tipo de Jornada"
                    name="jornadaTipo"
                  >
                    <Select placeholder="Selecciona el tipo de jornada">
                      <Select.Option value="completo">A tiempo completo</Select.Option>
                      <Select.Option value="parcial">A tiempo parcial</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Horas Semanales"
                    name="horasJornada"
                  >
                    <InputNumber
                      placeholder="Ej. 20"
                      min={0}
                      max={40}
                      style={{ width: "100%" }}
                      addonAfter="horas"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Cláusulas del documento.
                Cada campo corresponde a un hueco concreto del modelo oficial;
                por eso la etiqueta cita la cláusula y la frase que lo rodea. */}
            <Card title="Cláusulas del Contrato" style={{ marginBottom: "24px" }}>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Estos campos rellenan los huecos de las cláusulas del contrato."
                description="Los que vienen con texto son valores habituales: puedes cambiarlos. Lo que dejes vacío saldrá en blanco en el documento."
              />

              <Divider orientation="left" plain>
                PRIMERA — Puesto y lugar de trabajo
              </Divider>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Prestará sus servicios como…"
                    name="clausulaPuesto"
                    tooltip="Categoría o puesto. Aparece en el primer hueco de la cláusula PRIMERA."
                  >
                    <Input placeholder="Ej. Asistente Personal" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="…en el domicilio de trabajo ubicado en (calle, nº y localidad)"
                    name="clausulaLugarTrabajo"
                    tooltip="Dirección donde se presta el servicio."
                  >
                    <Input placeholder="Ej. Calle Mayor 12, 3º B, Bilbao" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>
                SEGUNDA — Distribución del tiempo de trabajo
              </Divider>
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item
                    label="La distribución del tiempo de trabajo será de…"
                    name="clausulaDistribucion"
                    tooltip="Horario concreto. Es el hueco que abre la segunda página del contrato."
                  >
                    <Input placeholder="Ej. De lunes a viernes, de 09:00 a 13:00 horas" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>
                TERCERA — Horas de presencia
              </Divider>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="¿Se pactan horas de presencia?"
                    name="clausulaPresencia"
                    tooltip="Marca la casilla SI o NO de la cláusula TERCERA."
                  >
                    <Radio.Group>
                      <Radio value="si">Sí</Radio>
                      <Radio value="no">No</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={4}>
                  <Form.Item label="Horas semanales de presencia" name="clausulaPresenciaHoras">
                    <Input placeholder="Ej. 5" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="…distribuidas de la siguiente manera"
                    name="clausulaPresenciaReparto"
                  >
                    <Input placeholder="Ej. Sábados por la tarde" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label="El tiempo de presencia se retribuirá o compensará…"
                    name="clausulaPresenciaModo"
                    tooltip="Marca una de las tres casillas de la cláusula TERCERA."
                  >
                    <Radio.Group>
                      <Space direction="vertical" size={2}>
                        <Radio value="compensacion">
                          Compensación con períodos equivalentes de descanso retribuido
                        </Radio>
                        <Radio value="retribucion">
                          Retribución con un salario no inferior al de las horas ordinarias
                        </Radio>
                        <Radio value="ambas">De cualquiera de las anteriores maneras</Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>
                CUARTA — Período de prueba
              </Divider>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Se establece un período de prueba de…"
                    name="clausulaPeriodoPrueba"
                    tooltip="La fecha de inicio de la relación laboral sale de «Fecha del Contrato»; aquí solo va la duración de la prueba."
                  >
                    <Input placeholder="Ej. 2 meses" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>
                QUINTA — Pernocta en el domicilio
              </Divider>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="¿Pernocta en el domicilio del empleador?"
                    name="clausulaPernocta"
                    tooltip="Marca la casilla SI o NO de la cláusula QUINTA."
                  >
                    <Radio.Group>
                      <Radio value="si">Sí</Radio>
                      <Radio value="no">No</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="El régimen de pernoctas será de… (noches a la semana)"
                    name="clausulaPernoctaNoches"
                  >
                    <Input placeholder="Ej. 2" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>
                SEXTA — Retribución
              </Divider>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Periodicidad del pago"
                    name="clausulaPeriodicidad"
                    tooltip="Va justo detrás de «euros brutos». El importe sale de «Monto Bruto Mensual»."
                  >
                    <Input placeholder="Ej. mensual" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="…que se distribuirán en los siguientes conceptos salariales"
                    name="clausulaConceptosSalariales"
                  >
                    <Input placeholder="Ej. pagas prorrateadas" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="¿Se pactan retribuciones en especie?"
                    name="clausulaEspecie"
                  >
                    <Radio.Group>
                      <Radio value="si">Sí</Radio>
                      <Radio value="no">No</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={16}>
                  <Form.Item
                    label="Las retribuciones en especie consistirán en…"
                    name="clausulaEspecieDetalle"
                    tooltip="Solo si has marcado que sí. Se escribe en la línea que hay bajo la cláusula."
                  >
                    <Input placeholder="Ej. Manutención y alojamiento" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>
                SÉPTIMA y OCTAVA
              </Divider>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="La duración de las vacaciones anuales será de…"
                    name="clausulaVacaciones"
                  >
                    <Input placeholder="Ej. 30 días naturales" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Reducción del 20% en las cotizaciones (OCTAVA)"
                    name="clausulaBonificacion"
                    tooltip="Marca la casilla del final del contrato."
                  >
                    <Checkbox>Marcar la casilla de la cláusula OCTAVA</Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Generar Contrato
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    setProvinciaCp(undefined);
                    setMunicipioCp(undefined);
                  }}
                >
                  Limpiar
                </Button>
              </Space>
            </Form.Item>
          </Form>

          {/* Tabla de Contratos */}
          <Divider style={{ marginTop: "40px" }} />

          {/* El estado cambia cuando la persona firma desde su enlace, así que
              hace falta poder recargar sin refrescar la página entera. */}
          <Space
            style={{
              width: "100%",
              justifyContent: "space-between",
              marginBottom: "16px",
              marginTop: "24px",
            }}
          >
            <Title level={3} style={{ margin: 0 }}>
              Historial de Contratos
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={cargarContratos}
              loading={contratosLoading}
            >
              Actualizar
            </Button>
          </Space>

          <Card>
            <Spin spinning={contratosLoading}>
              {contratos.length > 0 ? (
                <Table
                  dataSource={contratos}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "Fecha",
                      dataIndex: "fechacontrato",
                      key: "fecha",
                      render: (text) => <Text>{text || "-"}</Text>,
                      width: 100,
                    },
                    {
                      title: "Empleado",
                      dataIndex: "nombretrabajador",
                      key: "empleado",
                      render: (text, record) => (
                        <Space direction="vertical" size={0}>
                          <Text strong>{text || "-"}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.niftrabajador}
                          </Text>
                        </Space>
                      ),
                      width: 150,
                    },
                    {
                      title: "Empleador",
                      dataIndex: "nomempleador",
                      key: "empleador",
                      render: (text) => <Text>{text || "-"}</Text>,
                      width: 150,
                    },
                    {
                      title: "Monto",
                      dataIndex: "montobruto",
                      key: "monto",
                      render: (text) => (
                        <Text strong>{text ? `${text}€` : "-"}</Text>
                      ),
                      width: 100,
                      align: "right" as const,
                    },
                    {
                      title: "Estado",
                      dataIndex: "status",
                      key: "status",
                      render: (status) => {
                        const statusMap: Record<string, React.ReactNode> = {
                          pendiente: (
                            <Tag color="default">Pendiente</Tag>
                          ),
                          documento_creado: (
                            <Tag color="processing">Documento creado</Tag>
                          ),
                          campos_llenados: (
                            <Tag color="processing">Campos llenados</Tag>
                          ),
                          whatsapp_enviado: (
                            <Tag color="processing">WhatsApp enviado</Tag>
                          ),
                          invitacion_enviada: (
                            <Tag color="blue">Invitación enviada</Tag>
                          ),
                          firmando: (
                            <Tag color="cyan">Firmando</Tag>
                          ),
                          firmado: (
                            <Tag color="success">✓ Firmado</Tag>
                          ),
                          error: (
                            <Tag color="error">Error</Tag>
                          ),
                        };
                        return statusMap[status] || <Tag>{status}</Tag>;
                      },
                      width: 130,
                    },
                    {
                      title: "Creado",
                      dataIndex: "createdAt",
                      key: "createdAt",
                      render: (date) => {
                        if (!date) return "-";
                        return new Date(date).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      },
                      width: 130,
                    },
                    {
                      title: "Acciones",
                      key: "acciones",
                      render: (_, record) => (
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => {
                              Modal.info({
                                title: `Contrato - ${record.nombretrabajador}`,
                                width: 600,
                                content: (
                                  <Space direction="vertical" style={{ width: "100%" }}>
                                    <Descriptions column={1} size="small">
                                      <Descriptions.Item label="Estado">
                                        <Tag color={record.status === "firmado" ? "success" : "processing"}>
                                          {record.status}
                                        </Tag>
                                      </Descriptions.Item>
                                      <Descriptions.Item label="Empleado">
                                        {record.nombretrabajador} ({record.niftrabajador})
                                      </Descriptions.Item>
                                      <Descriptions.Item label="Empleador">
                                        {record.nomempleador}
                                      </Descriptions.Item>
                                      <Descriptions.Item label="Monto Bruto">
                                        {record.montobruto}€
                                      </Descriptions.Item>
                                      <Descriptions.Item label="Fecha Contrato">
                                        {record.fechacontrato}
                                      </Descriptions.Item>
                                    </Descriptions>

                                    {record.lastError && (
                                      <>
                                        <Divider />
                                        <Text type="danger" strong>
                                          Último Error:
                                        </Text>
                                        <Card
                                          size="small"
                                          style={{ background: "#fff1f0", borderColor: "#ffccc7" }}
                                        >
                                          <Text type="danger">
                                            <strong>Etapa:</strong> {record.lastError.stage}
                                            <br />
                                            <strong>Mensaje:</strong> {record.lastError.message}
                                          </Text>
                                        </Card>
                                      </>
                                    )}
                                  </Space>
                                ),
                              });
                            }}
                          >
                            Ver
                          </Button>
                          {(record.signingLinks || []).length > 0 && (
                            <Button
                              type="link"
                              size="small"
                              onClick={() => mostrarEnlacesFirma(record.signingLinks || [])}
                            >
                              Enlaces
                            </Button>
                          )}
                          <Button type="link" size="small" onClick={() => descargarPdf(record)}>
                            Descargar PDF
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            danger
                            onClick={() => eliminarContrato(record)}
                          >
                            Eliminar
                          </Button>
                        </Space>
                      ),
                      width: 300,
                    },
                  ]}
                  size="small"
                  scroll={{ x: 1100 }}
                />
              ) : (
                <Empty
                  description="No hay contratos registrados"
                  style={{ paddingTop: 20 }}
                />
              )}
            </Spin>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
