/**
 * Utility functions for KKM checking and score formatting
 */

/**
 * Check if a score is below the KKM threshold
 * @param {number|string} score - The score to check
 * @param {number} mapelId - The subject ID
 * @param {Object} kkms - KKM data keyed by mapel_id
 * @returns {boolean} True if score is below KKM
 */
export function isBelowKkm(score, mapelId, kkms) {
    if (!score || score === '-' || score === 0 || score === '0') return false;
    const num = Number(score);
    if (isNaN(num)) return false;
    const kkmValue = kkms?.[mapelId]?.kkm_value || 70;
    return num < kkmValue;
}

/**
 * Format a score for display
 * @param {number|string} score - The score to format
 * @returns {string} Formatted score
 */
export function formatScore(score) {
    if (score === null || score === undefined || score === '-') return '-';
    const num = Number(score);
    if (isNaN(num)) return score;
    if (num === 0) return '0';
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
}

/**
 * Get CSS classes for KKM highlighting
 * @param {number|string} score - The score to check
 * @param {number} mapelId - The subject ID
 * @param {Object} kkms - KKM data keyed by mapel_id
 * @returns {string} CSS classes for highlighting
 */
export function getKkmHighlightClass(score, mapelId, kkms) {
    return isBelowKkm(score, mapelId, kkms) ? 'text-red-600 font-bold' : '';
}
