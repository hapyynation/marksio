"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, X, Bot, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  sender: "ai" | "user"
  text: string
}

export default function AIChatCard({ className, onClose }: { className?: string; onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "ai", text: "👋 Merhaba! Ben Mark, AI pazarlama asistanınızım. Kampanya, segment veya otomasyon konusunda yardımcı olabilirim." },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return
    const userMsg = input.trim()
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }])
    setInput("")
    setIsTyping(true)

    try {
      const res = await fetch("/api/groq/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { sender: "user", text: userMsg }].map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })) }),
      })

      if (!res.ok) throw new Error("API error")
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let aiText = ""
      setMessages((prev) => [...prev, { sender: "ai", text: "" }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === "[DONE]") continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content || ""
            aiText += delta
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = { sender: "ai", text: aiText }
              return updated
            })
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", text: "Üzgünüm, bir hata oluştu. Tekrar deneyin." }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className={cn("relative w-full h-full flex flex-col bg-[#0f0f0f] rounded-xl border border-[#222] overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1e1e1e] bg-[#111]">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Mark AI</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Çevrimiçi
          </p>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-[#222]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}
          >
            {msg.sender === "ai" && (
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            <div className={cn(
              "px-3 py-2 rounded-xl max-w-[80%] text-sm leading-relaxed",
              msg.sender === "ai"
                ? "bg-[#1a1a1a] text-gray-200 border border-[#2a2a2a]"
                : "bg-blue-600 text-white"
            )}>
              {msg.text || <span className="opacity-50">...</span>}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 block"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#1e1e1e] bg-[#111] flex items-center gap-2">
        <input
          className="flex-1 px-3 py-2 text-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
          placeholder="Mesajınızı yazın..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
