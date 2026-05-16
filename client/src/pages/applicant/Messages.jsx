import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, MessageSquare, Send } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'
import { useAuth } from '../../context/AuthContext'
import { bootstrapConversation, getConversations, getMessages, sendMessage } from '../../services/messageService'

const MessagesIllustration = () => (
  <svg width="160" height="140" viewBox="0 0 160 140" fill="none">
    <ellipse cx="80" cy="130" rx="52" ry="7" fill="var(--cc-blue-light)" />
    <rect x="20" y="20" width="100" height="68" rx="14" fill="var(--cc-blue)" />
    <path d="M38 88 L28 106 L58 92 Z" fill="var(--cc-blue)" />
    <circle cx="55" cy="54" r="7" fill="white" opacity="0.9" />
    <circle cx="80" cy="54" r="7" fill="white" opacity="0.9" />
    <circle cx="105" cy="54" r="7" fill="white" opacity="0.9" />
    <rect x="70" y="60" width="76" height="46" rx="10" fill="var(--cc-blue-light)" />
    <path d="M126 106 L136 118 L114 106 Z" fill="var(--cc-blue-light)" />
    <rect x="82" y="72" width="50" height="5" rx="2.5" fill="var(--cc-blue-border)" />
    <rect x="82" y="83" width="36" height="5" rx="2.5" fill="var(--cc-blue-border)" />
  </svg>
)

export default function Messages({ showNavbar = true }) {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [searchVal, setSearchVal] = useState('')
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const currentUserId = user?.id || user?._id
  const isEmployerSide = user?.role === 'employer' || user?.role === 'recruiter'

  const fetchConversations = async () => {
    try {
      const data = await getConversations()
      setConversations(data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  // Deep-link into a conversation (even if no messages exist yet)
  useEffect(() => {
    const jobId = searchParams.get('jobId')
    const applicantId = searchParams.get('applicantId')
    const employerId = searchParams.get('employerId')
    if (!jobId || !applicantId || !employerId) return

    bootstrapConversation({ jobId, applicantId, employerId })
      .then(conv => setActiveConv(conv))
      .catch(() => setActiveConv(null))
  }, [searchParams])

  useEffect(() => {
    if (!activeConv) return
    const fetchMsgs = async () => {
      try {
        const data = await getMessages(activeConv.conversationId)
        setMessages(data)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } catch (err) {
        console.error(err)
        setMessages([])
        setActiveConv(null)
      }
    }
    fetchMsgs()
    const interval = setInterval(fetchMsgs, 5000) // Poll active chat every 5s
    return () => clearInterval(interval)
  }, [activeConv])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv) return
    const content = newMessage.trim()
    setNewMessage('')
    try {
      const msg = await sendMessage({
        jobId: activeConv.job._id,
        applicantId: activeConv.applicant._id,
        employerId: activeConv.employer._id,
        content
      })
      setMessages(prev => [...prev, msg])
      fetchConversations()
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      console.error(err)
    }
  }

  const filteredConversations = conversations.filter(c => {
    const otherUser = isEmployerSide ? c.applicant : c.employer
    const name = otherUser?.name || ''
    const jobTitle = c.job?.title || ''
    const s = searchVal.toLowerCase()
    return name.toLowerCase().includes(s) || jobTitle.toLowerCase().includes(s)
  })

  return (
    <div className="messages-root" style={{
      minHeight: '100vh',
      background: 'var(--cc-bg-gradient)',
      fontFamily: '"Noto Sans", "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed', top: '-40px', right: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {showNavbar && <Navbar />}

      <div
        className="messages-stage"
        style={{
          paddingTop: showNavbar ? '60px' : '0px',
          display: 'flex',
          justifyContent: 'center',
          height: showNavbar ? '100vh' : 'auto',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div className="messages-shell" style={{
          maxWidth: '1240px', width: '100%',
          padding: '20px 40px 0',
          display: 'flex', gap: '16px', alignItems: 'flex-start',
        }}>

          {/* ── LEFT SIDEBAR ── */}
          <div className="messages-left" style={{
            width: '30%', minWidth: '300px', flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            height: 'calc(100vh - 100px)',
            backgroundColor: 'var(--cc-surface-2)',
            borderRadius: '8px',
            border: '1px solid var(--cc-border)',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--cc-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--cc-text-1)', margin: 0 }}>Messages</h1>
              </div>
            </div>

            {/* Search */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--cc-border)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: 'var(--cc-surface)', borderRadius: '6px',
                padding: '7px 12px', border: '1px solid var(--cc-border)',
              }}>
                <Search size={14} color="var(--cc-text-3)" />
                <input
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder="Search messages"
                  style={{
                    border: 'none', outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '13px', color: 'var(--cc-text-1)',
                    flex: 1, fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Conversations List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--cc-text-3)', fontSize: '13px' }}>Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '32px 20px', textAlign: 'center',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    backgroundColor: 'var(--cc-blue-light)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '10px',
                  }}>
                    <MessageSquare size={20} color="var(--cc-blue)" />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--cc-text-3)', margin: 0, lineHeight: 1.5 }}>
                    No conversations yet
                  </p>
                </div>
              ) : (
                filteredConversations.map(c => {
                  const otherUser = isEmployerSide ? c.applicant : c.employer
                  const isActive = activeConv?.conversationId === c.conversationId
                  const lastSenderId = typeof c.lastMessage?.sender === 'object'
                    ? c.lastMessage?.sender?._id
                    : c.lastMessage?.sender
                  return (
                    <div
                      key={c.conversationId}
                      onClick={() => setActiveConv(c)}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--cc-border)',
                        backgroundColor: isActive ? 'var(--cc-blue-light)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => !isActive && (e.currentTarget.style.backgroundColor = 'var(--cc-surface)')}
                      onMouseLeave={e => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cc-text-1)' }}>{otherUser?.name || 'Unknown'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--cc-text-3)' }}>
                          {new Date(c.lastMessage?.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--cc-blue)', fontWeight: '500', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.job?.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--cc-text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {String(lastSenderId || '') === String(currentUserId || '') ? 'You: ' : ''}{c.lastMessage?.content}
                        </span>
                        {c.unreadCount > 0 && (
                          <span style={{
                            backgroundColor: 'var(--cc-blue)', color: 'white',
                            fontSize: '10px', fontWeight: '700', padding: '2px 6px',
                            borderRadius: '10px', marginLeft: '8px'
                          }}>
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ── RIGHT PANE ── */}
          <div className="messages-right" style={{
            width: '70%',
            backgroundColor: 'var(--cc-surface)',
            borderRadius: '8px',
            boxShadow: 'var(--cc-shadow-md)',
            display: 'flex', flexDirection: 'column',
            height: 'calc(100vh - 100px)',
            overflow: 'hidden'
          }}>
            {!activeConv ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
                <MessagesIllustration />
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '24px 0 8px' }}>
                  Welcome to Messages
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--cc-text-3)', maxWidth: '280px', lineHeight: 1.65, margin: '0 0 16px' }}>
                  When an employer messages you, conversations show up here.
                </p>
                <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: 0 }}>
                  Applied to a job? Message the employer from your{' '}
                  <Link to="/my-jobs?tab=applied"
                    style={{ color: 'var(--cc-blue)', textDecoration: 'none', fontWeight: '500' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
                    applied jobs
                  </Link>.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid var(--cc-border)', backgroundColor: 'var(--cc-surface-2)' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px', color: 'var(--cc-text-1)' }}>
                    {isEmployerSide ? activeConv.applicant?.name : activeConv.employer?.name}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: 0 }}>
                    Regarding: <strong>{activeConv.job?.title}</strong>
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--cc-green)', margin: '4px 0 0' }}>
                    Online
                  </p>
                </div>

                {/* Chat Messages */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {messages.map((m, i) => {
                    const senderId = typeof m.sender === 'object' ? m.sender?._id : m.sender
                    const isMe = String(senderId || '') === String(currentUserId || '')
                    return (
                      <div key={m._id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                        <div style={{
                          backgroundColor: isMe ? 'var(--cc-blue)' : 'var(--cc-surface-2)',
                          color: isMe ? 'white' : 'var(--cc-text-1)',
                          padding: '12px 16px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          fontSize: '14px',
                          lineHeight: 1.5
                        }}>
                          {m.content}
                        </div>
                        <p style={{
                          margin: '4px 2px 0',
                          fontSize: '11px',
                          color: 'var(--cc-text-3)',
                          textAlign: isMe ? 'right' : 'left',
                        }}>
                          {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSend} style={{ padding: '20px', borderTop: '1px solid var(--cc-border)', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(e)
                      }
                    }}
                    style={{
                      flex: 1,
                      border: '1px solid var(--cc-input-border)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      color: 'var(--cc-text-1)',
                      backgroundColor: 'var(--cc-input-bg)',
                      resize: 'none',
                      minHeight: '44px',
                      maxHeight: '120px',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--cc-blue)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--cc-input-border)'}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      backgroundColor: newMessage.trim() ? 'var(--cc-blue)' : 'var(--cc-border)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      flexShrink: 0, transition: 'background 0.2s'
                    }}
                  >
                    <Send size={18} style={{ marginLeft: '2px' }} />
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: var(--cc-scrollbar); border-radius: 3px; }

        @media (max-width: 768px) {
          .messages-stage { height: auto !important; min-height: calc(100vh - 60px); }
          .messages-shell { flex-direction: column; padding: 16px !important; }
          .messages-left { width: 100% !important; height: 40vh !important; }
          .messages-right { width: 100% !important; height: 55vh !important; }
        }
      `}</style>
    </div>
  )
}
