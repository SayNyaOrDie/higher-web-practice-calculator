import { z } from 'zod';

export const startFormSchema = z.object({
  endDate: z.string().min(1, 'Выберите срок'),
  initialBalance: z.number().positive('Укажите баланс больше нуля'),
});

export const balanceFormSchema = z.object({
  endDate: z.string().min(1, 'Выберите срок'),
  remaining: z.number().nonnegative(),
  topUp: z.number().nonnegative(),
});

export type StartFormInput = z.infer<typeof startFormSchema>;
export type BalanceFormInput = z.infer<typeof balanceFormSchema>;

function fieldErrors(result: z.ZodSafeParseResult<unknown>): Record<string, string> {
  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '');

    if (field !== '' && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

export function validateStartForm(input: StartFormInput): Record<string, string> {
  return fieldErrors(startFormSchema.safeParse(input));
}

export function validateBalanceForm(input: BalanceFormInput): Record<string, string> {
  return fieldErrors(balanceFormSchema.safeParse(input));
}

export function hasValidationErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

export function setFieldError(root: ParentNode, fieldId: string, message: string | null): void {
  const field = root.querySelector(`#${fieldId}`);
  const error = root.querySelector(`[data-error-for="${fieldId}"]`);

  if (field instanceof HTMLElement) {
    if (message) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
  }

  if (error instanceof HTMLElement) {
    error.textContent = message ?? '';
    error.classList.toggle('hidden', message === null);
  }
}
