import { TimesheetsService } from "@/services/timesheets";

type HolidayEvent = { start: string; end?: string; title?: string };

// Controlla se una data cade nel weekend
const isWeekend = (date: Date | string): boolean => {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6;
};

// Confronta due date ignorando orario
const isSameDay = (d1: Date, d2: Date) =>
  d1.toDateString() === d2.toDateString();

/**
 * Conta i giorni lavorativi in un mese
 * (esclude weekend e festività)
 */
const countWorkingDaysInMonth = (
  year: number,
  month: number, // 0-based (0 = gennaio)
  holidays: { start: string | Date }[] = []
): number => {
  let workingDays = 0;

  const holidayDates = holidays
    .map(h => new Date(h.start))
    .filter(d => d.getFullYear() === year && d.getMonth() === month);

  let date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    const weekend = isWeekend(date);
    const holiday = holidayDates.some(h => isSameDay(h, date));

    if (!weekend && !holiday) workingDays++;

    date.setDate(date.getDate() + 1);
  }

  console.log('workwork', workingDays)
  return workingDays;
};

/**
 * Conta i giorni lavorativi in un anno
 */
const countWorkingDaysInYear = (
  year: number,
  holidays: { start: string | Date }[] = []
): number => {
  let total = 0;
  for (let month = 0; month < 12; month++) {
    total += countWorkingDaysInMonth(year, month, holidays);
  }
  return total;
};

/**
 * Funzione generica che restituisce giorni lavorativi
 * Se month è specificato: giorni lavorativi del mese
 * Altrimenti: giorni lavorativi dell'anno
 */
const getWorkingDays = async (year: number, month?: number): Promise<number> => {
  const holidays = await TimesheetsService.getHolidays(year);

  if (month != null) {
    return countWorkingDaysInMonth(year, month - 1, holidays);
  }
  return countWorkingDaysInYear(year, holidays);
};

/**
 * API: giorni lavorativi annuali
 */
export const calcYearWorkingDays = (year: number) => getWorkingDays(year);

/**
 * API: giorni lavorativi mensili
 */
export const calcMonthWorkingDays = (year: number, month: number) => getWorkingDays(year, month);