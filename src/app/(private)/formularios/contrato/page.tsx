"use client";

import React, { useEffect, useState } from "react";
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
import { ArrowLeftOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

interface FormValues {
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
  fechacontrato?: Dayjs;
  montobruto?: number;
  lugarfirma?: string;
  mesfirma?: string;
  diafirma?: string;
  anofirma?: string;
  fechanactrabajador?: Dayjs;
}

const formatearFecha = (date: Dayjs | undefined, tipo: "completa"): string => {
  if (!date) return "";
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dia = date.date();
  const mes = meses[date.month()];
  const anio = date.year();
  return `${dia} de ${mes} ${anio}`;
};

export default function ContratoPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill: Partial<FormValues> = {};

    const fechacontrato = params.get("fechacontrato");
    if (fechacontrato) {
      const parsed = dayjs(fechacontrato, "YYYY-MM-DD", true);
      if (parsed.isValid()) prefill.fechacontrato = parsed;
    }

    const fechanactrabajador = params.get("fechanactrabajador");
    if (fechanactrabajador) {
      const parsed = dayjs(fechanactrabajador, "YYYY-MM-DD", true);
      if (parsed.isValid()) prefill.fechanactrabajador = parsed;
    }

    const montobruto = params.get("montobruto");
    if (montobruto !== null) {
      const num = Number(montobruto);
      if (!Number.isNaN(num)) prefill.montobruto = num;
    }

    const nomempleador = params.get("nomempleador");
    if (nomempleador) prefill.nomempleador = nomempleador;

    const nifempleador = params.get("nifempleador");
    if (nifempleador) prefill.nifempleador = nifempleador;

    const correoempleador = params.get("correoempleador");
    if (correoempleador) prefill.correoempleador = correoempleador;

    const regimen = params.get("regimen");
    if (regimen) prefill.regimen = regimen;

    const codigo = params.get("codigo");
    if (codigo) prefill.codigo = codigo;

    const prov = params.get("prov");
    if (prov) prefill.prov = prov;

    const numero = params.get("numero");
    if (numero) prefill.numero = numero;

    const dig = params.get("dig");
    if (dig) prefill.dig = dig;

    const contr = params.get("contr");
    if (contr) prefill.contr = contr;

    const domicilio = params.get("domicilio");
    if (domicilio) prefill.domicilio = domicilio;

    const municipio = params.get("municipio");
    if (municipio) prefill.municipio = municipio;

    const nombretrabajador = params.get("nombretrabajador");
    if (nombretrabajador) prefill.nombretrabajador = nombretrabajador;

    const niftrabajador = params.get("niftrabajador");
    if (niftrabajador) prefill.niftrabajador = niftrabajador;

    const correotrabajador = params.get("correotrabajador");
    if (correotrabajador) prefill.correotrabajador = correotrabajador;

    const numafiliaciontrabajador = params.get("numafiliaciontrabajador");
    if (numafiliaciontrabajador) prefill.numafiliaciontrabajador = numafiliaciontrabajador;

    const nivelformativotrabajador = params.get("nivelformativotrabajador");
    if (nivelformativotrabajador) prefill.nivelformativotrabajador = nivelformativotrabajador;

    const nacionalidadtrabajador = params.get("nacionalidadtrabajador");
    if (nacionalidadtrabajador) prefill.nacionalidadtrabajador = nacionalidadtrabajador;

    const municipiodomtrabaajdor = params.get("municipiodomtrabaajdor");
    if (municipiodomtrabaajdor) prefill.municipiodomtrabaajdor = municipiodomtrabaajdor;

    const paisdomtrabajador = params.get("paisdomtrabajador");
    if (paisdomtrabajador) prefill.paisdomtrabajador = paisdomtrabajador;

    const lugarfirma = params.get("lugarfirma");
    if (lugarfirma) prefill.lugarfirma = lugarfirma;

    const mesfirma = params.get("mesfirma");
    if (mesfirma) prefill.mesfirma = mesfirma;

    const diafirma = params.get("diafirma");
    if (diafirma) prefill.diafirma = diafirma;

    const anofirma = params.get("anofirma");
    if (anofirma) prefill.anofirma = anofirma;

    if (Object.keys(prefill).length === 0) return;
    form.setFieldsValue(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    message.loading({ content: "Enviando contrato...", key: "sending" });

    try {
      const payload = {
        nomempleador: values.nomempleador || "",
        nifempleador: values.nifempleador || "",
        correoempleador: values.correoempleador || "",
        regimen: values.regimen || "",
        codigo: values.codigo || "",
        prov: values.prov || "",
        numero: values.numero || "",
        dig: values.dig || "",
        contr: values.contr || "",
        domicilio: values.domicilio || "",
        municipio: values.municipio || "",
        nombretrabajador: values.nombretrabajador || "",
        niftrabajador: values.niftrabajador || "",
        correotrabajador: values.correotrabajador || "",
        fechanactrabajador: formatearFecha(values.fechanactrabajador, "completa"),
        numafiliaciontrabajador: values.numafiliaciontrabajador || "",
        nivelformativotrabajador: values.nivelformativotrabajador || "",
        nacionalidadtrabajador: values.nacionalidadtrabajador || "",
        municipiodomtrabaajdor: values.municipiodomtrabaajdor || "",
        paisdomtrabajador: values.paisdomtrabajador || "",
        fechacontrato: formatearFecha(values.fechacontrato, "completa"),
        montobruto: values.montobruto?.toString() || "",
        lugarfirma: values.lugarfirma || "",
        mesfirma: values.mesfirma || "",
        diafirma: values.diafirma || "",
        anofirma: values.anofirma || "",
      };

      console.log("Enviando payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(
        "https://hook.eu2.make.com/wxg5dazqrnjotoxpvt6j6wyy4upo14br",
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

      message.destroy("sending");

      if (response.ok) {
        message.success("✓ Contrato enviado correctamente");
        setTimeout(() => {
          Modal.success({
            title: "¡Contrato Enviado Correctamente!",
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
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="NIF del Empleador"
                    name="nifempleador"
                    rules={[{ required: true, message: "El NIF es requerido" }]}
                  >
                    <Input placeholder="12345678X" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Correo del Empleador"
                    name="correoempleador"
                    rules={[
                      { required: true, message: "El correo es requerido" },
                      { type: "email", message: "Ingresa un correo válido" }
                    ]}
                  >
                    <Input placeholder="empleador@empresa.com" type="email" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Datos de la Cuenta de Cotización */}
            <Card title="Datos de la Cuenta de Cotización" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={6}>
                  <Form.Item
                    label="Régimen"
                    name="regimen"
                    rules={[{ required: true, message: "Requerido" }]}
                  >
                    <Input placeholder="0000" maxLength={4} />
                  </Form.Item>
                </Col>
                <Col xs={6}>
                  <Form.Item
                    label="Código"
                    name="codigo"
                    rules={[{ required: true, message: "Requerido" }]}
                  >
                    <Input placeholder="0" maxLength={1} />
                  </Form.Item>
                </Col>
                <Col xs={6}>
                  <Form.Item
                    label="Prov"
                    name="prov"
                    rules={[{ required: true, message: "Requerido" }]}
                  >
                    <Input placeholder="0" maxLength={1} />
                  </Form.Item>
                </Col>
                <Col xs={6}>
                  <Form.Item
                    label="Dig"
                    name="dig"
                    rules={[{ required: true, message: "Requerido" }]}
                  >
                    <Input placeholder="0" maxLength={1} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Número"
                    name="numero"
                    rules={[{ required: true, message: "Este campo es requerido" }]}
                  >
                    <Input placeholder="Ej. 123456789" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Contr"
                    name="contr"
                    rules={[{ required: true, message: "Este campo es requerido" }]}
                  >
                    <Input placeholder="0" />
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
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="NIF de la Trabajadora"
                    name="niftrabajador"
                    rules={[{ required: true, message: "El NIF es requerido" }]}
                  >
                    <Input placeholder="98765432Y" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Correo de la Trabajadora"
                    name="correotrabajador"
                    rules={[
                      { required: true, message: "El correo es requerido" },
                      { type: "email", message: "Ingresa un correo válido" }
                    ]}
                  >
                    <Input placeholder="trabajadora@email.com" type="email" />
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
                    <Input placeholder="Ej. Primaria, Secundaria, Superior" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nacionalidad"
                    name="nacionalidadtrabajador"
                  >
                    <Input placeholder="Ej. Española" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Municipio de Domicilio"
                    name="municipiodomtrabaajdor"
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
                  >
                    <Input placeholder="Ej. Madrid" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col xs={8}>
                  <Form.Item
                    label="Día"
                    name="diafirma"
                  >
                    <Input placeholder="01-31" />
                  </Form.Item>
                </Col>
                <Col xs={8}>
                  <Form.Item
                    label="Mes"
                    name="mesfirma"
                  >
                    <Input placeholder="01-12" />
                  </Form.Item>
                </Col>
                <Col xs={8}>
                  <Form.Item
                    label="Año (2 dígitos)"
                    name="anofirma"
                  >
                    <Input placeholder="Ej. 26" maxLength={2} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Generar Contrato
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
