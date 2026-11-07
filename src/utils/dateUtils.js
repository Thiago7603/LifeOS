// src/utils/dateUtils.js
// Utilidades de fechas locales, extraídas de db.js.
// Usadas por habitsRepository.js y por cualquier módulo que necesite fechas.

export const DAY_MS = 86400000;
export const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * Devuelve la fecha local del dispositivo como string 'YYYY-MM-DD'.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte un string 'YYYY-MM-DD' a un objeto Date local al mediodía
 * para evitar desfases por zonas horarias.
 * @param {string} dateString
 * @returns {Date}
 */
export function parseLocalDate(dateString) {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Suma `amount` días a un string de fecha 'YYYY-MM-DD'.
 * @param {string} dateString
 * @param {number} amount  Puede ser negativo.
 * @returns {string}
 */
export function addDays(dateString, amount) {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + amount);
  return getLocalDate(date);
}

/**
 * Número de día de la semana ISO: Lunes=1 … Domingo=7.
 * @param {string} dateString
 * @returns {number}
 */
export function getDayNumber(dateString) {
  const day = parseLocalDate(dateString).getDay();
  return day === 0 ? 7 : day;
}

/**
 * Devuelve el lunes de la semana que contiene `dateString`.
 * @param {string} dateString
 * @returns {string}
 */
export function getMonday(dateString) {
  const day = getDayNumber(dateString);
  return addDays(dateString, 1 - day);
}

/**
 * Alias de getMonday — clave de semana para agrupar por semana.
 * @param {string} dateString
 * @returns {string}
 */
export function getWeekKey(dateString) {
  return getMonday(dateString);
}

