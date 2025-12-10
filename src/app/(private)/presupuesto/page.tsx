"use client";

import React, { useState } from "react";
import { Table } from "antd";
import { PlusOutlined,  DownloadOutlined } from '@ant-design/icons';
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
import PageHeader from "@/components/PageHeader";

const DashboardPage = () => {
  const [form] = Form.useForm();
  const [loadingPDF, setLoadingPDF] = useState(false);
  const diasSeleccionados = Form.useWatch("Dias", form) || [];
  const horarioConvenir = Form.useWatch("horarioConvenir", form) || false;
  type ResultadosType = {
    sueldoNeto: number;
    cuotaCuidoFam: number;
    seguridadSocial: number;
    totalEmpleador: number;
  } | null;

  type PresupuestoType = {
    id: number;
    resultados: ResultadosType;
  };

  const [resultadosActuales, setResultadosActuales] = useState<ResultadosType>(null);
  const [presupuestos, setPresupuestos] = useState<PresupuestoType[]>([]);
  const [desgloses, setDesgloses] = useState<Record<number, string>>({});

  //VARIABLES INPUT
  const [precioHora, setPrecioHora] = useState(0);
  const [diasTrabajo, setDiasTrabajo] = useState(0);
  const [horasDia, setHorasDia] = useState(0);
  const [semanasAlMes, setSemanasAlMes] = useState(0);
  const [salarioNetoManual, setSalarioNetoManual] = useState(0);
  const [precioServicio, setPrecioServicio] = useState(0);

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
      retribucionMensual: "0.001€ - 319€/mes",
      baseCotizacion: "296.00€",
      empleador2360: "69.86€",
      empleado637: "18.86€",
      total: "84.27€",
    },
    {
      key: "2",
      tramo: "2º",
      retribucionMensual: "319.01€ - 495€/mes",
      baseCotizacion: "423.00€",
      empleador2360: "99.83€",
      empleado637: "26.95€",
      total: "120.43€",
    },
    {
      key: "3",
      tramo: "3º",
      retribucionMensual: "495.01€ - 672€/mes",
      baseCotizacion: "584.00€",
      empleador2360: "137.82€",
      empleado637: "37.20€",
      total: "166.26€",
    },
    {
      key: "4",
      tramo: "4º",
      retribucionMensual: "672.01€ - 850€/mes",
      baseCotizacion: "761.00€",
      empleador2360: "179.60€",
      empleado637: "48.48€",
      total: "216.66€",
    },
    {
      key: "5",
      tramo: "5º",
      retribucionMensual: "850.01€ - 1029€/mes",
      baseCotizacion: "941.00€",
      empleador2360: "222.08€",
      empleado637: "59.94€",
      total: "267.90€",
    },
    {
      key: "6",
      tramo: "6º",
      retribucionMensual: "1029.01€ - 1204€/mes",
      baseCotizacion: "1116.00€",
      empleador2360: "263.38€",
      empleado637: "71.09€",
      total: "317.73€",
    },
    {
      key: "7",
      tramo: "7º",
      retribucionMensual: "1204.01€ - 1381.2€/mes",
      baseCotizacion: "1381.20€",
      empleador2360: "325.96€",
      empleado637: "87.99€",
      total: "393.23€",
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

    const costeTotalEmpleador =
      netoMensual + valoresTabla.total + (precioServicio + precioIvaDescuento);
    setCosteTortalEmpleador(costeTotalEmpleador);

    const resultadosFinales = {
      sueldoNeto: Number(netoMensual.toFixed(2)),
      cuotaCuidoFam: Number((precioServicio + precioIvaDescuento).toFixed(2)),
      seguridadSocial: Number(valoresTabla.total.toFixed(2)),
      totalEmpleador: Number(costeTotalEmpleador.toFixed(2)),
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
    /* 
    setPrecioHora(0);
    setDiasTrabajo(0);
    setHorasDia(0);
    setSemanasAlMes(0);
    setSalarioNetoManual(0);
    setPrecioServicio(0); */
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
  };

  const determinarTramo = (salario: number) => {
    if (salario >= 0.001 && salario <= 319) {
      return {
        tramo: 1,
        baseCotizacion: 296.0,
        empleador: 69.86,
        empleado: 18.86,
        total: 84.27,
      };
    } else if (salario >= 319.01 && salario <= 495) {
      return {
        tramo: 2,
        baseCotizacion: 423.0,
        empleador: 99.83,
        empleado: 26.95,
        total: 120.43,
      };
    } else if (salario >= 495.01 && salario <= 672) {
      return {
        tramo: 3,
        baseCotizacion: 584.0,
        empleador: 137.82,
        empleado: 37.2,
        total: 166.26,
      };
    } else if (salario >= 672.01 && salario <= 850) {
      return {
        tramo: 4,
        baseCotizacion: 761.0,
        empleador: 179.6,
        empleado: 48.48,
        total: 216.66,
      };
    } else if (salario >= 850.01 && salario <= 1029) {
      return {
        tramo: 5,
        baseCotizacion: 941.0,
        empleador: 222.08,
        empleado: 59.94,
        total: 267.9,
      };
    } else if (salario >= 1029.01 && salario <= 1204) {
      return {
        tramo: 6,
        baseCotizacion: 1116.0,
        empleador: 263.38,
        empleado: 71.09,
        total: 317.73,
      };
    } else if (salario >= 1204.01 && salario <= 1381.2) {
      return {
        tramo: 7,
        baseCotizacion: 1381.2,
        empleador: 325.96,
        empleado: 87.99,
        total: 393.23,
      };
    } else {
      return {
        tramo: 7,
        baseCotizacion: 1381.2,
        empleador: 325.96,
        empleado: 87.99,
        total: 393.23,
      };
    }
  };

  // ---------------- Horarios: helpers y validación ----------------
  const DIAS = [
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
  ];

  const rangoValido = (range: any) => {
    return (
      Array.isArray(range) &&
      range.length === 2 &&
      range[0] &&
      range[1] &&
      typeof range[0]?.isBefore === "function" &&
      range[0].isBefore(range[1])
    );
  };

  const validarYNormalizarHorarios = (values: any) => {
    const seleccion: string[] = values?.Dias || [];
    if (!Array.isArray(seleccion) || seleccion.length === 0) {
      return {};
    }

    // Modo por-día (si existe 'horarios')
    const horariosPorDia = values?.horarios;
    if (horariosPorDia && typeof horariosPorDia === "object") {
      const salida: Record<string, { inicio: string; fin: string } | null> = {};
      for (const { key } of DIAS) {
        const r = horariosPorDia[key];
        if (seleccion.includes(key)) {
          if (!rangoValido(r)) {
            throw new Error(
              `El día ${key} debe tener un rango válido (inicio < fin).`
            );
          }
          salida[key] = {
            inicio: r[0].format("HH:mm"),
            fin: r[1].format("HH:mm"),
          };
        } else {
          salida[key] = null;
        }
      }
      return salida;
    }

    // Modo global (form actual): inicio/fin únicos
    const inicio = values?.inicio;
    const fin = values?.final;
    if (
      !inicio ||
      !fin ||
      typeof inicio?.isBefore !== "function" ||
      !inicio.isBefore(fin)
    ) {
      throw new Error("Selecciona un horario global válido (inicio < fin).");
    }

    const salidaGlobal: Record<string, { inicio: string; fin: string } | null> =
      {};
    for (const { key } of DIAS) {
      if (seleccion.includes(key)) {
        salidaGlobal[key] = {
          inicio: inicio.format("HH:mm"),
          fin: fin.format("HH:mm"),
        };
      } else {
        salidaGlobal[key] = null;
      }
    }
    return salidaGlobal;
  };

  // Función para normalizar valores decimales
  const normalizarDecimal = (value: string | undefined): string => {
    if (!value || typeof value !== "string") return value || "";
    // Reemplazar comas por puntos
    return value.replace(/,/g, ".");
  };
  // ---------------------------------------------------------------

  return (
    <>
      <PageHeader
        title="Calculadora de Sueldos"
        description="Convenio Empleadas de Hogar"
      />

      <div style={{ padding: 24 }}>
        <Button.Group style={{ marginBottom: 24 }} size="middle">
          <Button type="primary" size="large">
            Calcular desde precio/hora
          </Button>
        </Button.Group>

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
                    step={0.1}
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
                    step={0.5}
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
                        Cuota CuidoFam: {p.resultados?.cuotaCuidoFam?.toFixed(2) || '0.00'}€
                      </Text>
                      <br />
                      <Text type="secondary">
                        Salario Neto: {p.resultados?.sueldoNeto?.toFixed(2) || '0.00'}€
                      </Text>
                      <br />
                      <Text type="secondary">
                        Seguridad Social:{" "}
                        {p.resultados?.seguridadSocial?.toFixed(2) || '0.00'}€
                      </Text>
                      <br />
                      <Text strong>
                        Coste Total: {p.resultados?.totalEmpleador?.toFixed(2) || '0.00'}€
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
                initialValues={{}}
                onFinish={async (values) => {
                  try {
                    setLoadingPDF(true);
                    const horariosNormalizados =
                      validarYNormalizarHorarios(values);
                    const payload = {
                      ...values,
                      horarios: horariosNormalizados,
                      salarioNetoMensual,
                      presupuestos: presupuestos.map((p, index) => ({
                        numero: index + 1,
                        resultados: p.resultados,
                        desglose: desgloses[p.id] || "",
                      })),
                      Dias: values.Dias || [],
                    };
                    //console.log("Formulario OK:", payload);

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
                    setLoadingPDF(false);
                    message.success("PDF generado correctamente");

                    // Resetear todos los campos solo si el PDF se genera correctamente
                    form.resetFields();
                    setPrecioHora(0);
                    setDiasTrabajo(0);
                    setHorasDia(0);
                    setSemanasAlMes(0);
                    setSalarioNetoManual(0);
                    setPrecioServicio(0);

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
                  } catch (err: any) {
                    message.destroy("generating-pdf");
                    setLoadingPDF(false);
                    message.error(
                      err?.message || "Revisa los horarios seleccionados."
                    );
                  }finally{
                    setLoadingPDF(false)
                  }
                }}
              >
                <>
                  <Form.Item
                    label="Nombre de la persona que hace el contrato "
                    name="nameContrato"
                    rules={[{ required: true,message:"*Campo Obligatorio"}]}
                  >
                    <Input type="text" style={{ width: "100%" }} step={1} />
                  </Form.Item>
                </>
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
                <Form.Item name="horarioConvenir" valuePropName="checked">
                  <Checkbox>¿Quieres enviar un horario a convenir?</Checkbox>
                </Form.Item>

                {horarioConvenir && (
                  <>
                    <Form.Item
                      label="Horario a Convenir"
                      name="horario_Convenir"
                      rules={[{ required: true,message:"*Campo Obligatorio"}]}
                    >
                      <Input type="text" style={{ width: "100%" }} step={1} />
                    </Form.Item>
                  </>
                )}

                <Form.Item
                  name="Dias"
                  label="Dias"
                  rules={[{ required: false }]}
                >
                  <Checkbox.Group>
                    <Row>
                      <Col span={8}>
                        <Checkbox value="lunes" style={{ lineHeight: "32px" }}>
                          Lunes
                        </Checkbox>
                      </Col>
                      <Col span={8}>
                        <Checkbox value="martes" style={{ lineHeight: "32px" }}>
                          Martes
                        </Checkbox>
                      </Col>
                      <Col span={8}>
                        <Checkbox
                          value="miercoles"
                          style={{ lineHeight: "32px" }}
                        >
                          Miercoles
                        </Checkbox>
                      </Col>
                      <Col span={8}>
                        <Checkbox value="jueves" style={{ lineHeight: "32px" }}>
                          Jueves
                        </Checkbox>
                      </Col>
                      <Col span={8}>
                        <Checkbox
                          value="viernes"
                          style={{ lineHeight: "32px" }}
                        >
                          Viernes
                        </Checkbox>
                      </Col>
                      <Col span={8}>
                        <Checkbox value="sabado" style={{ lineHeight: "32px" }}>
                          Sabado
                        </Checkbox>
                      </Col>
                      <Col span={8}>
                        <Checkbox
                          value="domingo"
                          style={{ lineHeight: "32px" }}
                        >
                          Domingo
                        </Checkbox>
                      </Col>
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
                <Row gutter={[16, 8]}>
                  {DIAS.map(({ key, label }) => {
                    const visible = diasSeleccionados.includes(key);
                    if (!visible) return null;
                    return (
                      <Col span={12} key={key}>
                        <Form.Item
                          label={`Horario ${label}`}
                          name={["horarios", key]}
                          rules={[
                            {
                              required: false,
                              validator: async (_, value) => {
                                if (!diasSeleccionados.includes(key))
                                  return Promise.resolve();
                                if (value && !rangoValido(value)) {
                                  return Promise.reject(
                                    new Error("Selecciona un rango válido")
                                  );
                                }
                                return Promise.resolve();
                              },
                            },
                          ]}
                        >
                          <TimePicker.RangePicker
                            format="HH:mm"
                            minuteStep={5}
                          />
                        </Form.Item>
                      </Col>
                    );
                  })}
                </Row>
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
                  </div>
                ))}
                <Form.Item>
                  <Button
                    style={{
                      background: "#6366f2",
                      color: "#fff",
                      fontWeight: "bold",
                      marginTop: "10px",
                    }}
                    icon= {<DownloadOutlined/>}
                    htmlType="submit"
                    block
                    size="large"
                    loading={loadingPDF}
                  >
                    {loadingPDF ? "Generando PDF..." : "Generar PDF"}
                  </Button>
                </Form.Item>
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
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">COSTE TOTAL PARA EL EMPLEADOR</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
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
    </>
  );
};

export default DashboardPage;
