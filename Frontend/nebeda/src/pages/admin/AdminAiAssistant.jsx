import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useToast } from '../../components/ui/toastContext'
import {
  getAdminAssistantKnowledge,
  getAssistantAnalytics,
  updateAssistantKnowledge,
} from '../../services/aiAssistantService'

const emptyAnalytics = {
  mostAskedQuestions: [],
  mostSearchedProducts: [],
  questionsWithNoAnswer: [],
  popularColours: [],
  popularOccasions: [],
  popularBudgets: [],
  whatsappEscalations: 0,
  bespokeStarted: 0,
  completedConversations: 0,
  conversionRate: 0,
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="mt-2 font-serif text-3xl text-white">{value}</p>
    </div>
  )
}

function ListPanel({ emptyText = 'No data yet.', items, title }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <h2 className="font-serif text-xl text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {items?.length ? items.map((item) => (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-black/35 px-3 py-2" key={item.label || item.questionText}>
            <span className="min-w-0 break-words text-sm text-white/75">{item.label || item.questionText || 'Unanswered question'}</span>
            {item.count ? <span className="shrink-0 text-xs font-semibold text-[var(--color-gold)]">{item.count}</span> : null}
          </div>
        )) : <p className="text-sm text-white/45">{emptyText}</p>}
      </div>
    </article>
  )
}

function KnowledgeEditor({ record, onSave }) {
  const [draft, setDraft] = useState(record)
  const [saving, setSaving] = useState(false)


  const save = async () => {
    setSaving(true)
    try {
      await onSave(record._id, draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-gold)]">{record.section}</p>
        <label className="inline-flex items-center gap-2 text-xs text-white/60">
          <input
            checked={Boolean(draft.isActive)}
            onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
            type="checkbox"
          />
          Active
        </label>
      </div>
      <input
        className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[var(--color-gold)]"
        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        value={draft.title || ''}
      />
      <textarea
        className="mt-3 min-h-32 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-[var(--color-gold)]"
        onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
        value={draft.content || ''}
      />
      <button
        className="mt-3 rounded-xl bg-[var(--color-gold)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[var(--color-gold-light)] disabled:opacity-50"
        disabled={saving}
        onClick={save}
        type="button"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </article>
  )
}

function AdminAiAssistant() {
  const { showToast } = useToast()
  const [analytics, setAnalytics] = useState(emptyAnalytics)
  const [knowledge, setKnowledge] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getAssistantAnalytics(), getAdminAssistantKnowledge()])
      .then(([analyticsResponse, knowledgeResponse]) => {
        if (!active) return
        setAnalytics({ ...emptyAnalytics, ...analyticsResponse })
        setKnowledge(knowledgeResponse || [])
      })
      .catch((error) => {
        if (active) showToast({ message: error.message || 'Unable to load AI assistant data.', type: 'error' })
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [showToast])

  const saveKnowledge = async (id, payload) => {
    const updated = await updateAssistantKnowledge(id, payload)
    setKnowledge((current) => current.map((item) => (item._id === id ? updated : item)))
    showToast({ message: 'Assistant knowledge updated.', type: 'success' })
  }

  return (
    <AdminLayout subtitle="Review assistant trends and update customer-facing help guidance.">
      <section className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-gold)]">Customer support intelligence</p>
            <h1 className="mt-2 font-serif text-4xl">AI Assistant</h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/55">
            Trends are aggregated and sanitized. The assistant does not expose personal customer data.
          </p>
        </div>

        {loading ? <p className="text-white/60">Loading assistant data...</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="WhatsApp escalations" value={analytics.whatsappEscalations || 0} />
          <StatCard label="Bespoke enquiries started" value={analytics.bespokeStarted || 0} />
          <StatCard label="Completed conversations" value={analytics.completedConversations || 0} />
          <StatCard label="Conversion rate" value={`${analytics.conversionRate || 0}%`} />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <ListPanel items={analytics.mostAskedQuestions} title="Most Asked Topics" />
          <ListPanel items={analytics.mostSearchedProducts} title="Most Searched Products" />
          <ListPanel items={analytics.questionsWithNoAnswer} title="Questions With No Answer" />
          <ListPanel items={analytics.popularColours} title="Popular Colours" />
          <ListPanel items={analytics.popularOccasions} title="Popular Occasions" />
          <ListPanel items={analytics.popularBudgets} title="Popular Budgets" />
        </div>

        <div>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-gold)]">Editable knowledge base</p>
            <h2 className="mt-2 font-serif text-3xl">Assistant Guidance</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {knowledge.map((record) => (
              <KnowledgeEditor key={record._id} onSave={saveKnowledge} record={record} />
            ))}
          </div>
        </div>
      </section>
    </AdminLayout>
  )
}

export default AdminAiAssistant
