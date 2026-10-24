/**
 * Bangladesh Taka (BDT / ৳) Currency Utilities for DentAI OS
 */

export const CURRENCY_SYMBOL = "৳";
export const CURRENCY_CODE = "BDT";

/**
 * Format any numeric or string amount into formatted BDT with symbol ৳
 * Example: 12500 -> "৳12,500.00"
 */
export function formatBDT(
  amount: number | string | null | undefined,
  includeDecimals: boolean = true
): string {
  if (amount == null || amount === "") return `${CURRENCY_SYMBOL}0${includeDecimals ? ".00" : ""}`;
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]/g, "")) : amount;
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0${includeDecimals ? ".00" : ""}`;

  return `${CURRENCY_SYMBOL}${num.toLocaleString("en-BD", {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  })}`;
}

/**
 * Format BDT in compact notation (e.g. ৳45K)
 */
export function formatCompactBDT(amount: number | string | null | undefined): string {
  if (amount == null || amount === "") return `${CURRENCY_SYMBOL}0`;
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]/g, "")) : amount;
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0`;

  if (num >= 100000) {
    return `${CURRENCY_SYMBOL}${(num / 100000).toFixed(1)} Lakh`;
  }
  if (num >= 1000) {
    return `${CURRENCY_SYMBOL}${(num / 1000).toFixed(1)}k`;
  }
  return `${CURRENCY_SYMBOL}${num.toLocaleString("en-BD")}`;
}

/**
 * Convert number into Bangladeshi words format (e.g. "Seven Thousand Eight Hundred Taka Only")
 */
export function numberToWordsBDT(amount: number): string {
  if (!amount || amount === 0) return "Zero Taka Only";
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertChunk(num: number): string {
    let str = "";
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }
    if (num > 0) {
      str += units[num] + " ";
    }
    return str.trim();
  }

  let n = Math.floor(Math.abs(amount));
  if (n === 0) return "Zero Taka Only";

  let words = "";
  if (n >= 10000000) {
    words += convertChunk(Math.floor(n / 10000000)) + " Crore ";
    n %= 10000000;
  }
  if (n >= 100000) {
    words += convertChunk(Math.floor(n / 100000)) + " Lakh ";
    n %= 100000;
  }
  if (n >= 1000) {
    words += convertChunk(Math.floor(n / 1000)) + " Thousand ";
    n %= 1000;
  }
  if (n > 0) {
    words += convertChunk(n) + " ";
  }

  return words.trim() + " Taka Only";
}
