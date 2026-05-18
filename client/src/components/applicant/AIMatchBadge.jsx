/**
 * AIMatchBadge
 * sm    – compact pill used in job cards (location row)
 * score – large box used at top of match section in JobDetails
 * lg    – legacy compat pill
 */
export default function AIMatchBadge({ score, size = 'sm' }) {
  if (score === null || score === undefined) return null

  /* ── Small pill (used in job cards) ── */
  if (size === 'sm') {
    // Round to whole number for display
    const pct = Math.round(score)

    // 4-tier color coding
    let bg, color, border, dot
    if (pct >= 75) {
      bg = '#dcfce7'; color = '#16a34a'; border = '#bbf7d0'; dot = '#16a34a'
    } else if (pct >= 50) {
      bg = '#fef9c3'; color = '#ca8a04'; border = '#fde68a'; dot = '#ca8a04'
    } else if (pct >= 25) {
      bg = '#ffedd5'; color = '#ea580c'; border = '#fed7aa'; dot = '#ea580c'
    } else {
      bg = '#fee2e2'; color = '#dc2626'; border = '#fecaca'; dot = '#dc2626'
    }

    return (
      <span style={{
        display:         'inline-flex',
        alignItems:      'center',
        gap:             '5px',
        height:          '22px',
        padding:         '0 8px',
        borderRadius:    '11px',
        backgroundColor: bg,
        color,
        border:          `1px solid ${border}`,
        fontSize:        '12px',
        fontWeight:      '600',
        whiteSpace:      'nowrap',
        lineHeight:       1,
        flexShrink:       0,
      }}>
        {/* Colored dot */}
        <span style={{
          width:           '6px',
          height:          '6px',
          borderRadius:    '50%',
          backgroundColor: dot,
          flexShrink:       0,
          display:         'inline-block',
        }} />
        {pct}% match
      </span>
    )
  }

  // palette used by score and lg variants
  const tier =
    score >= 80 ? 'green'
    : score >= 60 ? 'yellow'
    : 'gray'

  const palette = {
    green:  { bg: 'var(--cc-green-bg)', color: 'var(--cc-green)', label: 'Great match!' },
    yellow: { bg: 'var(--cc-amber-bg)', color: 'var(--cc-amber)', label: 'Good match' },
    gray:   { bg: 'var(--cc-surface-2)', color: 'var(--cc-text-3)', label: 'Partial match' },
  }[tier]

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
