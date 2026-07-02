function cleanOption(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeOption(value) {
  return cleanOption(value).toLocaleLowerCase('en-GB')
}

function findAvailableOption(options, value) {
  const normalizedValue = normalizeOption(value)
  if (!normalizedValue || !Array.isArray(options)) return ''
  return options.find((option) => normalizeOption(option) === normalizedValue)?.trim() || ''
}

export { cleanOption, findAvailableOption, normalizeOption }
