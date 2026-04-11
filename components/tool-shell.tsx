"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useGlobalHistory } from "./data-context";
import { parseEntries, type ParsedEntry } from "@/lib/data-parser";

interface ToolShellProps {
  title: string;
  desc?: string;
  minEntries?: number;
  noAutoFill?: boolean;
  children: (props: {
    data: ParsedEntry[];
    localInput: string;
    setLocalInput: (s: string) => void;
    toast: string;
    showToast: (msg: string) => void;
  }) => ReactNode;
}

export function ToolShell({
  title,
  desc,
  minEntries = 2,
  noAutoFill,
  children,
}: ToolShellProps) {
  const { historyText, parsedData: globalData } = useGlobalHistory();
  const [localInput, setLocalInput] = useState("");
  const [data, setData] = useState<ParsedEntry[]>([]);
  const [toast, setToast] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const initRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  // Auto-fill from global history on first mount
  useEffect(() => {
    if (!noAutoFill && !initRef.current && globalData.length >= minEntries) {
      initRef.current = true;
      setData(globalData);
      setLocalInput(historyText);
    }
  }, [globalData, historyText, minEntries, noAutoFill]);

  // Listen for global history updates
  useEffect(() => {
    if (!noAutoFill && globalData.length >= minEntries) {
      setData(globalData);
    }
  }, [globalData, noAutoFill, minEntries]);

  // Process local input with debounce
  const handleInput = useCallback(
    (text: string) => {
      setLocalInput(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const parsed = parseEntries(text);
        if (parsed.length >= minEntries) {
          setData(parsed);
        }
      }, 400);
    },
    [minEntries]
  );

  return (
    <div className="space-y-4">
      {children({ data, localInput, setLocalInput: handleInput, toast, showToast })}

      {/* Toast */}
      <div
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white shadow-2xl transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        ✅ {toast}
      </div>
    </div>
  );
}

/* Shared data input textarea */
export function DataInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold uppercase tracking-wide text-ink/60">
        วางข้อมูลที่นี่
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onChange(value);
          }
        }}
        placeholder={
          placeholder ??
          "ตัวอย่าง:\n2026-01-21\t'320\t'57\n2026-01-20\t'995\t'10"
        }
        className="h-44 w-full rounded-xl border border-ink/15 bg-white p-3 font-mono text-xs leading-relaxed text-ink outline-none transition focus:border-pine/60 focus:ring-2 focus:ring-pine/20"
      />
      <p className="text-[10px] text-ink/50">
        💡 วางข้อมูลจาก Excel แล้วระบบจะคำนวณอัตโนมัติ (หรือกด Enter)
      </p>
    </div>
  );
}
