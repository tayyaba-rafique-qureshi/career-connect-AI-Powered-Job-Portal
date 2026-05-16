import { X, Mail, Phone, MapPin, Briefcase, GraduationCap, Link as LinkIcon, Award } from 'lucide-react'

export default function ApplicantProfileModal({ application, onClose }) {
  const { applicant } = application
  const profile = applicant?.applicantProfile || {}
  const basic   = profile.basicInfo || {}
  const pro     = profile.professionalInfo || {}
  const prefs   = profile.preferences || {}
  const resume  = profile.resume || {}

  const initials = applicant?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#2557A7] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {applicant?.avatar
                ? <img src={applicant.avatar} alt={applicant.name} className="w-full h-full rounded-full object-cover" />
                : initials}
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1A1A2E]">{applicant?.name}</h2>
              <p className="text-sm text-[#595959]">{pro.currentTitle || 'No title set'}</p>
              {basic.location && (
                <p className="text-xs text-[#595959] flex items-center gap-1 mt-0.5">
                  <MapPin size={11} />{basic.location}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-[#595959] hover:text-[#1A1A2E] mt-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Contact */}
          <div className="flex flex-wrap gap-4 text-sm text-[#595959]">
            {applicant?.email && (
              <a href={`mailto:${applicant.email}`} className="flex items-center gap-1.5 hover:text-[#2557A7]">
                <Mail size={14} />{applicant.email}
              </a>
            )}
            {basic.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={14} />{basic.phone}
              </span>
            )}
          </div>

          {/* AI Match Score */}
          {application.matchScore != null && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs font-semibold text-[#595959]">AI Match Score</span>
              <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                application.matchScore >= 80 ? 'bg-green-100 text-green-700' :
                application.matchScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {application.matchScore}%
              </span>
              {application.totalSkills > 0 && (
                <span className="text-xs text-[#595959]">
                  {application.skillsMatched}/{application.totalSkills} skills matched
                </span>
              )}
            </div>
          )}

          {/* Professional Info */}
          {(pro.yearsOfExp || pro.industry || pro.educationLevel) && (
            <div>
              <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide mb-2">Experience</h3>
              <div className="space-y-1 text-sm text-[#595959]">
                {pro.yearsOfExp && <p className="flex items-center gap-2"><Briefcase size={13} />{pro.yearsOfExp} years of experience</p>}
                {pro.industry   && <p className="flex items-center gap-2"><Briefcase size={13} />Industry: {pro.industry}</p>}
                {pro.educationLevel && <p className="flex items-center gap-2"><GraduationCap size={13} />{pro.educationLevel}{pro.fieldOfStudy ? ` — ${pro.fieldOfStudy}` : ''}</p>}
              </div>
            </div>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(s => {
                  const name = typeof s === 'string' ? s : s.name
                  const isMatched = application.matchedSkills?.includes(name.toLowerCase())
                  return (
                    <span key={name} className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      isMatched ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-[#595959]'
                    }`}>
                      {name}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {application.missingSkills?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide mb-2">Missing Skills</h3>
              <div className="flex flex-wrap gap-2">
                {application.missingSkills.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Profile summary */}
          {profile.profileSummary && (
            <div>
              <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide mb-2">Summary</h3>
              <p className="text-sm text-[#595959] leading-relaxed">{profile.profileSummary}</p>
            </div>
          )}

          {/* Certifications */}
          {profile.certifications?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide mb-2">Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map(c => (
                  <span key={c} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
                    <Award size={11} />{c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-4 text-sm">
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[#2557A7] hover:underline">
                <LinkIcon size={13} />LinkedIn
              </a>
            )}
            {profile.portfolioUrl && (
              <a href={profile.portfolioUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[#2557A7] hover:underline">
                <LinkIcon size={13} />Portfolio
              </a>
            )}
            {resume.fileUrl && (
              <a href={resume.fileUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[#2557A7] hover:underline">
                <LinkIcon size={13} />Resume
              </a>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#595959] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
