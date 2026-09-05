"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const router = useRouter();

  async function handleClick() {
    setStatus("loading");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Falha desconhecida");
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      style={{
        background: "transparent",
        border: "none",
        color: status === "error" ? "#ff6b81" : "#8b8c92",
        fontSize: 11,
        cursor: status === "loading" ? "default" : "pointer",
        padding: 0,
      }}
    >
      {status === "loading"
        ? "Sincronizando..."
        : status === "error"
        ? "Erro — tentar de novo"
        : "Atualizar agora"}
    </button>
  );
}