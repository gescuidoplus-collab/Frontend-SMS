"use client";

import React from 'react';
import { AuthProvider } from './index';

// Este componente wrapper es necesario para evitar errores de "use client" en el layout principal
export default function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>{children}</AuthProvider>
  );
}
