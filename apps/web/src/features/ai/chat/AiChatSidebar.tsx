import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { aiChatApi } from './ai-chat.api'
import { cn } from '@/lib/utils'
import type { AiMessage } from '@adinsight/shared-types'

export function AiChatSidebar() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const chatMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: AiMessage[] }) =>
      aiChatApi.chat(message, history),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Erro ao processar resposta'
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }])
    },
  })

  const analyzeMutation = useMutation({
    mutationFn: aiChatApi.analyze,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: 'Faça uma análise completa das campanhas dos últimos 30 dias.' },
        { role: 'assistant', content: data.analysis },
      ])
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Erro na análise'
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }])
    },
  })

  function handleSend() {
    const text = input.trim()
    if (!text || chatMutation.isPending) return
    const newMessages: AiMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    chatMutation.mutate({ message: text, history: messages })
  }

  const isLoading = chatMutation.isPending || analyzeMutation.isPending

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          title="AdInsight Analyst"
        >
          <Bot className="w-5 h-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[600px] sm:h-[calc(100vh-5rem)] sm:bottom-4 sm:right-4 bg-card border border-border sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">AdInsight Analyst</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => analyzeMutation.mutate()}
                disabled={isLoading}
                title="Análise completa"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                Analisar
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <Bot className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Olá! Sou o AdInsight Analyst.</p>
                <p className="text-xs text-muted-foreground">Pergunte sobre performance de campanhas, orçamento, ROAS ou clique em "Analisar" para uma análise completa.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm',
                )}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border p-3 bg-card">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
                placeholder="Pergunte sobre suas campanhas..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
