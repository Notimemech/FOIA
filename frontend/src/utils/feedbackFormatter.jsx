import React from 'react';

/**
 * Parses and formats feedback text, wrapping quoted snippets (citations)
 * in <span className="wr-quote-tag"> so they display with primary background
 * and main background text color.
 *
 * Supports:
 * - Double quotes: "..."
 * - Typographic quotes: “...”
 * - Code backticks: `...`
 * - Standalone single quotes: 'phrase'
 *
 * @param {string} text - Raw feedback or comment string.
 * @returns {React.ReactNode} Formatted elements or original text.
 */
export function formatFeedbackText(text) {
  if (!text || typeof text !== 'string') return text;

  // Regular expression matching quoted segments:
  // 1. "..." (double quotes)
  // 2. “...” (curly double quotes)
  // 3. `...` (backticks)
  // 4. Standalone '...' around phrases (excluding apostrophes inside words)
  const quoteRegex = /("[^"\n]+"|[“][^”\n]+[”]|`[^`\n]+`|(?<=\s|^)'[^'\n]+'(?=[.,!?;:\s]|$))/g;

  const parts = text.split(quoteRegex);

  if (parts.length <= 1) {
    return text;
  }

  return parts.map((part, index) => {
    if (!part) return null;

    const isDoubleQuote = part.startsWith('"') && part.endsWith('"');
    const isCurlyQuote = part.startsWith('“') && part.endsWith('”');
    const isBacktick = part.startsWith('`') && part.endsWith('`');
    const isSingleQuote = part.startsWith("'") && part.endsWith("'") && part.length > 2;

    if (isDoubleQuote || isCurlyQuote || isBacktick || isSingleQuote) {
      return (
        <span key={index} className="wr-quote-tag">
          {part}
        </span>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default formatFeedbackText;
