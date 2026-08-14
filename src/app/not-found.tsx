"use client";

import React, { useEffect, useState } from "react";
import { Button, Empty } from "antd";
import { useRouter } from "next/navigation";
import { obtenerToken } from "@/lib/session";

export default function NotFound() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = obtenerToken();
    setIsLoggedIn(!!token);
    setLoading(false);
  }, []);

  const handleGoBack = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Empty
          description="Página no encontrada"
          style={{ marginBottom: 24 }}
        />
        <p style={{ fontSize: 16, marginBottom: 24, color: "#666" }}>
          La ruta que buscas no existe o no está disponible.
        </p>
        <Button
          type="primary"
          size="large"
          onClick={handleGoBack}
          style={{ borderRadius: 8 }}
        >
          {isLoggedIn ? "Ir al Dashboard" : "Ir al Login"}
        </Button>
      </div>
    </div>
  );
}
