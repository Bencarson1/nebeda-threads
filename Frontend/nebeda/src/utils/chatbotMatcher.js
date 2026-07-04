import { chatbotKnowledge, unknownAnswer } from '../data/chatbotKnowledge'

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function keywordMatches(input, tokens, keyword) {
  const normalizedKeyword = normalizeText(keyword)
  if (!normalizedKeyword) return false
  return normalizedKeyword.includes(' ')
    ? input.includes(normalizedKeyword)
    : tokens.has(normalizedKeyword)
}

function matchChatbotQuestion(question) {
  const input = normalizeText(question)
  if (!input) return unknownAnswer
  const tokens = new Set(input.split(' '))

  const ranked = chatbotKnowledge
    .map((entry) => ({
      entry,
      score: entry.keywords.reduce((score, keyword) => (
        score + (keywordMatches(input, tokens, keyword) ? normalizeText(keyword).includes(' ') ? 3 : 1 : 0)
      ), 0),
    }))
    .sort((left, right) => right.score - left.score)

  return ranked[0]?.score > 0 ? ranked[0].entry : unknownAnswer
}

export { matchChatbotQuestion, normalizeText }
