import React from 'react';
import { Modal, Button, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface CloudnavisErrorModalProps {
  visible: boolean;
  errorCode: string;
  onRetry: () => void;
  onContinue: () => void;
}

interface ErrorMessage {
  title: string;
  message: string;
}

const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  TOKEN_INVALID: {
    title: 'Token inválido o expirado',
    message: 'Tu token ha expirado o es inválido. Contacta con tu administrador para obtener un nuevo enlace.',
  },
  EMPLEADO_NOT_FOUND: {
    title: 'Empleado no encontrado',
    message: 'No encontramos el registro del empleado. Verifica el ID e intenta nuevamente.',
  },
  EMPLEADOR_NOT_FOUND: {
    title: 'Empleador no encontrado',
    message: 'No encontramos el registro del empleador. Verifica el ID e intenta nuevamente.',
  },
  NETWORK_ERROR: {
    title: 'Error de conexión',
    message: 'Error al conectar con el servidor. Intenta nuevamente en unos momentos.',
  },
  MALFORMED_RESPONSE: {
    title: 'Error procesando datos',
    message: 'Hubo un problema al procesar los datos. Contacta con soporte.',
  },
  // Antes, un enlace al que le faltaba algun parametro simplemente no hacia
  // nada: el formulario salia vacio sin explicar por que.
  ENLACE_INCOMPLETO: {
    title: 'El enlace está incompleto',
    message:
      'Falta el identificador del empleado (idEmpleado) en el enlace, así que no se han podido traer los datos de CloudNavis. Puedes rellenar el formulario a mano o pedir un enlace nuevo.',
  },
};

const CloudnavisErrorModal: React.FC<CloudnavisErrorModalProps> = ({
  visible,
  errorCode,
  onRetry,
  onContinue,
}) => {
  const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.MALFORMED_RESPONSE;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '20px' }} />
          <span>{errorInfo.title}</span>
        </div>
      }
      open={visible}
      onCancel={onContinue}
      closable={false}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onContinue}>Continuar sin datos</Button>
          <Button type="primary" onClick={onRetry}>
            Reintentar
          </Button>
        </Space>
      }
    >
      <p>{errorInfo.message}</p>
    </Modal>
  );
};

export default CloudnavisErrorModal;
