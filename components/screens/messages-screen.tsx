"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Send, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export function MessagesScreen() {
  const { messages, addMessage, setCurrentScreen } = useApp()
  const [newMessage, setNewMessage] = useState("")

  const handleSend = () => {
    if (!newMessage.trim()) return
    
    addMessage({
      id: Date.now().toString(),
      jobId: "1",
      sender: "user",
      text: newMessage,
      timestamp: new Date().toISOString(),
    })
    setNewMessage("")
    
    // Simulate response
    setTimeout(() => {
      addMessage({
        id: (Date.now() + 1).toString(),
        jobId: "1",
        sender: "braxton",
        text: "Thanks for your message! We'll get back to you shortly.",
        timestamp: new Date().toISOString(),
      })
    }, 1000)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="min-h-screen pb-28 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 border-b border-white/10">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Messages</h1>
        <p className="text-sm text-white/60 mt-1">Chat with Braxton Works</p>
      </div>

      {/* Messages */}
      <div className="flex-1 px-6 py-6 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="card-surface rounded-3xl p-8 text-center mt-4">
            <div className="h-14 w-14 rounded-2xl bg-[#F59E0B]/15 flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="h-6 w-6 text-[#F59E0B]" />
            </div>
            <p className="text-[#0F172A] font-medium mb-6">
              No messages yet — submit a job to get started.
            </p>
            <button
              onClick={() => setCurrentScreen("inquiry-type")}
              className="w-full h-12 rounded-xl btn-primary"
            >
              Start an Inquiry
            </button>
          </div>
        ) : messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                message.sender === "user"
                  ? "bg-[#F59E0B] rounded-br-md"
                  : "card-surface rounded-bl-md"
              )}
            >
              <p className={cn(
                "text-[15px]",
                message.sender === "user" ? "text-[#0F172A] font-medium" : "text-[#0F172A]"
              )}>{message.text}</p>
              <p
                className={cn(
                  "text-xs mt-1.5",
                  message.sender === "user" ? "text-[#0F172A]/60" : "text-[#94A3B8]"
                )}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 p-4 rounded-xl input-field placeholder:text-[#94A3B8] focus:outline-none text-[15px]"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="h-14 w-14 rounded-xl btn-primary flex items-center justify-center disabled:cursor-not-allowed active:scale-[0.95] transition-transform"
          >
            <Send className="h-5 w-5 text-[#0F172A]" />
          </button>
        </div>
      </div>
    </div>
  )
}
