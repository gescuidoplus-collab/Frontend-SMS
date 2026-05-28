"use client";

import React, { useState } from "react";
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
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
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
  monto1?: number;
  monto2?: number;
  total?: number;
}

const formatearFecha = (date: Dayjs | undefined, tipo: "completa" | "completaDel" | "mesYDia"): string => {
  if (!date) return "";
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dia = date.date();
  const mes = meses[date.month()];
  const anio = date.year();

  if (tipo === "mesYDia") {
    return `${dia} de ${mes}`;
  } else if (tipo === "completaDel") {
    return `${dia} de ${mes} del ${anio}`;
  } else {
    return `${dia} de ${mes} ${anio}`;
  }
};

export default function FiniquitoPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onValuesChange = (changedValues: Partial<FormValues>, allValues: FormValues) => {
    const monto1 = allValues.monto1 || 0;
    const monto2 = allValues.monto2 || 0;
    const total = monto1 + monto2;

    if (changedValues.monto1 !== undefined || changedValues.monto2 !== undefined) {
      form.setFieldValue("total", total);
    }
  };

  const onFinish = async (values: FormValues) => {
    setLoading(true);
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
        monto1: values.monto1?.toString() || "",
        monto2: values.monto2?.toString() || "",
        total: values.total?.toString() || "",
      };

      console.log("Enviando payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(
        "https://hook.eu2.make.com/dw7e2ijv5h2rpuitnhhbw2p8agfq66py",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.text();
      console.log("Response:", responseData);

      if (response.ok) {
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
            router.push("/formularios");
          },
        });
      } else {
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
          >
            {/* Sección: Información General */}
            <Card title="Información General" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Fecha del Finiquito"
                    name="fecha"
                    rules={[{ required: true, message: "Este campo es requerido" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Ej. 24 de Abril 2026" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Datos de la Empleada */}
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
                      { type: "email", message: "Ingresa un correo válido" }
                    ]}
                  >
                    <Input placeholder="ejemplo@email.com" type="email" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Datos del Empleador */}
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
                      { type: "email", message: "Ingresa un correo válido" }
                    ]}
                  >
                    <Input placeholder="ejemplo@empresa.com" type="email" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Periodo de Trabajo */}
            <Card title="Periodo de Trabajo" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Fecha de Inicio"
                    name="fechadesde"
                    rules={[{ required: true, message: "La fecha de inicio es requerida" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Ej. 24 de Abril del 2026" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Día de Salario"
                    name="diasalario"
                    rules={[{ required: true, message: "El día de salario es requerido" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Ej. 20 de Abril" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Fecha de Salario Final"
                    name="fechasalariofinalconanio"
                    rules={[{ required: true, message: "La fecha final es requerida" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Ej. 24 de Abril 2026" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Montos */}
            <Card title="Cálculo de Finiquito" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Salario Pendiente"
                    name="monto1"
                    rules={[
                      { required: true, message: "El salario es requerido" },
                      { type: "number", message: "Debe ser un número válido" }
                    ]}
                  >
                    <InputNumber
                      placeholder="0.00"
                      step={0.01}
                      min={0}
                      precision={2}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Vacaciones No Disfrutadas"
                    name="monto2"
                    rules={[
                      { required: true, message: "Las vacaciones son requeridas" },
                      { type: "number", message: "Debe ser un número válido" }
                    ]}
                  >
                    <InputNumber
                      placeholder="0.00"
                      step={0.01}
                      min={0}
                      precision={2}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Total a Pagar"
                    name="total"
                  >
                    <InputNumber
                      placeholder="Cálculo automático"
                      step={0.01}
                      min={0}
                      precision={2}
                      disabled
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Generar Finiquito
                </Button>
                <Button onClick={() => form.resetFields()}>
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
