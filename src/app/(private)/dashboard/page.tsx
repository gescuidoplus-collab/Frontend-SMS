"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, type TablePaginationConfig, Space, Typography } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import api from "@/lib/axios";

const { Title, Text } = Typography;

const DashboardPage = () => {
  interface PersonInfo {
    fullName?: string;
    phoneNumber?: string;
    message?: string;
  }

  interface Message {
    _id?: string;
    messageType: string;
    sentAt: string;
    status: string;
    fileUrl?: string;
    pdfUrl?: string;
    message?: string;
    message_employe?: string;
    reason?: string;
    recipient?: PersonInfo;
    employe?: PersonInfo; // segundo destinatario cuando messageType === "payRoll"
    [key: string]: unknown;
  }
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

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
      title: "Tipo de Archivo",
      dataIndex: "messageType",
      key: "messageType",
      render: (type: string) =>
        type === "payRoll" ? (
          <Tag color="blue">Nómina</Tag>
        ) : type === "invoice" ? (
          <Tag color="gold">Factura</Tag>
        ) : (
          <Tag>{type}</Tag>
        ),
    },
    {
      title: "Fecha",
      dataIndex: "sentAt",
      key: "sentAt",
      render: (sentAt: string) =>
        sentAt ? (
          new Date(sentAt).toLocaleString("es-ES", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        ) : (
          <span style={{ color: "#aaa" }}>No disponible</span>
        ),
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          success: "Éxito",
          failure: "Fallido",
          pending: "Pendiente",
        };
        const color =
          status === "success"
            ? "green"
            : status === "failure"
            ? "volcano"
            : "geekblue";
        return <Tag color={color}>{statusMap[status] || status}</Tag>;
      },
    },
    {
      title: "PDF / Motivo",
      key: "action",
      render: (_: unknown, record: Message) =>
        record.status === "success" ? (
          <button
            onClick={() => {
              window.open(record.pdfUrl, "_blank");
            }}
          >
            Descargar archivo
          </button>
        ) : record.status === "failure" ? (
          <span style={{ color: "red" }}>
            {record.reason || "No disponible"}
          </span>
        ) : (
          <p>No disponible.</p>
        ),
    },
  ];

  const expandedRowRender = (record: Message) => (
    <div style={{ padding: "16px 0" }}>
      <div>
        <b>Destinatario principal:</b>
        <div>
          <span style={{ color: "#1677ff" }}>
            {record.recipient?.fullName || "No disponible"}
          </span>
          <br />
          <span>{record.recipient?.phoneNumber || "No disponible"}</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <b>Mensaje:</b>
          <div
            style={{
              background: "#f6f8fa",
              borderRadius: 8,
              padding: 8,
              wordBreak: "break-word",
              marginTop: 4,
            }}
          >
            {record.message || "No disponible"}
          </div>
        </div>
      </div>
      {record.messageType === "payRoll" && record.employe && (
        <div style={{ marginTop: 16 }}>
          <b>Segundo destinatario:</b>
          <div>
            <span style={{ color: "#1677ff" }}>
              {record.employe.fullName || "No disponible"}
            </span>
            <br />
            <span>{record.employe.phoneNumber || "No disponible"}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <b>Mensaje:</b>
            <div
              style={{
                background: "#f6f8fa",
                borderRadius: 8,
                padding: 8,
                wordBreak: "break-word",
                marginTop: 4,
              }}
            >
              {record.message_employe || "No disponible"}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ background: "#f5f8ff", minHeight: "100vh", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", padding: "24px" }}>
        <Space align="center" style={{ margin: "0 0 16px 0" }}>
          <MessageOutlined style={{ fontSize: 28, color: "#1677ff" }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>Reporte de Mensajes</Title>
            <Text type="secondary">Visualiza el historial de envíos de SMS</Text>
          </div>
        </Space>
        <Table
        columns={columns}
        dataSource={messages}
        loading={loading}
        rowKey="_id"
        expandable={{
          expandedRowRender,
          expandRowByClick: true,
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
        }}
        onChange={handleTableChange}
      />
      </div>
    </div>
  );
};

export default DashboardPage;
