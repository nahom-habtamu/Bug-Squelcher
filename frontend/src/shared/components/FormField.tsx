import { Field } from '@fluentui/react-components';
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <Field
      label={label}
      required={required}
      validationMessage={error}
      validationState={error ? 'error' : 'none'}
    >
      {children}
    </Field>
  );
}
