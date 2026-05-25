/**
 * Shared utility functions for resume template engines.
 */

/**
 * Format resume date strings safely (e.g. "2024-05" -> "May 2024").
 * @param {string} dateStr 
 * @returns {string}
 */
export function formatResumeDate(dateStr) {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  if (/^[A-Za-z]+\s+\d{4}$/i.test(trimmed) || trimmed.toLowerCase() === "present" || trimmed.toLowerCase() === "current") {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }
  const match = trimmed.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (match) {
    const year = match[1];
    const month = parseInt(match[2], 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (month >= 1 && month <= 12) {
      return `${months[month - 1]} ${year}`;
    }
  }
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
    }
  } catch (e) {}
  return trimmed;
}

/**
 * Split description texts into clean, bullet-proof lines,
 * removing leading bullet points (*, -, •, etc.).
 * @param {string} descText 
 * @returns {string[]}
 */
export function parseBulletPoints(descText) {
  if (!descText) return [];
  return descText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[\u2022\u25E6\u2023\u2043\u2219*•\-\s]+/, "").trim())
    .filter(Boolean);
}
