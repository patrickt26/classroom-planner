"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render(
    container: HTMLDivElement,
    options: {
      sitekey: string;
      appearance: "interaction-only";
      size: "compact";
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      "timeout-callback": () => void;
      "response-field": false;
    },
  ): string;
  remove(widget: string): void;
};

export function Turnstile({
  siteKey,
  nonce,
  onVerify,
  onError,
}: {
  siteKey: string;
  nonce?: string;
  onVerify: (token: string) => void;
  onError: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [documentNonce, setDocumentNonce] = useState<string>();

  useEffect(() => {
    // A navegação do App Router mantém a CSP do documento original.
    const script = document.querySelector<HTMLScriptElement>("script[nonce]");
    setDocumentNonce(script?.nonce || nonce);
  }, [nonce]);

  useEffect(() => {
    if (!ready || !container.current) return;
    const api = (window as Window & { turnstile?: TurnstileApi }).turnstile;
    if (!api) {
      onError();
      return;
    }
    const widget = api.render(container.current, {
      sitekey: siteKey,
      appearance: "interaction-only",
      size: "compact",
      callback: onVerify,
      "error-callback": onError,
      "expired-callback": onError,
      "timeout-callback": onError,
      "response-field": false,
    });
    return () => api.remove(widget);
  }, [ready, siteKey, onVerify, onError]);

  return (
    <>
      <div ref={container} className="empty:hidden" />
      {documentNonce && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          nonce={documentNonce}
          onReady={() => setReady(true)}
          onError={onError}
        />
      )}
    </>
  );
}
