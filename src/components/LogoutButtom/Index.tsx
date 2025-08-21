"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";
import { logout as serverLogout } from "./action";
import { LogoutOutlined } from "@ant-design/icons";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await serverLogout();
    localStorage.removeItem("token");
    router.push("/login");
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
