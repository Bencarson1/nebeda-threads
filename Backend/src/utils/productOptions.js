const cleanOption = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeOption = (value) => cleanOption(value).toLocaleLowerCase("en-GB");

const findAvailableOption = (options, value) => {
  const normalizedValue = normalizeOption(value);
  if (!normalizedValue || !Array.isArray(options)) return "";
  return cleanOption(options.find((option) => normalizeOption(option) === normalizedValue));
};

const optionMatches = (left, right) => normalizeOption(left) === normalizeOption(right);

export { cleanOption, findAvailableOption, normalizeOption, optionMatches };
