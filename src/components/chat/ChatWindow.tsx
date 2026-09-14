"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessageData } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { MessageInput } from "./MessageInput";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { Loader2, MessageSquare } from "lucide-react";

interface ChatWindowProps {
  channelId: string;
  channelName: string;
  onlineUsersCount: number;
}

export function ChatWindow({ channelId, channelName, onlineUsersCount }: ChatWindowProps) {
  const { messages, loading, sendMessage } = useRealtimeMessages(channelId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, movieData?: any, fileData?: { file: File, previewUrl: string } | null) => {
    try {
      setIsSending(true);
      await sendMessage(content, movieData, fileData);
    } catch (error) {
      console.error("Failed to send", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="h-16 border-b flex items-center px-6 justify-between z-10 shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{channelName}</h2>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] space-y-3">
            <div className="p-4 rounded-full" style={{ background: 'rgba(240, 100, 73, 0.08)' }}>
              <MessageSquare className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <MessageInput onSendMessage={handleSendMessage} disabled={isSending} />
      </div>
    </div>
  );
}

