"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GLOBAL_HISTORY_STORAGE_KEY,
  GLOBAL_HISTORY_UPDATED_EVENT,
  countNonEmptyLines,
} from "@/lib/global-history";

type LegacyRuntimeProps = {
  html: string;
  toolSlug: string;
};

type ParsedScript = {
  src?: string;
  content?: string;
  type?: string;
};

type ParsedHtml = {
  bodyHtml: string;
  bodyClassName: string;
  bodyStyle: string;
  links: string[];
  styles: string[];
  scripts: ParsedScript[];
};

function shouldSkipScript(src?: string, content?: string): boolean {
  if (src) {
    return src.includes("/cdn-cgi/");
  }

  if (!content) {
    return false;
  }

  return content.includes("__CF$cv$params") || content.includes("challenge-platform/scripts/jsd");
}

function shouldExecuteScript(type?: string): boolean {
  const normalized = (type || "text/javascript").toLowerCase();
  return (
    normalized === "" ||
    normalized.includes("javascript") ||
    normalized.includes("ecmascript") ||
    normalized.includes("module") ||
    normalized.includes("babel")
  );
}

function injectInlineScript(code: string, type?: string): HTMLScriptElement {
  const script = document.createElement("script");
  if ((type || "").toLowerCase().includes("module")) {
    script.type = "module";
  }
  script.text = code;
  document.body.appendChild(script);
  return script;
}

function bindLegacyInlineEvents(root: HTMLElement): Array<() => void> {
  const cleanups: Array<() => void> = [];
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  for (const element of elements) {
    const attrs = Array.from(element.attributes).filter((attr) => attr.name.startsWith("on"));

    for (const attr of attrs) {
      const eventName = attr.name.slice(2).toLowerCase();
      const handlerCode = attr.value.trim();
      if (!eventName || !handlerCode) {
        continue;
      }

      element.removeAttribute(attr.name);

      const listener = (event: Event) => {
        try {
          const run = new Function(
            "event",
            `with(window){ return (function(){ ${handlerCode} }).call(this); }`,
          ) as (this: HTMLElement, event: Event) => unknown;

          const result = run.call(element, event);
          if (result === false) {
            event.preventDefault();
            event.stopPropagation();
          }
        } catch {
          // Keep legacy page interactive even if one inline handler fails.
        }
      };

      element.addEventListener(eventName, listener);
      cleanups.push(() => element.removeEventListener(eventName, listener));
    }
  }

  return cleanups;
}

function looksLikeOutputField(el: HTMLInputElement | HTMLTextAreaElement): boolean {
  const identity = `${el.id} ${el.name} ${el.className} ${el.placeholder}`.toLowerCase();
  return /(result|output|summary|copy|export|readonly)/.test(identity) || el.readOnly;
}

function pickBestDataInput(root: HTMLElement): HTMLInputElement | HTMLTextAreaElement | null {
  const fields = Array.from(
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("textarea, input[type='text']"),
  ).filter((field) => !looksLikeOutputField(field));

  if (fields.length === 0) {
    return null;
  }

  const scored = fields
    .map((field) => {
      const identity = `${field.id} ${field.name} ${field.className} ${field.placeholder}`.toLowerCase();
      const value = field.value || "";
      const score =
        (field.tagName === "TEXTAREA" ? 120 : 0) +
        (/(input|data|history|raw|paste|result)/.test(identity) ? 80 : 0) +
        Math.min((field.getAttribute("rows") ? Number(field.getAttribute("rows")) : 0) * 5, 40) +
        Math.min(value.length, 30);
      return { field, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.field || null;
}

function triggerLegacyCalculation(root: HTMLElement): void {
  const fnNames = [
    "analyzeBottomTwo",
    "processData",
    "executeCalculation",
    "handleAnalyze",
    "calculate",
    "loadData",
    "handleImport",
    "renderAll",
    "calculateResults",
  ] as const;

  for (const fnName of fnNames) {
    const candidate = (window as Window & Record<string, unknown>)[fnName];
    if (typeof candidate !== "function") {
      continue;
    }

    try {
      (candidate as () => void)();
      return;
    } catch {
      // Try next compatible function.
    }
  }

  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
  const actionBtn = buttons.find((button) =>
    /(คำนวณ|วิเคราะห์|ประมวลผล|analyze|calculate|process|import)/i.test(button.textContent || ""),
  );

  actionBtn?.click();
}

const AUTO_HISTORY_DISABLED_SLUGS = new Set([
  "017-random-one",
  "018-random-two",
  "022-luck-meter",
  "legacy-cloud-sim",
  "legacy-gpt-sim",
  "legacy-simulator",
]);

function applyGlobalHistoryToTool(root: HTMLElement, toolSlug: string): void {
  if (AUTO_HISTORY_DISABLED_SLUGS.has(toolSlug)) {
    return;
  }

  const history = window.localStorage.getItem(GLOBAL_HISTORY_STORAGE_KEY) || "";
  if (!history || countNonEmptyLines(history) === 0) {
    return;
  }

  const targetInput = pickBestDataInput(root);
  if (!targetInput) {
    return;
  }

  if (targetInput.value !== history) {
    targetInput.value = history;
    targetInput.dispatchEvent(new Event("input", { bubbles: true }));
    targetInput.dispatchEvent(new Event("change", { bubbles: true }));
    targetInput.dispatchEvent(new Event("paste", { bubbles: true }));
  }

  triggerLegacyCalculation(root);
}

declare global {
  interface Window {
    __legacyLoadedScripts?: Set<string>;
    Babel?: {
      transform: (code: string, options: { presets: string[] }) => { code: string };
    };
  }
}

function parseLegacyHtml(html: string): ParsedHtml {
  if (typeof window === "undefined") {
    return {
      bodyHtml: html,
      bodyClassName: "",
      bodyStyle: "",
      links: [],
      styles: [],
      scripts: [],
    };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
    .map((el) => el.getAttribute("href") || "")
    .filter(Boolean);

  const styles = Array.from(doc.querySelectorAll("style"))
    .map((el) => el.textContent || "")
    .filter(Boolean);

  const scripts: ParsedScript[] = Array.from(doc.querySelectorAll("script"))
    .map((el) => ({
      src: el.getAttribute("src") || undefined,
      content: el.textContent || undefined,
      type: (el.getAttribute("type") || "text/javascript").toLowerCase(),
    }))
    .filter((script) => !shouldSkipScript(script.src, script.content))
    .filter((script) => shouldExecuteScript(script.type));

  doc.querySelectorAll("script").forEach((el) => el.remove());

  return {
    bodyHtml: doc.body?.innerHTML || html,
    bodyClassName: doc.body?.className || "",
    bodyStyle: doc.body?.getAttribute("style") || "",
    links,
    styles,
    scripts,
  };
}

async function loadExternalScript(src: string): Promise<void> {
  if (src.startsWith("/_sdk/")) {
    return;
  }

  if (!window.__legacyLoadedScripts) {
    window.__legacyLoadedScripts = new Set<string>();
  }

  if (window.__legacyLoadedScripts.has(src)) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => {
      window.__legacyLoadedScripts?.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

export function LegacyRuntime({ html, toolSlug }: LegacyRuntimeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const parsed = useMemo(() => parseLegacyHtml(html), [html]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    if (wrapperRef.current) {
      if (parsed.bodyStyle) {
        wrapperRef.current.setAttribute("style", parsed.bodyStyle);
      } else {
        wrapperRef.current.removeAttribute("style");
      }
    }

    mountRef.current.innerHTML = parsed.bodyHtml;

    const inlineEventCleanups = bindLegacyInlineEvents(mountRef.current);
    let canceled = false;

    const injectedScripts: HTMLScriptElement[] = [];

    const runScripts = async () => {
      for (const script of parsed.scripts) {
        if (canceled) {
          return;
        }

        try {
          if (script.src) {
            await loadExternalScript(script.src);
            continue;
          }

          const content = script.content?.trim();
          if (!content) {
            continue;
          }

          if (script.type?.includes("babel") && window.Babel) {
            const transformed = window.Babel.transform(content, { presets: ["react"] });
            injectedScripts.push(injectInlineScript(transformed.code, "text/javascript"));
            continue;
          }

          injectedScripts.push(injectInlineScript(content, script.type));
        } catch {
          // Keep the page usable even if one legacy script fails.
        }
      }

      // Some legacy pages attach logic on DOMContentLoaded/load.
      document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true }));
      window.dispatchEvent(new Event("load"));

      if (!canceled && mountRef.current) {
        applyGlobalHistoryToTool(mountRef.current, toolSlug);
      }
    };

    void runScripts();

    const onGlobalHistoryUpdated = () => {
      if (!mountRef.current) {
        return;
      }

      applyGlobalHistoryToTool(mountRef.current, toolSlug);
    };

    window.addEventListener(GLOBAL_HISTORY_UPDATED_EVENT, onGlobalHistoryUpdated as EventListener);

    return () => {
      canceled = true;
      window.removeEventListener(GLOBAL_HISTORY_UPDATED_EVENT, onGlobalHistoryUpdated as EventListener);
      inlineEventCleanups.forEach((cleanup) => cleanup());
      injectedScripts.forEach((script) => script.remove());
    };
  }, [parsed.bodyHtml, parsed.scripts, toolSlug]);

  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft">
      {isHydrated && parsed.links.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {isHydrated && parsed.styles.map((style, index) => (
        <style key={`${index}-${style.length}`} dangerouslySetInnerHTML={{ __html: style }} />
      ))}

      <div ref={wrapperRef} className={parsed.bodyClassName}>
        <div ref={mountRef} />
      </div>
    </section>
  );
}