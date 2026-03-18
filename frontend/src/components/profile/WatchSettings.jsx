import { useState, useEffect } from 'react'
import { saveWatchPreferences, getWatchPreferences } from '../../utils/api'
import { toast } from '../shared/Toast'

export default function WatchSettings() {
  const [minScore, setMinScore] = useState(70)
  const [keywords, setKeywords] = useState('AI, LLM, search, full-stack')
  const [locations, setLocations] = useState('San Francisco, Remote')
  const [stages, setStages] = useState('Seed, Series A, Series B')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getWatchPreferences().then(prefs => {
      if (!prefs) return
      setMinScore(prefs.min_match_score ?? 70)
      setKeywords((prefs.keywords || []).join(', '))
      setLocations((prefs.locations || []).join(', '))
      setStages((prefs.company_stages || []).join(', '))
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveWatchPreferences({
        min_match_score: Number(minScore),
        keywords: keywords.split(',').map(s => s.trim()).filter(Boolean),
        locations: locations.split(',').map(s => s.trim()).filter(Boolean),
        company_stages: stages.split(',').map(s => s.trim()).filter(Boolean),
      })
      toast('Watch preferences saved')
    } catch {
      toast('Failed to save preferences', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-secondary block mb-1">Minimum match score: <span className="text-primary font-mono">{minScore}%</span></label>
        <input
          type="range" min={50} max={95} step={5}
          value={minScore}
          onChange={e => setMinScore(e.target.value)}
          className="w-full accent-accent"
        />
      </div>

      <div>
        <label className="text-xs text-secondary block mb-1">Keywords (comma-separated)</label>
        <input
          type="text"
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent/50"
        />
      </div>

      <div>
        <label className="text-xs text-secondary block mb-1">Locations (comma-separated)</label>
        <input
          type="text"
          value={locations}
          onChange={e => setLocations(e.target.value)}
          className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent/50"
        />
      </div>

      <div>
        <label className="text-xs text-secondary block mb-1">Company stages (comma-separated)</label>
        <input
          type="text"
          value={stages}
          onChange={e => setStages(e.target.value)}
          className="w-full bg-zinc-900 border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent/50"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-accent text-bg font-semibold text-sm px-5 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-all"
      >
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </div>
  )
}
