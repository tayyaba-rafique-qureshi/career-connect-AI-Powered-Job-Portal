/**
 * HelpChatbot.jsx
 * ---------------
 * Reusable chat UI component.
 * Used as:
 *   - A slide-up drawer on the applicant dashboard (mode="drawer")
 *   - A full-page chat on /help (mode="page")
 *
 * Props:
 *   mode        : "drawer" | "page"  (default "drawer")
 *   onClose     : () => void         (drawer only — called when X is clicked)
 */
import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle, RotateCcw } from 'lucide-react'
import { matchIntent, formatBotMessage, SUGGESTED_QUESTIONS } from '../../utils/helpBot'

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%',
          backgroundColor: 'var(--cc-text-4)',
          animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isBot = msg.role === 'bot'

  if (msg.typing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: 'var(--cc-blue-light)', border: '1px solid var(--cc-blue-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: '8px', alignSelf: 'flex-end',
        }}>
          <MessageCircle size={15} style={{ color: 'var(--cc-blue)' }} />
        </div>
        <div style={{
          backgroundColor: 'var(--cc-surface-2)', border: '1px solid var(--cc-border)',
          borderRadius: '16px 16px 16px 4px',
          padding: '10px 14px',
        }}>
          <TypingDots />
        </div>
      </div>
    )
  }

  const lines = formatBotMessage(msg.text)

  return (
    <div style={{
      display: 'flex',
      justifyContent: isBot ? 'flex-start' : 'flex-end',
      marginBottom: '12px',
      alignItems: 'flex-end',
      gap: '8px',
    }}>
      {/* Bot avatar */}
      {isBot && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: 'var(--cc-blue-light)', border: '1px solid var(--cc-blue-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MessageCircle size={15} style={{ color: 'var(--cc-blue)' }} />
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: '78%',
        padding: '10px 14px',
        borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
        backgroundColor: isBot ? 'var(--cc-surface-2)' : 'var(--cc-blue)',
        border: isBot ? '1px solid var(--cc-border)' : 'none',
        color: isBot ? 'var(--cc-text-1)' : 'var(--cc-text-4)',
        fontSize: '13.5px',
        lineHeight: 1.65,
        wordBreak: 'break-word',
      }}>
        {isBot ? (
          // Render bot messages with bold + line breaks
          lines.map((lineParts, li) => (
            <p key={li} style={{ margin: li === 0 ? 0 : '6px 0 0' }}>
              {lineParts.map((part, pi) =>
                part.type === 'bold'
                  ? <strong key={pi}>{part.content}</strong>
                  : <span key={pi}>{part.content}</span>
              )}
            </p>
          ))
        ) : (
          <span>{msg.text}</span>
        )}
      </div>

      {/* User avatar */}
      {!isBot && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: 'var(--cc-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '700', color: 'var(--cc-text-4)',
        }}>
          U
        </div>
      )}
    </div>
  )
}

// ── Suggested question chip ───────────────────────────────────────────────────
function SuggestionChip({ label, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => onClick(label)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '7px 14px',
        borderRadius: '999px',
        border: '1px solid var(--cc-blue-border)',
        backgroundColor: hov ? 'var(--cc-blue-border)' : 'var(--cc-blue-light)',
        color: 'var(--cc-blue)',
        fontSize: '12.5px', fontWeight: '500',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

// ── Main chatbot component ────────────────────────────────────────────────────
const INITIAL_BOT_MSG = {
  id: 0,
  role: 'bot',
  text: `Hi! 👋 I'm the CareerConnect Help Bot. Ask me anything about the app, or tap one of the suggestions below to get started.`,
}

export default function HelpChatbot({ mode = 'drawer', onClose }) {
  const [messages, setMessages] = useState([INITIAL_BOT_MSG])
  const [input, setInput]       = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)
  const msgIdRef                = useRef(1)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setShowSuggestions(false)
    setInput('')

    // Add user message
    const userMsg = { id: msgIdRef.current++, role: 'user', text: trimmed }
    setMessages(prev => [...prev, userMsg])

    // Show typing indicator
    setIsTyping(true)

    // Simulate bot "thinking" delay (300–700ms feels natural)
    const delay = 300 + Math.random() * 400
    setTimeout(() => {
      const response = matchIntent(trimmed)
      setIsTyping(false)
      setMessages(prev => [...prev, { id: msgIdRef.current++, role: 'bot', text: response }])
    }, delay)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleReset = () => {
    setMessages([INITIAL_BOT_MSG])
    setShowSuggestions(true)
    setInput('')
    setIsTyping(false)
    msgIdRef.current = 1
    inputRef.current?.focus()
  }

  const isDrawer = mode === 'drawer'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      fontFamily: '"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
      backgroundColor: 'var(--cc-surface)',
      borderRadius: isDrawer ? '16px 16px 0 0' : '0',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'linear-gradient(135deg, var(--cc-blue-hover) 0%, var(--cc-blue) 100%)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageCircle size={18} style={{ color: 'white' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--cc-text-4)' }}>
              CareerConnect Help
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>
              Instant answers · No wait time
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleReset}
            title="Clear chat"
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: 'none', backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--cc-text-4)',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          >
            <RotateCcw size={14} />
          </button>
          {isDrawer && onClose && (
            <button
              onClick={onClose}
              title="Close"
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: 'none', backgroundColor: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--cc-text-4)',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Messages area ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '16px 16px 8px',
        backgroundColor: 'var(--cc-bg)',
        display: 'flex', flexDirection: 'column',
      }}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: 'var(--cc-blue-light)', border: '1px solid var(--cc-blue-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: '8px', alignSelf: 'flex-end',
            }}>
              <MessageCircle size={15} style={{ color: 'var(--cc-blue)' }} />
            </div>
            <div style={{
              backgroundColor: 'var(--cc-surface-2)', border: '1px solid var(--cc-border)',
              borderRadius: '16px 16px 16px 4px',
              padding: '10px 14px',
            }}>
              <TypingDots />
            </div>
          </div>
        )}

        {/* Suggested chips — shown only at start */}
        {showSuggestions && !isTyping && (
          <div style={{ marginTop: '8px', marginBottom: '4px' }}>
            <p style={{ fontSize: '11px', color: 'var(--cc-text-4)', margin: '0 0 8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suggested questions
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SUGGESTED_QUESTIONS.map(q => (
                <SuggestionChip key={q} label={q} onClick={sendMessage} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 14px',
          borderTop: '1px solid var(--cc-border)',
          backgroundColor: 'var(--cc-surface)',
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question…"
          autoComplete="off"
          style={{
            flex: 1, padding: '9px 14px',
            border: '1px solid var(--cc-input-border)', borderRadius: '999px',
            fontSize: '13.5px', color: 'var(--cc-text-1)',
            outline: 'none', fontFamily: 'inherit',
            backgroundColor: 'var(--cc-input-bg)',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--cc-blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--cc-input-border)'}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          style={{
            width: '38px', height: '38px', borderRadius: '50%',
            border: 'none', flexShrink: 0,
            backgroundColor: input.trim() && !isTyping ? 'var(--cc-blue)' : 'var(--cc-border)',
            color: input.trim() && !isTyping ? 'var(--cc-text-4)' : 'var(--cc-text-4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() && !isTyping ? 'pointer' : 'default',
            transition: 'all 0.15s',
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}
