export function getTodayStr() {
  const today = new Date();
  const year = today.getFullYear().toString().padStart(4, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const today_str = year + "-" + month + "-" + day;
  return today_str;
}

export function getTodayMonth() {
  const today = new Date();
  const year = today.getFullYear().toString().padStart(4, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const today_month = year + "-" + month;
  return today_month;
}
