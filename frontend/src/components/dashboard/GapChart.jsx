import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-zinc-900 border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-primary font-medium">{d.skill}</p>
      <p className="text-secondary">{d.demanded_by} jobs · {d.percentage}%</p>
      {d.status && <p className="text-green-400 mt-0.5">✓ You have this</p>}
      {d.priority && <p className="text-yellow-400 mt-0.5">Priority: {d.priority}</p>}
    </div>
  )
}

export default function GapChart({ gaps }) {
  if (!gaps) return null

  const strongData = (gaps.strong_skills || []).map(s => ({ ...s, type: 'strong' }))
  const missingData = (gaps.missing_skills || []).map(s => ({ ...s, type: 'missing' }))

  return (
    <div className="space-y-6">
      {strongData.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-secondary mb-3">You're strong in</p>
          <ResponsiveContainer width="100%" height={strongData.length * 36 + 20}>
            <BarChart data={strongData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="skill" width={100} tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="percentage" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {strongData.map((_, i) => <Cell key={i} fill="#22C55E" fillOpacity={0.7} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {missingData.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-secondary mb-3">Consider learning</p>
          <ResponsiveContainer width="100%" height={missingData.length * 36 + 20}>
            <BarChart data={missingData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="skill" width={100} tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="percentage" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {missingData.map((entry, i) => (
                  <Cell key={i} fill={entry.priority === 'high' ? '#F59E0B' : '#71717A'} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
