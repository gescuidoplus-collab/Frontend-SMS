"use client";

/**
 * Pide las credenciales sin salir de la página.
 *
 * Existe para los enlaces de prellenado de CloudNavis: mandar al usuario a
 * /login se lleva por delante el query string del enlace, así que al volver ya
 * no hay ni ids ni token que cargar. Iniciando sesión aquí, la página sigue
 * donde estaba y el prellenado continúa solo.
 */

import React, { useState } from "react";
import { Modal, Form, Input, Button, Alert, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";
import api from "@/lib/axios";
import { guardarSesion } from "@/lib/session";

const { Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginRequeridoModalProps {
  abierto: boolean;
  /** Se llama al guardar la sesión, para reanudar lo que estuviera pendiente. */
  onSesionIniciada: () => void;
}

const LoginRequeridoModal: React.FC<LoginRequeridoModalProps> = ({
  abierto,
  onSesionIniciada,
}) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: LoginFormValues) => {
    setCargando(true);
    setError(null);

    try {
      const response = await api.post("/auth/login/", values);
      const token = response?.data?.accessToken;

      if (!token) {
        throw new Error("La respuesta del servidor no incluyó el token");
      }

      // Deja token y cookie a la vez, que es lo que mira el middleware.
      guardarSesion(token);
      onSesionIniciada();
    } catch (err) {
      console.error("Login failed:", err);
      setError("No se pudo iniciar sesión. Revisa el correo y la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LockOutlined style={{ color: "#1677ff" }} />
          <span>Inicia sesión para continuar</span>
        </div>
      }
      open={abierto}
      // Sin sesión no hay nada que hacer en la página, así que no se puede cerrar.
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      width={420}
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        Has abierto un enlace con datos precargados. Entra con tu cuenta y el
        formulario se rellenará solo, sin perder el enlace.
      </Text>

      {error && (
        <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
      )}

      <Form layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item
          label="Correo electrónico"
          name="email"
          rules={[
            { required: true, message: "Introduce tu correo" },
            { type: "email", message: "El correo no es válido" },
          ]}
        >
          <Input placeholder="ejemplo@cuidofam.com" autoFocus />
        </Form.Item>

        <Form.Item
          label="Contraseña"
          name="password"
          rules={[{ required: true, message: "Introduce tu contraseña" }]}
        >
          <Input.Password placeholder="••••••••" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={cargando} block>
            Entrar y continuar
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LoginRequeridoModal;
