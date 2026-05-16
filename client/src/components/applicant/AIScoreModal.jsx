/**
 * AIScoreModal
 * Explains how the AI match score is calculated.
 * Uses recharts (already installed) for the visual breakdown bar.
 */
import { X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const FACTORS = [
  { name: 'Skills',     weight: 60, color: '#22C55E', desc: 'How many of the job\'s required skills appear in your profile and resume.' },
  { name: 'Experience', weight: 25, color: '#3B82F6', desc: 'Your years of experience and seniority level vs. what the role expects.' },
  { name: 'Semantics',  weight: 10, color: '#A855F7', desc: 'How closely your resume language matches the job description vocabulary.' },
  { name: 'Tools',      weight: 5,  color: '#F59E0B', desc: 'Specific tools and technologies mentioned in both your profile and the job.' },
]

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--cc-surface)', border: '1px solid var(--cc-border)',
      borderRadius: '8px', padding: '10px 14px',
      boxShadow: 'var(--cc-shadow-md)',
      maxWidth: '200px', fontSize: '12px', color: 'var(--cc-text-2)',
    }}>
      <p style={{ fontWeight: '700', marginBottom: '4px', color: 'var(--cc-text-1)' }}>{d.name} — {d.weight}%</p>
      <p style={{ margin: 0, lineHeight: 1.5 }}>{d.desc}</p>
    </div>
  )
}

export default function AIScoreModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--cc-overlay)' }}
        onClick={onClose}
      />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        backgroundColor: 'var(--cc-surface)', borderRadius: '16px',
        boxShadow: 'var(--cc-shadow-lg)',
        width: '100%', maxWidth: '480px',
        fontFamily: '"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--cc-border)',
          background: 'var(--cc-bg-gradient)',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--cc-text-1)' }}>
              How is my AI score calculated?
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--cc-text-3)' }}>
              Four factors combine to produce your match percentage
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cc-text-3)', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--cc-surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {/* Summary sentence */}
          <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', lineHeight: 1.65, margin: '0 0 18px' }}>
            Your AI match score compares your <strong>skills</strong>, <strong>experience</strong>,
            resume language, and tools against the job's requirements. Skills carry the most
            weight — adding missing skills to your profile is the fastest way to improve your score.
          </p>

          {/* Bar chart */}
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--cc-text-3)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Score breakdown (hover for details)
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={FACTORS}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 10 }}
                barSize={18}
              >
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: 'var(--cc-text-4)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--cc-text-2)', fontWeight: 600 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="weight" radius={[0, 6, 6, 0]} label={{ position: 'right', formatter: v => `${v}%`, fontSize: 12, fill: 'var(--cc-text-3)' }}>
                  {FACTORS.map(f => <Cell key={f.name} fill={f.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Factor cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FACTORS.map(f => (
              <div key={f.name} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                backgroundColor: 'var(--cc-surface-2)', border: '1px solid var(--cc-border)',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                  backgroundColor: f.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: f.color }}>{f.weight}%</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--cc-text-1)' }}>{f.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cc-text-3)', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            marginTop: '16px', padding: '12px 14px',
            backgroundColor: 'var(--cc-blue-light)', borderRadius: '8px',
            border: '1px solid var(--cc-blue-border)',
            fontSize: '12px', color: 'var(--cc-blue)', lineHeight: 1.6,
          }}>
            💡 <strong>Tip:</strong> Keep your profile skills up to date and upload a text-based PDF resume for the most accurate score.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 22px', borderTop: '1px solid var(--cc-border)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: '8px',
              backgroundColor: 'var(--cc-blue)', color: 'var(--cc-text-4)',
              border: 'none', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue)'}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
