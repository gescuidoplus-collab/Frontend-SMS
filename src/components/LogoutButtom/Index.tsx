"use client";

import { Button } from "antd";
import { logout as serverLogout } from "./action";
import { cerrarSesion } from "@/lib/session";
import { LogoutOutlined } from "@ant-design/icons";

export default function LogoutButton() {
  const handleLogout = async () => {
    // Se limpia por los dos lados: la cookie del servidor y la copia del
    // cliente. Si solo se borrara una, el middleware y las páginas se
    // contradirían y la navegación entraría en bucle.
    try {
      await serverLogout();
    } catch (error) {
      console.error("Error cerrando sesión en el servidor:", error);
    }
    cerrarSesion();
    window.location.href = "/login";
  };

  return (
    <Button
      type="primary"
      danger
      icon={<LogoutOutlined />}
      onClick={handleLogout}
    >
      Cerrar sesión
    </Button>
  );
}
