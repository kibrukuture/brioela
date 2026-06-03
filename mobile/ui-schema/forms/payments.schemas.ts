import { z } from '@brioela/shared/zod';
import { isUiError, requireValidIban } from '@brioela/shared/lib';

const email_format_invalid = `The email address you entered isn't valid.`;

type AccountDetailsSchemaOptions = {
  isBusiness: boolean;
  showEmailField: boolean;
};

export const amountEntrySchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .refine((v) => {
      const parsed = Number.parseFloat(v);
      return Number.isFinite(parsed) && parsed > 0;
    }, 'Amount must be greater than 0'),
});

export const emailPaymentSchema = z.object({
  email: z.email(email_format_invalid),
  fullName: z.string().trim().min(1, 'Name is required'),
});

export const findRecipientSearchSchema = z.object({
  query: z.string().trim().max(128, 'Search query is too long'),
});

export const currencySearchSchema = z.object({
  query: z.string().trim().max(64, 'Search query is too long'),
});

export function createAccountDetailsSchema(options: AccountDetailsSchemaOptions) {
  return z
    .object({
      region: z.enum(['inside_europe', 'outside_europe']),
      email: z.string().trim(),
      fullName: z.string().trim(),
      businessName: z.string().trim(),
      iban: z.string().trim(),
      swift: z.string().trim(),
      accountNumber: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      if (options.isBusiness) {
        if (!values.businessName) {
          ctx.addIssue({
            code: 'custom',
            path: ['businessName'],
            message: 'Name is required',
          });
        }
      } else {
        if (!values.fullName) {
          ctx.addIssue({
            code: 'custom',
            path: ['fullName'],
            message: 'Name is required',
          });
        }
      }

      if (options.showEmailField) {
        const email = values.email;
        if (values.region === 'inside_europe') {
          if (!email) {
            ctx.addIssue({
              code: 'custom',
              path: ['email'],
              message: 'Email is required',
            });
          } else if (!z.email().safeParse(email).success) {
            ctx.addIssue({
              code: 'custom',
              path: ['email'],
              message: "The email address you entered isn't valid.",
            });
          }
        } else {
          if (email && !z.email().safeParse(email).success) {
            ctx.addIssue({
              code: 'custom',
              path: ['email'],
              message: "The email address you entered isn't valid.",
            });
          }
        }
      }

      if (values.region === 'inside_europe') {
        try {
          requireValidIban(values.iban);
        } catch (e) {
          ctx.addIssue({
            code: 'custom',
            path: ['iban'],
            message: isUiError(e) ? e.message : 'Invalid IBAN',
          });
        }

        if (!values.swift) {
          ctx.addIssue({
            code: 'custom',
            path: ['swift'],
            message: 'SWIFT is required',
          });
        }
      } else {
        if (!values.swift) {
          ctx.addIssue({
            code: 'custom',
            path: ['swift'],
            message: 'SWIFT is required',
          });
        }
        if (!values.accountNumber) {
          ctx.addIssue({
            code: 'custom',
            path: ['accountNumber'],
            message: 'Account number is required',
          });
        }
      }
    });
}
