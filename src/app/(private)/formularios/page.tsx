"use client";

import React from "react";
import { Card, Row, Col, Button, Badge, Space, Typography } from "antd";
import { FormOutlined, FileTextOutlined, FileProtectOutlined, FileDoneOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function FormulariosPage() {
  const router = useRouter();

  const forms = [
    {
      key: 1,
      title: "Documentos Grupo",
      icon: <FileTextOutlined style={{ fontSize: 32, color: "#1677ff" }} />,
      description: "Completa los documentos del grupo",
      route: "/formularios/documentos-grupo",
      badge: null,
    },
    {
      key: 2,
      title: "Contrato",
      icon: <FileProtectOutlined style={{ fontSize: 32, color: "#faad14" }} />,
      description: "Contrato de trabajo indefinido",
      route: "/formularios/contrato",
      badge: null,
    },
    {
      key: 3,
      title: "Finiquito",
      icon: <FileDoneOutlined style={{ fontSize: 32, color: "#52c41a" }} />,
      description: "Documento de finiquito o liquidación",
      route: "/formularios/finiquito",
      badge: null,
    },
  ];

  return (
    <div style={{ background: "#f5f8ff", minHeight: "100vh", padding: "24px" }}>
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", padding: "24px" }}>
        <Space align="center" style={{ marginBottom: "32px" }}>
          <FormOutlined style={{ fontSize: 28, color: "#1677ff" }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>Formularios</Title>
            <Text type="secondary">Completa los formularios necesarios para la gestión documental</Text>
          </div>
        </Space>

        <Row gutter={[24, 24]}>
          {forms.map((form) => (
            <Col xs={24} sm={12} md={8} key={form.key}>
              <Badge.Ribbon text={form.badge} color={form.badge ? "#faad14" : undefined}>
                <Card
                  hoverable
                  style={{
                    cursor: form.badge ? "default" : "pointer",
                    opacity: form.badge ? 0.6 : 1,
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => !form.badge && router.push(form.route)}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: "16px" }}>
                      {form.icon}
                    </div>
                    <Title level={5} style={{ margin: "0 0 8px 0" }}>
                      {form.title}
                    </Title>
                    <Text type="secondary" style={{ display: "block", marginBottom: "16px", fontSize: "12px" }}>
                      {form.description}
                    </Text>
                    <Button
                      type={form.badge ? "default" : "primary"}
                      disabled={!!form.badge}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!form.badge) {
                          router.push(form.route);
                        }
                      }}
                    >
                      {form.badge ? "Próximamente" : "Acceder"}
                    </Button>
                  </div>
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
