'use client';

import { Modal } from './Modal';

type Props = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  danger?: boolean;
  confirmLabel?: string;
};

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading,
  danger = true,
  confirmLabel = 'Confirmar',
}: Props) {
  return (
    <Modal
      title={title}
      open={open}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button
            onClick={onCancel}
            className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#3c8ea8] hover:bg-[#367f96]'
            }`}
          >
            {isLoading ? 'Processando...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-[#3d3420]">{message}</p>
    </Modal>
  );
}

