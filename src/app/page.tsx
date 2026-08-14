"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { obtenerToken } from "@/lib/session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = obtenerToken();
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
