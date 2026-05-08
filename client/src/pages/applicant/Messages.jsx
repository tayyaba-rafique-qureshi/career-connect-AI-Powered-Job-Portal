import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, MessageSquare, Send } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'
import { useAuth } from '../../context/AuthContext'
import { bootstrapConversation, getConversations, getMessages, sendMessage } from '../../services/messageService'

const MessagesIllustration = () => (
  <svg width="160" height="140" viewBox="0 0 160 140" fill="none">
    <ellipse cx="80" cy="130" rx="52" ry="7" fill="#EDF3FC" />
    <rect x="20" y="20" width="100" height="68" rx="14" fill="#2557A7" />
    <path d="M38 88 L28 106 L58 92 Z" fill="#2557A7" />
    <circle cx="55" cy="54" r="7" fill="white" opacity="0.9" />
    <circle cx="80" cy="54" r="7" fill="white" opacity="0.9" />
    <circle cx="105" cy="54" r="7" fill="white" opacity="0.9" />
    <rect x="70" y="60" width="76" height="46" rx="10" fill="#E8F0FE" />
    <path d="M126 106 L136 118 L114 106 Z" fill="#E8F0FE" />
    <rect x="82" y="72" width="50" height="5" rx="2.5" fill="#C5D8FA" />
    <rect x="82" y="83" width="36" height="5" rx="2.5" fill="#C5D8FA" />
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
      .catch(() => {})
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
      background: 'linear-gradient(160deg, #EDF3FC 0%, #E4EEF9 25%, #EEF3FA 55%, #F7F9FC 80%, #FFFFFF 100%)',
      fontFamily: '"Noto Sans", "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed', top: '-40px', right: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,205,248,0.45) 0%, transparent 70%)',
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
            backgroundColor: 'rgba(255,255,255,0.6)',
            borderRadius: '8px',
            border: '1px solid rgba(228,226,224,0.7)',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #E4E2E0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#2D2D2D', margin: 0 }}>Messages</h1>
              </div>
            </div>

            {/* Search */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #E4E2E0' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: 'white', borderRadius: '6px',
                padding: '7px 12px', border: '1px solid #E4E2E0',
              }}>
                <Search size={14} color="#767676" />
                <input
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder="Search messages"
                  style={{
                    border: 'none', outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '13px', color: '#2D2D2D',
                    flex: 1, fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Conversations List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#767676', fontSize: '13px' }}>Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '32px 20px', textAlign: 'center',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    backgroundColor: '#E8F0FE', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '10px',
                  }}>
                    <MessageSquare size={20} color="#2557A7" />
                  </div>
                  <p style={{ fontSize: '13px', color: '#767676', margin: 0, lineHeight: 1.5 }}>
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
                        borderBottom: '1px solid #E4E2E0',
                        backgroundColor: isActive ? '#F0F7FF' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => !isActive && (e.currentTarget.style.backgroundColor = 'white')}
                      onMouseLeave={e => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#2D2D2D' }}>{otherUser?.name || 'Unknown'}</span>
                        <span style={{ fontSize: '11px', color: '#767676' }}>
                          {new Date(c.lastMessage?.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#2557A7', fontWeight: '500', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.job?.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#595959', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {String(lastSenderId || '') === String(currentUserId || '') ? 'You: ' : ''}{c.lastMessage?.content}
                        </span>
                        {c.unreadCount > 0 && (
                          <span style={{
                            backgroundColor: '#2557A7', color: 'white',
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
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column',
            height: 'calc(100vh - 100px)',
            overflow: 'hidden'
          }}>
            {!activeConv ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
                <MessagesIllustration />
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#2D2D2D', margin: '24px 0 8px' }}>
                  Welcome to Messages
                </h2>
                <p style={{ fontSize: '14px', color: '#767676', maxWidth: '280px', lineHeight: '1.65', margin: '0 0 16px' }}>
                  When an employer messages you, conversations show up here.
                </p>
                <p style={{ fontSize: '13px', color: '#595959', margin: 0 }}>
                  Applied to a job? Message the employer from your{' '}
                  <Link to="/my-jobs?tab=applied"
                    style={{ color: '#2557A7', textDecoration: 'none', fontWeight: '500' }}
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
                <div style={{ padding: '20px', borderBottom: '1px solid #E4E2E0', backgroundColor: '#FAFAFA' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px', color: '#2D2D2D' }}>
                    {user?.role === 'employer' ? activeConv.applicant?.name : activeConv.employer?.name}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#595959', margin: 0 }}>
                    Regarding: <strong>{activeConv.job?.title}</strong>
                  </p>
                  <p style={{ fontSize: '11px', color: '#137333', margin: '4px 0 0' }}>
                    Online
                  </p>
                </div>

                {/* Chat Messages */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {messages.map((m, i) => {
                    const isMe = m.sender?._id === user?._id || m.sender === user?._id
                    return (
                      <div key={m._id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                        <div style={{
                          backgroundColor: isMe ? '#2557A7' : '#F0F0F0',
                          color: isMe ? 'white' : '#2D2D2D',
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
                          color: '#767676',
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
                <form onSubmit={handleSend} style={{ padding: '20px', borderTop: '1px solid #E4E2E0', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
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
                      border: '1px solid #D4D2D0',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      resize: 'none',
                      minHeight: '44px',
                      maxHeight: '120px',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#2557A7'}
                    onBlur={e => e.currentTarget.style.borderColor = '#D4D2D0'}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      backgroundColor: newMessage.trim() ? '#2557A7' : '#D4D2D0',
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
        ::-webkit-scrollbar-thumb { background: #D4D2D0; border-radius: 3px; }

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
