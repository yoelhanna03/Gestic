"use client";
import React, { useState } from "react";

type Toast = { id: string; type: "success" | "error"; message: string };

function ToastContainer({
  toasts,
  remove,
}: {
  toasts: Toast[];
  remove: (id: string) => void;
}) {
  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`max-w-sm px-4 py-2 rounded shadow-md text-sm ${
            t.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>{t.message}</div>
            <button
              onClick={() => remove(t.id)}
              className="ml-4 text-xs opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProfileForm({ user }: { user: any }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notifications, setNotifications] = useState(
    user?.notificationsEnabled ? "enabled" : "disabled",
  );
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [toasts, setToasts] = useState<Toast[]>([]);

  function pushToast(t: Omit<Toast, "id">) {
    const id = Math.random().toString(36).slice(2, 9);
    const toast = { id, ...t };
    setToasts((s) => [...s, toast]);
    // auto-remove after 4s
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id));
    }, 4000);
  }

  function removeToast(id: string) {
    setToasts((s) => s.filter((x) => x.id !== id));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("email", email);
      form.append("notifications", notifications);

      const res = await fetch("/api/user/update", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save");
      }
      setStatus("idle");
      pushToast({ type: "success", message: "Paramètres enregistrés" });
    } catch (err: any) {
      console.error(err);
      setStatus("idle");
      pushToast({
        type: "error",
        message: `Erreur: ${err?.message ?? "Échec"}`,
      });
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />
      <form id="profile-form" onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="_action" value="updateProfile" />
        <div>
          <label className="text-sm font-medium">Nom</label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded-md border border-border bg-background text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded-md border border-border bg-background text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Notifications</label>
          <select
            name="notifications"
            value={notifications}
            onChange={(e) => setNotifications(e.target.value)}
            className="w-full p-2 rounded-md border border-border bg-background text-sm"
          >
            <option value="enabled">Activées</option>
            <option value="disabled">Désactivées</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={onSubmit as any}
            disabled={status === "loading"}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
          >
            {status === "loading" ? "Envoi..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </>
  );
}
