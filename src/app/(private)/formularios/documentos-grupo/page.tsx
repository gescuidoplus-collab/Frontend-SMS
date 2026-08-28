"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
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
  Table,
  Tag,
  Empty,
  Spin,
  Divider,
} from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { fetchCloudnavisEmpleado } from "@/services/cloudnavisClient";
import { mapEmpleadoToDocumentosGrupo } from "@/services/mappers";
import CloudnavisErrorModal from "@/components/CloudnavisErrorModal";
import LoginRequeridoModal from "@/components/LoginRequeridoModal";
import { useSesionEnlace } from "@/lib/useSesionEnlace";
import { obtenerToken } from "@/lib/session";
import { API_URL } from "@/lib/config";

const { Title, Text } = Typography;

interface DocumentoGrupoRecord {
  _id: string;
  nombres?: string;
  primerApellido?: string;
  segundoApellido?: string;
  numeroDocumento?: string;
  nif?: string;
  municipio?: string;
  fechaFirma?: string;
  status?: string;
  createdAt?: string;
  signingLinks?: { role: string; link: string }[];
  lastError?: { stage?: string; message?: string };
}

interface FormValues {
  primerApellido?: string;
  segundoApellido?: string;
  nombres?: string;
  nif?: string;
  sexo?: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  fechaNacimiento?: Dayjs;
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
  correo?: string;
  telefono?: string;
  razonSocial?: string;
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
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoGrupoRecord[]>([]);
  const [documentosLoading, setDocumentosLoading] = useState(false);
  // Un enlace de CloudNavis puede abrirse sin sesión: el prellenado funciona
  // igual (usa el token de la URL), pero el historial y el envío no.
  const { haySesion, marcarSesionIniciada } = useSesionEnlace();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idEmpleado = params.get("idEmpleado");
    const token = params.get("token");

    // Sin parametros se entra a rellenar a mano, que es lo normal.
    if (!idEmpleado && !token) return;

    // Pero si el enlace trae algo y le falta lo esencial, hay que decirlo:
    // antes se salia en silencio y el formulario aparecia vacio sin motivo.
    if (!idEmpleado || !token) {
      setErrorCode("ENLACE_INCOMPLETO");
      return;
    }

    setLoading(true);
    setErrorCode(null);

    (async () => {
      try {
        const empleado = await fetchCloudnavisEmpleado(idEmpleado, token);
        const { diaNacimiento, mesNacimiento, anioNacimiento, ...mapped } =
          mapEmpleadoToDocumentosGrupo(empleado);
        const fechaNacimiento =
          diaNacimiento && mesNacimiento && anioNacimiento
            ? dayjs(`${anioNacimiento}-${mesNacimiento}-${diaNacimiento}`, "YYYY-M-D")
            : undefined;
        form.setFieldsValue({ ...mapped, fechaNacimiento });
      } catch (err) {
        const error = err as Error;
        if (error.message === "TOKEN_INVALID") {
          setErrorCode("TOKEN_INVALID");
        } else if (error.message === "EMPLEADO_NOT_FOUND") {
          setErrorCode("EMPLEADO_NOT_FOUND");
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

  const cargarDocumentos = async () => {
    const token = obtenerToken();
    // Un enlace de CloudNavis puede abrirse sin sesión: en ese caso el modal de
    // login ya lo está pidiendo y no tiene sentido llamar ni avisar de nada.
    if (!token) return;

    setDocumentosLoading(true);
    try {
      const res = await fetch(`${API_URL}/documentos-grupo/lista?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Sin este aviso la tabla se queda vacía sin explicar por qué (p. ej.
        // con la sesión caducada el backend responde 403).
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Tu sesión ha caducado. Vuelve a iniciar sesión."
            : `El servidor respondió ${res.status}`
        );
      }

      const data = await res.json();
      setDocumentos(data.data || []);
    } catch (error) {
      console.error("Error cargando documentos:", error);
      message.error(`No se pudo cargar el historial: ${(error as Error).message}`);
    } finally {
      setDocumentosLoading(false);
    }
  };

  useEffect(() => {
    cargarDocumentos();
  }, []);

  const nombreDe = (r: DocumentoGrupoRecord) =>
    `${r.nombres || ""} ${r.primerApellido || ""} ${r.segundoApellido || ""}`
      .replace(/\s+/g, " ")
      .trim();

  const mostrarEnlacesFirma = (links: { role: string; link: string }[]) => {
    Modal.info({
      title: "Enlaces de firma",
      width: 640,
      okText: "Cerrar",
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>
            Con este enlace se pueden ver y firmar los tres documentos de una vez,
            sin necesidad de correo ni de crear una cuenta.
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
                    message.success("Enlace copiado");
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

  const descargarPdf = async (record: DocumentoGrupoRecord) => {
    const key = `descarga-${record._id}`;
    message.loading({ content: "Generando PDF...", key });
    try {
      const token = obtenerToken();
      const response = await fetch(
        `${API_URL}/documentos-grupo/${record._id}/descargar`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        const detalle = await response.text();
        throw new Error(`${response.status} — ${detalle.slice(0, 200)}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `documentos-${nombreDe(record) || record._id}.pdf`;
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

  const eliminarDocumento = (record: DocumentoGrupoRecord) => {
    Modal.confirm({
      title: "Eliminar documentos",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: (
        <div>
          <p>
            Se eliminarán los documentos de <strong>{nombreDe(record) || "esta persona"}</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            El enlace de firma dejará de funcionar y no se podrá recuperar.
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
            `${API_URL}/documentos-grupo/${record._id}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) throw new Error(`${res.status}`);
          message.success("Documentos eliminados");
          cargarDocumentos();
        } catch (err) {
          console.error("Error eliminando documentos:", err);
          message.error("No se pudieron eliminar los documentos");
        }
      },
    });
  };

  const handleRetryFetch = () => {
    const params = new URLSearchParams(window.location.search);
    const idEmpleado = params.get("idEmpleado");
    const token = params.get("token");

    if (idEmpleado && token) {
      setErrorCode(null);
      window.location.reload();
    }
  };

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    message.loading({ content: "Enviando documentos...", key: "sending" });

    try {
      const { fechaNacimiento, ...resto } = values;
      const payload = {
        ...resto,
        fechaFirma: formatearFecha(values.fechaFirma, "completa"),
        diaNacimiento: fechaNacimiento?.date(),
        mesNacimiento: fechaNacimiento ? fechaNacimiento.month() + 1 : undefined,
        anioNacimiento: fechaNacimiento?.year(),
      };

      const token = obtenerToken();
      const response = await fetch(
        `${API_URL}/documentos-grupo/crear`,
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

        message.success("✓ Documentos generados correctamente");
        cargarDocumentos();
        setTimeout(() => {
          Modal.success({
            title: "¡Documentos Generados Correctamente!",
            icon: <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 48 }} />,
            width: 640,
            content: (
              <div>
                <p style={{ marginBottom: 12 }}>
                  Se han generado los tres modelos (FR103, TA1 y FR con CCC) en un único
                  documento. Comparte este enlace para que se firme; no hace falta correo.
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
                          message.success("Enlace copiado");
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
            okText: "Cerrar",
            onOk: () => {
              form.resetFields();
              cargarDocumentos();
            },
          });
        }, 500);
      } else {
        // El backend explica en qué etapa falló; mostrarlo evita confundir un
        // error del servidor con un campo del formulario sin rellenar.
        const detalle = await response
          .json()
          .then((d) => d?.message || d?.error)
          .catch(() => null);

        message.error("Error al enviar documentos");
        Modal.error({
          title: "Error al Enviar el Formulario",
          icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: 48 }} />,
          content: (
            <div>
              <p style={{ marginBottom: 8 }}>
                Hubo un problema al generar los documentos ({response.status}).
              </p>
              {detalle && (
                <p style={{ marginBottom: 8 }}>
                  <Text code>{detalle}</Text>
                </p>
              )}
              <p style={{ marginBottom: 0 }}>
                Si el mensaje menciona una etapa del servidor, avisa al equipo técnico.
              </p>
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
      <LoginRequeridoModal
        abierto={!haySesion}
        onSesionIniciada={() => {
          marcarSesionIniciada();
          // El historial no se pudo cargar sin sesión; ahora sí.
          cargarDocumentos();
        }}
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
                  <Form.Item label="Fecha de Nacimiento" name="fechaNacimiento">
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      placeholder="DD/MM/AAAA"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Documento" style={{ marginBottom: 0 }}>
                    <Space.Compact style={{ width: "100%" }}>
                      <Form.Item name="tipoDocumento" noStyle>
                        <Select style={{ width: "35%" }} placeholder="Tipo">
                          <Select.Option value="dni">DNI</Select.Option>
                          <Select.Option value="nie">NIE</Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item name="numeroDocumento" noStyle>
                        <Input style={{ width: "65%" }} placeholder="Ej. 12345678" />
                      </Form.Item>
                    </Space.Compact>
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

            {/* Sección: Contacto y empresa (los piden el TA1, el FR103 y el FR con CCC) */}
            <Card title="Contacto y Empresa" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Correo Electrónico"
                    name="correo"
                    tooltip="Aparece en el modelo TA1"
                    rules={[{ type: "email", message: "Ingresa un correo válido" }]}
                  >
                    <Input placeholder="ejemplo@email.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Teléfono"
                    name="telefono"
                    tooltip="Aparece en el TA1 y en el FR103"
                  >
                    <Input placeholder="Ej. 600111222" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Razón Social del Empleador"
                    name="razonSocial"
                    tooltip="Aparece en el FR con CCC"
                  >
                    <Input placeholder="Ej. CuidoFam SL" />
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

          {/* Historial */}
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
              Historial de Documentos
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={cargarDocumentos}
              loading={documentosLoading}
            >
              Actualizar
            </Button>
          </Space>

          <Card>
            <Spin spinning={documentosLoading}>
              {documentos.length > 0 ? (
                <Table
                  dataSource={documentos}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                  scroll={{ x: 900 }}
                  columns={[
                    {
                      title: "Persona",
                      key: "persona",
                      render: (_, record) => (
                        <Space direction="vertical" size={0}>
                          <Text strong>{nombreDe(record) || "-"}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.numeroDocumento || record.nif}
                          </Text>
                        </Space>
                      ),
                      width: 200,
                    },
                    {
                      title: "Municipio",
                      dataIndex: "municipio",
                      key: "municipio",
                      render: (text) => <Text>{text || "-"}</Text>,
                      width: 130,
                    },
                    {
                      title: "Fecha firma",
                      dataIndex: "fechaFirma",
                      key: "fechaFirma",
                      render: (text) => <Text>{text || "-"}</Text>,
                      width: 140,
                    },
                    {
                      title: "Estado",
                      dataIndex: "status",
                      key: "status",
                      render: (status) => {
                        const mapa: Record<string, React.ReactNode> = {
                          pendiente: <Tag color="default">Pendiente</Tag>,
                          campos_llenados: <Tag color="processing">Generado</Tag>,
                          invitacion_enviada: <Tag color="blue">Pendiente de firma</Tag>,
                          firmando: <Tag color="cyan">Firmando</Tag>,
                          firmado: <Tag color="success">✓ Firmado</Tag>,
                          error: <Tag color="error">Error</Tag>,
                        };
                        return mapa[status] || <Tag>{status}</Tag>;
                      },
                      width: 150,
                    },
                    {
                      title: "Creado",
                      dataIndex: "createdAt",
                      key: "createdAt",
                      render: (date) =>
                        date
                          ? new Date(date).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-",
                      width: 140,
                    },
                    {
                      title: "Acciones",
                      key: "acciones",
                      render: (_, record) => (
                        <Space>
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
                            onClick={() => eliminarDocumento(record)}
                          >
                            Eliminar
                          </Button>
                        </Space>
                      ),
                      width: 260,
                    },
                  ]}
                />
              ) : (
                <Empty description="No hay documentos registrados" style={{ paddingTop: 20 }} />
              )}
            </Spin>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
