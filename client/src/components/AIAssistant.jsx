import { useEffect, useRef, useState } from 'react'
import { Bot, Send, X } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I am the GPro assistant. Ask about leave, payroll, attendance, or HR policies.' },
  ])
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async (e) => {
    e?.preventDefault()
    const message = input.trim()
    if (!message || sending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: message }])
    setSending(true)
    try {
      const { data } = await api.post('/ai/chat', { message })
      const reply =
        data?.data?.reply ||
        data?.data?.message ||
        data?.data?.response ||
        (typeof data?.data === 'string' ? data.data : null) ||
        'I could not generate a response.'
      setMessages((m) => [...m, { role: 'bot', text: reply }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'bot', text: getErrorMessage(err, 'AI service unavailable.') }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button type="button" className="ai-fab" onClick={() => setOpen((o) => !o)} aria-label="AI Assistant">
        {open ? <X size={24} /> : <Bot size={24} />}
      </button>
      {open && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <h3>GPro AI Assistant</h3>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ color: 'white' }}>
              <X size={18} />
            </button>
          </div>
          <div className="ai-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.text}
              </div>
            ))}
            {sending && <div className="ai-msg bot">Thinking…</div>}
            <div ref={endRef} />
          </div>
          <form className="ai-input-row" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              disabled={sending}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
