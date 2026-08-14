"use client";

/**
 * Next.js 15 sirve React 19 al cliente aunque el package.json declare React 18.
 * Antd v5 sólo soporta oficialmente React 16-18, y sin este parche sus métodos
 * estáticos (Modal.info, Modal.confirm, message, notification) no llegan a
 * renderizarse. Debe importarse una sola vez, desde el cliente.
 */
import "@ant-design/v5-patch-for-react-19";

export default function AntdCompatPatch() {
  return null;
}
