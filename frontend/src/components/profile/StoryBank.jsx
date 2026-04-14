import { useState } from 'react'
import { useStories } from '../../hooks/useStories'
import { toast } from '../shared/Toast'

const EMPTY_FORM = { situation: '', task: '', action: '', result: '', skills_demonstrated: '' }

export default function StoryBank() {
  const { stories, loading, add, remove } = useStories()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await add({
        ...form,
        skills_demonstrated: form.skills_demonstrated
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      })
      setForm(EMPTY_FORM)
      setOpen(false)
      toast('Story saved')
    } catch {
      toast('Failed to save story', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await remove(id)
      toast('Story deleted')
    } catch {
      toast('Failed to delete story', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Add story toggle */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs px-3 py-1.5 rounded-lg border transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
        >
          + Add Story
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { field: 'situation', label: 'Situation', placeholder: 'What was the context or challenge?' },
            { field: 'task',      label: 'Task',      placeholder: 'What was your specific responsibility?' },
            { field: 'action',    label: 'Action',    placeholder: 'What did you do?' },
            { field: 'result',    label: 'Result',    placeholder: 'What was the outcome? (include metrics if possible)' },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-4)' }}>{label}</label>
              <textarea
                value={form[field]}
                onChange={e => handleChange(field, e.target.value)}
                placeholder={placeholder}
                required
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          ))}

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-4)' }}>
              Skills demonstrated (comma-separated)
            </label>
            <input
              type="text"
              value={form.skills_demonstrated}
              onChange={e => handleChange('skills_demonstrated', e.target.value)}
              placeholder="Python, system design, cross-team collaboration"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
              style={{ backgroundColor: 'var(--accent)', color: '#000' }}
            >
              {saving ? 'Saving…' : 'Save Story'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setForm(EMPTY_FORM) }}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Story list */}
      {loading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="h-16 rounded-lg" style={{ backgroundColor: 'var(--bg)' }} />
          ))}
        </div>
      )}

      {!loading && stories.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>
          No stories yet. Add a STAR story and it'll be woven into your pitches automatically.
        </p>
      )}

      {stories.map(story => (
        <div
          key={story.id}
          className="rounded-xl p-4 space-y-2 relative group"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => handleDelete(story.id)}
            className="absolute top-3 right-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-4)' }}
          >
            Delete
          </button>

          <div className="space-y-1 text-sm pr-12">
            <p><span className="font-medium" style={{ color: 'var(--text)' }}>S: </span><span style={{ color: 'var(--text-3)' }}>{story.situation}</span></p>
            <p><span className="font-medium" style={{ color: 'var(--text)' }}>T: </span><span style={{ color: 'var(--text-3)' }}>{story.task}</span></p>
            <p><span className="font-medium" style={{ color: 'var(--text)' }}>A: </span><span style={{ color: 'var(--text-3)' }}>{story.action}</span></p>
            <p><span className="font-medium" style={{ color: 'var(--text)' }}>R: </span><span style={{ color: 'var(--text-3)' }}>{story.result}</span></p>
          </div>

          {story.skills_demonstrated?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {story.skills_demonstrated.map((skill, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
