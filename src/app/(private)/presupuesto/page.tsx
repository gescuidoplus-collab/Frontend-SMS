"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, type TablePaginationConfig } from "antd";
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
} from "antd";
const { Title, Text } = Typography;
import PageHeader from "@/components/PageHeader";

interface Recipient {
  id: string;
  fullName: string;
  phoneNumber: string;
  message: string;
}
interface Message {
  _id: string;
  source: string;
  recipient: Recipient;
  employe?: Recipient;
  messageType: string;
  fileUrl: string;
  status: string;
  sentAt?: string;
  reason?: string;
}

const DashboardPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [form] = Form.useForm();
  console.log("Form: ", form);
  const [modo, setModo] = useState<"precio" | "salario">("precio");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  //VARIABLES 
  const [salarioNetoMensual,setSalarioNetoMensual] = useState("")
  const [precioHora,setPrecioHora] = useState(0)
  const [diasTrabajo,setDiasTrabajo] = useState(0)
  const [horasDia,setHorasDia] = useState(0)
  const [semanasAlMes,setSemanasAlMes] = useState(0)
  const [salarioNetoManual,setSalarioNetoManual] = useState("")
  const [precioServicio,setPrecioServicio] = useState("")

  const [calculo,setCalculo] = useState(0)
  const [calculo2,setCalculo2]= useState(0)



  const fetchMessages = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await api.get(
        `/sms-delivery-log?page=${page}&limit=${limit}`
      );
      setMessages(response.data.results);
      setPagination({
        current: response.data.page,
        pageSize: limit,
        total: response.data.total,
      });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(pagination.current, pagination.pageSize);
    // eslint-disable-next-line
  }, []);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchMessages(pag.current, pag.pageSize);
  };

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
    key: '1',
    tramo: '1º',
    retribucionMensual: '0.001€ - 319€/mes',
    baseCotizacion: "296.00€",
    empleador2360: "69.86€",
    empleado637: "18.86€",
    total: "84.27€",
  },
  {
    key: '2',
    tramo: '2º',
    retribucionMensual: '319.01€ - 495€/mes',
    baseCotizacion: 423.00,
    empleador2360: 99.83,
    empleado637: 26.95,
    total: 120.43,
  },
  {
    key: '3',
    tramo: '3º',
    retribucionMensual: '495.01€ - 672€/mes',
    baseCotizacion: 584.00,
    empleador2360: 137.82,
    empleado637: 37.20,
    total: 166.26,
  },
  {
    key: '4',
    tramo: '4º',
    retribucionMensual: '672.01€ - 850€/mes',
    baseCotizacion: 761.00,
    empleador2360: 179.60,
    empleado637: 48.48,
    total: 216.66,
  },
  {
    key: '5',
    tramo: '5º',
    retribucionMensual: '850.01€ - 1029€/mes',
    baseCotizacion: 941.00,
    empleador2360: 222.08,
    empleado637: 59.94,
    total: 267.90,
  },
  {
    key: '6',
    tramo: '6º',
    retribucionMensual: '1029.01€ - 1204€/mes',
    baseCotizacion: 1116.00,
    empleador2360: 263.38,
    empleado637: 71.09,
    total: 317.73,
  },
  {
    key: '7',
    tramo: '7º',
    retribucionMensual: '1204.01€ - 1381.2€/mes',
    baseCotizacion: 1381.20,
    empleador2360: 325.96,
    empleado637: 87.99,
    total: 393.23,
  },
  ];

  const calculos = ()=>{
      //Falta culminar esta parte
      let vas= horasDia*diasTrabajo*semanasAlMes 
      setCalculo(vas)

      if(vas > 0){
        let f= vas * precioHora;
        setCalculo2(f)

      }
  }

  return (
    <>
      <PageHeader
        title="Calculadora de Sueldos"
        description="Convenio Empleadas de Hogar 2025"
      />

      <div style={{ padding: 24 }}>
        <Button.Group style={{ marginBottom: 24 }} size="middle">
          <Button
            type={modo === "precio" ? "primary" : "default"}
            size="large"
            onClick={() => setModo("precio")}
          >
            Calcular desde precio/hora
          </Button>
          <Button
            type={modo === "salario" ? "primary" : "default"}
            size="large"
            onClick={() => setModo("salario")}
          >
            Calcular desde salario neto
          </Button>
        </Button.Group>

        <Flex gap={24} align="flex-start">
          {/* Columna Izquierda - Formulario */}
          <Card style={{ flex: 1, maxWidth: 550 }}>
            <Card>
              <Flex vertical gap={16}>
                {modo === "salario" && (
                  <div>
                    <Text>Salario Neto Mensual (€)</Text>
                    <InputNumber
                      style={{ width: "100%", marginTop: 8 }}
                      placeholder="Ej: 950.00"
                      min={0}
                      step={0.01}
                      value={salarioNetoMensual}
                      onChange={(value) => setSalarioNetoMensual(value || 0)}
                    />
                  </div>
                )}

                {modo === "precio" && (
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
                )}

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
                    step={0.1}
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

                <Button
                  style={{
                    background: "#6366f2",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                  block
                  size="large"
                  onClick={calculos}
                >
                  Calcular
                </Button>
              </Flex>
            </Card>

            <Card style={{ margin: "10px 0", background: "#f5f5f5" }}>
              <Form
                form={form}
                layout="vertical"
                initialValues={{}}
                onFinish={(values) => {
                  console.log("Datos del formulario:", values);
                }}
              >
                <>
                  <Form.Item
                    label="Identificacion Del servicio "
                    name="idServicio"
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      max={7}
                      step={0.1}
                    />
                  </Form.Item>
                </>
                <Form.Item
                  label="Nombre de la persona a cuidar"
                  name="nameCuidado"
                >
                  <Input
                    type="text"
                    style={{ width: "100%" }}
                    min={0}
                    max={7}
                    step={1}
                  />
                </Form.Item>
                <Form.Item label="Nombre del Cuidador" name="nameCuidador">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    max={24}
                    step={0.1}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    style={{
                      background: "#6366f2",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                    htmlType="submit"
                    block
                    size="large"
                  >
                    Generar PDF
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
                  {calculo} horas
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {`${diasTrabajo} dias x ${horasDia} horas x ${semanasAlMes} semanas = ${calculo} horas`}
                </Text>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Salario neto mensual</Text>
                <Title level={5} style={{ margin: "0" }}>
                  {calculo2}€
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {precioHora}€/hora × {calculo} horas = {calculo2}€
                </Text>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Tramo salarial</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  Tramo 7
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Base de cotización</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  1381.20€
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Cotizaciones empleado</Text>
                <Title level={5} style={{ margin: "8px 0" }}>
                  87.99€ (6,37%)
                </Title>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <Text type="secondary">
                    Contingencias comunes (4,70%): 64.92€
                  </Text>
                  <br />
                  <Text type="secondary">Desempleo (1,55%): 21.41€</Text>
                  <br />
                  <Text type="secondary">
                    Formación profesional (0,12%): 1.66€
                  </Text>
                </div>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Salario bruto mensual</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  1367.99€
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  1280.00€ (neto) + 87.99€(cotizacion empleado) = 1367.99€
                </Text>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Cotizacion empleador(23,60%)</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  325.96
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Cotizacion total</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  393.23
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Precio por hora</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  8.00€/hora
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">Precio de tu servicio</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  100.00€
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">IVA (21%)</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  21.00€
                </Title>
              </Card>
              <Card size="small" style={{ borderLeft: "4px solid #6366f2" }}>
                <Text type="secondary">COSTE TOTAL PARA EL EMPLEADOR</Text>
                <Title level={5} style={{ margin: "0px 0" }}>
                  1794.23€
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  1280.00€ (neto) + 393.23€ (cotización total) + 121.00€
                  (servicio+IVA) = 1794.23€
                </Text>
              </Card>

              <Card size="small">
                <Text type="secondary" style={{ margin: "0px" }}>
                  Informacion de depuracion:
                </Text>
                <br />
                <Text type="secondary" style={{ margin: "0px" }}>
                  Horas totales: 5 días × 8 horas × 4 semanas = 160 horas
                </Text>
                <br />
                <Text type="secondary">
                  Salario neto: 8€/hora × 160 horas = 1280.00€
                </Text>
                <br />
                <Text type="secondary">
                  Tramo seleccionado: 7 (1204.01€ - 1381.2€)
                </Text>
                <br />
                <Text type="secondary">
                  Salario bruto: 1280.00€ + 87.99€ = 1367.99€
                </Text>
                <br />
                <Text type="secondary">Tramo final verificado: 7</Text>
                <br />
                <Text type="secondary">
                  Coste total corregido: 1280.00€ (neto) + 393.23€ (cotización
                  total) + 121.00€ (servicio+IVA) = 1794.23€
                </Text>
              </Card>
            </Flex>
          </Card>
        </Flex>

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