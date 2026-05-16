/**
 * resumeTemplate.jsx
 * ------------------
 * Shared ATS-friendly resume preview component.
 * Used by ResumeBuilderPage (live preview panel) and
 * ResumePreviewModal (full-screen view / download trigger).
 *
 * Props:
 *   resume  — the full resume state object
 *   forPrint — boolean; when true, removes wrapper scroll constraints (for PDF/print)
 */
import { FileText } from 'lucide-react'

function SectionLine({ title, accentColor = '#000' }) {
  return (
    <div style={{ margin: '16px 0 8px' }}>
      <p style={{
        margin: 0, fontSize: '11px', fontWeight: '800',
        color: accentColor, textTransform: 'uppercase', letterSpacing: '0.12em',
        fontFamily: '"Times New Roman", Times, serif',
      }}>{title}</p>
      <div style={{ height: '1.5px', backgroundColor: accentColor, marginTop: '3px' }} />
    </div>
  )
}

export default function ATSPreview({ resume, forPrint = false }) {
  const { personalInfo: pi, summary, skills, workExperience, projects, education, certifications } = resume
  const accentColor = resume?.accentColor || '#000'

  const hasContent = pi?.fullName || pi?.email || summary || skills?.length > 0

  if (!hasContent) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center', color: '#9CA3AF' }}>
        <FileText size={48} color="#E4E2E0" style={{ margin: '0 auto 16px', display: 'block' }} />
        <p style={{ fontSize: '14px', margin: 0 }}>
          Start filling in the sections on the left to see your resume preview here.
        </p>
      </div>
    )
  }

  const baseStyle = {
    fontFamily: '"Times New Roman", Times, serif',
    fontSize: '12px',
    color: '#000',
    padding: forPrint ? '0' : '32px 36px',
    lineHeight: 1.55,
    backgroundColor: 'white',
    minHeight: forPrint ? 'auto' : '100%',
  }

  return (
    <div id="ats-resume-content" style={baseStyle}>
      {/* ── Name ── */}
      {pi?.fullName && (
        <h1 style={{
          margin: '0 0 5px', fontSize: '22px', fontWeight: '800',
          textAlign: 'center', letterSpacing: '0.02em', color: accentColor,
          fontFamily: '"Times New Roman", Times, serif',
        }}>
          {pi.fullName}
        </h1>
      )}

      {/* ── Contact line ── */}
      {(pi?.email || pi?.phone || pi?.location || pi?.linkedin) && (
        <p style={{
          margin: '0 0 2px', textAlign: 'center',
          fontSize: '10.5px', color: '#333',
          fontFamily: '"Times New Roman", Times, serif',
        }}>
          {[pi.phone, pi.email, pi.location, pi.linkedin].filter(Boolean).join('  ·  ')}
        </p>
      )}

      {/* ── Summary ── */}
      {summary && (
        <>
          <SectionLine title="Professional Summary" accentColor={accentColor} />
          <p style={{ margin: 0, textAlign: 'justify', fontSize: '11px' }}>{summary}</p>
        </>
      )}

      {/* ── Skills ── */}
      {skills?.length > 0 && (
        <>
          <SectionLine title="Skills" accentColor={accentColor} />
          <p style={{ margin: 0, fontSize: '11px' }}>{skills.join('  ·  ')}</p>
        </>
      )}

      {/* ── Work Experience ── */}
      {workExperience?.some(e => e.jobTitle || e.company) && (
        <>
          <SectionLine title="Work Experience" accentColor={accentColor} />
          {workExperience.filter(e => e.jobTitle || e.company).map((e, i) => (
            <div key={i} style={{ marginBottom: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '11.5px' }}>{e.jobTitle}</strong>
                <span style={{ fontSize: '10.5px', color: '#555', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                  {e.startDate}{e.startDate ? ' – ' : ''}{e.current ? 'Present' : e.endDate}
                </span>
              </div>
              {e.company && (
                <div style={{ fontStyle: 'italic', color: '#444', fontSize: '11px', marginBottom: '3px' }}>
                  {e.company}
                </div>
              )}
              {e.bullets?.filter(b => b.trim()).map((b, bi) => (
                <div key={bi} style={{ display: 'flex', gap: '5px', marginTop: '2px', fontSize: '11px', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, marginTop: '1px' }}>•</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* ── Projects ── */}
      {projects?.some(p => p.name) && (
        <>
          <SectionLine title="Projects" accentColor={accentColor} />
          {projects.filter(p => p.name).map((p, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '11.5px' }}>{p.name}</strong>
                {p.link && (
                  <span style={{ fontSize: '9.5px', color: '#555', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {p.link}
                  </span>
                )}
              </div>
              {p.techStack && (
                <div style={{ fontStyle: 'italic', color: '#444', fontSize: '11px', marginBottom: '2px' }}>
                  Tech: {p.techStack}
                </div>
              )}
              {p.description && (
                <div style={{ fontSize: '11px' }}>{p.description}</div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── Education ── */}
      {education?.some(e => e.degree || e.institution) && (
        <>
          <SectionLine title="Education" accentColor={accentColor} />
          {education.filter(e => e.degree || e.institution).map((e, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '11.5px' }}>{e.degree}</strong>
                <span style={{ fontSize: '10.5px', color: '#555', whiteSpace: 'nowrap', marginLeft: '8px' }}>{e.year}</span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#444', fontSize: '11px' }}>
                {e.institution}{e.cgpa ? `  ·  CGPA: ${e.cgpa}` : ''}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Certifications ── */}
      {certifications?.some(c => c.name) && (
        <>
          <SectionLine title="Certifications" accentColor={accentColor} />
          {certifications.filter(c => c.name).map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
              <span>
                <strong>{c.name}</strong>
                {c.issuer ? `  ·  ${c.issuer}` : ''}
              </span>
              <span style={{ fontSize: '10.5px', color: '#555', whiteSpace: 'nowrap', marginLeft: '8px' }}>{c.year}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
