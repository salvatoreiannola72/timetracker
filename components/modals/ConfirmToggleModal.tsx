import React from "react";
import { Button } from "../Button";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmToggleModal: React.FC<Props> = ({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        <p className="text-slate-600 mb-6">{message}</p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>

          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};