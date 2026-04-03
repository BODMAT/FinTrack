"use client";

import { useState } from "react";
import { useUserApiKey } from "@/hooks/useUserApiKey";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { Spinner } from "@/shared/ui/Helpers";

type Provider = "GROQ" | "GEMINI";

const PROVIDER_INFO = {
  GROQ: {
    label: "Groq",
    url: "https://console.groq.com/keys",
    hint: "Models: llama-3.1-8b-instant, llama-3.3-70b-versatile and more",
    placeholder: "gsk_...",
  },
  GEMINI: {
    label: "Gemini",
    url: "https://aistudio.google.com/app/apikey",
    hint: "Models: gemini-2.0-flash, gemini-1.5-pro and more",
    placeholder: "AIza...",
  },
} as const;

export function ApiKeyPopup() {
  const { t } = useSafeTranslation();
  const { keys, isLoading, upsert, isUpserting, upsertError, remove, toggle } =
    useUserApiKey();

  const [selectedProvider, setSelectedProvider] = useState<Provider>("GROQ");
  const [inputKey, setInputKey] = useState("");

  const currentKey = keys.find((key) => key.provider === selectedProvider);
  const info = PROVIDER_INFO[selectedProvider];

  const handleSave = async () => {
    const trimmedKey = inputKey.trim();
    if (!trimmedKey) return;

    await upsert({ provider: selectedProvider, apiKey: trimmedKey });
    setInputKey("");
  };

  const handleDelete = async () => {
    await remove(selectedProvider);
    setInputKey("");
  };

  const handleToggle = async () => {
    await toggle(selectedProvider);
  };

  return (
    <section className="flex w-full flex-col gap-5 text-(--color-text)">
      <p className="text-sm leading-relaxed text-(--color-fixed-text)">
        {t("analytics.apiKeyDescription")}{" "}
        <a
          href={info.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-(--color-hover) underline transition-all hover:opacity-80"
        >
          {info.label} Console
        </a>
      </p>

      <div className="flex gap-2 max-sm:flex-col">
        {(["GROQ", "GEMINI"] as Provider[]).map((provider) => {
          const providerKey = keys.find((key) => key.provider === provider);
          const isActiveTab = selectedProvider === provider;

          return (
            <button
              key={provider}
              type="button"
              onClick={() => {
                setSelectedProvider(provider);
                setInputKey("");
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-sm font-semibold transition-all cursor-pointer
              ${
                isActiveTab
                  ? "border-(--color-hover) bg-(--color-hover-reverse) text-(--color-text)"
                  : "border-(--color-fixed-text) text-(--color-fixed-text) hover:border-(--color-hover) hover:text-(--color-hover)"
              }`}
            >
              <span>{PROVIDER_INFO[provider].label}</span>
              {providerKey?.isActive && (
                <span className="h-[6px] w-[6px] rounded-full bg-green-500" />
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : currentKey ? (
        <div className="flex items-center justify-between gap-3 rounded-[10px] border border-(--color-fixed-text) bg-(--color-background) p-3 max-sm:flex-col max-sm:items-stretch">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-(--color-text)">
              {currentKey.maskedKey}
            </p>
            <p className="mt-1 text-xs text-(--color-fixed-text)">
              {info.hint}
            </p>
          </div>
          <div className="flex items-center gap-2 self-end max-sm:self-stretch max-sm:justify-between">
            <button
              type="button"
              onClick={() => void handleToggle()}
              className={`relative h-6 w-11 rounded-full border transition-colors cursor-pointer ${
                currentKey.isActive
                  ? "border-(--color-hover) bg-(--color-hover)"
                  : "border-(--color-fixed-text) bg-transparent"
              }`}
              aria-label={`${info.label} toggle`}
            >
              <span
                className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-(--color-card) transition-all ${
                  currentKey.isActive ? "left-[22px]" : "left-[2px]"
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-[10px] border border-red-500 px-3 py-2 text-sm font-semibold text-red-500 transition-all cursor-pointer hover:bg-red-500 hover:text-white"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-[10px] border border-dashed border-(--color-fixed-text) p-3 text-sm italic text-(--color-fixed-text)">
          {info.hint}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <input
          type="password"
          value={inputKey}
          onChange={(e) => {
            setInputKey(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSave();
            }
          }}
          placeholder={
            currentKey ? t("analytics.apiKeyReplace") : info.placeholder
          }
          className="custom-input flex-1"
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isUpserting || !inputKey.trim()}
          className="custom-btn disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUpserting ? t("common.loading") : t("analytics.apiKeySave")}
        </button>
      </div>

      {upsertError && <p className="text-sm text-red-500">{upsertError}</p>}
    </section>
  );
}
