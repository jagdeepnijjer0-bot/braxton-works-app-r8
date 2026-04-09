"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

export function MessagesScreen() {
  const { messages, addMessage } = useApp()
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
    <div className="min-h-screen pb-24 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 border-b border-[#E8ECF0] bg-white/95 backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Messages</h1>
        <p className="text-sm text-[#5A6A7A] mt-1">Chat with Braxton Works</p>
      </div>

      {/* Messages */}
      <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
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
                  ? "bg-[#6CB4EE] text-white rounded-br-md"
                  : "bg-white border border-[#E8ECF0] text-[#1E1E1E] rounded-bl-md shadow-sm"
              )}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={cn(
                  "text-xs mt-1",
                  message.sender === "user" ? "text-white/70" : "text-[#9CA3AF]"
                )}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[#E8ECF0] bg-white/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 p-3 rounded-xl border border-[#E8ECF0] bg-white text-[#1E1E1E] placeholder:text-[#9CA3AF] focus:border-[#6CB4EE] focus:ring-1 focus:ring-[#6CB4EE]/20 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="h-12 w-12 rounded-xl bg-[#6CB4EE] hover:bg-[#5AA3DD] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
