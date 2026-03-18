import { useState } from "react";

export type ToastType = "success" | "error";

export const useToast = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  return { toast, showToast };
};