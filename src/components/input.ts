import { formatRubles, parseAmount } from '../services/budget-calculator';

export interface InputOptions {
  action?: string;
  id: string;
  inputMode?: 'numeric' | 'text';
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
}

export function renderInput(options: InputOptions): string {
  const value = options.value ?? '';
  const placeholder = options.placeholder ?? '';
  const inputMode = options.inputMode ?? 'text';
  const action = options.action ?? '';
  const fieldClass = action ? 'field pr-12' : 'field';

  return `
    <label class="flex flex-col gap-1" for="${options.id}">
      <span class="caption px-4">${options.label}</span>
      <div class="relative">
        <input
          id="${options.id}"
          name="${options.name}"
          class="${fieldClass}"
          type="text"
          inputmode="${inputMode}"
          value="${value}"
          placeholder="${placeholder}"
          autocomplete="off"
        />
        ${action}
      </div>
      <span class="caption px-4 text-error hidden" data-error-for="${options.id}"></span>
    </label>
  `;
}

export interface AmountFieldOptions {
  prefix?: string;
  onInput?: () => void;
}

export function initAmountField(input: HTMLInputElement, options: AmountFieldOptions = {}): void {
  const formatValue = (amount: number): string => {
    if (amount === 0) {
      return '';
    }

    const formatted = formatRubles(amount);
    return options.prefix ? `${options.prefix}${formatted}` : formatted;
  };

  const keepCaretOnDigits = (digitsBefore: number): void => {
    const pos = Math.min(digitsBefore, input.value.length);
    input.setSelectionRange(pos, pos);
  };

  input.addEventListener('focus', () => {
    const digitsBefore = input.value.slice(0, input.selectionStart ?? 0).replace(/\D/g, '').length;
    const amount = parseAmount(input.value);
    input.value = amount > 0 ? String(amount) : '';
    keepCaretOnDigits(digitsBefore);
  });

  input.addEventListener('input', () => {
    const digitsBefore = input.value.slice(0, input.selectionStart ?? 0).replace(/\D/g, '').length;
    input.value = input.value.replace(/\D/g, '');
    keepCaretOnDigits(digitsBefore);
    options.onInput?.();
  });

  input.addEventListener('blur', () => {
    input.value = formatValue(parseAmount(input.value));
  });
}
