/**
 * Email Service — CareerConnect
 *
 * Current implementation: Gmail via Nodemailer (development/demo)
 * Intended production upgrade: Resend (resend.com)
 *   - Better deliverability, 3000 emails/month free
 *   - Drop-in replacement: swap transporter with Resend SDK
 */

const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

// ─── Core send function ───────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `CareerConnect <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html
    })
    console.log(`[Email] Sent "${subject}" → ${to}`)
  } catch (err) {
    // Fire-and-forget: log but never crash the main request
    console.error(`[Email] Failed to send "${subject}" → ${to}:`, err.message)
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

const base = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #2557A7; padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: -0.3px; }
    .header span { color: #a8c4f0; font-size: 13px; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .body h2 { font-size: 18px; color: #111; margin-top: 0; }
    .btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: #2557A7; color: #fff !important; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 14px; }
    .footer { padding: 20px 32px; background: #f9f9f9; border-top: 1px solid #eee; font-size: 12px; color: #999; }
    .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .tag-green { background: #dcfce7; color: #166534; }
    .tag-red { background: #fee2e2; color: #991b1b; }
    .tag-blue { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>CareerConnect</h1>
      <span>AI-Powered Job Portal</span>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      © ${new Date().getFullYear()} CareerConnect. This is an automated message, please do not reply.<br/>
      <em>Note: Currently using Gmail for development. Production will use Resend for scalable delivery.</em>
    </div>
  </div>
</body>
</html>`

// ─── Email senders ─────────────────────────────────────────────────────────────

exports.sendWelcomeEmail = (user) => sendMail({
  to: user.email,
  subject: 'Welcome to CareerConnect 🎉',
  html: base(`
    <h2>Welcome, ${user.name}!</h2>
    <p>Your account has been created successfully as a <strong>${user.role}</strong>.</p>
    <p>CareerConnect uses AI to match you with the best opportunities. Complete your profile to get started.</p>
    <a href="${process.env.CLIENT_URL}" class="btn">Go to Dashboard</a>
    <p style="margin-top:24px; color:#666; font-size:13px;">If you didn't create this account, please ignore this email.</p>
  `)
})

exports.sendOnboardingCompleteEmail = (user) => sendMail({
  to: user.email,
  subject: 'Your CareerConnect profile is ready ✅',
  html: base(`
    <h2>Profile Complete, ${user.name}!</h2>
    <p>Your profile has been set up successfully. Our AI engine will now start matching you with relevant jobs.</p>
    <p>Here's what happens next:</p>
    <ul>
      <li>Browse AI-matched job listings</li>
      <li>Apply with one click using your saved profile</li>
      <li>Track your applications in real time</li>
    </ul>
    <a href="${process.env.CLIENT_URL}/jobs" class="btn">Browse Jobs</a>
  `)
})

exports.sendApplicationConfirmEmail = ({ applicant, job }) => sendMail({
  to: applicant.email,
  subject: `Application submitted — ${job.title} at ${job.company}`,
  html: base(`
    <h2>Application Received</h2>
    <p>Hi <strong>${applicant.name}</strong>,</p>
    <p>Your application for <strong>${job.title}</strong> at <strong>${job.company}</strong> has been submitted successfully.</p>
    <p>Your AI match score for this role: <strong style="color:#2557A7">${job.aiScore ? (job.aiScore * 100).toFixed(0) + '%' : 'Calculating...'}</strong></p>
    <p>You'll be notified when the employer reviews your application.</p>
    <a href="${process.env.CLIENT_URL}/dashboard/applicant" class="btn">View My Applications</a>
  `)
})

exports.sendStatusUpdateEmail = ({ applicant, job, status }) => {
  const statusConfig = {
    accepted: { tag: 'tag-green', label: 'Accepted 🎉', message: 'Congratulations! The employer has accepted your application. They will be in touch with next steps shortly.' },
    rejected: { tag: 'tag-red',   label: 'Not Selected', message: 'Thank you for your interest. Unfortunately, the employer has decided to move forward with other candidates. Keep applying — the right opportunity is out there.' },
    reviewed: { tag: 'tag-blue',  label: 'Under Review', message: 'Good news — the employer is actively reviewing your application.' }
  }
  const cfg = statusConfig[status] || statusConfig.reviewed

  return sendMail({
    to: applicant.email,
    subject: `Application update — ${job.title} at ${job.company}`,
    html: base(`
      <h2>Application Status Update</h2>
      <p>Hi <strong>${applicant.name}</strong>,</p>
      <p>Your application for <strong>${job.title}</strong> at <strong>${job.company}</strong> has been updated:</p>
      <p><span class="tag ${cfg.tag}">${cfg.label}</span></p>
      <p>${cfg.message}</p>
      <a href="${process.env.CLIENT_URL}/dashboard/applicant" class="btn">View Application</a>
    `)
  })
}

exports.sendNewApplicationEmail = ({ employer, applicant, job }) => sendMail({
  to: employer.email,
  subject: `New application for ${job.title}`,
  html: base(`
    <h2>New Application Received</h2>
    <p>Hi <strong>${employer.name}</strong>,</p>
    <p><strong>${applicant.name}</strong> has applied for <strong>${job.title}</strong>.</p>
    <p>AI Match Score: <strong style="color:#2557A7">${job.aiScore ? (job.aiScore * 100).toFixed(0) + '%' : 'Calculating...'}</strong></p>
    <a href="${process.env.CLIENT_URL}/dashboard/recruiter" class="btn">Review Application</a>
  `)
})

exports.sendJobMatchEmail = ({ applicant, job }) => sendMail({
  to: applicant.email,
  subject: `New ${job.title} job in ${job.location || 'your area'}`,
  html: base(`
    <h2>A New Job Matches Your Preferences!</h2>
    <p>Hi <strong>${applicant.name}</strong>,</p>
    <p>A new role has been posted that matches your profile:</p>
    <div style="background:#f8f9fa; border-radius:8px; padding:16px; margin:16px 0;">
      <p style="margin:0 0 4px; font-size:16px; font-weight:700; color:#1A1A2E;">${job.title}</p>
      <p style="margin:0 0 4px; color:#595959;">${job.company}</p>
      <p style="margin:0; color:#767676;">📍 ${job.location || 'Remote'} · ${(job.jobType || []).join(', ')} · ${job.workMode || 'remote'}</p>
    </div>
    <a href="${process.env.CLIENT_URL}/dashboard/applicant" class="btn">View Job</a>
    <p style="margin-top:20px; color:#999; font-size:12px;">You're receiving this because your preferences match this job. <a href="${process.env.CLIENT_URL}/profile" style="color:#2557A7;">Update preferences</a></p>
  `)
})

exports.sendPasswordResetEmail = ({ user, resetUrl }) => sendMail({
  to: user.email,
  subject: 'Reset your CareerConnect password',
  html: base(`
    <h2>Password Reset Request</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to set a new one:</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p style="margin-top:24px; color:#666; font-size:13px;">
      This link expires in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.
    </p>
    <p style="color:#999; font-size:12px; margin-top:16px;">
      If the button doesn't work, copy and paste this link:<br/>
      <a href="${resetUrl}" style="color:#2557A7; word-break:break-all;">${resetUrl}</a>
    </p>
  `)
})
