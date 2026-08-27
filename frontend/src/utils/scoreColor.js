/**
 * Calculates a continuous color gradient from Red (Band 1.0) to Green (Band 9.0)
 * @param {number|string} score - IELTS Band Score (1.0 - 9.0)
 * @returns {string} HSL color string
 */
export const getScoreColor = (score) => {
  const num = parseFloat(score);
  if (isNaN(num) || num <= 0) return '#D9BE8F';
  
  // Clamp between Band 1.0 and 9.0
  const clamped = Math.max(1, Math.min(9, num));
  
  // Normalized 0.0 (at Band 1.0) to 1.0 (at Band 9.0)
  const normalized = (clamped - 1) / 8;
  
  // Hue from 0° (Pure Red #ef4444) to 138° (Bright Green/Emerald #10b981)
  const hue = Math.round(normalized * 138);
  
  return `hsl(${hue}, 88%, 52%)`;
};

export default getScoreColor;
