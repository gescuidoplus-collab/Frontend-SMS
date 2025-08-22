"use client";

import React from "react";
import { Layout, Menu } from "antd";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButtom/Index";

const { Header, Content, Sider } = Layout;

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const SIDER_WIDTH = 200;

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
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          <Image
            src="/LogCuidoFam.jpg"
            alt="Logo"
            width={50}
            height={50}
            style={{ borderRadius: 50, height: 50, width: 50, objectFit: "cover" }}
            priority
          />
          <p style={{ marginLeft: 10, color: "#fff" }}>CuidoFam</p>
        </div>
        {/* Espacio entre logo y menú */}
        <div style={{ height: 32 }} />
        <Menu
          theme="dark"
          defaultSelectedKeys={["1"]}
          mode="inline"
          items={[{ key: "1", label: "Reporte de Mensajes" }]}
        />
        {/* Botón de logout al fondo */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            width: "100%",
            display: "flex",
            justifyContent: "center",
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
