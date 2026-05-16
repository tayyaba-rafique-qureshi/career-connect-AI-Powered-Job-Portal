const Message = require('../models/Message')
const User = require('../models/User')
const Job = require('../models/Job')
const Notification = require('../models/Notification')
const Application = require('../models/Application')

function safeConvId(jobId, applicantId, employerId) {
  return `${jobId}_${applicantId}_${employerId}`
}

function parseConvId(conversationId) {
  const [jobId, applicantId, employerId] = String(conversationId || '').split('_')
  return { jobId, applicantId, employerId }
}

async function authorizeConversation({ jobId, applicantId, employerId, userId }) {
  if (!jobId || !applicantId || !employerId) {
    const err = new Error('jobId, applicantId, and employerId are required')
    err.status = 400
    throw err
  }

  if (![String(applicantId), String(employerId)].includes(String(userId))) {
    const err = new Error('Not authorized')
    err.status = 403
    throw err
  }

  const [job, application, applicant, employer] = await Promise.all([
    Job.findOne({ _id: jobId, postedBy: employerId }).select('title company postedBy'),
    Application.findOne({ job: jobId, applicant: applicantId }).select('_id'),
    User.findById(applicantId).select('name avatar role'),
    User.findById(employerId).select('name avatar role'),
  ])

  if (!job) {
    const err = new Error('Job not found')
    err.status = 404
    throw err
  }
  if (!application) {
    const err = new Error('Conversation is only available for this job application')
    err.status = 403
    throw err
  }
  if (!applicant || !employer) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }

  return { job, applicant, employer, conversationId: safeConvId(jobId, applicantId, employerId) }
}

// GET /api/messages/conversations — Get all conversations for the logged-in user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id
    
    // Find all messages where the user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
    .populate('job', 'title company')
    .populate('applicant', 'name avatar')
    .populate('employer', 'name avatar')
    .sort({ createdAt: -1 })

    // Group by conversationId
    const conversationsMap = new Map()
    for (const msg of messages) {
      if (!conversationsMap.has(msg.conversationId)) {
        conversationsMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          job: msg.job,
          applicant: msg.applicant,
          employer: msg.employer,
          lastMessage: msg,
          unreadCount: 0
        })
      }
      if (msg.receiver.toString() === userId && !msg.read) {
        conversationsMap.get(msg.conversationId).unreadCount += 1
      }
    }

    const conversations = Array.from(conversationsMap.values())
    res.json(conversations)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/messages/:conversationId — Get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    await authorizeConversation({ ...parseConvId(conversationId), userId })

    const messages = await Message.find({
      conversationId,
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 })

    // Mark as read
    await Message.updateMany(
      { conversationId, receiver: userId, read: false },
      { $set: { read: true } }
    )

    res.json(messages)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

// GET /api/messages/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user.id, read: false })
    res.json({ count })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PATCH /api/messages/:id/read
exports.markMessageRead = async (req, res) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.id, receiver: req.user.id },
      { $set: { read: true } },
      { new: true }
    )
    if (!msg) return res.status(404).json({ message: 'Message not found' })
    res.json({ message: 'Message marked as read' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/messages — Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { jobId, applicantId, employerId, content } = req.body
    const senderId = req.user.id

    if (!jobId || !applicantId || !employerId || !content) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const authorized = await authorizeConversation({ jobId, applicantId, employerId, userId: senderId })
    const receiverId = String(senderId) === String(applicantId) ? employerId : applicantId
    const conversationId = authorized.conversationId

    const msg = await Message.create({
      conversationId,
      job: jobId,
      applicant: applicantId,
      employer: employerId,
      sender: senderId,
      receiver: receiverId,
      content
    })

    const populatedMsg = await Message.findById(msg._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')

    // Create a notification for the receiver (fire-and-forget)
    try {
      const sender = await User.findById(senderId).select('name')
      await Notification.create({
        user: receiverId,
        type: 'general',
        title: 'New message',
        message: `${sender?.name || 'Someone'}: ${String(content).slice(0, 80)}${String(content).length > 80 ? '…' : ''}`,
        link: `/messages?jobId=${jobId}&applicantId=${applicantId}&employerId=${employerId}`,
      })
    } catch {
      // ignore notification failures
    }

    res.status(201).json(populatedMsg)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

// GET /api/messages/bootstrap?jobId=&applicantId=&employerId=
// Returns the conversation header data even if there are zero messages.
exports.bootstrapConversation = async (req, res) => {
  try {
    const { jobId, applicantId, employerId } = req.query
    const userId = req.user.id

    if (!jobId || !applicantId || !employerId) {
      return res.status(400).json({ message: 'jobId, applicantId, and employerId are required' })
    }

    const { job, applicant, employer, conversationId } = await authorizeConversation({ jobId, applicantId, employerId, userId })

    res.json({
      conversationId,
      job,
      applicant,
      employer,
      lastMessage: null,
      unreadCount: 0,
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}
