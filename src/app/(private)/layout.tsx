"use client";

import React, { useEffect } from "react";
import { Layout, Menu, Divider } from "antd";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButtom/Index";
import { MessageOutlined, CalculatorOutlined, FileTextOutlined } from "@ant-design/icons";

const { Header, Content, Sider } = Layout;

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const SIDER_WIDTH = 200;
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const handleMenuClick = (key: string) => {
    const routes: Record<string, string> = {
      "1" : "/dashboard",
      "2" : "/presupuesto",
      "3" : "/formularios"
    }
    router.push(routes[key]);
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={SIDER_WIDTH}
        style={{
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Image
            src="/LogCuidoFam.jpg"
            alt="Logo"
            width={50}
            height={50}
            style={{ maxHeight: 50, width: "auto", borderRadius: 50 }}
          />
          <div style={{ marginLeft: 10 }}>
            <p style={{ color: "#fff", margin: 0, fontWeight: "bold", fontSize: 14 }}>CuidoFam</p>
            <p style={{ color: "#888", margin: 0, fontSize: 11 }}>v1.0</p>
          </div>
        </div>

        {/* Menú */}
        <Menu
          theme="dark"
          defaultSelectedKeys={["1"]}
          mode="inline"
          style={{
            background: "transparent",
            border: "none",
            marginTop: 24,
          }}
          items={[
            {
              key: "1",
              icon: <MessageOutlined style={{ fontSize: 16 }} />,
              label: "Reportes",
              style: { marginBottom: 8 },
            },
            {
              key: "2",
              icon: <CalculatorOutlined style={{ fontSize: 16 }} />,
              label: "Presupuesto",
              style: { marginBottom: 8 },
            },
            {
              key: "3",
              icon: <FileTextOutlined style={{ fontSize: 16 }} />,
              label: "Formularios",
              style: { marginBottom: 8 },
            },
          ]}
          onClick={({ key }) => handleMenuClick(key)}
        />

        <div style={{ flex: 1 }} />

        {/* Footer del menú */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <LogoutButton />
        </div>
      </Sider>
      <Layout style={{ marginLeft: SIDER_WIDTH }}>
        <Header
          style={{
            background: "#fff",
            padding: "0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div></div>
        </Header>
        <Content style={{ margin: "16px" }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
