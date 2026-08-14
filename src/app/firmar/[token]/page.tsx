"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Result,
  Space,
  Spin,
  Typography,
  message,
  Descriptions,
  Alert,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";

const { Title, Text } = Typography;

const API_BASE = "http://localhost:3001/api/v1/firma";

interface FirmaInfo {
  tipo: "finiquito" | "contrato";
  titulo: string;
  role: string;
  firmado: boolean;
  firmadoAt?: string;
  trabajador?: string;
  empleador?: string;
  fecha?: string;
  importe?: string;
  etiquetaImporte?: string;
  documentoCompleto: boolean;
}

export default function FirmarPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [info, setInfo] = useState<FirmaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firmado, setFirmado] = useState(false);
  const [hayTrazo, setHayTrazo] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dibujando = useRef(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.message || "El enlace no es válido");
        } else {
          setInfo(data.data);
          setFirmado(data.data.firmado);
        }
      } catch {
        setError("No se pudo conectar con el servidor");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // El PDF vive en otro origen (el backend), así que la CSP no permite
  // incrustarlo directamente: lo descargamos y lo mostramos como blob:.
  const cargarDocumento = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/${token}/documento`);
      if (!res.ok) return;
      const blob = await res.blob();
      setDocUrl((anterior) => {
        if (anterior) window.URL.revokeObjectURL(anterior);
        return window.URL.createObjectURL(blob);
      });
    } catch {
      // Si falla, simplemente no se muestra la vista previa
    }
  }, [token]);

  useEffect(() => {
    cargarDocumento();
  }, [cargarDocumento]);

  useEffect(() => {
    return () => {
      if (docUrl) window.URL.revokeObjectURL(docUrl);
    };
    // Solo al desmontar: revocamos la última URL creada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El canvas se dimensiona en píxeles reales para que la firma no salga borrosa
  const prepararCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const ancho = canvas.offsetWidth;
    const alto = canvas.offsetHeight;
    canvas.width = ancho * ratio;
    canvas.height = alto * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
  }, []);

  useEffect(() => {
    if (!loading && !firmado && !error) prepararCanvas();
  }, [loading, firmado, error, prepararCanvas]);

  const posicion = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dibujando.current = true;
    const { x, y } = posicion(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = posicion(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHayTrazo(true);
  };

  const onPointerUp = () => {
    dibujando.current = false;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHayTrazo(false);
  };

  const enviarFirma = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hayTrazo) {
      message.warning("Dibuja tu firma antes de continuar");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firma: canvas.toDataURL("image/png") }),
      });
      const data = await res.json();

      if (res.ok) {
        setFirmado(true);
        message.success("Firma registrada correctamente");
        // Volvemos a pedir el PDF para que se vea ya con la firma estampada
        cargarDocumento();
      } else {
        message.error(data?.message || "No se pudo registrar la firma");
      }
    } catch {
      message.error("No se pudo conectar con el servidor");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <Result status="404" title="Enlace no válido" subTitle={error} />
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f8ff", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Title level={3}>Firma del {info?.titulo || "Documento"}</Title>
        <Text type="secondary">
          Firmas como <strong>{info?.role}</strong>
        </Text>

        <Card style={{ marginTop: 16, marginBottom: 16 }}>
          <Descriptions
            column={1}
            size="small"
            items={[
              { key: "trabajador", label: "Trabajadora", children: info?.trabajador || "-" },
              { key: "empleador", label: "Empleador", children: info?.empleador || "-" },
              { key: "fecha", label: "Fecha", children: info?.fecha || "-" },
              {
                key: "importe",
                label: info?.etiquetaImporte || "Importe",
                children: info?.importe ? `${info.importe}€` : "-",
              },
            ]}
          />
        </Card>

        <Card
          title="Documento"
          style={{ marginBottom: 16 }}
          extra={
            docUrl && (
              <Button size="small" onClick={() => window.open(docUrl, "_blank")}>
                Abrir en pestaña nueva
              </Button>
            )
          }
        >
          {docUrl ? (
            <iframe
              src={docUrl}
              style={{ width: "100%", height: 600, border: "1px solid #f0f0f0" }}
              title="Documento de finiquito"
            />
          ) : (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Spin />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">Cargando documento...</Text>
              </div>
            </div>
          )}
        </Card>

        {firmado ? (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            title="¡Documento firmado!"
            subTitle={
              info?.documentoCompleto
                ? "Ambas partes han firmado. El documento está completo."
                : "Tu firma quedó registrada. Falta que firme la otra parte."
            }
          />
        ) : (
          <Card title="Dibuja tu firma">
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="Dibuja tu firma con el ratón o con el dedo dentro del recuadro."
            />
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              style={{
                width: "100%",
                height: 180,
                border: "1px dashed #bfbfbf",
                borderRadius: 6,
                background: "#fff",
                touchAction: "none",
                cursor: "crosshair",
              }}
            />
            <Space style={{ marginTop: 12 }}>
              <Button type="primary" loading={enviando} onClick={enviarFirma}>
                Firmar documento
              </Button>
              <Button onClick={limpiar} disabled={enviando}>
                Limpiar
              </Button>
            </Space>
          </Card>
        )}
      </div>
    </div>
  );
}
