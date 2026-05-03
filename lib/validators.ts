import type { CardBrand } from "@/lib/types";

const eloPatterns = [
  /^4011/,
  /^4312/,
  /^4389/,
  /^4514/,
  /^4576/,
  /^5041/,
  /^5066/,
  /^5090/,
  /^6277/,
  /^6362/,
  /^6363/,
];

export function isProjectKeyValid(value: string) {
  return /^\d{6}$/.test(value);
}

export function isCpfValid(value: string) {
  return /^\d{11}$/.test(value);
}

export function validateLuhn(input: string) {
  const digits = input.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return digits.length >= 12 && sum % 10 === 0;
}

export function detectCardBrand(rawNumber: string): CardBrand {
  const number = rawNumber.replace(/\D/g, "");
  if (/^4/.test(number)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(number)) return "mastercard";
  if (/^3[47]/.test(number)) return "amex";
  if (/^(606282|3841)/.test(number)) return "hipercard";
  if (eloPatterns.some((pattern) => pattern.test(number))) return "elo";
  return "other";
}

export function maskPreview(value: string, visibleCount = 3) {
  const clean = value.trim();
  if (!clean) return "•••";
  return `${clean.slice(0, visibleCount)}•••`;
}
