function ChatbotQuickQuestions({ onSelect, questions }) {
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
