export const parseApiError = (error: any): string => {
  if (!error) return "Errore sconosciuto";

  // axios / fetch style
  const data = error?.response?.data;

  if (!data) return error.message || "Errore generico";

  // caso DRF: { detail: "..." }
  if (data.detail) return data.detail;

  // caso DRF: { field: ["msg"] }
  if (typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        if (Array.isArray(messages)) {
          return `${field}: ${messages.join(", ")}`;
        }
        return `${field}: ${messages}`;
      })
      .join(" | ");
  }

  return "Errore imprevisto";
};