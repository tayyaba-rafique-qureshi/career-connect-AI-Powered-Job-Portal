/**
 * server/src/routes/paymentRoutes.js
 * ------------------------------------
 * Payment gateway integration for the CareerConnect job-post credit system.
 *
 * POST /api/payments/init        — initiate a payment session with the mock gateway
 * POST /api/payments/verify      — verify a completed payment and credit the account
 * GET  /api/payments/credits     — return the recruiter's current credit balance
 * POST /api/payments/fix-credits — one-time migration for existing accounts
 */

const router  = require('express').Router()
const axios   = require('axios')
const User    = require('../models/User')
const { protect } = require('../middleware/authMiddleware')

// ── Gateway config (read from env at call time so tests can override) ─────────
const gatewayUrl     = () => process.env.MOCK_GATEWAY_ENDPOINT
const gatewayHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-Key':    process.env.MOCK_GATEWAY_API_KEY,
  'X-Guest-ID':   process.env.MOCK_GATEWAY_GUEST_ID,
})

// ── POST /api/payments/init ───────────────────────────────────────────────────
router.post('/init', protect, async (req, res) => {
  try {
    const recruiterId = req.user.id
    const orderId     = `order_${recruiterId}_${Date.now()}`

    console.log('[payments/init] called by:', recruiterId)
    console.log('[payments/init] gateway endpoint:', gatewayUrl())
    console.log('[payments/init] API key present:', !!process.env.MOCK_GATEWAY_API_KEY)
    console.log('[payments/init] guest ID present:', !!process.env.MOCK_GATEWAY_GUEST_ID)

    const { data } = await axios.post(
      `${gatewayUrl()}/init`,
      {
        amount:      999,
        currency:    'PKR',
        order_id:    orderId,
        description: '5 Job Post Credits - CareerConnect',
        success_url: `${process.env.CLIENT_URL}/payment/success`,
        cancel_url:  `${process.env.CLIENT_URL}/payment/cancel`,
        failure_url: `${process.env.CLIENT_URL}/payment/cancel`,
        return_url:  `${process.env.CLIENT_URL}/payment/success`,
      },
      { headers: gatewayHeaders(), timeout: 10000 }
    )

    console.log('[payments/init] gateway response:', JSON.stringify(data))

    // Handle all possible URL key names the gateway might return
    const paymentUrl =
      data?.next_action?.redirect_to_url?.url ||
      data?.payment_url  ||
      data?.paymentUrl   ||
      data?.url          ||
      data?.redirect_url ||
      data?.checkout_url ||
      data?.redirect     ||
      data?.hosted_url

    if (!paymentUrl) {
      console.error('[payments/init] no URL in gateway response:', JSON.stringify(data))
      return res.status(502).json({
        message:         'Payment gateway did not return a redirect URL.',
        gatewayResponse: data,
      })
    }

    await User.findByIdAndUpdate(recruiterId, { pendingOrderId: orderId })

    console.log('[payments/init] redirecting to:', paymentUrl)
    return res.json({ payment_url: paymentUrl, order_id: orderId })

  } catch (err) {
    console.error('[payments/init] gateway error status:', err.response?.status)
    console.error('[payments/init] gateway error data:', JSON.stringify(err.response?.data))
    console.error('[payments/init] error message:', err.message)
    return res.status(502).json({
      message: 'Payment initialization failed. Please try again.',
      detail:  err.response?.data || err.message,
    })
  }
})

// ── POST /api/payments/verify ─────────────────────────────────────────────────
router.post('/verify', protect, async (req, res) => {
  try {
    const { payment_id } = req.body

    if (!payment_id) {
      return res.status(400).json({
        success: false,
        message: 'payment_id is required',
      })
    }

    console.log('[payments/verify] verifying payment_id:', payment_id)

    // ── Idempotency check ───────────────────────────────────────────────────
    // If this payment_id was already processed, return success without
    // adding credits again. This stops React 18 double-mount or page
    // refreshes from crediting the account twice.
    const alreadyProcessed = await User.findOne({
      _id: req.user.id,
      processedPayments: payment_id,
    })

    if (alreadyProcessed) {
      console.log('[payments/verify] already processed, skipping credit:', payment_id)
      return res.json({
        success:          true,
        alreadyProcessed: true,
        message:          'Payment already processed.',
      })
    }
    // ───────────────────────────────────────────────────────────────────────

    const { data } = await axios.get(
      `${gatewayUrl()}/verify/${payment_id}`,
      { headers: gatewayHeaders(), timeout: 10000 }
    )

    console.log('[payments/verify] full gateway response:', JSON.stringify(data))

    // Handle all possible status field names the gateway might return
    const status = (
      data.status         ||
      data.payment_status ||
      data.result         ||
      data.state          ||
      ''
    ).toLowerCase()

    console.log('[payments/verify] resolved status:', status)

    const isSuccess   = ['success', 'completed', 'paid', 'successful', 'approved', 'succeeded']
      .includes(status)
    const isCancelled = ['cancelled', 'canceled', 'abandoned']
      .includes(status)
    const isFailed    = ['failed', 'failure', 'declined', 'rejected']
      .includes(status)

    if (isSuccess) {
      // Atomically add credits AND record payment_id to prevent future double-credits
      await User.findByIdAndUpdate(req.user.id, {
        $inc:  { jobPostCredits: 5 },
        $push: { processedPayments: payment_id },
        pendingOrderId: null,
      })
      console.log('[payments/verify] 5 credits added for recruiter:', req.user.id)
      return res.json({
        success: true,
        message: '5 credits added to your account.',
      })
    }

    if (isCancelled) {
      return res.json({
        success: false,
        reason:  'cancelled',
        message: 'Payment was cancelled.',
      })
    }

    if (isFailed) {
      return res.json({
        success: false,
        reason:  'failed',
        message: 'Payment was declined by the gateway.',
      })
    }

    // Unknown status — return it so we can debug
    console.warn('[payments/verify] unrecognised status:', status)
    return res.json({
      success: false,
      reason:  'unknown',
      message: `Payment could not be confirmed. Status received: "${status}"`,
    })

  } catch (err) {
    console.error('[payments/verify] error:', err.response?.data || err.message)
    return res.status(502).json({
      success: false,
      message: 'Could not verify payment. Please contact support.',
      detail:  err.response?.data || err.message,
    })
  }
})

// ── GET /api/payments/credits ─────────────────────────────────────────────────
router.get('/credits', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('jobPostCredits')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    // Clamp to 0 minimum — never return a negative number to the client
    const credits = Math.max(0, user.jobPostCredits ?? 3)
    return res.json({ credits })
  } catch (err) {
    console.error('[payments/credits] error:', err.message)
    return res.status(500).json({ message: err.message })
  }
})

// ── POST /api/payments/fix-credits ────────────────────────────────────────────
// TEMPORARY — run once to fix existing recruiter accounts created before the
// jobPostCredits field was added. Remove this endpoint after running it once.
router.post('/fix-credits', protect, async (req, res) => {
  try {
    const result = await User.updateMany(
      {
        role: { $in: ['employer', 'recruiter'] },
        $or: [
          { jobPostCredits: { $exists: false } },
          { jobPostCredits: null },
          { jobPostCredits: { $lt: 0 } },
        ],
      },
      { $set: { jobPostCredits: 3 } }
    )
    console.log('[fix-credits] updated', result.modifiedCount, 'accounts')
    return res.json({
      message:      `Credits fixed for ${result.modifiedCount} affected recruiter account(s).`,
      modifiedCount: result.modifiedCount,
    })
  } catch (err) {
    console.error('[fix-credits] error:', err.message)
    return res.status(500).json({ message: err.message })
  }
})

module.exports = router