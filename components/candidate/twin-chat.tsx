"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { chatWithTwin } from "@/lib/api";

// A simple chat interface for interacting with a candidate's digital twin. The twin is
// a conversational agent that can answer questions about the candidate's profile, but
// it does not have access to any private data from the account or other candidates.
type Message = { role: "user" | "twin"; text: string };

export function TwinChat({ candidateId, candidateName }: { candidateId: number; candidateName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setSending(true);
    try {
      const { reply } = await chatWithTwin(candidateId, userMessage);
      setMessages((prev) => [...prev, { role: "twin", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "twin", text: "Sorry, I couldn't respond just now." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface flex flex-col h-96">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-display text-sm font-medium">Chat with {candidateName}&apos;s digital twin</p>
        <p className="text-xs text-muted">Answers are grounded in their profile — not a live conversation with them.</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-xs text-muted">Ask something like &quot;Tell me about your experience with Python.&quot;</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm max-w-[85%] rounded-lg px-3 py-2 ${
            m.role === "user" ? "bg-amber text-[#1A1204] self-end" : "bg-bg text-text self-start"
          }`}>
            {m.text}
          </div>
        ))}
        {sending && <p className="text-xs text-muted self-start">Thinking...</p>}
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber"
        />
        <button type="submit" disabled={sending} className="w-9 h-9 rounded-lg bg-amber flex items-center justify-center disabled:opacity-50">
          <Send className="w-4 h-4 text-[#1A1204]" />
        </button>
      </form>
    </div>
  );
}