"use client";

import { useState } from "react";
import { useActionState } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import { upsertAiSettings, type ActionResult } from "@/actions/ai-settings";
import { cn } from "@/lib/utils";
import type { AiSettingsRow } from "@/types/database";

const PRESETS = {
  groq: {
    label: "Groq",
    base_url: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  openrouter: {
    label: "OpenRouter",
    base_url: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.1-8b-instruct",
  },
} as const;

export function AiSettingsForm({
  settings,
}: {
  settings: AiSettingsRow | null;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    upsertAiSettings,
    {},
  );
  const [baseUrl, setBaseUrl] = useState(
    settings?.base_url ?? PRESETS.groq.base_url,
  );
  const [model, setModel] = useState(
    settings?.model ?? PRESETS.groq.model,
  );
  const [apiKey, setApiKey] = useState(settings?.api_key ?? "");
  const [enabled, setEnabled] = useState(settings?.enabled ?? false);

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-600" />
        <h2 className="text-base font-semibold">Kecerdasan Buatan (BYOK)</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Bawa kunci API sendiri (Groq, OpenRouter, atau server OpenAI-compatible).
        Dipakai untuk proyeksi AI dan chat.
      </p>

      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setBaseUrl(p.base_url);
              setModel(p.model);
            }}
            className="rounded-full border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Base URL</span>
        <input
          name="base_url"
          type="url"
          required
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.groq.com/openai/v1"
          className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Model</span>
        <input
          name="model"
          required
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="llama-3.3-70b-versatile"
          className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">API Key</span>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="api_key"
            type="password"
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="gsk_..."
            className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Disimpan di database Supabase milikmu, hanya dipakai saat request.
        </p>
      </label>

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-input px-4 py-3">
        <span className="text-sm font-medium">Aktifkan AI</span>
        <input
          name="enabled"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-5 w-5 accent-primary"
        />
      </label>

      {state.fieldErrors?.base_url && (
        <p role="alert" className="text-sm text-destructive">
          {state.fieldErrors.base_url[0]}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors",
          "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {pending ? "Menyimpan..." : state.success ? "Tersimpan" : "Simpan AI"}
      </button>
    </form>
  );
}
