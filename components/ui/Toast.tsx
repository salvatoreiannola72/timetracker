import React from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
}

export const Toast: React.FC<ToastProps> = ({ message, type }) => {
  return (
    <div
      className={`z-[999] fixed bottom-5 right-5 px-4 py-3 rounded-lg shadow-lg text-white transition-all ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {message}
    </div>
  );
};