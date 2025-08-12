"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import api from "@/lib/axios";
import PageHeader from "@/components/PageHeader";

const DashboardPage = () => {
  const [messages, setMessages] = useState<any[]>([]);
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

  const handleTableChange = (pag: any) => {
    fetchMessages(pag.current, pag.pageSize);
  };

  const columns = [
    {
      title: "Destino",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Fecha",
      dataIndex: "sentAt",
      key: "sentAt",
      render: (sentAt: string) =>
        new Date(sentAt).toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
    },
    {
      title: "Tipo de Archivo",
      dataIndex: "messageType",
      key: "messageType",
      render: (type: string) =>
        type === "payRool" ? (
          <Tag color="blue">Nómina</Tag>
        ) : type === "invoce" ? (
          <Tag color="gold">Factura</Tag>
        ) : (
          <Tag>{type}</Tag>
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
        let color =
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
      render: (_: any, record: any) =>
        record.status === "success" ? (
          <button
            onClick={() => {
              window.open(record.fileUrl, "_blank");
            }}
          >
            Descargar factura
          </button>
        ) : record.status === "failure" ? (
          <span style={{ color: "red" }}>{record.reason}</span>
        ) : (
          <p>No disponible.</p>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Panel de Facturas"
        description="Visualiza el historial de envíos de SMS"
      />
      <Table
        columns={columns}
        dataSource={messages}
        loading={loading}
        rowKey="_id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
        }}
        onChange={handleTableChange}
      />
    </>
  );
};

export default DashboardPage;
