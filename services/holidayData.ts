
// --- CHINESE STATUTORY HOLIDAYS DATABASE (OFFICIAL 2025 + PREDICTED 2026) ---
// This file separates data from UI logic for easier maintenance.

export const HOLIDAYS: Record<string, string> = {
  // === 2025 (OFFICIAL STATE COUNCIL RELEASE) ===
  '2025-01-01': '元旦',
  
  // Spring Festival 2025 (Jan 28 - Feb 4)
  '2025-01-28': '春节', '2025-01-29': '春节', '2025-01-30': '春节', '2025-01-31': '春节',
  '2025-02-01': '春节', '2025-02-02': '春节', '2025-02-03': '春节', '2025-02-04': '春节',
  
  // Qingming 2025 (Apr 4-6)
  '2025-04-04': '清明节', '2025-04-05': '清明节', '2025-04-06': '清明节',
  
  // Labor Day 2025 (May 1-5)
  '2025-05-01': '劳动节', '2025-05-02': '劳动节', '2025-05-03': '劳动节', '2025-05-04': '劳动节', '2025-05-05': '劳动节',
  
  // Dragon Boat 2025 (May 31 - Jun 2)
  '2025-05-31': '端午节', '2025-06-01': '端午节', '2025-06-02': '端午节',
  
  // National Day + Mid-Autumn 2025 (Oct 1 - Oct 8)
  '2025-10-01': '国庆/中秋', '2025-10-02': '国庆节', '2025-10-03': '国庆节', '2025-10-04': '国庆节',
  '2025-10-05': '国庆节', '2025-10-06': '国庆节', '2025-10-07': '国庆节', '2025-10-08': '国庆节',

  // === 2026 (PREDICTED BASED ON LUNAR CALENDAR & RULES) ===
  // New Year 2026
  '2026-01-01': '元旦', '2026-01-02': '元旦', '2026-01-03': '元旦',

  // Spring Festival 2026 (Lunar NY is Feb 17. Holiday likely Feb 16 Eve - Feb 22)
  '2026-02-16': '春节(除夕)', '2026-02-17': '春节', '2026-02-18': '春节', 
  '2026-02-19': '春节', '2026-02-20': '春节', '2026-02-21': '春节', '2026-02-22': '春节',

  // Qingming 2026 (Apr 5 is Sun) -> Apr 4-6
  '2026-04-04': '清明节', '2026-04-05': '清明节', '2026-04-06': '清明节',

  // Labor Day 2026 (May 1 is Fri) -> May 1-5
  '2026-05-01': '劳动节', '2026-05-02': '劳动节', '2026-05-03': '劳动节', '2026-05-04': '劳动节', '2026-05-05': '劳动节',

  // Dragon Boat 2026 (Jun 19 is Fri) -> Jun 19-21
  '2026-06-19': '端午节', '2026-06-20': '端午节', '2026-06-21': '端午节',

  // Mid-Autumn 2026 (Sep 25 is Fri) -> Sep 25-27
  '2026-09-25': '中秋节', '2026-09-26': '中秋节', '2026-09-27': '中秋节',

  // National Day 2026 (Oct 1 is Thu) -> Oct 1-7
  '2026-10-01': '国庆节', '2026-10-02': '国庆节', '2026-10-03': '国庆节', 
  '2026-10-04': '国庆节', '2026-10-05': '国庆节', '2026-10-06': '国庆节', '2026-10-07': '国庆节',
};

// --- ADJUSTED WORKING DAYS (TIAO XIU) ---
// Weekends that are legally working days
export const ADJUSTED_WORKDAYS: Set<string> = new Set([
  // === 2025 OFFICIAL ===
  '2025-01-26', // Sun (CNY)
  '2025-02-08', // Sat (CNY)
  '2025-04-27', // Sun (Labor Day)
  '2025-09-28', // Sun (National Day)
  '2025-10-11', // Sat (National Day)

  // === 2026 PREDICTED ===
  '2026-01-04', // Sun (New Year adjustment)
  '2026-02-07', // Sat (CNY adjustment - Prep)
  '2026-02-14', // Sat (CNY adjustment - Fix for the Feb 9-15 week request)
  '2026-04-26', // Sun (Labor Day adjustment)
  '2026-05-09', // Sat (Labor Day adjustment)
  '2026-09-27', // Sun (Mid-Autumn adjustment? Maybe not if Fri-Sun)
  '2026-09-26', // Sat (National Day adjustment)
  '2026-10-10', // Sat (National Day adjustment)
]);

export const getHolidayInfo = (start: Date, end: Date) => {
  let weekendCount = 0;
  let holidayNames = new Set<string>();
  let holidayCount = 0;
  let adjustedWorkCount = 0;

  const cur = new Date(start);
  while (cur <= end) {
    // Generate YYYY-MM-DD in local time
    const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    const day = cur.getDay();

    if (HOLIDAYS[dateStr]) {
      holidayNames.add(HOLIDAYS[dateStr]);
      holidayCount++;
    } else if (ADJUSTED_WORKDAYS.has(dateStr)) {
      adjustedWorkCount++;
      // It's a workday, do not count as weekend
    } else if (day === 0 || day === 6) {
      weekendCount++;
    }

    cur.setDate(cur.getDate() + 1);
  }

  const parts = [];
  if (holidayCount > 0) {
    const names = Array.from(holidayNames).join('/');
    parts.push(`${holidayCount}天${names}假期`);
  }
  if (weekendCount > 0) parts.push(`${weekendCount}天周末`);
  if (adjustedWorkCount > 0) parts.push(`${adjustedWorkCount}天调休工作`);

  return parts.length > 0 ? `(${parts.join(', ')})` : '';
};
