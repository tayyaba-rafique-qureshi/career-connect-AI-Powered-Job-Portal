/**
 * helpBot.js
 * ----------
 * Pure keyword/intent matching FAQ engine — no external API.
 * Each intent has a list of trigger keywords and a response string.
 * matchIntent(input) returns the best matching response or a fallback.
 */

const INTENTS = [
  {
    id: 'apply',
    keywords: ['apply', 'application', 'submit', 'applying', 'how to apply', 'apply for a job', 'apply now'],
    response: `To apply for a job on CareerConnect:

1. Browse jobs on your dashboard and click any listing to open it.
2. Click **"Apply now"** — a modal will appear showing your AI match score, matched and missing skills.
3. Review your resume (or upload one if you haven't yet).
4. Optionally add a cover letter (up to 500 characters).
5. Click **"Submit Application"**.

You can track all your applications under **My Jobs → Applied**.`,
  },
  {
    id: 'ai_score',
    keywords: ['ai score', 'match score', 'score calculated', 'how is my score', 'match percentage', 'ai match', 'calculated', 'score work', 'score mean', 'match calculated'],
    response: `Your **AI match score** (0–100%) is calculated by comparing your profile and resume against the job's requirements across four factors:

• **Skills (60%)** — how many required skills appear in your profile and resume
• **Experience (25%)** — your years of experience vs. what the role expects
• **Semantics (10%)** — how closely your resume language matches the job description
• **Tools (5%)** — specific tools and technologies mentioned in both

💡 Adding missing skills to your profile is the fastest way to improve your score. Click **"How is this calculated?"** on any job listing for a visual breakdown.`,
  },
  {
    id: 'resume_build',
    keywords: ['build resume', 'create resume', 'update resume', 'upload resume', 'resume builder', 'resume upload', 'change resume', 'new resume', 'resume file', 'pdf'],
    response: `To upload or update your resume:

1. Go to **Profile** (click your avatar → My Profile).
2. Scroll to the **Resume** section.
3. Click **Upload Resume** and select a text-based PDF file.
4. The AI will automatically extract your skills and experience.

⚠️ Make sure your PDF is text-based (not a scanned image) so the AI can read it. Image-based PDFs won't extract correctly.

You can also swap your resume directly from the Apply modal by clicking **"Change"** next to your current resume.`,
  },
  {
    id: 'update_profile',
    keywords: ['update profile', 'edit profile', 'change profile', 'profile settings', 'my profile', 'profile info', 'update skills', 'add skills', 'change name', 'profile picture'],
    response: `To update your profile:

1. Click your avatar in the top-right navbar and select **My Profile**.
2. You can edit:
   - **Basic info** — name, headline, location
   - **Skills** — add or remove skills (this directly affects your AI match score)
   - **Work experience** — add past roles and years
   - **Education** — degrees and institutions
   - **Resume** — upload a new PDF
   - **Preferences** — preferred job type, work mode, and locations

Changes are saved automatically when you click **Save** on each section.`,
  },
  {
    id: 'missing_skills',
    keywords: ['missing skills', 'skills missing', 'what are missing skills', 'missing skill', 'skills i dont have', 'skill gap', 'required skills', 'skills needed'],
    response: `**Missing skills** are the skills listed in a job's requirements that weren't found in your profile or resume.

They appear in the red column of the AI match section when you open a job listing or the Apply modal.

To improve your match:
• Add the missing skills to your profile if you actually have them
• Upload an updated resume that mentions those skills
• Use the **Career Advice** feature (available on job listings) for a personalised learning path

Adding missing skills can significantly boost your AI match score for that role.`,
  },
  {
    id: 'dislike',
    keywords: ['dislike', 'hide job', 'not interested', 'remove job', 'thumbs down', 'hide', 'dismiss job', 'dont show', "don't show"],
    response: `To hide a job you're not interested in:

1. Click the **thumbs-down icon** (👎) on any job card in the list, or in the job details panel.
2. The job will fade out and disappear from your feed.
3. A toast notification will appear at the bottom — click **"Undo"** within 5 seconds to restore it.

Hidden jobs are saved to your account so they won't reappear when you refresh.`,
  },
  {
    id: 'download_resume',
    keywords: ['download resume', 'get resume', 'export resume', 'save resume', 'resume download', 'download my resume', 'view resume'],
    response: `To download your resume:

1. Go to **Profile → Resume section**.
2. Click the **Download** button next to your uploaded resume file.

Your resume is stored securely in the app. Recruiters can also download it when reviewing your application — you'll see a note in your application status when they do.`,
  },
  {
    id: 'support',
    keywords: ['contact support', 'support', 'help email', 'contact us', 'report problem', 'bug', 'issue', 'feedback', 'get help', 'reach out'],
    response: `Need more help? You can reach our support team at:

📧 **support@careerconnect.com**

We typically respond within 1–2 business days. When writing in, please include:
- Your account email
- A brief description of the issue
- Any error messages you saw

For urgent issues, mention "URGENT" in the subject line.`,
  },
  {
    id: 'saved_jobs',
    keywords: ['save job', 'saved jobs', 'bookmark', 'saved', 'my saved', 'unsave', 'remove saved'],
    response: `To save a job:

1. Click the **bookmark icon** on any job card or in the job details panel.
2. Saved jobs appear under **My Jobs → Saved**.

To remove a saved job, click the bookmark icon again (it will turn blue when saved). You can also manage saved jobs from the My Jobs page.`,
  },
  {
    id: 'notifications',
    keywords: ['notification', 'notifications', 'alerts', 'bell', 'unread', 'email notification'],
    response: `Notifications appear in the **bell icon** in the top navbar. You'll receive notifications for:

• Application status updates (Reviewed, Interview scheduled, Offer, Rejection)
• Messages from recruiters
• New job matches based on your profile

Click the bell to view all notifications. Unread ones are highlighted — click any to mark it as read.`,
  },
  {
    id: 'messages',
    keywords: ['message', 'messages', 'chat', 'recruiter message', 'inbox', 'send message', 'reply'],
    response: `To view and send messages:

1. Click the **chat icon** in the top navbar, or go to **Messages** from the mobile menu.
2. You'll see all conversations with recruiters.
3. Click any conversation to read and reply.

Recruiters can initiate conversations after reviewing your application. You can reply directly from the Messages page.`,
  },
  {
    id: 'greet',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'howdy', 'sup', 'greetings'],
    response: `Hi there! 👋 I'm the CareerConnect Help Bot. I can answer questions about applying for jobs, your AI match score, your profile, and more.

Try asking something like:
• "How do I apply for a job?"
• "What is my AI match score?"
• "How do I upload my resume?"`,
  },
  {
    id: 'thanks',
    keywords: ['thank', 'thanks', 'thank you', 'thx', 'cheers', 'great', 'helpful', 'perfect'],
    response: `You're welcome! 😊 Is there anything else I can help you with?`,
  },
]

// Suggested chips shown on first open
export const SUGGESTED_QUESTIONS = [
  'How do I apply for a job?',
  'How is my AI score calculated?',
  'How do I upload my resume?',
  'What does "Missing Skills" mean?',
  'How do I hide a job?',
]

const FALLBACK = `I couldn't find an answer to that. You can email us at **support@careerconnect.com** and we'll get back to you within 1–2 business days.`

/**
 * matchIntent(input: string) → string
 * Returns the best matching response for the user's input.
 */
export function matchIntent(input) {
  if (!input?.trim()) return FALLBACK

  const lower = input.toLowerCase().trim()

  // Score each intent by counting keyword hits
  let bestScore = 0
  let bestResponse = null

  for (const intent of INTENTS) {
    let score = 0
    for (const kw of intent.keywords) {
      if (lower.includes(kw)) {
        // Longer keyword matches score higher (more specific)
        score += kw.split(' ').length
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestResponse = intent.response
    }
  }

  return bestScore > 0 ? bestResponse : FALLBACK
}

/**
 * formatBotMessage(text: string) → array of { type, content } segments
 * Converts **bold** markdown and newlines into renderable segments.
 * Used by the chat bubble renderer.
 */
export function formatBotMessage(text) {
  // Split on newlines first, then handle **bold** within each line
  return text.split('\n').map(line => {
    const parts = []
    const regex = /\*\*(.+?)\*\*/g
    let last = 0
    let match
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push({ type: 'text', content: line.slice(last, match.index) })
      parts.push({ type: 'bold', content: match[1] })
      last = match.index + match[0].length
    }
    if (last < line.length) parts.push({ type: 'text', content: line.slice(last) })
    return parts
  })
}
