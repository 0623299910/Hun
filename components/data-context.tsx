"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { parseEntries, type ParsedEntry } from "@/lib/data-parser";

const STORAGE_KEY = "hun.globalHistoryData";
const EVENT_NAME = "hun-global-history-updated";
const MAX_LINES = 250;

interface DataContextValue {
  historyText: string;
  setHistoryText: (text: string) => void;
  saveHistory: () => void;
  clearHistory: () => void;
  parsedData: ParsedEntry[];
  lineCount: number;
}

const DataContext = createContext<DataContextValue | null>(null);

function limitLines(text: string, max = MAX_LINES): string {
  return text.split(/\r?\n/).slice(0, max).join("\n");
}

function countLines(text: string): number {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [historyText, setRawText] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) || "";
    setRawText(saved);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRawText(e.newValue || "");
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.text !== undefined) setRawText(detail.text);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT_NAME, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENT_NAME, onCustom as EventListener);
    };
  }, []);

  const setHistoryText = useCallback((t: string) => {
    setRawText(limitLines(t, MAX_LINES));
  }, []);

  const saveHistory = useCallback(() => {
    const limited = limitLines(historyText, MAX_LINES);
    setRawText(limited);
    window.localStorage.setItem(STORAGE_KEY, limited);
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { text: limited } })
    );
  }, [historyText]);

  const clearHistory = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setRawText("");
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { text: "" } })
    );
  }, []);

  const parsedData = useMemo(() => parseEntries(historyText), [historyText]);
  const lineCount = useMemo(() => countLines(historyText), [historyText]);

  const value = useMemo(
    () => ({
      historyText,
      setHistoryText,
      saveHistory,
      clearHistory,
      parsedData,
      lineCount,
    }),
    [historyText, setHistoryText, saveHistory, clearHistory, parsedData, lineCount]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useGlobalHistory() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useGlobalHistory must be used within DataProvider");
  return ctx;
}
