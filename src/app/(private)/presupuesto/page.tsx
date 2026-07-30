"use client";

import React, {  useState } from "react";
import { Table } from "antd";
import { PlusOutlined,  DownloadOutlined, CalculatorOutlined } from '@ant-design/icons';
import api from "@/lib/axios";
import {
  Card,
  Form,
  InputNumber,
  Button,
  Flex,
  Typography,
  Input,
  Space,
  Select,
  Checkbox,
  Row,
  Col,
  TimePicker,
  message,
  Divider,
} from "antd";
const { Title, Text } = Typography;

const DashboardPage = () => {
  const [form] = Form.useForm();
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [enviarWhatsApp, setEnviarWhatsApp] = useState(false);
  const [numeroWhatsApp, setNumeroWhatsApp] = useState("");
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [whatsappProgress, setWhatsappProgress] = useState(0);
  const [trackingStatus, setTrackingStatus] = useState<"idle" | "sending" | "tracking" | "delivered" | "failed" | "timeout">("idle");
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingError, setTrackingError] = useState<string>("");
  // Definir tipo para resultados
  type ResultadosType = {
    sueldoNeto: number;
    cuotaCuidoFam: number;
    seguridadSocial: number;
    totalEmpleador: number;
  } | null;

  const [resultadosActuales, setResultadosActuales] = useState<ResultadosType>(null);
  // Definir tipo para presupuestos
  type PresupuestoType = {
    id: number;
    resultados: {
      sueldoNeto: number;
      cuotaCuidoFam: number;
      seguridadSocial: number;
      totalEmpleador: number;
    };
  };

  const [presupuestos, setPresupuestos] = useState<PresupuestoType[]>([]);
  // Definir tipo para desgloses - sólo valores string para los inputs
  const [desgloses, setDesgloses] = useState<Record<number, string>>({});
  const [mensajesPresupuesto, setMensajesPresupuestos] = useState<Record<number, string>>({});
  const [mensajesActivacion, setMensajesActivacion] = useState<Record<number, string>>({});

  //VARIABLES INPUT
  const [precioHora, setPrecioHora] = useState(8.3);
  const [diasTrabajo, setDiasTrabajo] = useState(5);
  const [horasDia, setHorasDia] = useState(8);
  const [semanasAlMes, setSemanasAlMes] = useState(4);
  const [salarioNetoManual, setSalarioNetoManual] = useState(0);
  const [precioServicio, setPrecioServicio] = useState(0);
  const [cuotaActivacion, setCuotaActivacion] = useState(149);

  //Variables de resultados
  const [horasTotalesMensuales, setHorasTotalesMensuales] = useState(0);
  const [salarioNetoMensual, setSalarioNetoMensual] = useState(0);
  const [tramoSalarial, setTramoSalarial] = useState(0);
  const [baseCotizacion, setBaseCotizacion] = useState(0);
  const [cotizacionesEmpleados, setCotizacionesEmpleados] = useState(0);
  const [contingenciasComunes, setContingenciasComunes] = useState(0);
  const [desempleo, setDesempleo] = useState(0);
  const [formacionProfesional, setFormacionProfesional] = useState(0);
  const [salarioBrutoMensual, setBrutoMensual] = useState(0);
  const [cotizacionEmpleador, setCotizacionEmpleador] = useState(0);
  const [cotizacionTotal, setCotizacionTotal] = useState(0);
  const [ivaPrecioServicio, setIvaPrecioServicio] = useState(0);
  const [costeTotalEmpleador, setCosteTortalEmpleador] = useState(0);

  const columns = [
    {
      title: "Tramo",
      dataIndex: "tramo",
      key: "tramo",
    },
    {
      title: "Retribucion Mensual",
      dataIndex: "retribucionMensual",
      key: "retribucionMensual",
    },
    {
      title: "Base Cotizacion",
      dataIndex: "baseCotizacion",
      key: "baseCotizacion",
    },
    {
      title: "Empleador 23,63%",
      dataIndex: "empleador2360",
      key: "empleador2360",
    },
    {
      title: "Empleado 6,37%",
      dataIndex: "empleado637",
      key: "empleado637",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
    },
  ];

  const dataSource = [
    {
      key: "1",
      tramo: "1º",
      retribucionMensual: "0,001€ - 329€/mes",
      baseCotizacion: "305.00€",
      empleador2360: "71.98€",
      empleado637: "14.34€",
      total: "86.83€",
    },
    {
      key: "2",
      tramo: "2º",
      retribucionMensual: "329.01€ - 510€/mes",
      baseCotizacion: "436.00€",
      empleador2360: "102.90€",
      empleado637: "20.49€",
      total: "124.13€",
    },
    {
      key: "3",
      tramo: "3º",
      retribucionMensual: "510.01€ - 693€/mes",
      baseCotizacion: "602.00€",
      empleador2360: "142.07€",
      empleado637: "28.29€",
      total: "171.39€",
    },
    {
      key: "4",
      tramo: "4º",
      retribucionMensual: "693.01€ - 876€/mes",
      baseCotizacion: "785.00€",
      empleador2360: "185.26€",
      empleado637: "36.90€",
      total: "223.49€",
    },
    {
      key: "5",
      tramo: "5º",
      retribucionMensual: "876.01€ - 1061€/mes",
      baseCotizacion: "970.00€",
      empleador2360: "228.92€",
      empleado637: "45.59€",
      total: "276.16€",
    },
    {
      key: "6",
      tramo: "6º",
      retribucionMensual: "1061.01€ - 1241€/mes",
      baseCotizacion: "1.151.00€",
      empleador2360: "271.64€",
      empleado637: "54.10€",
      total: "327.69€",
    },
    {
      key: "7",
      tramo: "7º",
      retribucionMensual: "1241.01€ - 1424.50€/mes",
      baseCotizacion: "1.424.50€",
      empleador2360: "336.18€",
      empleado637: "66.95€",
      total: "405.56€",
    },
    {
      key: "8",
      tramo: "8º",
      retribucionMensual: "1424.50€ en adelante",
      baseCotizacion: "1.424.50€",
      empleador2360: "336.18€",
      empleado637: "66.95€",
      total: "-€",
    },
  ];

  const calculateData = () => {
    const totalHoras = diasTrabajo * horasDia * semanasAlMes;
    setHorasTotalesMensuales(totalHoras);

    // Usar salarioNetoManual si se proporciona, sino calcular desde precioHora
    const netoMensual = salarioNetoManual > 0 ? salarioNetoManual : precioHora * totalHoras;
    setSalarioNetoMensual(netoMensual);

    const valoresTabla = determinarTramo(netoMensual);
    setTramoSalarial(valoresTabla.tramo);
    setBaseCotizacion(valoresTabla.baseCotizacion);

    // Calcular cotizaciones del empleado desglosadas
    const contingenciasComunesCalc = valoresTabla.baseCotizacion * 0.047;
    const desempleoCalc = valoresTabla.baseCotizacion * 0.0155;
    const formacionProfesionalCalc = valoresTabla.baseCotizacion * 0.0012;
    const cotizacionesEmpleadosCalc = valoresTabla.baseCotizacion * 0.0637;

    setContingenciasComunes(contingenciasComunesCalc);
    setDesempleo(desempleoCalc);
    setFormacionProfesional(formacionProfesionalCalc);
    setCotizacionesEmpleados(cotizacionesEmpleadosCalc);

    const salarioBruto = netoMensual + cotizacionesEmpleadosCalc;
    setBrutoMensual(salarioBruto);

    setCotizacionEmpleador(valoresTabla.empleador);
    setCotizacionTotal(valoresTabla.total);

    const precioIvaDescuento = precioServicio * 0.21;
    setIvaPrecioServicio(precioIvaDescuento);

    const ivaActivacion = cuotaActivacion * 0.21;

    const costeTotalEmpleador =
      netoMensual + valoresTabla.total + (precioServicio + precioIvaDescuento);
    setCosteTortalEmpleador(costeTotalEmpleador);

    const resultadosFinales = {
      sueldoNeto: Number(netoMensual.toFixed(2)),
      cuotaCuidoFam: Number((precioServicio + precioIvaDescuento).toFixed(2)),
      seguridadSocial: Number(valoresTabla.total.toFixed(2)),
      totalEmpleador: Number(costeTotalEmpleador.toFixed(2)),
      cuotaActivacion: Number(cuotaActivacion.toFixed(2)),
      ivaActivacion: Number(ivaActivacion.toFixed(2)),
      cuotaActivacionConIva: Number((cuotaActivacion + ivaActivacion).toFixed(2)),
    };

    setResultadosActuales(resultadosFinales);
  };

  const agregarPresupuesto = () => {
    if (!resultadosActuales) {
      message.error("Primero debes calcular los resultados");
      return;
    }

    const nuevoPresupuesto = {
      id: Date.now(),
      resultados: resultadosActuales,
    };

    setPresupuestos([...presupuestos, nuevoPresupuesto]);
    limpiarFormulario();
  };

  const limpiarFormulario = () => {
    setResultadosActuales(null);
    setHorasTotalesMensuales(0);
    setSalarioNetoMensual(0);
    setBaseCotizacion(0);
    setTramoSalarial(0);
    setCotizacionesEmpleados(0);
    setContingenciasComunes(0);
    setDesempleo(0);
    setFormacionProfesional(0);
    setBrutoMensual(0);
    setCotizacionEmpleador(0);
    setCotizacionTotal(0);
    setIvaPrecioServicio(0);
    setCosteTortalEmpleador(0);
    setCuotaActivacion(149);
  };

  const determinarTramo = (salario: number) => {
    if (salario >= 0.001 && salario <= 329) {
      return {
        tramo: 1,
        baseCotizacion: 305.0,
        empleador: 71.98,
        empleado: 14.34,
        total: 86.83,
      };
    } else if (salario >= 329.01 && salario <= 510) {
      return {
        tramo: 2,
        baseCotizacion: 436.0,
        empleador: 102.90,
        empleado: 20.49,
        total: 124.13,
      };
    } else if (salario >= 510.01 && salario <= 693) {
      return {
        tramo: 3,
        baseCotizacion: 602.0,
        empleador: 142.07,
        empleado: 28.29,
        total: 171.39,
      };
    } else if (salario >= 693.01 && salario <= 876) {
      return {
        tramo: 4,
        baseCotizacion: 785.0,
        empleador: 185.26,
        empleado: 36.90,
        total: 223.49,
      };
    } else if (salario >= 876.01 && salario <= 1061) {
      return {
        tramo: 5,
        baseCotizacion: 970.0,
        empleador: 228.92,
        empleado: 45.59,
        total: 276.16,
      };
    } else if (salario >= 1061.01 && salario <= 1241) {
      return {
        tramo: 6,
        baseCotizacion: 1151.0,
        empleador: 271.64,
        empleado: 54.10,
        total: 327.69,
      };
    } else if (salario >= 1241.01 && salario <= 1424.50) {
      return {
        tramo: 7,
        baseCotizacion: 1424.50,
        empleador: 336.18,
        empleado: 66.95,
        total: 405.56,
      };
    } else {
      return {
        tramo: 8,
        baseCotizacion: 1424.50,
        empleador: 336.18,
        empleado: 66.95,
        total: 405.56,
      };
    }
  };

  // ---------------- Horarios: helpers y validación ----------------

  return (
    <div style={{ background: "#f5f8ff", minHeight: "100vh", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: "24px 24px 0" }}>
        <Space align="center" style={{ margin: "0 0 16px 0" }}>
          <CalculatorOutlined style={{ fontSize: 28, color: "#6366f2" }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>Calculadora de Sueldos</Title>
            <Text type="secondary">Convenio Empleadas de Hogar</Text>
          </div>
        </Space>

        <div style={{ marginBottom: 24 }}>
          <Button type="primary" size="large">
            Calcular desde precio/hora
          </Button>
        </div>

        <Flex gap={24} align="flex-start">
          {/* Columna Izquierda - Formulario */}
          <Card style={{ flex: 1, maxWidth: 550 }}>
            {/*Calculadora */}
            <Card>
              <Flex vertical gap={16}>
                <div>
                  <Text>Precio por hora (€)</Text>
                  <InputNumber
                    style={{ width: "100%", marginTop: 8 }}
                    min={0}
                    step={0.1}
                    value={precioHora}
                    onChange={(value) => setPrecioHora(value || 0)}
                  />
                </div>

                <div>
                  <Text>Días de trabajo a la semana</Text>
                  <InputNumber
                    style={{ width: "100%", marginTop: 8 }}
                    min={0}
                    max={7}
                    step={1}
                    value={diasTrabajo}
                    onChange={(value) => setDiasTrabajo(value || 0)}
                  />
                </div>

                <div>
                  <Text>Horas de trabajo al día</Text>
                  <InputNumber
                    style={{ width: "100%", marginTop: 8 }}
                    min={0}
                    max={24}
                    step={1}
                    precision={0}
                    value={horasDia}
                    onChange={(value) => setHorasDia(value || 0)}
                  />
                </div>

                <div>
                  <Text>Semanas al mes</Text>
                  <InputNumber
                    style={{ width: "100%", marginTop: 8 }}
                    min={0}
                    max={5}
                    step={1}
                    precision={0}
                    value={semanasAlMes}
                    onChange={(value) => setSemanasAlMes(value || 0)}
                  />
                </div>

                <div>
                  <Text>Salario Neto Manual (€)</Text>
                  <InputNumber
                    style={{ width: "100%", marginTop: 8 }}
                    placeholder="Introduce el salario neto manualmente"
                    min={0}
                    step={0.1}
                    value={salarioNetoManual}
                    onChange={(value) => setSalarioNetoManual(value || 0)}
                  />
                </div>

                <div>
                  <Text>Precio de tu servicio (€)</Text>
                  <InputNumber
                    style={{ width: "100%", marginTop: 8 }}
                    min={0}
                    step={0.1}
                    value={precioServicio}
                    onChange={(value) => setPrecioServicio(value || 0)}
                  />
                </div>

                <div>
                  <Text>Cuota de Activación (€) - Por defecto 149€</Text>
                  <InputNumber
                    style={{ width: "100%", marginTop: 8 }}
                    min={0}
                    step={0.1}
                    value={cuotaActivacion}
                    onChange={(value) => setCuotaActivacion(value || 149)}
                  />
                  <Text type="secondary" style={{ fontSize: "12px", marginTop: "4px", display: "block" }}>
                    IVA 21%: {(cuotaActivacion * 0.21).toFixed(2)}€ | Total: {(cuotaActivacion + cuotaActivacion * 0.21).toFixed(2)}€
                  </Text>
                </div>

                <Space>
                  <Button
                    style={{
                      background: "#6366f2",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                    size="large"
                    onClick={calculateData}
                  >
                    Calcular
                  </Button>

                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={agregarPresupuesto}
                    disabled={!resultadosActuales}
                  >
                    {"Agregar Presupuesto"}
                  </Button>
                </Space>
              </Flex>
            </Card>

            {presupuestos.length > 0 && (
              <Card
                title={`Presupuestos Agregados (${presupuestos.length})`}
                style={{ marginBottom: 16, marginTop: 10 }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {presupuestos.map((p, index) => (
                    <Card
                      key={p.id}
                      size="small"
                      style={{ background: "#f5f5f5" }}
                    >
                      <Text strong>Presupuesto {index + 1}</Text>
                      <br />
                      <Text type="secondary">
                        Cuota CuidoFam: {p.resultados.cuotaCuidoFam.toFixed(2)}€
                      </Text>
                      <br />
                      <Text type="secondary">
                        Salario Neto: {p.resultados.sueldoNeto.toFixed(2)}€
                      </Text>
                      <br />
                      <Text type="secondary">
                        Seguridad Social:{" "}
                        {p.resultados.seguridadSocial.toFixed(2)}€
                      </Text>
                      <br />
                      <Text strong>
                        Coste Total: {p.resultados.totalEmpleador.toFixed(2)}€
                      </Text>
                    </Card>
                  ))}
                </Space>
              </Card>
            )}

            {/*Formulario*/}
            <Card style={{ margin: "10px 0", background: "#f5f5f5" }}>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  considerationOne: "Salario según SMI (Salario Mínimo Interprofesional La cuota de la Seguridad Social y el SMI segun legislación)",
                  considerationTwo: "Pagas Prorrateadas Incluidas. Vacaciones NO incluidas.",
                  considerationThree: "Relalizacion de altas, bajas, contratos, nominas. Festivos NO incluidos",
                }}
                onFinish={async (values) => {
                  try {
                    // Validar campos requeridos
                    if (!values.nameContrato?.trim()) {
                      message.error("❌ El nombre del contrato es requerido");
                      return;
                    }

                    if (presupuestos.length === 0) {
                      message.error("❌ Debes agregar al menos un presupuesto");
                      return;
                    }

                    if (enviarWhatsApp && !numeroWhatsApp.trim()) {
                      message.error("❌ Si quieres enviar por WhatsApp, ingresa un número válido");
                      return;
                    }

                    setLoadingPDF(true);
                    message.loading({ content: "📄 Generando PDF...", key: "generating-pdf" });

                    const payload = {
                      ...values,
                      salarioNetoMensual,
                      presupuestos: presupuestos.map((p, index) => ({
                        numero: index + 1,
                        resultados: p.resultados,
                        desglose: desgloses[p.id] || "",
                        mensajesPresupuesto: mensajesPresupuesto[p.id] || "",
                        mensajesActivacion: mensajesActivacion[p.id] || "",
                      })),
                    };
                    console.log("✓ Formulario validado:", payload);

                    const response = await api.post("/generate-pdf", payload, {
                      responseType: "blob", // IMPORTANTE: Para recibir archivos binarios
                    });
                    const blob = new Blob([response.data], {
                      type: "application/pdf",
                    });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `Presupuesto-${
                      values.nameContrato || ""
                    }.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    message.destroy("generating-pdf");
                    message.success("✓ PDF generado correctamente y descargado");

                    // Enviar por WhatsApp si checkbox está marcado
                    if (enviarWhatsApp) {
                      const numLimpio = numeroWhatsApp.replace(/[\s\-\(\)]/g, "");
                      const isValidPhone = /^(\+\d{1,3})?\d{8,14}$/.test(numLimpio) && numLimpio.length >= 9;

                      if (!numeroWhatsApp.trim()) {
                        message.error("❌ Por favor ingresa un número de WhatsApp");
                        return;
                      }

                      if (!isValidPhone) {
                        message.error("❌ Número de WhatsApp inválido. Verifica el formato");
                        return;
                      }

                      try {
                        setLoadingWhatsApp(true);
                        setTrackingStatus("sending");
                        setWhatsappProgress(10);
                        setTrackingError("");
                        setTrackingData({
                          nombreCliente: values.nameContrato,
                          numeroDestino: numeroWhatsApp,
                          presupuestosCount: presupuestos.length,
                          fechaEnvio: new Date().toLocaleString("es-ES"),
                        });

                        const whatsappResponse = await api.post("/quotes", {
                          ...payload,
                          numeroWhatsApp: numLimpio,
                        });

                        if (whatsappResponse.data.success) {
                          const messageId = whatsappResponse.data.messageId;
                          setTrackingStatus("tracking");
                          setWhatsappProgress(25);

                          // Polling para monitorear estado del mensaje (máx 1 minuto)
                          let attempts = 0;
                          const maxAttempts = 12; // 12 * 5 segundos = 60 segundos
                          const pollInterval = setInterval(async () => {
                            attempts++;
                            const progressIncrement = (75 / maxAttempts);
                            setWhatsappProgress(prev => Math.min(prev + progressIncrement, 95));

                            try {
                              const statusResponse = await api.get(
                                `/quotes/${messageId}/status`
                              );

                              if (statusResponse.data.success) {
                                const status = statusResponse.data.status;

                                if (status === "delivered") {
                                  setWhatsappProgress(100);
                                  setTrackingStatus("delivered");
                                  clearInterval(pollInterval);
                                  setTimeout(() => setLoadingWhatsApp(false), 2000);
                                } else if (status === "sent") {
                                  setTrackingStatus("tracking");
                                } else if (
                                  status === "failed" ||
                                  statusResponse.data.errorCode
                                ) {
                                  setTrackingStatus("failed");
                                  setTrackingError(statusResponse.data.errorMessage || "Error desconocido");
                                  clearInterval(pollInterval);
                                  setTimeout(() => setLoadingWhatsApp(false), 2000);
                                }

                                if (attempts >= maxAttempts) {
                                  setTrackingStatus("timeout");
                                  setWhatsappProgress(100);
                                  clearInterval(pollInterval);
                                  setTimeout(() => setLoadingWhatsApp(false), 2000);
                                }
                              }
                            } catch (pollErr) {
                              if (attempts >= maxAttempts) {
                                clearInterval(pollInterval);
                              }
                            }
                          }, 5000); // Polling cada 5 segundos
                        } else {
                          setTrackingStatus("failed");
                          setTrackingError(whatsappResponse.data.error || "Error desconocido");
                          setLoadingWhatsApp(false);
                        }
                      } catch (err: unknown) {
                        const error = err as Error;
                        setTrackingStatus("failed");
                        setTrackingError(error.message || "No se pudo conectar con el servidor");
                        setLoadingWhatsApp(false);
                      }
                    }

                    // Resetear todos los campos solo si el PDF se genera correctamente
                    form.resetFields();
                    setPrecioHora(8.3);
                    setDiasTrabajo(5);
                    setHorasDia(8);
                    setSemanasAlMes(4);
                    setSalarioNetoManual(0);
                    setPrecioServicio(0);
                    setCuotaActivacion(149);

                    setHorasTotalesMensuales(0);
                    setSalarioNetoMensual(0);
                    setTramoSalarial(0);
                    setBaseCotizacion(0);
                    setCotizacionesEmpleados(0);
                    setContingenciasComunes(0);
                    setDesempleo(0);
                    setFormacionProfesional(0);
                    setBrutoMensual(0);
                    setCotizacionEmpleador(0);
                    setCotizacionTotal(0);
                    setIvaPrecioServicio(0);
                    setCosteTortalEmpleador(0);
                    setPresupuestos([]);
                    setDesgloses({});
                    setEnviarWhatsApp(false);
                    setNumeroWhatsApp("");
                  } catch (err: unknown) {
                    const error = err as Error;
                    message.destroy("generating-pdf");
                    message.error(`Error al generar PDF: ${error.message || "Revisa los horarios seleccionados."}`);
                  } finally {
                    setLoadingPDF(false);
                  }
                }}
              >
                <Divider>Formulario</Divider>
                <>
                  <Form.Item
                    label="Nombre de la persona que hace el contrato "
                    name="nameContrato"
                    rules={[{ required: true,message:"*Campo Obligatorio"}]}
                  >
                    <Input type="text" style={{ width: "100%" }} step={1} />
                  </Form.Item>
                </>
                 <Form.Item
                    label="Complemento Titulo "
                    name="titleComplement"
                  >
                    <Input type="text" style={{ width: "100%" }} step={1} value={""} />
                  </Form.Item>
                <Form.Item label="Nombre del Pueblo" name="NombrePueblo" rules={[{ required: true,message:"*Campo Obligatorio"}]}>
                  <Input
                    type="text"
                    style={{ width: "100%" }}
                    min={0}
                    max={7}
                    step={1}
                  />
                </Form.Item>
                <Form.Item name="Servicio" label="Provincia del Servicio" rules={[{ required: true,message:"*Campo Obligatorio"}]}>
                  <Select
                    placeholder=""
                    options={[
                      { value: "Vizcaya", label: "Vizcaya" },
                      { value: "Cantabria", label: "Cantabria" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="TipoServicio" label="Tipo de Servicio" rules={[{ required: true,message:"*Campo Obligatorio"}]}>
                  <Select
                    mode="multiple"
                    options={[
                      { value: "0", label: "--" },
                      { value: "Externa", label: "Externa" },
                      { value: "Interna", label: "Interna" },
                      {
                        value: "Externa Fin Semana",
                        label: "Externa Fin Semana",
                      },
                      {
                        value: "Interna Fin Semana",
                        label: "Interna Fin Semana",
                      },
                    ]}
                  />
                </Form.Item>
                <Divider>Consideraciones adicionales</Divider>
                <Form.Item
                    label="Consideracion 1 "
                    name="considerationOne"
                  >
                    <Input.TextArea style={{ width: "100%" }} rows={3} />
                  </Form.Item>
                  <Form.Item
                    label="Consideracion 2 "
                    name="considerationTwo"
                  >
                    <Input.TextArea style={{ width: "100%" }} rows={3} />
                  </Form.Item>
                  <Form.Item
                    label="Consideracion 3"
                    name="considerationThree"
                  >
                    <Input.TextArea style={{ width: "100%" }} rows={3} />
                  </Form.Item>

                <Divider>Desgloses de Presupuestos</Divider>

                {presupuestos.map((p, index) => (
                  <div key={p.id}>
                    <Text>Desglose del Presupuesto {index + 1}</Text>
                    <Input
                      style={{ marginTop: 8 }}
                      placeholder={`Describe el presupuesto ${index + 1}`}
                      value={desgloses[p.id] || ""}
                      onChange={(e) =>
                        setDesgloses({
                          ...desgloses,
                          [p.id]: e.target.value,
                        })
                      }
                    />

                    <Text>Complemento Desgloce Presupuesto {index + 1}</Text>
                    <Input
                      style={{ marginTop: 8 }}
                      placeholder={`Describe el Complemento del presupuesto ${index + 1}`}
                      value={mensajesPresupuesto[p.id] || ""}
                      onChange={(e) =>
                        setMensajesPresupuestos({
                          ...mensajesPresupuesto,
                          [p.id]: e.target.value,
                        })
                      } 
                    />
                    <Text>Complemento Activacion Presupuesto {index + 1}</Text>
                    <Input
                      style={{ marginTop: 8 }}
                      placeholder={`Describe el complemento de la  Activacion ${index + 1}`}
                      value={mensajesActivacion[p.id] || ""}
                      onChange={(e) =>
                        setMensajesActivacion({
                          ...mensajesActivacion,
                          [p.id]: e.target.value,
                        })
                      }
                      />
                  <Divider></Divider>
                  </div>
                ))}

                {/* Sección: Enviar por WhatsApp */}
                <Card
                  style={{
                    margin: "20px 0",
                    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                    border: "2px solid #e0e7ff",
                    borderRadius: "12px"
                  }}
                >
                  <Form.Item name="enviarWhatsApp" valuePropName="checked">
                    <Checkbox
                      onChange={(e) => {
                        setEnviarWhatsApp(e.target.checked);
                        if (!e.target.checked) setNumeroWhatsApp("");
                      }}
                      style={{ fontSize: "16px", fontWeight: "600" }}
                    >
                      📱 Enviar presupuesto por WhatsApp
                    </Checkbox>
                  </Form.Item>

                  {enviarWhatsApp && (
                    <Space direction="vertical" style={{ width: "100%", marginTop: "16px" }} size="large">
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item
                            label={<span style={{ fontWeight: "600", color: "#1f2937" }}>Código país</span>}
                            name="codigoWhatsApp"
                            initialValue="+34"
                          >
                            <Select
                              options={[
                                { label: "🇪🇸 +34", value: "+34" },
                                { label: "🇻🇪 +58", value: "+58" },
                                { label: "🇨🇴 +57", value: "+57" },
                                { label: "🇦🇷 +54", value: "+54" },
                                { label: "🇲🇽 +52", value: "+52" },
                                { label: "🇨🇱 +56", value: "+56" },
                                { label: "🇵🇪 +51", value: "+51" },
                                { label: "🇪🇨 +593", value: "+593" },
                                { label: "🇧🇴 +591", value: "+591" },
                                { label: "🇵🇾 +595", value: "+595" },
                                { label: "🇺🇾 +598", value: "+598" },
                                { label: "🇧🇷 +55", value: "+55" },
                                { label: "🇵🇦 +507", value: "+507" },
                                { label: "🇨🇷 +506", value: "+506" },
                                { label: "🇬🇹 +502", value: "+502" },
                                { label: "🇸🇻 +503", value: "+503" },
                                { label: "🇭🇳 +504", value: "+504" },
                                { label: "🇳🇮 +505", value: "+505" },
                                { label: "🇨🇺 +53", value: "+53" },
                                { label: "🇫🇷 +33", value: "+33" },
                                { label: "🇵🇹 +351", value: "+351" },
                                { label: "🇮🇹 +39", value: "+39" },
                                { label: "🇩🇪 +49", value: "+49" },
                                { label: "🇬🇧 +44", value: "+44" },
                                { label: "🇺🇸/🇨🇦/🇩🇴 +1", value: "+1" },
                              ]}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={16}>
                          <Form.Item
                            label={<span style={{ fontWeight: "600", color: "#1f2937" }}>Número</span>}
                            name="numeroWhatsApp"
                            rules={[
                              {
                                required: enviarWhatsApp,
                                message: "Número requerido",
                              },
                              {
                                validator: (_, value) => {
                                  if (!value) return Promise.resolve();
                                  const cleanNum = value.replace(/[\s\-\(\)]/g, "");
                                  if (!/^\d{8,14}$/.test(cleanNum)) {
                                    return Promise.reject(new Error("8-14 dígitos"));
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <Input
                              type="tel"
                              placeholder="612345678"
                              onChange={(e) => {
                                const codigo = form.getFieldValue("codigoWhatsApp") || "+34";
                                const num = e.target.value.replace(/[\s\-\(\)]/g, "");
                                setNumeroWhatsApp(`${codigo}${num}`);
                              }}
                              style={{
                                padding: "10px 12px",
                                fontSize: "15px",
                                borderRadius: "8px"
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Text type="secondary" style={{ fontSize: "13px", display: "block" }}>
                        ✓ Selecciona el código de tu país y escribe el número
                      </Text>
                    </Space>
                  )}
                </Card>

                <Form.Item>
                  <Button
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      marginTop: "10px",
                    }}
                    disabled={presupuestos.length === 0}
                    icon= {<DownloadOutlined/>}
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loadingPDF}
                  >
                    {loadingPDF ? "Generando PDF..." : "Generar PDF"}
                  </Button>
                </Form.Item>

                {trackingStatus !== "idle" && (
                  <Card
                    style={{
                      marginTop: "20px",
                      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                      border: "2px solid #0ea5e9",
                      borderRadius: "12px",
                    }}
                  >
                    <Flex vertical gap={16}>
                      <div>
                        <Flex justify="space-between" align="center" style={{ marginBottom: "8px" }}>
                          <Text strong style={{ fontSize: "14px" }}>
                            {trackingStatus === "sending" && "📱 Enviando mensaje..."}
                            {trackingStatus === "tracking" && "📱 Rastreando estado..."}
                            {trackingStatus === "delivered" && "✅ Presupuesto entregado"}
                            {trackingStatus === "failed" && "❌ Falló el envío"}
                            {trackingStatus === "timeout" && "⏱️ Timeout - Sin respuesta"}
                          </Text>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            {whatsappProgress}%
                          </Text>
                        </Flex>
                        <div
                          style={{
                            height: "8px",
                            background: "#e0e7ff",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              background:
                                trackingStatus === "delivered"
                                  ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                                  : trackingStatus === "failed"
                                  ? "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)"
                                  : trackingStatus === "timeout"
                                  ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
                                  : "linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%)",
                              width: `${whatsappProgress}%`,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>

                      {trackingData && (
                        <Card size="small" style={{ background: "rgba(255,255,255,0.6)" }}>
                          <Flex vertical gap={8}>
                            <Flex justify="space-between">
                              <Text type="secondary" style={{ fontSize: "12px" }}>
                                Cliente:
                              </Text>
                              <Text strong style={{ fontSize: "12px" }}>
                                {trackingData.nombreCliente}
                              </Text>
                            </Flex>
                            <Flex justify="space-between">
                              <Text type="secondary" style={{ fontSize: "12px" }}>
                                Destino:
                              </Text>
                              <Text strong style={{ fontSize: "12px" }}>
                                {trackingData.numeroDestino}
                              </Text>
                            </Flex>
                            <Flex justify="space-between">
                              <Text type="secondary" style={{ fontSize: "12px" }}>
                                Presupuestos:
                              </Text>
                              <Text strong style={{ fontSize: "12px" }}>
                                {trackingData.presupuestosCount}
                              </Text>
                            </Flex>
                            <Flex justify="space-between">
                              <Text type="secondary" style={{ fontSize: "12px" }}>
                                Enviado:
                              </Text>
                              <Text strong style={{ fontSize: "12px" }}>
                                {trackingData.fechaEnvio}
                              </Text>
                            </Flex>
                          </Flex>
                        </Card>
                      )}

                      {trackingError && (
                        <Card
                          size="small"
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            borderLeft: "4px solid #ef4444",
                          }}
                        >
                          <Text type="danger" style={{ fontSize: "12px" }}>
                            {trackingError}
                          </Text>
                        </Card>
                      )}
                    </Flex>
                  </Card>
                )}
              </Form>
            </Card>
          </Card>

          {/* Columna Derecha - Resultados */}
          <Card title="Resultados" style={{ flex: 1, maxWidth: 550 }}>
            <Flex vertical gap={24}>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Horas totales mensuales</Text>
                <Title level={5} style={{ margin: "0" }}>
                  {horasTotalesMensuales.toFixed(1)} horas
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {`${diasTrabajo} dias x ${horasDia} horas x ${semanasAlMes} semanas = ${horasTotalesMensuales.toFixed(
                    1
                  )} horas`}
                </Text>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Salario neto mensual</Text>
                <Title level={5} style={{ margin: "0" }}>
                  {salarioNetoMensual.toFixed(2)}€
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {salarioNetoManual > 0
                    ? `Salario neto manual: ${salarioNetoMensual.toFixed(2)}€`
                    : `${precioHora}€/hora × ${horasTotalesMensuales.toFixed(
                        1
                      )} horas = ${salarioNetoMensual.toFixed(2)}€`}
                </Text>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Tramo salarial</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  Tramo {tramoSalarial}
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Base de cotización</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  {baseCotizacion.toFixed(2)}€
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Cotizaciones empleado</Text>
                <Title level={5} style={{ margin: "8px 0" }}>
                  {cotizacionesEmpleados.toFixed(2)}€ (6,37%)
                </Title>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <Text type="secondary">
                    Contingencias comunes (4,70%):{" "}
                    {contingenciasComunes.toFixed(2)}€
                  </Text>
                  <br />
                  <Text type="secondary">
                    Desempleo (1,55%): {desempleo.toFixed(2)}€
                  </Text>
                  <br />
                  <Text type="secondary">
                    Formación profesional (0,12%):{" "}
                    {formacionProfesional.toFixed(2)}€
                  </Text>
                </div>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Salario bruto mensual</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  {salarioBrutoMensual.toFixed(2)}€
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {salarioNetoMensual.toFixed(2)}€ (neto) +{" "}
                  {cotizacionesEmpleados.toFixed(2)}€ (cotizacion empleado) ={" "}
                  {salarioBrutoMensual.toFixed(2)}€
                </Text>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Cotizacion empleador(23,60%)</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  {cotizacionEmpleador.toFixed(2)}€
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Cotizacion total</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  {cotizacionTotal.toFixed(2)}€
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Precio por hora</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  {precioHora.toFixed(2)}€/hora
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Precio de tu servicio</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  {precioServicio.toFixed(2)}€
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">IVA (21%)</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  {ivaPrecioServicio.toFixed(2)}€
                </Title>
              </Card>
              <Card size="small" style={{ background: "#e6f4ff", borderLeft: "4px solid #1677ff", borderRadius: 8 }}>
                <Text type="secondary">COSTE TOTAL PARA EL EMPLEADOR</Text>
                <Title level={3} style={{ margin: "4px 0", color: "#1677ff" }}>
                  {costeTotalEmpleador.toFixed(2)}€
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {salarioNetoMensual.toFixed(2)}€ (neto) +{" "}
                  {cotizacionTotal.toFixed(2)}€ (cotización total) +{" "}
                  {(precioServicio + ivaPrecioServicio).toFixed(2)}€
                  (servicio+IVA) = {costeTotalEmpleador.toFixed(2)}€
                </Text>
              </Card>
            </Flex>
          </Card>
        </Flex>

        {/*Tabla de Precios*/}
        <Card style={{ marginTop: "50px" }}>
          <Table
            //style={{ marginTop: "50px" }}
            columns={columns}
            dataSource={dataSource}
            //pagination={{ pageSize: 7 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
