"use client";

import React, { useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
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
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

const { Title, Text } = Typography;

interface FormValues {
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
  fechaFirma?: Dayjs;
}

const formatearFecha = (date: Dayjs | undefined, tipo: "completa"): string => {
  if (!date) return "";
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dia = date.date();
  const mes = meses[date.month()];
  const anio = date.year();
  return `${dia} de ${mes} ${anio}`;
};

export default function DocumentosGrupoPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    message.loading({ content: "Enviando documentos...", key: "sending" });

    try {
      const payload = [
        {
          plantilla: "grupo",
          datos: {
            ...values,
            fechaFirma: formatearFecha(values.fechaFirma, "completa"),
          },
          timestamp: {},
        },
      ];

      const response = await fetch(
        "https://hook.eu2.make.com/tom528yfgpx6y2dxnmw8uir90t1g1a8i",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      message.destroy("sending");

      if (response.ok) {
        message.success("✓ Documentos enviados correctamente");
        setTimeout(() => {
          Modal.success({
            title: "¡Documentos Enviados Correctamente!",
            icon: <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 48 }} />,
            content: (
              <div>
                <p style={{ marginBottom: 12 }}>
                  ✓ La invitación a la firma ha sido enviada a los correos correspondientes.
                </p>
                <p style={{ marginBottom: 12 }}>
                  ✓ Puedes ver los documentos en <strong>SignNow</strong>
                </p>
                <p>
                  ✓ Una vez se firmen, se guardarán automáticamente en <strong>Google Drive</strong>
                </p>
              </div>
            ),
            okText: "Cerrar",
            onOk: () => {
              form.resetFields();
              router.push("/formularios");
            },
          });
        }, 500);
      } else {
        message.error("Error al enviar documentos");
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
            Documentos Grupo
          </Title>
          <Text type="secondary" style={{ display: "block", marginBottom: "24px" }}>
            Completa los datos del grupo para generar los documentos
          </Text>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            {/* Sección: Datos Personales */}
            <Card title="Datos Personales" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Primer Apellido"
                    name="primerApellido"
                    rules={[{ required: true, message: "El primer apellido es requerido" }]}
                  >
                    <Input placeholder="García" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Segundo Apellido"
                    name="segundoApellido"
                  >
                    <Input placeholder="López" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nombres"
                    name="nombres"
                    rules={[{ required: true, message: "Los nombres son requeridos" }]}
                  >
                    <Input placeholder="Juan Carlos" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="NIF"
                    name="nif"
                  >
                    <Input placeholder="12345678X" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Sexo"
                    name="sexo"
                  >
                    <Select placeholder="Selecciona sexo">
                      <Select.Option value="M">Masculino</Select.Option>
                      <Select.Option value="F">Femenino</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Número de Documento"
                    name="numeroDocumento"
                  >
                    <Input placeholder="Ej. 12345678" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Tipo de Documento"
                    name="tipoDocumento"
                  >
                    <Select placeholder="Selecciona tipo">
                      <Select.Option value="dni">DNI</Select.Option>
                      <Select.Option value="nie">NIE</Select.Option>
                      <Select.Option value="pasaporte">Pasaporte</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={8}>
                  <Form.Item
                    label="Día"
                    name="diaNacimiento"
                    rules={[{ type: "number", message: "Debe ser un número válido" }]}
                  >
                    <InputNumber min={1} max={31} placeholder="1-31" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={8}>
                  <Form.Item
                    label="Mes"
                    name="mesNacimiento"
                    rules={[{ type: "number", message: "Debe ser un número válido" }]}
                  >
                    <InputNumber min={1} max={12} placeholder="1-12" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={8}>
                  <Form.Item
                    label="Año"
                    name="anioNacimiento"
                    rules={[{ type: "number", message: "Debe ser un número válido" }]}
                  >
                    <InputNumber min={1900} max={2024} placeholder="YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Dirección */}
            <Card title="Dirección" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Tipo de Vía"
                    name="tipoVia"
                  >
                    <Input placeholder="Ej. Calle, Avenida" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nombre de Vía"
                    name="nombreVia"
                  >
                    <Input placeholder="Ej. Principal" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Bloque"
                    name="bloque"
                  >
                    <Input placeholder="A, B, C..." />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Número"
                    name="numero"
                  >
                    <Input placeholder="Ej. 123" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Puerta"
                    name="puerta"
                  >
                    <Input placeholder="Ej. 3B" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Código Postal"
                    name="codPostal"
                  >
                    <Input placeholder="Ej. 28001" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Municipio"
                    name="municipio"
                  >
                    <Input placeholder="Ej. Madrid" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Provincia"
                    name="provincia"
                  >
                    <Input placeholder="Ej. Madrid" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="País"
                    name="pais"
                  >
                    <Input placeholder="Ej. España" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Datos Bancarios */}
            <Card title="Datos Bancarios" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Código SWIFT"
                    name="codigoSwift"
                  >
                    <Input placeholder="Ej. BBVAESMM" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Número de Cuenta"
                    name="numeroCuenta"
                  >
                    <Input placeholder="Ej. ES9121000418450200051332" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label="Cuenta de Cotización"
                    name="cuentaCotizacion"
                  >
                    <Input placeholder="Ej. 1234567890" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Firma */}
            <Card title="Información de Firma" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Lugar de Firma"
                    name="lugarFirma"
                  >
                    <Input placeholder="Ej. Madrid" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Fecha de Firma"
                    name="fechaFirma"
                    rules={[{ required: true, message: "La fecha de firma es requerida" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Ej. 24 de Abril 2026" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Enviar Formulario
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
