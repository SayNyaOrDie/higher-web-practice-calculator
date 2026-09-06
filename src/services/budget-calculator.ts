import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { Transaction } from '../models/schemas';

export function getDaysInPeriod(startDate: string, endDate: string): number {
  return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
}

export function getDailyBudget(initialBalance: number, days: number): number {
  if (days <= 0) {
    return 0;
  }

  return Math.floor(initialBalance / days);
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ru-RU');
}

export function formatRubles(value: number): string {
  return `${formatNumber(value)} ₽`;
}

export function parseAmount(value: string): number {
  const digits = value.replace(/\D/g, '');

  return digits ? Number(digits) : 0;
}

export function formatDateRu(isoDate: string): string {
  return format(parseISO(isoDate), 'd MMMM', { locale: ru });
}

export function getTodayExpenses(transactions: Transaction[], today: string): number {
  return transactions
    .filter(item => item.type === 'expense' && item.date === today)
    .reduce((sum, item) => sum + item.amount, 0);
}

function getIncomeTotal(transactions: Transaction[]): number {
  return transactions
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
}

export function getExpenseTotal(transactions: Transaction[]): number {
  return transactions
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
}

export function getTotalBalance(initialBalance: number, transactions: Transaction[]): number {
  return initialBalance + getIncomeTotal(transactions) - getExpenseTotal(transactions);
}

export function getNextInitialBalance(
  initialBalance: number,
  remaining: number,
  transactions: Transaction[]
): number {
  return initialBalance + (remaining - getTotalBalance(initialBalance, transactions));
}

export function getDailyLimit(
  initialBalance: number,
  days: number,
  transactions: Transaction[]
): number {
  return getDailyBudget(initialBalance + getIncomeTotal(transactions), days);
}

export function getAverageDailySpending(transactions: Transaction[], startDate: string): number {
  const totalSpent = transactions
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const daysPassed = Math.max(1, differenceInCalendarDays(new Date(), parseISO(startDate)) + 1);

  return Math.round(totalSpent / daysPassed);
}

export function formatDaysLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} день`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} дня`;
  }

  return `${count} дней`;
}
