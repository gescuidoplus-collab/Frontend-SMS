"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Form, Input } from "antd";
import api from "@/lib/axios";

interface LoginFormValues {
  username: string;
  password: string;
  [key: string]: unknown;
}

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: LoginFormValues) => {
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
      {/* Sol */}
      <svg
        width={190}
        height={190}
        viewBox="0 0 180 180"
        style={{ position: "absolute", top: 50, right: 50, zIndex: 2 }}
      >
        <circle cx="90" cy="90" r="90" fill="#FFD43B" />
      </svg>
      {/* Olas */}
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
          fill="url(#waveGradient)"
          d="M0,192L48,181.3C96,171,192,149,288,154.7C384,160,480,192,576,197.3C672,203,768,181,864,181.3C960,181,1056,203,1152,213.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
      {/* Contenido */}
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
          <div style={{ marginBottom: 32 }}>
            <Image
              src="/LogCuidoFam.jpg"
              alt="Logo"
              width={90}
              height={90}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                background: "#f0f4fa",
              }}
            />
          </div>
          <Form
            layout="vertical"
            onFinish={onFinish}
            style={{ width: "100%" }}
            disabled={loading}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Por favor ingresa tu usuario!" },
              ]}
            >
              <Input placeholder="Usuario" size="large" />
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
