/**
 * AIMatchBadge
 * sm  – compact pill used in job cards (top-right overlay)
 * lg  – full "score section" card used inside the right details pane
 */
export default function AIMatchBadge({ score, size = 'sm' }) {
  if (score === null || score === undefined) return null

  // Color tiers
  const tier =
    score >= 80 ? 'green'
    : score >= 60 ? 'yellow'
    : 'gray'

  const palette = {
    green:  { bg: 'var(--cc-green-bg)', color: 'var(--cc-green)', label: 'Great match!' },
    yellow: { bg: 'var(--cc-amber-bg)', color: 'var(--cc-amber)', label: 'Good match' },
    gray:   { bg: 'var(--cc-surface-2)', color: 'var(--cc-text-3)', label: 'Partial match' },
  }[tier]

  /* ── Small pill (used in job cards) ── */
  if (size === 'sm') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '22px',
        padding: '0 8px',
        borderRadius: '11px',
        backgroundColor: palette.bg,
        color: palette.color,
        fontSize: '12px',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}>
        {score}% match
      </span>
    )
  }

  /* ── Large score badge (used at top of match section) ── */
  if (size === 'score') {
    return (
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}>
        <div style={{
          width: '80px',
          height: '72px',
          borderRadius: '12px',
          backgroundColor: palette.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '4px',
          overflow: 'hidden',
        }}>
          <span style={{ fontSize: '16px', fontWeight: '800', color: palette.color, lineHeight: 1, textAlign: 'center', whiteSpace: 'nowrap', display: 'block' }}>
            {score}%
          </span>
          <span style={{ fontSize: '10px', fontWeight: '600', color: palette.color, lineHeight: 1, letterSpacing: '0.05em', textAlign: 'center', display: 'block' }}>
            MATCH
          </span>
        </div>
        <span style={{ fontSize: '13px', fontWeight: '600', color: palette.color }}>
          {palette.label}
        </span>
      </div>
    )
  }

  /* ── lg (legacy compat - same as score) ── */
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 14px',
      borderRadius: '20px',
      backgroundColor: palette.bg,
      color: palette.color,
      fontSize: '14px',
      fontWeight: '700',
    }}>
      {score >= 80 ? '🎯' : score >= 60 ? '📊' : '📋'} {score}% match — {palette.label}
    </span>
  )
}
