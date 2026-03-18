export default function ParsedProfile({ profile, uploadedAt }) {
  const p = profile?.parsed_profile || {}

  const skillCategories = Object.entries(p.skills || {}).filter(([, v]) => v?.length > 0)

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div>
        <h3 className="text-lg font-semibold text-primary">{p.name || 'Unknown'}</h3>
        {p.education?.[0] && (
          <p className="text-secondary text-sm mt-0.5">
            {p.education[0].degree} {p.education[0].field && `in ${p.education[0].field}`}
            {p.education[0].school && ` · ${p.education[0].school}`}
          </p>
        )}
        <p className="text-secondary text-sm">
          {p.experience_years ? `${p.experience_years} year${p.experience_years !== 1 ? 's' : ''} experience` : ''}
        </p>
        {p.summary && (
          <p className="text-secondary text-sm mt-2 leading-relaxed">{p.summary}</p>
        )}
      </div>

      {/* Skills */}
      {skillCategories.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-secondary mb-2">Skills</p>
          <div className="space-y-2">
            {skillCategories.map(([cat, skills]) => (
              <div key={cat} className="flex gap-2 text-sm">
                <span className="text-zinc-600 capitalize w-24 shrink-0">{cat.replace('_', '/')}:</span>
                <span className="text-secondary">{skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {p.projects?.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-secondary mb-2">Key Projects</p>
          <div className="space-y-2">
            {p.projects.slice(0, 5).map((proj, i) => (
              <div key={i} className="text-sm">
                <span className="text-primary font-medium">{proj.name}</span>
                {proj.tech?.length > 0 && (
                  <span className="text-zinc-600 ml-2 text-xs">{proj.tech.join(', ')}</span>
                )}
                {proj.description && (
                  <p className="text-secondary text-xs mt-0.5">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work history */}
      {p.work_history?.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-secondary mb-2">Experience</p>
          <div className="space-y-1">
            {p.work_history.map((w, i) => (
              <div key={i} className="text-sm">
                <span className="text-primary">{w.role}</span>
                <span className="text-zinc-600 ml-2">at {w.company}</span>
                {w.duration && <span className="text-zinc-600 ml-2">· {w.duration}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedAt && (
        <p className="text-xs text-zinc-600">
          Uploaded {new Date(uploadedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
