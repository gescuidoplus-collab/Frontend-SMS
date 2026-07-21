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
  Divider,
  Descriptions,
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

const { Title, Text } = Typography;

interface FormValues {
  fecha?: Dayjs;
  nomempleada?: string;
  niempleada?: string;
  correoempleada?: string;
  nomempleador?: string;
  correoempleador?: string;
  fechadesde?: Dayjs;
  diasalario?: Dayjs;
  fechasalariofinalconanio?: Dayjs;
  salarioNeto?: number;
  aplicaPreaviso?: boolean;
  diasSinPreaviso?: number;
  aplicaIndemnizacion?: boolean;
}

interface Calculado {
  diasTrabajados: number;
  diasVacaciones: number;
  salarioPendiente: number;
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

const calcularFiniquito = (values: FormValues): Calculado | null => {
  const {
    fechadesde,
    fechasalariofinalconanio,
    diasalario,
    salarioNeto,
    aplicaPreaviso,
    diasSinPreaviso,
    aplicaIndemnizacion,
  } = values;

  if (!fechadesde || !fechasalariofinalconanio || !diasalario || !salarioNeto || salarioNeto <= 0) {
    return null;
  }

  const diasTrabajados = fechasalariofinalconanio.diff(fechadesde, "day") + 1;
  if (diasTrabajados <= 0) return null;

  const salarioDiarioNeto = salarioNeto / 30;

  // 1. Vacaciones proporcionales
  const diasVacaciones = (diasTrabajados * 30) / 365;
  const importeVacaciones = diasVacaciones * salarioDiarioNeto;

  // 2. Salario pendiente del período
  const diasPeriodo = fechasalariofinalconanio.diff(diasalario, "day") + 1;
  const salarioPendiente = Math.max(0, diasPeriodo * salarioDiarioNeto);

  // 3. Indemnización (solo si aplica)
  let importeIndemnizacion = 0;
  if (aplicaIndemnizacion) {
    const anos = diasTrabajados / 365;
    const baseCotizacion = determinarTramoFiniquito(salarioNeto);
    const salarioDiarioBase = baseCotizacion / 30;
    importeIndemnizacion = salarioDiarioBase * 12 * anos;
  }

  // 4. Preaviso (solo si aplica)
  let importePreaviso = 0;
  if (aplicaPreaviso && diasSinPreaviso && diasSinPreaviso > 0) {
    importePreaviso = salarioDiarioNeto * diasSinPreaviso;
  }

  const total = salarioPendiente + importeVacaciones + importeIndemnizacion + importePreaviso;

  return {
    diasTrabajados,
    diasVacaciones,
    salarioPendiente,
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
  const [calculado, setCalculado] = useState<Calculado | null>(null);
  const router = useRouter();

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

  const onValuesChange = (_: Partial<FormValues>, allValues: FormValues) => {
    const result = calcularFiniquito({
      ...allValues,
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
        nomempleada: values.nomempleada || "",
        niempleada: values.niempleada || "",
        correoempleada: values.correoempleada || "",
        nomempleador: values.nomempleador || "",
        correoempleador: values.correoempleador || "",
        fechadesde: formatearFecha(values.fechadesde, "completaDel"),
        diasalario: formatearFecha(values.diasalario, "mesYDia"),
        fechasalariofinalconanio: formatearFecha(values.fechasalariofinalconanio, "completa"),
        // campos existentes — ahora calculados automáticamente
        monto1: calculado.salarioPendiente.toFixed(2),
        monto2: calculado.importeVacaciones.toFixed(2),
        total: calculado.total.toFixed(2),
        // 3 campos nuevos para Make → SignNow
        vacacionesdias: calculado.diasVacaciones.toFixed(3),
        preaviso: aplicaPreaviso ? calculado.importePreaviso.toFixed(2) : "no procede",
        indemnizacion: aplicaIndemnizacion ? calculado.importeIndemnizacion.toFixed(2) : "no procede",
      };

      const response = await fetch(
        "https://hook.eu2.make.com/dw7e2ijv5h2rpuitnhhbw2p8agfq66py",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
            initialValues={{ diasSinPreaviso: 7 }}
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
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="NIE"
                    name="niempleada"
                    rules={[{ required: true, message: "El NIE es requerido" }]}
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
                        const result = calcularFiniquito({
                          ...vals,
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
                    >
                      <InputNumber
                        min={1}
                        max={30}
                        precision={0}
                        style={{ width: "100%" }}
                        addonAfter="días"
                      />
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
                    <Descriptions.Item label="Salario pendiente del período">
                      <strong>{fmt(calculado.salarioPendiente)} €</strong>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={`Vacaciones generadas no disfrutadas (${calculado.diasVacaciones.toFixed(3)} días)`}
                    >
                      <strong>{fmt(calculado.importeVacaciones)} €</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Falta de preaviso">
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
                <Text type="secondary">
                  Completa las fechas y el salario neto para ver el cálculo automático.
                </Text>
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
        </div>
      </div>
    </div>
  );
}
