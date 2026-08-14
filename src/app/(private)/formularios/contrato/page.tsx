"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  AutoComplete,
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
  Descriptions,
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { useRouter } from "next/navigation";
import { fetchCloudnavisEmpleado, fetchCloudnavisEmpleador } from "@/services/cloudnavisClient";
import { mapEmpleadoToContrato, mapEmpleadorToContrato } from "@/services/mappers";
import CloudnavisErrorModal from "@/components/CloudnavisErrorModal";
import { obtenerToken } from "@/lib/session";

const { Title, Text } = Typography;

interface FormValues {
  nomempleador?: string;
  tipoDocumentoEmpleador?: "NIE" | "NIF";
  nifempleador?: string;
  correoempleador?: string;
  cuentaCotizacion?: string;
  domicilio?: string;
  municipio?: string;
  nombretrabajador?: string;
  tipoDocumentoTrabajador?: "NIE" | "NIF";
  niftrabajador?: string;
  numafiliaciontrabajador?: string;
  nivelformativotrabajador?: string;
  nacionalidadtrabajador?: string;
  municipiodomtrabajador?: string;
  paisdomtrabajador?: string;
  codPostal?: string;
  interExterno?: "Interna" | "Externa";
  jornadaTipo?: "completo" | "parcial";
  horasJornada?: number;
  fechacontrato?: Dayjs;
  montobruto?: number;
  lugarfirma?: string;
  fechanactrabajador?: Dayjs;
}

interface ContratoRecord {
  _id: string;
  fechacontrato?: string;
  nombretrabajador?: string;
  niftrabajador?: string;
  nomempleador?: string;
  montobruto?: string | number;
  status?: string;
  createdAt?: string;
  correoempleado?: string;
  correoempleador?: string;
  signingLinks?: { role: string; link: string }[];
  lastError?: { stage?: string; message?: string };
}

const formatearFecha = (date: Dayjs | undefined, tipo: "completa"): string => {
  if (!date) return "";
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dia = date.date();
  const mes = meses[date.month()];
  const anio = date.year();
  return `${dia} de ${mes} ${anio}`;
};

// Régimen(4) + Código(1) + Provincia(1) + Número(4) + Dígito control(1) + Contr(1) = 12 dígitos
const splitCuentaCotizacion = (value?: string) => {
  const digits = (value || "").replace(/\D/g, "").slice(0, 12);
  return {
    regimen: digits.slice(0, 4),
    codigo: digits.slice(4, 5),
    prov: digits.slice(5, 6),
    numero: digits.slice(6, 10),
    dig: digits.slice(10, 11),
    contr: digits.slice(11, 12),
  };
};

const NIVELES_FORMATIVOS = [
  "Sin estudios",
  "Estudios primarios",
  "Educación Secundaria Obligatoria (ESO)",
  "Bachillerato",
  "Formación Profesional Grado Medio",
  "Formación Profesional Grado Superior",
  "Diplomatura / Grado Universitario",
  "Licenciatura / Máster",
  "Doctorado",
  "Otros",
];

// Lista de referencia — cubre los países más frecuentes; ampliar según necesidad
const NACIONALIDADES = [
  "Afgana", "Albanesa", "Alemana", "Andorrana", "Angoleña", "Antiguana y Barbudense",
  "Argelina", "Argentina", "Armenia", "Australiana", "Austriaca", "Azerbaiyana",
  "Bahameña", "Bahreiní", "Bangladesí", "Barbadense", "Belga", "Beliceña", "Beninesa",
  "Bielorrusa", "Birmana", "Boliviana", "Bosnia", "Botsuana", "Brasileña", "Bruneana",
  "Búlgara", "Burkinesa", "Burundesa", "Butanesa", "Caboverdiana", "Camboyana",
  "Camerunesa", "Canadiense", "Catarí", "Centroafricana", "Chadiana", "Checa",
  "Chilena", "China", "Chipriota", "Colombiana", "Comorense", "Congoleña (Rep. del Congo)",
  "Congoleña (Rep. Dem. del Congo)", "Costarricense", "Croata", "Cubana", "Danesa",
  "Dominiquesa", "Dominicana", "Ecuatoguineana", "Ecuatoriana", "Egipcia", "Emiratí",
  "Eritrea", "Eslovaca", "Eslovena", "Española", "Estadounidense", "Estonia",
  "Esuatinense", "Etíope", "Filipina", "Finlandesa", "Fiyiana", "Francesa", "Gabonesa",
  "Gambiana", "Georgiana", "Ghanesa", "Granadina", "Griega", "Guatemalteca", "Guineana",
  "Guineana-Bisáu", "Guyanesa", "Haitiana", "Hondureña", "Húngara", "India", "Indonesia",
  "Iraquí", "Iraní", "Irlandesa", "Islandesa", "Israelí", "Italiana", "Jamaicana",
  "Japonesa", "Jordana", "Kazaja", "Keniana", "Kirguisa", "Kiribatiana", "Kuwaití",
  "Laosiana", "Lesotense", "Letona", "Libanesa", "Liberiana", "Libia", "Liechtensteiniana",
  "Lituana", "Luxemburguesa", "Macedonia", "Malgache", "Malasia", "Malauí", "Maldiva",
  "Maliense", "Maltesa", "Marfileña", "Marroquí", "Marshalesa", "Mauriciana",
  "Mauritana", "Mexicana", "Micronesia", "Moldava", "Monegasca", "Mongola",
  "Montenegrina", "Mozambiqueña", "Namibia", "Nauruana", "Neerlandesa", "Nepalí",
  "Neozelandesa", "Nicaragüense", "Nigeriana", "Nigerina", "Norcoreana", "Noruega",
  "Omaní", "Pakistaní", "Palauana", "Palestina", "Panameña", "Papú", "Paraguaya",
  "Peruana", "Polaca", "Portuguesa", "Británica", "Rumana", "Rusa", "Ruandesa",
  "Samoana", "Sanmarinense", "Santalucense", "Sancristobaleña", "Saotomense", "Saudí",
  "Senegalesa", "Serbia", "Seychellense", "Sierraleonesa", "Singapurense", "Siria",
  "Somalí", "Esrilanquesa", "Sudafricana", "Sudanesa", "Sursudanesa", "Sueca", "Suiza",
  "Surcoreana", "Surinamesa", "Tailandesa", "Tanzana", "Tayika", "Timorense",
  "Togolesa", "Tonganesa", "Trinitense", "Tunecina", "Turca", "Turcomana", "Tuvaluana",
  "Ucraniana", "Ugandesa", "Uruguaya", "Uzbeka", "Vanuatuense", "Vaticana",
  "Venezolana", "Vicentina", "Vietnamita", "Yemení", "Yibutiana", "Zambiana",
  "Zimbabuense", "Otra",
];

// Códigos postales de Bizkaia por municipio. Los municipios que comparten
// código aparecen agrupados en la misma opción.
const CODIGOS_POSTALES_VIZCAYA = [
  { codigo: "48001", municipio: "Bilbao" },
  { codigo: "48002", municipio: "Bilbao" },
  { codigo: "48003", municipio: "Bilbao" },
  { codigo: "48004", municipio: "Bilbao" },
  { codigo: "48005", municipio: "Bilbao" },
  { codigo: "48006", municipio: "Bilbao" },
  { codigo: "48007", municipio: "Bilbao" },
  { codigo: "48008", municipio: "Bilbao" },
  { codigo: "48009", municipio: "Bilbao" },
  { codigo: "48010", municipio: "Bilbao" },
  { codigo: "48011", municipio: "Bilbao" },
  { codigo: "48012", municipio: "Bilbao" },
  { codigo: "48013", municipio: "Bilbao" },
  { codigo: "48014", municipio: "Bilbao" },
  { codigo: "48015", municipio: "Bilbao" },
  { codigo: "48100", municipio: "Mungia" },
  { codigo: "48110", municipio: "Gatika" },
  { codigo: "48111", municipio: "Laukiz" },
  { codigo: "48112", municipio: "Maruri-Jatabe" },
  { codigo: "48113", municipio: "Gamiz-Fika" },
  { codigo: "48114", municipio: "Arrieta / Zeanuri" },
  { codigo: "48115", municipio: "Morga" },
  { codigo: "48116", municipio: "Fruiz" },
  { codigo: "48120", municipio: "Meñaka" },
  { codigo: "48130", municipio: "Bakio" },
  { codigo: "48140", municipio: "Arantzazu / Igorre" },
  { codigo: "48141", municipio: "Dima" },
  { codigo: "48142", municipio: "Artea" },
  { codigo: "48143", municipio: "Areatza" },
  { codigo: "48145", municipio: "Ubide" },
  { codigo: "48150", municipio: "Sondika" },
  { codigo: "48160", municipio: "Derio" },
  { codigo: "48170", municipio: "Zamudio" },
  { codigo: "48180", municipio: "Loiu" },
  { codigo: "48190", municipio: "Sopuerta" },
  { codigo: "48191", municipio: "Galdames" },
  { codigo: "48192", municipio: "Gordexola" },
  { codigo: "48195", municipio: "Larrabetzu" },
  { codigo: "48196", municipio: "Lezama" },
  { codigo: "48200", municipio: "Durango / Garai" },
  { codigo: "48210", municipio: "Otxandio" },
  { codigo: "48212", municipio: "Mañaria" },
  { codigo: "48213", municipio: "Izurtza" },
  { codigo: "48215", municipio: "Iurreta" },
  { codigo: "48220", municipio: "Abadiño" },
  { codigo: "48230", municipio: "Elorrio" },
  { codigo: "48240", municipio: "Berriz" },
  { codigo: "48250", municipio: "Zaldibar" },
  { codigo: "48260", municipio: "Ermua" },
  { codigo: "48269", municipio: "Mallabia" },
  { codigo: "48270", municipio: "Markina-Xemein" },
  { codigo: "48277", municipio: "Etxebarria" },
  { codigo: "48278", municipio: "Ziortza-Bolibar" },
  { codigo: "48280", municipio: "Lekeitio" },
  { codigo: "48287", municipio: "Ea" },
  { codigo: "48288", municipio: "Ispaster" },
  { codigo: "48289", municipio: "Amoroto / Gizaburuaga / Mendexa" },
  { codigo: "48291", municipio: "Atxondo" },
  { codigo: "48300", municipio: "Gernika-Lumo" },
  { codigo: "48309", municipio: "Errigoiti" },
  { codigo: "48310", municipio: "Elantxobe" },
  { codigo: "48311", municipio: "Ibarrangelu" },
  { codigo: "48312", municipio: "Nabarniz" },
  { codigo: "48313", municipio: "Ereño" },
  { codigo: "48314", municipio: "Gautegiz Arteaga" },
  { codigo: "48315", municipio: "Kortezubi" },
  { codigo: "48320", municipio: "Ajangiz" },
  { codigo: "48330", municipio: "Lemoa" },
  { codigo: "48340", municipio: "Amorebieta-Etxano" },
  { codigo: "48350", municipio: "Busturia" },
  { codigo: "48360", municipio: "Mundaka" },
  { codigo: "48370", municipio: "Bermeo" },
  { codigo: "48380", municipio: "Aulesti" },
  { codigo: "48381", municipio: "Munitibar-Arbatzegi Gerrikaitz" },
  { codigo: "48382", municipio: "Mendata" },
  { codigo: "48383", municipio: "Arratzu" },
  { codigo: "48390", municipio: "Bedia" },
  { codigo: "48392", municipio: "Muxika" },
  { codigo: "48393", municipio: "Forua" },
  { codigo: "48394", municipio: "Murueta" },
  { codigo: "48395", municipio: "Sukarrieta" },
  { codigo: "48410", municipio: "Orozko" },
  { codigo: "48450", municipio: "Etxebarri" },
  { codigo: "48460", municipio: "Urduña-Orduña" },
  { codigo: "48480", municipio: "Arrigorriaga / Zaratamo" },
  { codigo: "48490", municipio: "Ugao-Miraballes" },
  { codigo: "48498", municipio: "Arakaldo / Arrankudiaga" },
  { codigo: "48499", municipio: "Zeberio" },
  { codigo: "48500", municipio: "Abanto y Ciérvana-Abanto Zierbena" },
  { codigo: "48508", municipio: "Zierbena" },
  { codigo: "48510", municipio: "Valle de Trápaga-Trapagaran" },
  { codigo: "48530", municipio: "Ortuella" },
  { codigo: "48550", municipio: "Muskiz" },
  { codigo: "48600", municipio: "Sopelana" },
  { codigo: "48610", municipio: "Urduliz" },
  { codigo: "48620", municipio: "Lemoiz / Plentzia" },
  { codigo: "48630", municipio: "Gorliz" },
  { codigo: "48640", municipio: "Berango" },
  { codigo: "48650", municipio: "Barrika" },
  { codigo: "48700", municipio: "Ondarroa" },
  { codigo: "48710", municipio: "Berriatua" },
  { codigo: "48800", municipio: "Balmaseda" },
  { codigo: "48810", municipio: "Alonsotegi" },
  { codigo: "48840", municipio: "Güeñes" },
  { codigo: "48860", municipio: "Zalla" },
  { codigo: "48879", municipio: "Artzentales" },
  { codigo: "48880", municipio: "Trucios-Turtzioz" },
  { codigo: "48891", municipio: "Karrantza Harana / Valle de Carranza" },
  { codigo: "48895", municipio: "Lanestosa" },
  { codigo: "48901", municipio: "Barakaldo" },
  { codigo: "48902", municipio: "Barakaldo" },
  { codigo: "48903", municipio: "Barakaldo" },
  { codigo: "48910", municipio: "Sestao" },
  { codigo: "48920", municipio: "Portugalete" },
  { codigo: "48930", municipio: "Getxo" },
  { codigo: "48940", municipio: "Leioa" },
  { codigo: "48950", municipio: "Erandio" },
  { codigo: "48960", municipio: "Galdakao" },
  { codigo: "48970", municipio: "Basauri" },
  { codigo: "48980", municipio: "Santurtzi" },
  { codigo: "48991", municipio: "Getxo" },
  { codigo: "48992", municipio: "Getxo" },
  { codigo: "48993", municipio: "Getxo" },
];

export default function ContratoPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [contratos, setContratos] = useState<ContratoRecord[]>([]);
  const [contratosLoading, setContratosLoading] = useState(false);
  const router = useRouter();


  const cargarContratos = async () => {
    setContratosLoading(true);
    try {
      const token = obtenerToken();
      const response = await fetch(
        "http://localhost:3001/api/v1/contrato/lista",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setContratos(data.data || []);
      }
    } catch (error) {
      console.error("Error cargando contratos:", error);
    } finally {
      setContratosLoading(false);
    }
  };

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

        const mappedEmpleado = mapEmpleadoToContrato(empleado);
        const mappedEmpleador = mapEmpleadorToContrato(empleador);

        form.setFieldsValue({ ...mappedEmpleado, ...mappedEmpleador });

        // Cargar historial de contratos del empleado
        cargarContratos();
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
  }, [form]);

  const handleRetryFetch = () => {
    window.location.reload();
  };

  const mostrarEnlacesFirma = (links: { role: string; link: string }[]) => {
    Modal.info({
      title: "Enlaces de firma",
      width: 640,
      okText: "Cerrar",
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>
            Envía cada enlace a la persona correspondiente. Con el enlace puede ver el
            documento y firmarlo, sin necesidad de correo ni de crearse una cuenta.
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
                    message.success(`Enlace de ${l.role} copiado`);
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

  const descargarPdf = async (record: ContratoRecord) => {
    const key = `descarga-${record._id}`;
    message.loading({ content: "Generando PDF...", key });
    try {
      const token = obtenerToken();
      const response = await fetch(
        `http://localhost:3001/api/v1/contrato/${record._id}/descargar`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const detalle = await response.text();
        throw new Error(`${response.status} — ${detalle.slice(0, 200)}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // El enlace debe estar en el DOM para que el click dispare la descarga
      const link = document.createElement("a");
      link.href = url;
      link.download = `contrato-${record.nombretrabajador || record._id}.pdf`;
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

  const eliminarContrato = (record: ContratoRecord) => {
    Modal.confirm({
      title: "Eliminar contrato",
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: (
        <div>
          <p>
            Se eliminará el contrato de{" "}
            <strong>{record.nombretrabajador || "esta trabajadora"}</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            Los enlaces de firma dejarán de funcionar y no se podrá recuperar.
          </p>
        </div>
      ),
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          const token = obtenerToken();
          const res = await fetch(`http://localhost:3001/api/v1/contrato/${record._id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(`${res.status}`);
          message.success("Contrato eliminado");
          cargarContratos();
        } catch (err) {
          console.error("Error eliminando contrato:", err);
          message.error("No se pudo eliminar el contrato");
        }
      },
    });
  };

  const onFinish = async (values: FormValues) => {
    // Validación de fechas
    if (values.fechacontrato) {
      const fechaContrato = values.fechacontrato;
      // Validación adicional si es necesaria
    }

    setLoading(true);
    message.loading({ content: "Enviando contrato...", key: "sending" });

    try {
      const cuenta = splitCuentaCotizacion(values.cuentaCotizacion);
      const diafirma = values.fechacontrato ? String(values.fechacontrato.date()).padStart(2, "0") : "";
      const mesfirma = values.fechacontrato ? String(values.fechacontrato.month() + 1).padStart(2, "0") : "";
      const anofirma = values.fechacontrato ? String(values.fechacontrato.year()).slice(-2) : "";

      const payload = {
        nomempleador: values.nomempleador || "",
        tipoDocumentoEmpleador: values.tipoDocumentoEmpleador || "NIF",
        nifempleador: values.nifempleador || "",
        regimen: cuenta.regimen,
        codigo: cuenta.codigo,
        prov: cuenta.prov,
        numero: cuenta.numero,
        dig: cuenta.dig,
        contr: cuenta.contr,
        domicilio: values.domicilio || "",
        municipio: values.municipio || "",
        nombretrabajador: values.nombretrabajador || "",
        tipoDocumentoTrabajador: values.tipoDocumentoTrabajador || "NIE",
        niftrabajador: values.niftrabajador || "",
        fechanactrabajador: formatearFecha(values.fechanactrabajador, "completa"),
        numafiliaciontrabajador: values.numafiliaciontrabajador || "",
        nivelformativotrabajador: values.nivelformativotrabajador || "",
        nacionalidadtrabajador: values.nacionalidadtrabajador || "",
        municipiodomtrabaajdor: values.municipiodomtrabajador || "",
        paisdomtrabajador: values.paisdomtrabajador || "",
        codPostal: values.codPostal || "",
        interExterno: values.interExterno || "",
        jornadaTipo: values.jornadaTipo || "",
        horasJornada: values.horasJornada || 0,
        fechacontrato: formatearFecha(values.fechacontrato, "completa"),
        montobruto: values.montobruto || 0,
        lugarfirma: values.lugarfirma || "",
        mesfirma,
        diafirma,
        anofirma,
      };

      const token = obtenerToken();

      const response = await fetch(
        "http://localhost:3001/api/v1/contrato/crear",
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

        message.success("✓ Contrato generado correctamente");
        // Refrescamos ya, para que aparezca en la tabla aunque se cierre el
        // modal sin pulsar "Cerrar".
        cargarContratos();
        setTimeout(() => {
          Modal.success({
            title: "¡Contrato Generado Correctamente!",
            icon: <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 48 }} />,
            width: 640,
            content: (
              <div>
                {links.length > 0 ? (
                  <>
                    <p style={{ marginBottom: 12 }}>
                      Comparte estos enlaces para que cada parte firme. No hace falta
                      correo: con el enlace se puede ver el documento y firmarlo.
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
                              message.success(`Enlace de ${l.role} copiado`);
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
                  </>
                ) : (
                  <p>✓ El contrato se generó correctamente.</p>
                )}
                <p style={{ marginTop: 12, marginBottom: 0 }}>
                  Si cierras esta ventana, puedes volver a ver los enlaces con el botón{" "}
                  <strong>Enlaces</strong> del <strong>Historial de Contratos</strong>.
                </p>
              </div>
            ),
            okText: "Cerrar",
            onOk: () => {
              form.resetFields();
              cargarContratos();
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
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Tipo de Documento"
                    name="tipoDocumentoEmpleador"
                    initialValue="NIF"
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
                    name="nifempleador"
                    rules={[{ required: true, message: "El documento es requerido" }]}
                  >
                    <Input placeholder="12345678X" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Sección: Datos de la Cuenta de Cotización */}
            <Card title="Datos de la Cuenta de Cotización" style={{ marginBottom: "24px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Cuenta de Cotización (12 dígitos)"
                    name="cuentaCotizacion"
                    tooltip="Régimen(4) + Código(1) + Provincia(1) + Número(4) + Dígito de control(1) + Contr(1) = 12 dígitos. Se separan automáticamente."
                    rules={[
                      { required: true, message: "Requerido" },
                      { pattern: /^\d{12}$/, message: "Debe tener exactamente 12 dígitos" },
                    ]}
                  >
                    <Input placeholder="Ej. 013801234567" maxLength={12} />
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
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Tipo de Documento"
                    name="tipoDocumentoTrabajador"
                    initialValue="NIE"
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
                    name="niftrabajador"
                    rules={[{ required: true, message: "El documento es requerido" }]}
                  >
                    <Input placeholder="98765432Y" />
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
                    <Select placeholder="Selecciona el nivel formativo" showSearch>
                      {NIVELES_FORMATIVOS.map((nivel) => (
                        <Select.Option key={nivel} value={nivel}>
                          {nivel}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Nacionalidad"
                    name="nacionalidadtrabajador"
                  >
                    <Select
                      placeholder="Selecciona la nacionalidad"
                      showSearch
                      optionFilterProp="children"
                    >
                      {NACIONALIDADES.map((nacionalidad) => (
                        <Select.Option key={nacionalidad} value={nacionalidad}>
                          {nacionalidad}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Municipio de Domicilio"
                    name="municipiodomtrabajador"
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
                    label="Código Postal (Bizkaia)"
                    name="codPostal"
                    tooltip="Puedes buscar por código o por municipio. Si necesitas uno que no esté en la lista, escríbelo directamente."
                  >
                    <AutoComplete
                      placeholder="Busca por código o municipio"
                      filterOption={(input, option) =>
                        String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      options={CODIGOS_POSTALES_VIZCAYA.map((cp) => ({
                        value: cp.codigo,
                        label: `${cp.codigo} — ${cp.municipio}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Interna o Externa"
                    name="interExterno"
                  >
                    <Select placeholder="Selecciona una opción">
                      <Select.Option value="Interna">Interna</Select.Option>
                      <Select.Option value="Externa">Externa</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
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
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Tipo de Jornada"
                    name="jornadaTipo"
                  >
                    <Select placeholder="Selecciona el tipo de jornada">
                      <Select.Option value="completo">A tiempo completo</Select.Option>
                      <Select.Option value="parcial">A tiempo parcial</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label="Horas Semanales"
                    name="horasJornada"
                  >
                    <InputNumber
                      placeholder="Ej. 20"
                      min={0}
                      max={40}
                      style={{ width: "100%" }}
                      addonAfter="horas"
                    />
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

          {/* Tabla de Contratos */}
          <Divider style={{ marginTop: "40px" }} />

          <Title level={3} style={{ marginBottom: "16px", marginTop: "24px" }}>
            Historial de Contratos
          </Title>

          <Card>
            <Spin spinning={contratosLoading}>
              {contratos.length > 0 ? (
                <Table
                  dataSource={contratos}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "Fecha",
                      dataIndex: "fechacontrato",
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
                      title: "Monto",
                      dataIndex: "montobruto",
                      key: "monto",
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
                        const statusMap: Record<string, React.ReactNode> = {
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
                                title: `Contrato - ${record.nombretrabajador}`,
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
                                      <Descriptions.Item label="Monto Bruto">
                                        {record.montobruto}€
                                      </Descriptions.Item>
                                      <Descriptions.Item label="Fecha Contrato">
                                        {record.fechacontrato}
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
                            onClick={() => eliminarContrato(record)}
                          >
                            Eliminar
                          </Button>
                        </Space>
                      ),
                      width: 300,
                    },
                  ]}
                  size="small"
                  scroll={{ x: 1100 }}
                />
              ) : (
                <Empty
                  description="No hay contratos registrados"
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
