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
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { useRouter } from "next/navigation";
import { fetchCloudnavisEmpleado, fetchCloudnavisEmpleador } from "@/services/cloudnavisClient";
import { mapEmpleadoToFiniquito, mapEmpleadorToFiniquito } from "@/services/mappers";
import CloudnavisErrorModal from "@/components/CloudnavisErrorModal";

const { Title, Text } = Typography;

interface FormValues {
  fecha?: Dayjs;
  lugarFirma?: string;
  nomempleada?: string;
  tipoDocumentoEmpleada?: "NIE" | "NIF";
  niempleada?: string;
  correoempleada?: string;
  nomempleador?: string;
  correoempleador?: string;
  fechadesde?: Dayjs;
  diasalario?: Dayjs;
  fechasalariofinalconanio?: Dayjs;
  salarioNeto?: number;
  tipoJornada?: "lv" | "finde";
  diasLaborablesMes?: number;
  aplicaPreaviso?: boolean;
  diasSinPreaviso?: number;
  aplicaIndemnizacion?: boolean;
  indemnizacionDiasPorAnio?: number;
}

interface Calculado {
  diasTrabajados: number;
  diasVacaciones: number;
  importeSalario: number;
  importeVacaciones: number;
  importePreaviso: number;
  importeIndemnizacion: number;
  total: number;
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

// Cuenta los sábados y domingos entre dos fechas, ambas inclusive
const contarDiasFinde = (inicio: Dayjs, fin: Dayjs): number => {
  let dias = 0;
  let cursor = inicio.startOf("day");
  const limite = fin.startOf("day");
  while (!cursor.isAfter(limite)) {
    const diaSemana = cursor.day(); // 0 = domingo, 6 = sábado
    if (diaSemana === 0 || diaSemana === 6) dias += 1;
    cursor = cursor.add(1, "day");
  }
  return dias;
};

// Antigüedad < 1 año → 7 días de preaviso; ≥ 1 año → 20 días (RD-ley 16/2022)
const sugerirDiasPreaviso = (fechadesde?: Dayjs, fechasalariofinalconanio?: Dayjs): number => {
  if (!fechadesde || !fechasalariofinalconanio) return 7;
  const diasTrabajados = fechasalariofinalconanio.diff(fechadesde, "day") + 1;
  return diasTrabajados >= 365 ? 20 : 7;
};

const calcularFiniquito = (values: FormValues): Calculado | null => {
  const {
    fechadesde,
    fechasalariofinalconanio,
    diasalario,
    salarioNeto,
    tipoJornada,
    diasLaborablesMes,
    aplicaPreaviso,
    diasSinPreaviso,
    aplicaIndemnizacion,
    indemnizacionDiasPorAnio,
  } = values;

  if (!fechadesde || !fechasalariofinalconanio || !diasalario || !salarioNeto || salarioNeto <= 0) {
    return null;
  }

  // Validar que la fecha de baja sea posterior a la de inicio
  if (fechasalariofinalconanio.isBefore(fechadesde)) {
    return null;
  }

  const diasTrabajados = fechasalariofinalconanio.diff(fechadesde, "day") + 1;
  if (diasTrabajados <= 0) return null;

  const salarioDiarioNeto = salarioNeto / 30;

  // 1. Vacaciones proporcionales
  const diasVacaciones = (diasTrabajados * 30) / 365;
  const importeVacaciones = diasVacaciones * salarioDiarioNeto;

  // 2. Salario del último período
  let importeSalario: number;
  if (tipoJornada === "finde") {
    if (!diasLaborablesMes || diasLaborablesMes <= 0) return null;
    const diasPeriodoFinde = contarDiasFinde(diasalario, fechasalariofinalconanio);
    importeSalario = Math.max(0, diasPeriodoFinde * (salarioNeto / diasLaborablesMes));
  } else {
    const diasPeriodo = fechasalariofinalconanio.diff(diasalario, "day") + 1;
    importeSalario = Math.max(0, diasPeriodo * salarioDiarioNeto);
  }

  // 3. Indemnización (solo si aplica)
  let importeIndemnizacion = 0;
  if (aplicaIndemnizacion) {
    const anos = diasTrabajados / 365;
    const baseCotizacion = determinarTramoFiniquito(salarioNeto);
    const salarioDiarioBase = baseCotizacion / 30;
    const diasPorAnio = indemnizacionDiasPorAnio || 12;
    importeIndemnizacion = salarioDiarioBase * diasPorAnio * anos;
  }

  // 4. Preaviso (solo si aplica)
  let importePreaviso = 0;
  if (aplicaPreaviso && diasSinPreaviso && diasSinPreaviso > 0) {
    importePreaviso = salarioDiarioNeto * diasSinPreaviso;
  }

  // Total finiquito: salario + vacaciones + indemnización + preaviso
  const total = importeSalario + importeVacaciones + importeIndemnizacion + importePreaviso;

  return {
    diasTrabajados,
    diasVacaciones,
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
  const [preavisoTouched, setPreavisoTouched] = useState(false);
  const [tipoJornada, setTipoJornada] = useState<"lv" | "finde">("lv");
  const [calculado, setCalculado] = useState<Calculado | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [finiquitos, setFiniquitos] = useState<any[]>([]);
  const [finiquitosLoading, setFiniquitosLoading] = useState(false);
  const router = useRouter();


  const cargarFiniquitos = async () => {
    setFiniquitosLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3001/api/v1/finiquito/lista",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFiniquitos(data.data || []);
      }
    } catch (error) {
      console.error("Error cargando finiquitos:", error);
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

    const diasalario = params.get("diasalario");
    if (diasalario) {
      const parsed = dayjs(diasalario, "YYYY-MM-DD", true);
      if (parsed.isValid()) prefill.diasalario = parsed;
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
      valores = { ...allValues, diasSinPreaviso: sugerido };
    }

    if ("tipoJornada" in changed) {
      setTipoJornada(changed.tipoJornada || "lv");
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
        correoempleada: values.correoempleada || "",
        nomempleador: values.nomempleador || "",
        nifempleador: "", // Agregar estos del formulario si están disponibles
        correoempleador: values.correoempleador || "",
        fechadesde: formatearFecha(values.fechadesde, "completaDel"),
        diasalario: formatearFecha(values.diasalario, "mesYDia"),
        fechasalariofinalconanio: formatearFecha(values.fechasalariofinalconanio, "completa"),
        salarioNeto: values.salarioNeto || 0,
        tipoJornada: values.tipoJornada || "lv",
        diasLaborablesMes: values.tipoJornada === "finde" ? values.diasLaborablesMes || 0 : undefined,
        aplicaPreaviso,
        diasSinPreaviso: aplicaPreaviso ? values.diasSinPreaviso || 0 : undefined,
        aplicaIndemnizacion,
        indemnizacionDiasPorAnio: aplicaIndemnizacion ? values.indemnizacionDiasPorAnio || 12 : undefined,
        // Finiquito: salario + vacaciones + preaviso + indemnización
        salarioLiquidacionImporte: calculado.importeSalario.toFixed(2),
        vacacionesdias: calculado.diasVacaciones.toFixed(3),
        vacacionesimporte: calculado.importeVacaciones.toFixed(2),
        preaviso: aplicaPreaviso ? calculado.importePreaviso.toFixed(2) : "no procede",
        indemnizacion: aplicaIndemnizacion ? calculado.importeIndemnizacion.toFixed(2) : "no procede",
        total: calculado.total.toFixed(2),
      };

      // Obtener token JWT del localStorage
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:3001/api/v1/finiquito/crear",
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
        message.success("✓ Finiquito enviado correctamente");
        setTimeout(() => {
          Modal.success({
            title: "¡Finiquito Enviado Correctamente!",
            icon: <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 48 }} />,
            content: (
              <div>
                <p style={{ marginBottom: 12 }}>
                  ✓ La invitación a la firma ha sido enviada a los correos correspondientes.
                </p>
                <p style={{ marginBottom: 12 }}>
                  ✓ Puedes ver el documento en <strong>SignNow</strong>
                </p>
                <p>
                  ✓ Una vez se firme, se guardará automáticamente en <strong>Google Drive</strong>
                </p>
              </div>
            ),
            okText: "Cerrar",
            onOk: () => {
              form.resetFields();
              setCalculado(null);
              setAplicaPreaviso(false);
              setAplicaIndemnizacion(false);
              cargarFiniquitos(); // Recargar lista
              router.push("/formularios");
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
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Correo Electrónico"
                    name="correoempleada"
                    rules={[
                      { required: true, message: "El correo es requerido" },
                      { type: "email", message: "Ingresa un correo válido" },
                    ]}
                  >
                    <Input placeholder="ejemplo@email.com" type="email" />
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
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Correo Electrónico"
                    name="correoempleador"
                    rules={[
                      { required: true, message: "El correo es requerido" },
                      { type: "email", message: "Ingresa un correo válido" },
                    ]}
                  >
                    <Input placeholder="ejemplo@empresa.com" type="email" />
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
                    label="Inicio del Último Período Salarial"
                    name="diasalario"
                    rules={[{ required: true, message: "El día de inicio de salario es requerido" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Ej. 1 de Junio" />
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
                    rules={[{ required: true, message: "Requerido" }]}
                  >
                    <Select onChange={(value) => setTipoJornada(value)}>
                      <Select.Option value="lv">Lunes a viernes</Select.Option>
                      <Select.Option value="finde">Fines de semana</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                {tipoJornada === "finde" && (
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Días Laborables Reales al Mes"
                      name="diasLaborablesMes"
                      rules={[{ required: true, message: "Indica los días laborables al mes" }]}
                      tooltip="Número de días que realmente se trabaja al mes (ej. 8 si son solo fines de semana)"
                    >
                      <InputNumber
                        min={1}
                        max={31}
                        precision={0}
                        style={{ width: "100%" }}
                        addonAfter="días/mes"
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </Card>

            {/* Conceptos especiales */}
            <Card title="Conceptos Especiales" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item label="¿Aplica falta de preaviso?" name="aplicaPreaviso" valuePropName="checked">
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
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Días sin preaviso"
                      name="diasSinPreaviso"
                      rules={[{ required: true, message: "Indica los días" }]}
                      tooltip="Se autoselecciona según la antigüedad (<1 año = 7 días, ≥1 año = 20 días); puedes cambiarlo manualmente"
                    >
                      <Select onChange={() => setPreavisoTouched(true)}>
                        <Select.Option value={7}>7 días</Select.Option>
                        <Select.Option value={20}>20 días</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                )}
                <Col xs={24} sm={12}>
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
                  <Col xs={24} sm={12}>
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
                    <Descriptions.Item label="Salario del último período">
                      <strong>{fmt(calculado.importeSalario)} €</strong>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={`Vacaciones proporcionales (${calculado.diasVacaciones.toFixed(3)} días)`}
                    >
                      <strong>{fmt(calculado.importeVacaciones)} €</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Compensación por falta de preaviso">
                      {aplicaPreaviso ? (
                        <strong>{fmt(calculado.importePreaviso)} €</strong>
                      ) : (
                        <Text type="secondary">no procede</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Indemnización por extinción">
                      {aplicaIndemnizacion ? (
                        <strong>{fmt(calculado.importeIndemnizacion)} €</strong>
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
                  }}
                >
                  Limpiar
                </Button>
              </Space>
            </Form.Item>
          </Form>

          {/* Tabla de Finiquitos */}
          <Divider style={{ marginTop: "40px" }} />

          <Title level={3} style={{ marginBottom: "16px", marginTop: "24px" }}>
            Historial de Finiquitos
          </Title>

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
                        const statusMap: Record<string, any> = {
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
                                title: `Finiquito - ${record.nombretrabajador}`,
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
                                      <Descriptions.Item label="Vacaciones">
                                        {record.vacacionesimporte}€
                                      </Descriptions.Item>
                                      <Descriptions.Item label="Preaviso">
                                        {record.preaviso}
                                      </Descriptions.Item>
                                      <Descriptions.Item label="Indemnización">
                                        {record.indemnizacion}
                                      </Descriptions.Item>
                                      <Descriptions.Item label="Total">
                                        <Text strong>{record.total}€</Text>
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
                        </Space>
                      ),
                      width: 120,
                    },
                  ]}
                  size="small"
                  scroll={{ x: 1000 }}
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
