"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  Space,
  Typography,
  message,
  Modal,
  DatePicker,
  Switch,
  Select,
  Alert,
  Divider,
  Descriptions,
  Table,
  Tag,
  Empty,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalculatorOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { useRouter } from "next/navigation";
import { fetchCloudnavisEmpleado, fetchCloudnavisEmpleador } from "@/services/cloudnavisClient";
import { mapEmpleadoToFiniquito, mapEmpleadorToFiniquito } from "@/services/mappers";
import CloudnavisErrorModal from "@/components/CloudnavisErrorModal";
import { obtenerToken } from "@/lib/session";
import { API_URL } from "@/lib/config";

const { Title, Text } = Typography;

interface FormValues {
  fecha?: Dayjs;
  lugarFirma?: string;
  nomempleada?: string;
  tipoDocumentoEmpleada?: "NIE" | "NIF";
  niempleada?: string;
  textoIntro?: string;
  // Ya no se piden en el formulario, pero pueden llegar prellenados desde CloudNavis
  correoempleada?: string;
  nomempleador?: string;
  correoempleador?: string;
  fechadesde?: Dayjs;
  fechasalariofinalconanio?: Dayjs;
  salarioNeto?: number;
  tipoJornada?: "lv" | "finde";
  enPruebas?: boolean;
  diasVacacionesDisfrutadas?: number;
  aplicaPreaviso?: boolean;
  diasSinPreaviso?: number;
  aplicaIndemnizacion?: boolean;
  indemnizacionDiasPorAnio?: number;
}

interface Calculado {
  diasTrabajados: number;
  diasPeriodo: number;
  // Precio del día con el que se paga el último período y findes del mes de la
  // baja (0 si la jornada no es de fin de semana)
  salarioDiarioPeriodo: number;
  diasFindeDelMes: number;
  // Vacaciones: se computan solo dentro del año en curso
  diasComputoVacaciones: number;
  diasVacacionesGenerados: number;
  diasVacacionesAPagar: number;
  // Desglose de la indemnización
  salarioBruto: number;
  baseCotizacion: number;
  baseReguladora: number;
  diasIndemnizacion: number;
  importeSalario: number;
  importeVacaciones: number;
  importePreaviso: number;
  importeIndemnizacion: number;
  total: number;
}

interface FiniquitoRecord {
  _id: string;
  fecha?: string;
  nomempleada?: string;
  niempleada?: string;
  // Nombres antiguos, presentes solo en registros creados antes de unificarlos
  nombretrabajador?: string;
  niftrabajador?: string;
  nomempleador?: string;
  total?: string | number;
  vacacionesimporte?: string | number;
  preaviso?: string;
  indemnizacion?: string;
  status?: string;
  createdAt?: string;
  correoempleado?: string;
  correoempleador?: string;
  signingLinks?: { role: string; link: string }[];
  lastError?: { stage?: string; message?: string };
}

const formatearFecha = (
  date: Dayjs | undefined,
  tipo: "completa" | "completaDel" | "mesYDia"
): string => {
  if (!date) return "";
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const dia = date.date();
  const mes = meses[date.month()];
  const anio = date.year();

  if (tipo === "mesYDia") return `${dia} de ${mes}`;
  if (tipo === "completaDel") return `${dia} de ${mes} del ${anio}`;
  return `${dia} de ${mes} ${anio}`;
};

// Tabla oficial Orden PJC/297/2026 — DIFERENTE a la tabla de presupuesto
const determinarTramoFiniquito = (salarioNeto: number): number => {
  if (salarioNeto <= 329) return 306;
  if (salarioNeto <= 451) return 436;
  if (salarioNeto <= 620) return 602;
  if (salarioNeto <= 850) return 785;
  if (salarioNeto <= 1050) return 970;
  if (salarioNeto <= 1155) return 1151;
  if (salarioNeto <= 1424.4) return 1424;
  return salarioNeto; // Tramo 8: base = salario real
};

// Conceptos de cotización a cargo del empleado. Se calculan por separado sobre
// la base y se suman (4,70 + 1,55 + 0,15 = 6,40%).
const CONTINGENCIAS_COMUNES = 0.047;
const DESEMPLEO = 0.0155;
const FORMACION_PROFESIONAL = 0.0015;

/**
 * Obtiene el salario bruto a partir del neto: se localiza el tramo con el neto,
 * se calculan las tres cotizaciones del empleado sobre esa base y su suma se
 * añade al neto.
 */
const calcularSalarioBruto = (salarioNeto: number): number => {
  const baseProvisional = determinarTramoFiniquito(salarioNeto);
  const cotizacionEmpleado =
    baseProvisional * CONTINGENCIAS_COMUNES +
    baseProvisional * DESEMPLEO +
    baseProvisional * FORMACION_PROFESIONAL;
  return salarioNeto + cotizacionEmpleado;
};

// Cuenta los sábados y domingos desde `inicio` hasta `fin`, sin incluir `fin`
// (mismo criterio que el resto de conteos de días).
const contarDiasFinde = (inicio: Dayjs, fin: Dayjs): number => {
  let dias = 0;
  let cursor = inicio.startOf("day");
  const limite = fin.startOf("day");
  while (cursor.isBefore(limite)) {
    const diaSemana = cursor.day(); // 0 = domingo, 6 = sábado
    if (diaSemana === 0 || diaSemana === 6) dias += 1;
    cursor = cursor.add(1, "day");
  }
  return dias;
};

// Sábados y domingos que tiene el mes completo al que pertenece la fecha.
const contarDiasFindeDelMes = (fecha: Dayjs): number => {
  const inicioMes = fecha.startOf("month");
  return contarDiasFinde(inicioMes, inicioMes.add(1, "month"));
};

/**
 * El último período salarial es el del mes en curso: los meses anteriores ya
 * se pagaron en su nómina. Arranca el día 1 del mes de la baja, salvo que el
 * contrato empezara ese mismo mes, en cuyo caso arranca en la fecha de alta.
 */
const calcularInicioPeriodoSalarial = (
  fechadesde?: Dayjs,
  fechasalariofinalconanio?: Dayjs
): Dayjs | undefined => {
  if (!fechasalariofinalconanio) return undefined;
  const primeroDelMes = fechasalariofinalconanio.startOf("month");
  if (fechadesde && fechadesde.isAfter(primeroDelMes)) return fechadesde;
  return primeroDelMes;
};

/**
 * Las vacaciones no se acumulan de un año para otro: se computan siempre
 * dentro del año en curso. Si el contrato viene de años anteriores se arranca
 * el 1 de enero; si empezó este año, desde la fecha de alta.
 */
const calcularInicioComputoVacaciones = (
  fechadesde?: Dayjs,
  fechasalariofinalconanio?: Dayjs
): Dayjs | undefined => {
  if (!fechasalariofinalconanio) return undefined;
  const primeroDeEnero = fechasalariofinalconanio.startOf("year");
  if (fechadesde && fechadesde.isAfter(primeroDeEnero)) return fechadesde;
  return primeroDeEnero;
};

// Antigüedad < 1 año → 7 días de preaviso; ≥ 1 año → 20 días (RD-ley 16/2022)
const sugerirDiasPreaviso = (fechadesde?: Dayjs, fechasalariofinalconanio?: Dayjs): number => {
  if (!fechadesde || !fechasalariofinalconanio) return 7;
  const diasTrabajados = fechasalariofinalconanio.diff(fechadesde, "day");
  return diasTrabajados >= 365 ? 20 : 7;
};

const calcularFiniquito = (values: FormValues): Calculado | null => {
  const {
    fechadesde,
    fechasalariofinalconanio,
    salarioNeto,
    tipoJornada,
    enPruebas,
    diasVacacionesDisfrutadas,
    aplicaPreaviso,
    diasSinPreaviso,
    aplicaIndemnizacion,
    indemnizacionDiasPorAnio,
  } = values;

  if (!fechadesde || !fechasalariofinalconanio || !salarioNeto || salarioNeto <= 0) {
    return null;
  }

  // Validar que la fecha de baja sea posterior a la de inicio
  if (fechasalariofinalconanio.isBefore(fechadesde)) {
    return null;
  }

  const diasTrabajados = fechasalariofinalconanio.diff(fechadesde, "day");
  if (diasTrabajados < 0) return null;

  const salarioDiarioNeto = salarioNeto / 30;

  // 1. Salario del último período (solo los días del mes en curso). En jornada
  // de fin de semana se cuentan únicamente los sábados y domingos del período.
  const inicioPeriodo = calcularInicioPeriodoSalarial(fechadesde, fechasalariofinalconanio)!;
  const diasPeriodo =
    tipoJornada === "finde"
      ? contarDiasFinde(inicioPeriodo, fechasalariofinalconanio)
      : fechasalariofinalconanio.diff(inicioPeriodo, "day");

  // Quien solo trabaja fines de semana cobra el mes entero en esos días, así
  // que el precio del día sale de repartir el salario entre los findes de ese
  // mes, no entre 30: si no, se le pagaría una fracción de lo que le toca.
  const diasFindeDelMes =
    tipoJornada === "finde" ? contarDiasFindeDelMes(fechasalariofinalconanio) : 0;
  const salarioDiarioPeriodo =
    tipoJornada === "finde" && diasFindeDelMes > 0
      ? salarioNeto / diasFindeDelMes
      : salarioDiarioNeto;

  const importeSalario = Math.max(0, diasPeriodo * salarioDiarioPeriodo);

  // Durante el período de prueba solo se abonan los días trabajados: no hay
  // vacaciones, ni preaviso, ni indemnización.
  if (enPruebas) {
    return {
      diasTrabajados,
      diasPeriodo,
      salarioDiarioPeriodo,
      diasFindeDelMes,
      diasComputoVacaciones: 0,
      diasVacacionesGenerados: 0,
      diasVacacionesAPagar: 0,
      salarioBruto: 0,
      baseCotizacion: 0,
      baseReguladora: 0,
      diasIndemnizacion: 0,
      importeSalario,
      importeVacaciones: 0,
      importePreaviso: 0,
      importeIndemnizacion: 0,
      total: importeSalario,
    };
  }

  // 2. Vacaciones: solo las generadas dentro del año en curso, menos las que
  // ya se hayan disfrutado. En jornada de fin de semana se computan únicamente
  // los sábados y domingos, igual que en el salario.
  const inicioVacaciones = calcularInicioComputoVacaciones(
    fechadesde,
    fechasalariofinalconanio
  )!;
  const diasComputoVacaciones =
    tipoJornada === "finde"
      ? contarDiasFinde(inicioVacaciones, fechasalariofinalconanio)
      : fechasalariofinalconanio.diff(inicioVacaciones, "day");
  const diasVacacionesGenerados = (diasComputoVacaciones * 30) / 365;
  const diasVacacionesAPagar = Math.max(
    0,
    diasVacacionesGenerados - (diasVacacionesDisfrutadas || 0)
  );
  const importeVacaciones = diasVacacionesAPagar * salarioDiarioNeto;

  // 3. Indemnización (solo si aplica). El tramo se busca con el salario BRUTO,
  // que es como está indexada la tabla oficial, no con el neto.
  let importeIndemnizacion = 0;
  let salarioBruto = 0;
  let baseCotizacion = 0;
  let baseReguladora = 0;
  let diasIndemnizacion = 0;
  if (aplicaIndemnizacion) {
    salarioBruto = calcularSalarioBruto(salarioNeto);
    baseCotizacion = determinarTramoFiniquito(salarioBruto);
    baseReguladora = baseCotizacion / 30;
    const diasPorAnio = indemnizacionDiasPorAnio || 12;
    diasIndemnizacion = (diasTrabajados * diasPorAnio) / 365;
    importeIndemnizacion = baseReguladora * diasIndemnizacion;
  }

  // 4. Preaviso (solo si aplica): lo que cuesta el día por los días no avisados
  let importePreaviso = 0;
  if (aplicaPreaviso && diasSinPreaviso && diasSinPreaviso > 0) {
    importePreaviso = salarioDiarioNeto * diasSinPreaviso;
  }

  // Total finiquito: salario + vacaciones + indemnización + preaviso
  const total = importeSalario + importeVacaciones + importeIndemnizacion + importePreaviso;

  return {
    diasTrabajados,
    diasPeriodo,
    salarioDiarioPeriodo,
    diasFindeDelMes,
    diasComputoVacaciones,
    diasVacacionesGenerados,
    diasVacacionesAPagar,
    salarioBruto,
    baseCotizacion,
    baseReguladora,
    diasIndemnizacion,
    importeSalario,
    importeVacaciones,
    importePreaviso,
    importeIndemnizacion,
    total,
  };
};

export default function FiniquitoPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [aplicaPreaviso, setAplicaPreaviso] = useState(false);
  const [aplicaIndemnizacion, setAplicaIndemnizacion] = useState(false);
  const [enPruebas, setEnPruebas] = useState(false);
  const [preavisoTouched, setPreavisoTouched] = useState(false);
  const [calculado, setCalculado] = useState<Calculado | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [finiquitos, setFiniquitos] = useState<FiniquitoRecord[]>([]);
  const [finiquitosLoading, setFiniquitosLoading] = useState(false);
  const [textoPorDefecto, setTextoPorDefecto] = useState("");
  const router = useRouter();

  useEffect(() => {
    cargarFiniquitos();
  }, []);

  // El texto declarativo vive en el backend para no duplicarlo aquí
  useEffect(() => {
    (async () => {
      try {
        const token = obtenerToken();
        const res = await fetch(
          `${API_URL}/finiquito/texto-por-defecto`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const intro = data?.data?.texto || "";
        setTextoPorDefecto(intro);
        if (!form.getFieldValue("textoIntro")) form.setFieldValue("textoIntro", intro);
      } catch {
        // Si no llega, el backend usará su texto por defecto igualmente
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const cargarFiniquitos = async () => {
    setFiniquitosLoading(true);
    try {
      const token = obtenerToken();
      // Sin limit el backend devuelve solo 10 registros y el historial parece
      // incompleto; la tabla pagina por su cuenta sobre lo que llegue.
      const response = await fetch(
        `${API_URL}/finiquito/lista?limit=200`,
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
      setFiniquitos(data.data || []);
    } catch (error) {
      console.error("Error cargando finiquitos:", error);
      message.error(`No se pudo cargar el historial: ${(error as Error).message}`);
    } finally {
      setFiniquitosLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill: Partial<FormValues> = {};

    const fecha = params.get("fecha");
    if (fecha) {
      const parsed = dayjs(fecha, "YYYY-MM-DD", true);
      if (parsed.isValid()) prefill.fecha = parsed;
    }

    const fechadesde = params.get("fechadesde");
    if (fechadesde) {
      const parsed = dayjs(fechadesde, "YYYY-MM-DD", true);
      if (parsed.isValid()) prefill.fechadesde = parsed;
    }

    const fechasalariofinalconanio = params.get("fechasalariofinalconanio");
    if (fechasalariofinalconanio) {
      const parsed = dayjs(fechasalariofinalconanio, "YYYY-MM-DD", true);
      if (parsed.isValid()) prefill.fechasalariofinalconanio = parsed;
    }

    const nomempleada = params.get("nomempleada");
    if (nomempleada) prefill.nomempleada = nomempleada;

    const niempleada = params.get("niempleada");
    if (niempleada) prefill.niempleada = niempleada;

    const correoempleada = params.get("correoempleada");
    if (correoempleada) prefill.correoempleada = correoempleada;

    const nomempleador = params.get("nomempleador");
    if (nomempleador) prefill.nomempleador = nomempleador;

    const correoempleador = params.get("correoempleador");
    if (correoempleador) prefill.correoempleador = correoempleador;

    const salarioNeto = params.get("salarioNeto");
    if (salarioNeto !== null) {
      const num = Number(salarioNeto);
      if (!Number.isNaN(num)) prefill.salarioNeto = num;
    }

    const diasSinPreaviso = params.get("diasSinPreaviso");
    if (diasSinPreaviso !== null) {
      const num = Number(diasSinPreaviso);
      if (!Number.isNaN(num)) prefill.diasSinPreaviso = num;
    }

    if (Object.keys(prefill).length === 0) return;

    form.setFieldsValue(prefill);
    const merged = { ...form.getFieldsValue(), aplicaPreaviso, aplicaIndemnizacion };
    setCalculado(calcularFiniquito(merged));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idEmpleado = params.get("idEmpleado");
    const idCliente = params.get("idCliente");
    const token = params.get("token");

    if (!idEmpleado || !idCliente || !token) {
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

        const mappedEmpleado = mapEmpleadoToFiniquito(empleado);
        const mappedEmpleador = mapEmpleadorToFiniquito(empleador);

        form.setFieldsValue({ ...mappedEmpleado, ...mappedEmpleador });
        const merged = { ...form.getFieldsValue(), aplicaPreaviso, aplicaIndemnizacion };
        setCalculado(calcularFiniquito(merged));

        // Cargar historial de finiquitos del empleado
        cargarFiniquitos();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleRetryFetch = () => {
    const params = new URLSearchParams(window.location.search);
    const idEmpleado = params.get("idEmpleado");
    const idCliente = params.get("idCliente");
    const token = params.get("token");

    if (idEmpleado && idCliente && token) {
      setErrorCode(null);
      window.location.reload();
    }
  };

  const onValuesChange = (changed: Partial<FormValues>, allValues: FormValues) => {
    let valores = allValues;

    if (
      aplicaPreaviso &&
      !preavisoTouched &&
      ("fechadesde" in changed || "fechasalariofinalconanio" in changed)
    ) {
      const sugerido = sugerirDiasPreaviso(allValues.fechadesde, allValues.fechasalariofinalconanio);
      form.setFieldValue("diasSinPreaviso", sugerido);
      valores = { ...valores, diasSinPreaviso: sugerido };
    }


    const result = calcularFiniquito({
      ...valores,
      aplicaPreaviso,
      aplicaIndemnizacion,
    });
    setCalculado(result);
  };

  const fmt = (n: number) =>
    n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const descargarPdf = async (record: FiniquitoRecord) => {
    const key = `descarga-${record._id}`;
    message.loading({ content: "Generando PDF...", key });
    try {
      const token = obtenerToken();
      const response = await fetch(
        `${API_URL}/finiquito/${record._id}/descargar`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const detalle = await response.text();
        throw new Error(`${response.status} — ${detalle.slice(0, 200)}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // El enlace debe estar en el DOM para que el click dispare la descarga
      // en todos los navegadores, y la URL no puede revocarse antes de tiempo.
      const link = document.createElement("a");
      link.href = url;
      link.download = `finiquito-${
        record.nomempleada || record.nombretrabajador || record._id
      }.pdf`;
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

  const eliminarFiniquito = (record: FiniquitoRecord) => {
    Modal.confirm({
      title: "Eliminar finiquito",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: (
        <div>
          <p>
            Se eliminará el finiquito de{" "}
            <strong>{record.nomempleada || record.nombretrabajador || "esta empleada"}</strong>.
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
          const res = await fetch(
            `${API_URL}/finiquito/${record._id}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) throw new Error(`${res.status}`);
          message.success("Finiquito eliminado");
          cargarFiniquitos();
        } catch (err) {
          console.error("Error eliminando finiquito:", err);
          message.error("No se pudo eliminar el finiquito");
        }
      },
    });
  };

  const mostrarDetalle = (record: FiniquitoRecord) => {
    Modal.info({
      title: `Finiquito - ${record.nomempleada || record.nombretrabajador || ""}`,
      width: 600,
      okText: "Cerrar",
      content: (
        <Descriptions
          column={1}
          size="small"
          items={[
            {
              key: "estado",
              label: "Estado",
              children: (
                <Tag color={record.status === "firmado" ? "success" : "processing"}>
                  {record.status}
                </Tag>
              ),
            },
            {
              key: "empleado",
              label: "Empleado",
              children: `${record.nomempleada || record.nombretrabajador || "-"} (${
                record.niempleada || record.niftrabajador || "-"
              })`,
            },
            { key: "empleador", label: "Empleador", children: record.nomempleador || "-" },
            {
              key: "vacaciones",
              label: "Vacaciones",
              children: `${record.vacacionesimporte ?? "-"}€`,
            },
            { key: "preaviso", label: "Preaviso", children: record.preaviso || "-" },
            {
              key: "indemnizacion",
              label: "Indemnización",
              children: record.indemnizacion || "-",
            },
            { key: "total", label: "Total", children: `${record.total ?? "-"}€` },
            ...(record.lastError?.message
              ? [
                  {
                    key: "error",
                    label: "Último error",
                    children: `${record.lastError.stage || ""}: ${record.lastError.message}`,
                  },
                ]
              : []),
          ]}
        />
      ),
    });
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

  const onFinish = async (values: FormValues) => {
    if (!calculado) {
      message.warning("Completa los datos para calcular el finiquito");
      return;
    }

    setLoading(true);
    message.loading({ content: "Enviando finiquito...", key: "sending" });

    try {
      const payload = {
        fecha: formatearFecha(values.fecha, "completa"),
        lugarFirma: values.lugarFirma || "",
        nomempleada: values.nomempleada || "",
        tipoDocumentoEmpleada: values.tipoDocumentoEmpleada || "NIE",
        niempleada: values.niempleada || "",
        textoIntro: values.textoIntro || "",
        correoempleada: values.correoempleada || "",
        nomempleador: values.nomempleador || "",
        nifempleador: "", // Agregar estos del formulario si están disponibles
        correoempleador: values.correoempleador || "",
        fechadesde: formatearFecha(values.fechadesde, "completaDel"),
        // El período salarial se deduce de las fechas, no se pide en el formulario
        diasalario: formatearFecha(
          calcularInicioPeriodoSalarial(values.fechadesde, values.fechasalariofinalconanio),
          "mesYDia"
        ),
        fechasalariofinalconanio: formatearFecha(values.fechasalariofinalconanio, "completa"),
        salarioNeto: values.salarioNeto || 0,
        tipoJornada: values.tipoJornada || "lv",
        // En período de prueba solo se abonan los días trabajados
        enPruebas,
        aplicaPreaviso: enPruebas ? false : aplicaPreaviso,
        diasSinPreaviso: !enPruebas && aplicaPreaviso ? values.diasSinPreaviso || 0 : undefined,
        aplicaIndemnizacion: enPruebas ? false : aplicaIndemnizacion,
        indemnizacionDiasPorAnio:
          !enPruebas && aplicaIndemnizacion ? values.indemnizacionDiasPorAnio || 12 : undefined,
        // Finiquito: salario + vacaciones + preaviso + indemnización
        salarioLiquidacionImporte: calculado.importeSalario.toFixed(2),
        diasVacacionesDisfrutadas: enPruebas ? 0 : values.diasVacacionesDisfrutadas || 0,
        // Se envía para poder mostrarla en la línea de indemnización del PDF
        baseReguladora: calculado.baseReguladora.toFixed(2),
        vacacionesdias: calculado.diasVacacionesAPagar.toFixed(2),
        vacacionesimporte: calculado.importeVacaciones.toFixed(2),
        preaviso:
          !enPruebas && aplicaPreaviso ? calculado.importePreaviso.toFixed(2) : "no procede",
        indemnizacion:
          !enPruebas && aplicaIndemnizacion
            ? calculado.importeIndemnizacion.toFixed(2)
            : "no procede",
        total: calculado.total.toFixed(2),
      };

      // Obtener token JWT del localStorage
      const token = obtenerToken();

      const response = await fetch(
        `${API_URL}/finiquito/crear`,
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
        const finiquitoId = resultado?.data?.finiquitoId;

        message.success("✓ Finiquito generado correctamente");
        // Refrescamos ya, para que aparezca en la tabla aunque se cierre el
        // modal sin pulsar "Cerrar".
        cargarFiniquitos();
        setTimeout(() => {
          Modal.success({
            title: "¡Finiquito Generado Correctamente!",
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
                  <p style={{ marginBottom: 12 }}>
                    ✓ El documento se generó con todos los datos y ya puedes descargarlo
                    desde el historial de finiquitos.
                  </p>
                )}
                {finiquitoId && (
                  <p style={{ marginTop: 12, marginBottom: 0 }}>
                    Si cierras esta ventana, puedes volver a ver los enlaces con el botón{" "}
                    <strong>Enlaces</strong> del <strong>Historial de Finiquitos</strong>.
                  </p>
                )}
              </div>
            ),
            okText: "Cerrar",
            onOk: () => {
              // El texto del documento se conserva entre finiquitos: si se
              // ajustó, no tiene sentido volver a escribirlo cada vez.
              const textoActual = form.getFieldValue("textoIntro");
              form.resetFields();
              form.setFieldValue("textoIntro", textoActual || textoPorDefecto);
              setCalculado(null);
              setAplicaPreaviso(false);
              setAplicaIndemnizacion(false);
              setEnPruebas(false);
              cargarFiniquitos(); // Recargar lista
            },
          });
        }, 500);
      } else {
        message.error("Error al enviar finiquito");
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
            Finiquito o Liquidación
          </Title>
          <Text type="secondary" style={{ display: "block", marginBottom: "24px" }}>
            Completa los datos para generar el documento de finiquito
          </Text>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={onValuesChange}
            autoComplete="off"
            initialValues={{
              diasSinPreaviso: 7,
              tipoDocumentoEmpleada: "NIE",
              tipoJornada: "lv",
              indemnizacionDiasPorAnio: 12,
            }}
          >
            {/* Información General */}
            <Card title="Información General" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Fecha del Finiquito"
                    name="fecha"
                    rules={[{ required: true, message: "Este campo es requerido" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Selecciona la fecha" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Lugar de Firma"
                    name="lugarFirma"
                    rules={[{ required: true, message: "El lugar de firma es requerido" }]}
                  >
                    <Input placeholder="Ej. Portugalete" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Datos de la Empleada */}
            <Card title="Datos de la Empleada" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nombre Completo"
                    name="nomempleada"
                    rules={[{ required: true, message: "El nombre es requerido" }]}
                  >
                    <Input placeholder="Ej. María García López" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Tipo de Documento"
                    name="tipoDocumentoEmpleada"
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
                    name="niempleada"
                    rules={[{ required: true, message: "El documento es requerido" }]}
                  >
                    <Input placeholder="Ej. X1234567Z" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Datos del Empleador */}
            <Card title="Datos del Empleador" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nombre Completo"
                    name="nomempleador"
                    rules={[{ required: true, message: "El nombre es requerido" }]}
                  >
                    <Input placeholder="Ej. Juan García López" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Periodo y Salario */}
            <Card title="Periodo de Trabajo y Salario" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Fecha de Inicio del Contrato"
                    name="fechadesde"
                    rules={[{ required: true, message: "La fecha de inicio es requerida" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Fecha de alta" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Fecha de Baja / Extinción"
                    name="fechasalariofinalconanio"
                    rules={[{ required: true, message: "La fecha de baja es requerida" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Fecha de baja" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Salario Neto Mensual (€)"
                    name="salarioNeto"
                    rules={[{ required: true, message: "El salario neto es requerido" }]}
                  >
                    <InputNumber
                      placeholder="Ej. 1333.33"
                      step={0.01}
                      min={0.01}
                      precision={2}
                      style={{ width: "100%" }}
                      addonAfter="€"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Tipo de Jornada"
                    name="tipoJornada"
                    tooltip="En fines de semana solo se pagan los sábados y domingos del período"
                    rules={[{ required: true, message: "Requerido" }]}
                  >
                    <Select>
                      <Select.Option value="lv">Lunes a viernes</Select.Option>
                      <Select.Option value="finde">Fines de semana</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Conceptos especiales */}
            <Card title="Conceptos Especiales" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item
                    label="¿Estaba en período de prueba?"
                    name="enPruebas"
                    valuePropName="checked"
                    tooltip="En período de prueba solo se abonan los días trabajados: no hay vacaciones, ni preaviso, ni indemnización."
                  >
                    <Switch
                      checked={enPruebas}
                      onChange={(checked) => {
                        setEnPruebas(checked);
                        if (checked) {
                          setAplicaPreaviso(false);
                          setAplicaIndemnizacion(false);
                          form.setFieldsValue({
                            aplicaPreaviso: false,
                            aplicaIndemnizacion: false,
                          });
                        }
                        setCalculado(
                          calcularFiniquito({
                            ...form.getFieldsValue(),
                            enPruebas: checked,
                            aplicaPreaviso: checked ? false : aplicaPreaviso,
                            aplicaIndemnizacion: checked ? false : aplicaIndemnizacion,
                          })
                        );
                      }}
                    />
                  </Form.Item>
                  {enPruebas && (
                    <Alert
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                      message="Período de prueba: solo se pagan los días trabajados."
                      description="No se calculan vacaciones, ni preaviso, ni indemnización."
                    />
                  )}
                </Col>
                {!enPruebas && (
                <>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Días de vacaciones ya disfrutadas"
                    name="diasVacacionesDisfrutadas"
                    initialValue={0}
                    tooltip="Se restan a las vacaciones generadas en el año en curso. Déjalo en 0 si no disfrutó ninguna."
                  >
                    <InputNumber
                      min={0}
                      step={0.5}
                      precision={2}
                      style={{ width: "100%" }}
                      addonAfter="días"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="¿Se despidió SIN preaviso?"
                    name="aplicaPreaviso"
                    valuePropName="checked"
                    tooltip="Si se avisó con la antelación legal, no hay que pagar nada por este concepto. Si no se avisó, se compensan los días de preaviso que faltaron."
                  >
                    <Switch
                      onChange={(checked) => {
                        setAplicaPreaviso(checked);
                        const vals = form.getFieldsValue();
                        let valores = vals;
                        if (checked && !preavisoTouched) {
                          const sugerido = sugerirDiasPreaviso(vals.fechadesde, vals.fechasalariofinalconanio);
                          form.setFieldValue("diasSinPreaviso", sugerido);
                          valores = { ...vals, diasSinPreaviso: sugerido };
                        }
                        const result = calcularFiniquito({
                          ...valores,
                          aplicaPreaviso: checked,
                          aplicaIndemnizacion,
                        });
                        setCalculado(result);
                      }}
                    />
                  </Form.Item>
                </Col>
                {aplicaPreaviso && (
                  <Col xs={24} sm={6}>
                    <Form.Item
                      label="Días de preaviso a compensar"
                      name="diasSinPreaviso"
                      rules={[{ required: true, message: "Indica los días" }]}
                      tooltip="Se autoselecciona según la antigüedad (menos de 1 año = 7 días, 1 año o más = 20 días); puedes cambiarlo manualmente"
                    >
                      <Select onChange={() => setPreavisoTouched(true)}>
                        <Select.Option value={7}>7 días</Select.Option>
                        <Select.Option value={20}>20 días</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                )}
                </>
                )}
              </Row>

              {/* La indemnización va en su propia fila, debajo de las vacaciones */}
              {!enPruebas && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={6}>
                  <Form.Item label="¿Aplica indemnización por despido?" name="aplicaIndemnizacion" valuePropName="checked">
                    <Switch
                      onChange={(checked) => {
                        setAplicaIndemnizacion(checked);
                        const vals = form.getFieldsValue();
                        const result = calcularFiniquito({
                          ...vals,
                          aplicaPreaviso,
                          aplicaIndemnizacion: checked,
                        });
                        setCalculado(result);
                      }}
                    />
                  </Form.Item>
                </Col>
                {aplicaIndemnizacion && (
                  <Col xs={24} sm={6}>
                    <Form.Item
                      label="Días de Indemnización por Año"
                      name="indemnizacionDiasPorAnio"
                      rules={[{ required: true, message: "Indica los días por año" }]}
                      tooltip="12 = extinción con causa justificada · 20 = despido disciplinario improcedente · 22 = según indique el cliente · 33 = despido improcedente general"
                    >
                      <Select
                        onChange={(value) => {
                          const vals = form.getFieldsValue();
                          const result = calcularFiniquito({
                            ...vals,
                            indemnizacionDiasPorAnio: value,
                            aplicaPreaviso,
                            aplicaIndemnizacion,
                          });
                          setCalculado(result);
                        }}
                      >
                        <Select.Option value={12}>12 días/año</Select.Option>
                        <Select.Option value={20}>20 días/año</Select.Option>
                        <Select.Option value={22}>22 días/año</Select.Option>
                        <Select.Option value={33}>33 días/año</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                )}
              </Row>
              )}
            </Card>

            {/* Texto del documento */}
            <Card title="Texto del Documento" style={{ marginBottom: "24px" }}>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                message="Este es el texto que aparece en el documento. Puedes editarlo."
                description={
                  <span>
                    Usa <code>{"{{empleada}}"}</code>, <code>{"{{empleadora}}"}</code> y{" "}
                    <code>{"{{fechaEfectos}}"}</code> para insertar los datos automáticamente, y{" "}
                    <code>**texto**</code> para poner algo en negrita. Deja una línea en blanco
                    para separar párrafos.
                  </span>
                }
              />
              <Form.Item name="textoIntro" style={{ marginBottom: 16 }}>
                <Input.TextArea autoSize={{ minRows: 8 }} style={{ fontSize: 13 }} />
              </Form.Item>

              <Button
                size="small"
                onClick={() => form.setFieldValue("textoIntro", textoPorDefecto)}
                disabled={!textoPorDefecto}
              >
                Restaurar texto original
              </Button>
            </Card>

            {/* Resultado calculado */}
            <Card
              title={
                <Space>
                  <CalculatorOutlined />
                  Resumen del Finiquito
                </Space>
              }
              style={{ marginBottom: "24px" }}
              styles={{ body: { background: calculado ? "#f6ffed" : "#fafafa" } }}
            >
              {calculado ? (
                <>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item
                      label={`Salario del último período (${calculado.diasPeriodo} ${
                        calculado.diasPeriodo === 1 ? "día" : "días"
                      })`}
                    >
                      <Space direction="vertical" size={0}>
                        <strong>{fmt(calculado.importeSalario)} €</strong>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {calculado.diasFindeDelMes > 0
                            ? `${fmt(calculado.salarioDiarioPeriodo)} €/día (salario ÷ ${
                                calculado.diasFindeDelMes
                              } días de finde del mes) × ${calculado.diasPeriodo} pendientes`
                            : `${fmt(calculado.salarioDiarioPeriodo)} €/día (salario ÷ 30) × ${
                                calculado.diasPeriodo
                              } días`}
                        </Text>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        enPruebas
                          ? "Vacaciones no disfrutadas"
                          : `Vacaciones no disfrutadas (${calculado.diasVacacionesAPagar.toFixed(
                              2
                            )} días a pagar)`
                      }
                    >
                      {enPruebas ? (
                        <Text type="secondary">no procede (período de prueba)</Text>
                      ) : (
                        <Space direction="vertical" size={0}>
                          <strong>{fmt(calculado.importeVacaciones)} €</strong>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {calculado.diasVacacionesGenerados.toFixed(2)} generados en el año
                            {" − "}
                            {(
                              calculado.diasVacacionesGenerados - calculado.diasVacacionesAPagar
                            ).toFixed(2)}{" "}
                            disfrutados · {calculado.diasComputoVacaciones} días computados
                          </Text>
                        </Space>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Compensación por falta de preaviso">
                      {enPruebas ? (
                        <Text type="secondary">no procede (período de prueba)</Text>
                      ) : aplicaPreaviso ? (
                        <strong>{fmt(calculado.importePreaviso)} €</strong>
                      ) : (
                        <Text type="secondary">no procede</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Indemnización por extinción">
                      {enPruebas ? (
                        <Text type="secondary">no procede (período de prueba)</Text>
                      ) : aplicaIndemnizacion ? (
                        <Space direction="vertical" size={0}>
                          <strong>{fmt(calculado.importeIndemnizacion)} €</strong>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Bruto {fmt(calculado.salarioBruto)} € → base{" "}
                            {fmt(calculado.baseCotizacion)} € → base reguladora{" "}
                            {fmt(calculado.baseReguladora)} €/día
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {calculado.diasTrabajados} días de alta ={" "}
                            {calculado.diasIndemnizacion.toFixed(2)} días de indemnización
                          </Text>
                        </Space>
                      ) : (
                        <Text type="secondary">no procede</Text>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                  <Divider />
                  <div style={{ textAlign: "right" }}>
                    <Text strong style={{ fontSize: 18 }}>
                      TOTAL: {fmt(calculado.total)} €
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Días trabajados: {calculado.diasTrabajados} días naturales
                    </Text>
                  </div>
                </>
              ) : (
                <>
                  {form.getFieldValue("fechadesde") &&
                   form.getFieldValue("fechasalariofinalconanio") &&
                   form.getFieldValue("fechasalariofinalconanio").isBefore(form.getFieldValue("fechadesde")) ? (
                    <Card
                      style={{ background: "#fff1f0", borderColor: "#ffccc7" }}
                      type="inner"
                    >
                      <Text type="danger" strong>
                        ❌ Las fechas están invertidas
                      </Text>
                      <br />
                      <Text type="danger" style={{ fontSize: 12 }}>
                        La fecha de baja/extinción debe ser posterior a la fecha de inicio del contrato.
                      </Text>
                    </Card>
                  ) : (
                    <Text type="secondary">
                      Completa las fechas y el salario neto para ver el cálculo automático.
                    </Text>
                  )}
                </>
              )}
            </Card>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={!calculado}
                >
                  Generar Finiquito
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields();
                    setCalculado(null);
                    setAplicaPreaviso(false);
                    setAplicaIndemnizacion(false);
                    setEnPruebas(false);
                  }}
                >
                  Limpiar
                </Button>
              </Space>
            </Form.Item>
          </Form>

          {/* Tabla de Finiquitos */}
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
              Historial de Finiquitos
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={cargarFiniquitos}
              loading={finiquitosLoading}
            >
              Actualizar
            </Button>
          </Space>

          <Card>
            <Spin spinning={finiquitosLoading}>
              {finiquitos.length > 0 ? (
                <Table
                  dataSource={finiquitos}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "Fecha",
                      dataIndex: "fecha",
                      key: "fecha",
                      render: (text) => <Text>{text || "-"}</Text>,
                      width: 100,
                    },
                    {
                      title: "Empleado",
                      dataIndex: "nomempleada",
                      key: "empleado",
                      render: (text, record) => (
                        <Space direction="vertical" size={0}>
                          <Text strong>{text || record.nombretrabajador || "-"}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.niempleada || record.niftrabajador}
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
                      title: "Total",
                      dataIndex: "total",
                      key: "total",
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
                            onClick={() => mostrarDetalle(record)}
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
                          <Button
                            type="link"
                            size="small"
                            onClick={() => descargarPdf(record)}
                          >
                            Descargar PDF
                          </Button>
                          {record.status === "error" && (
                            <Button
                              type="link"
                              size="small"
                              onClick={() => {
                                Modal.confirm({
                                  title: "Reintentar Finiquito",
                                  content:
                                    "¿Deseas reintentar el envío de este finiquito?",
                                  onOk: async () => {
                                    // TODO: Implementar reintento
                                    message.info("Función de reintento en desarrollo");
                                  },
                                });
                              }}
                            >
                              Reintentar
                            </Button>
                          )}
                          <Button
                            type="link"
                            size="small"
                            danger
                            onClick={() => eliminarFiniquito(record)}
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
                  description="No hay finiquitos registrados"
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
