"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, Input } from "antd";
import api from "@/lib/axios";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login/", values);
      localStorage.setItem("token", response?.data?.accessToken);
      document.cookie = `token=${response?.data?.accessToken}; path=/;`;
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        background: "#181C23",
      }}
    >
      {/* Sol SVG en la esquina superior derecha */}
      <svg
        width={190}
        height={190}
        viewBox="0 0 180 180"
        style={{
          position: "absolute",
          top: 50,
          right: 50,
          zIndex: 2,
        }}
      >
        <circle cx="90" cy="90" r="90" fill="#FFD43B" />
      </svg>
      {/* Fondo animado de ondas */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100vw",
          height: "40vh",
          zIndex: 0,
        }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e3f0ff" />
            <stop offset="100%" stopColor="#b6e0fe" />
          </linearGradient>
        </defs>
        <path
          d="M0,160 Q360,240 720,160 T1440,160 V320 H0 Z"
          fill="url(#waveGradient)"
        >
          <animate
            attributeName="d"
            dur="6s"
            repeatCount="indefinite"
            values="
              M0,160 Q360,240 720,160 T1440,160 V320 H0 Z;
              M0,180 Q360,120 720,200 T1440,180 V320 H0 Z;
              M0,160 Q360,240 720,160 T1440,160 V320 H0 Z
            "
          />
        </path>
      </svg>

      {/* Contenido centrado */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div
          style={{
            width: 370,
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 8px 32px rgba(24,28,35,0.18)",
            padding: "40px 32px 32px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <img
              src="/LogCuidoFam.jpg"
              alt="Logo"
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                background: "#f0f4fa",
              }}
            />
          </div>
          <Form onFinish={onFinish} style={{ width: "100%" }}>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Por favor ingresa tu email!" },
              ]}
            >
              <Input placeholder="Email" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Por favor ingresa tu contraseña!" },
              ]}
            >
              <Input.Password placeholder="Contraseña" size="large" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{ borderRadius: 8 }}
              >
                Iniciar sesión
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
