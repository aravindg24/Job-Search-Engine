import { useState } from 'react'
import { generatePitch } from '../../utils/api'
import { toast } from '../shared/Toast'

const TYPES = [
  { id: 'cover_letter_hook', label: 'Cover Letter Hook' },
  { id: 'cold_email', label: 'Cold Email' },
  { id: 'why_interested', label: 'Why Interested?' },
]

export default function PitchGenerator({ jobId }) {
  const [type, setType] = useState('cover_letter_hook')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const data = await generatePitch(jobId, type)
      setResult(data)
    } catch (err) {
      toast(err.response?.data?.detail || 'Pitch generation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    if (!result?.pitch) return
    navigator.clipboard.writeText(result.pitch)
    toast('Copied to clipboard')
  }

  return (
    <div>
      {/* Type selector */}
      <div className="flex gap-2 mb-4">
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => { setType(t.id); setResult(null) }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              type === t.id
                ? 'bg-accent text-bg border-accent font-medium'
                : 'border-border text-secondary hover:border-zinc-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-50 mb-4"
      >
        {loading ? 'Generating…' : 'Generate Pitch'}
      </button>

      {result && (
        <div className="space-y-4">
          {/* The pitch */}
          <div className="border border-border rounded-xl p-4 relative" style={{ backgroundColor: 'var(--surface)' }}>
            <p className="text-primary text-sm leading-relaxed whitespace-pre-wrap">
              {result.pitch}
            </p>
            <button
              onClick={copy}
              className="absolute top-3 right-3 text-xs text-secondary hover:text-accent transition-colors border border-border hover:border-accent/30 rounded px-2 py-1"
            >
              Copy
            </button>
          </div>

          {/* Key mappings */}
          {result.key_mappings?.length > 0 && (
            <div>
              <p className="text-xs text-secondary uppercase tracking-wider mb-2">Why this works</p>
              <div className="space-y-2">
                {result.key_mappings.map((m, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-secondary shrink-0">→</span>
                    <span>
                      <span className="text-zinc-400">{m.jd_requirement}</span>
                      <span className="text-zinc-600 mx-1">·</span>
                      <span className="text-primary">{m.your_experience}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Framing advice */}
          {result.framing_advice && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-400">
              <span className="font-medium">Strategic note: </span>
              {result.framing_advice}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
