const actionIcons = {
  "Men's Collection": 'M',
  "Women's Collection": 'W',
  "Browse Men's Collection": 'M',
  "Browse Women's Collection": 'W',
  'Wedding Collection': 'W',
  'Bespoke Tailoring': 'B',
  'I Need Style Advice': 'S',
  'Track My Order': 'T',
  'General Help': '?',
  'Size Guide': 'S',
  'Delivery Information': 'D',
  'Speak on WhatsApp': 'WA',
  'Start a Bespoke Order': 'B',
  "Men's Measurements": 'M',
  "Women's Measurements": 'W',
  'Watch Measurement Video': 'V',
  Wedding: 'W',
  Birthday: 'B',
  Engagement: 'E',
  Church: 'C',
  Photoshoot: 'P',
  Casual: 'C',
  Corporate: 'C',
  Other: '?',
  Male: 'M',
  Female: 'F',
  Couple: 'C',
}

function isPrimaryCardSet(questions = []) {
  return questions.some((question) => ["Men's Collection", "Women's Collection", 'Wedding Collection', 'Bespoke Tailoring', 'I Need Style Advice', 'Track My Order', 'General Help'].includes(question))
}

function ChatbotQuickQuestions({ onSelect, questions }) {
  const cardMode = isPrimaryCardSet(questions)

  if (cardMode) {
    return (
      <div aria-label="Suggested actions" className="grid grid-cols-2 gap-2 sm:grid-cols-2">
        {questions.map((question) => (
          <button
            className="group min-h-20 rounded-2xl border border-[rgba(190,151,83,0.28)] bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(190,151,83,0.045))] px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-gold)] hover:bg-[rgba(190,151,83,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
            key={question}
            onClick={() => onSelect(question)}
            type="button"
          >
            <span className="grid size-8 place-items-center rounded-full border border-[rgba(190,151,83,0.45)] text-[10px] font-bold text-[var(--color-gold)] transition group-hover:bg-[var(--color-gold)] group-hover:text-black">{actionIcons[question] || '?'}</span>
            <span className="mt-3 block text-xs font-semibold leading-5 text-white">{question}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div aria-label="Suggested questions" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {questions.map((question) => (
        <button
          className="shrink-0 rounded-full border border-[rgba(190,151,83,0.4)] bg-black px-3 py-2 text-left text-[11px] font-semibold text-[var(--color-gold)] transition hover:border-[var(--color-gold)] hover:bg-[rgba(190,151,83,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
          key={question}
          onClick={() => onSelect(question)}
          type="button"
        >
          {question}
        </button>
      ))}
    </div>
  )
}

export default ChatbotQuickQuestions