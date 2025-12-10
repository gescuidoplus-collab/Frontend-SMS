"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";
import { logout as serverLogout } from "./action";
import { LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "../AuthProvider";

export default function LogoutButton() {
  const router = useRouter();

  // Obtener la función logout del contexto de autenticación
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Ejecutar el logout en el servidor
      await serverLogout();
      
      // Usar la función de logout del contexto
      logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
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
