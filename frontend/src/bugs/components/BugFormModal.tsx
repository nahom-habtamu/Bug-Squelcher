import { useState, useEffect } from 'react';
import {
  Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent,
  Button, Input, Select, makeStyles, tokens, MessageBar,
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular } from '@fluentui/react-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '../../shared/components/FormField';
import { useCreateBugForm } from '../hooks/useCreateBugForm';
import { useUpdateBug } from '../hooks/useUpdateBug';
import { createBugSchema, updateBugSchema, type CreateBugFormValues, type UpdateBugFormValues } from '../schemas/bug.schemas';
import type { Bug } from '../bug.types';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  stepsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalXS,
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXS,
  },
  stepNumber: {
    minWidth: '1.5rem',
    color: tokens.colorNeutralForeground3,
  },
  stepInput: {
    flex: 1,
  },
});

interface BugFormModalProps {
  open: boolean;
  bug?: Bug;
  onDismiss: () => void;
}

// ── Create mode ──────────────────────────────────────────────────────────────
function CreateForm({ onDismiss }: { onDismiss: () => void }) {
  const styles = useStyles();
  const [steps, setSteps] = useState<string[]>(['']);

  const { control, onSubmit, formState: { errors }, isSubmitting, submitError, setValue } =
    useCreateBugForm(onDismiss);

  // Keep stepsToReproduce in sync with steps array
  useEffect(() => {
    setValue('stepsToReproduce', steps.filter(Boolean).join('\n'));
  }, [steps, setValue]);

  const addStep = () => setSteps((s) => [...s, '']);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, val: string) =>
    setSteps((s) => s.map((v, idx) => (idx === i ? val : v)));

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <FormField label="Title" required error={errors.title?.message}>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <Input {...field} data-testid="bug-form-title" placeholder="Brief description of the bug" />
          )}
        />
      </FormField>

      <div>
        <div className={styles.stepsHeader}>
          <span>Steps to Reproduce *</span>
          <Button size="small" icon={<AddRegular />} appearance="subtle" onClick={addStep} data-testid="bug-form-add-step">
            Add Step
          </Button>
        </div>
        {steps.map((step, i) => (
          <div key={i} className={styles.stepRow}>
            <span className={styles.stepNumber}>{i + 1}.</span>
            <Input
              className={styles.stepInput}
              value={step}
              onChange={(_, d) => updateStep(i, d.value)}
              placeholder={`Step ${i + 1}`}
              data-testid={`bug-form-step-${i}`}
            />
            {steps.length > 1 && (
              <Button size="small" icon={<DeleteRegular />} appearance="subtle" onClick={() => removeStep(i)} data-testid={`bug-form-remove-step-${i}`} />
            )}
          </div>
        ))}
        {errors.stepsToReproduce && (
          <MessageBar intent="error">{errors.stepsToReproduce.message}</MessageBar>
        )}
      </div>

      <FormField label="Severity" required error={errors.severity?.message}>
        <Controller
          name="severity"
          control={control}
          render={({ field }) => (
            <Select {...field} data-testid="bug-form-severity">
              <option value="P0">Critical</option>
              <option value="P1">High</option>
              <option value="P2">Medium</option>
              <option value="P3">Low</option>
            </Select>
          )}
        />
      </FormField>

      {submitError && <MessageBar intent="error">{submitError}</MessageBar>}

      <DialogActions>
        <Button appearance="secondary" onClick={onDismiss} data-testid="bug-form-cancel">Cancel</Button>
        <Button type="submit" appearance="primary" disabled={isSubmitting} data-testid="bug-form-submit">
          {isSubmitting ? 'Saving…' : 'Report Bug'}
        </Button>
      </DialogActions>
    </form>
  );
}

// ── Edit mode ─────────────────────────────────────────────────────────────────
function EditForm({ bug, onDismiss }: { bug: Bug; onDismiss: () => void }) {
  const styles = useStyles();
  const updateMutation = useUpdateBug();

  const initialSteps = bug.stepsToReproduce.split('\n').filter(Boolean);
  const [steps, setSteps] = useState<string[]>(initialSteps.length ? initialSteps : ['']);

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<UpdateBugFormValues>({
    resolver: zodResolver(updateBugSchema),
    defaultValues: {
      title: bug.title,
      severity: bug.severity,
      status: bug.status,
      stepsToReproduce: bug.stepsToReproduce,
    },
  });

  useEffect(() => {
    setValue('stepsToReproduce', steps.filter(Boolean).join('\n'));
  }, [steps, setValue]);

  const addStep = () => setSteps((s) => [...s, '']);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, val: string) =>
    setSteps((s) => s.map((v, idx) => (idx === i ? val : v)));

  const onSubmit = handleSubmit((data) => {
    updateMutation.mutate({ id: bug.id, data }, { onSuccess: onDismiss });
  });

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <FormField label="Title" required error={errors.title?.message}>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <Input {...field} data-testid="bug-form-title" />
          )}
        />
      </FormField>

      <div>
        <div className={styles.stepsHeader}>
          <span>Steps to Reproduce *</span>
          <Button size="small" icon={<AddRegular />} appearance="subtle" onClick={addStep} data-testid="bug-form-add-step">
            Add Step
          </Button>
        </div>
        {steps.map((step, i) => (
          <div key={i} className={styles.stepRow}>
            <span className={styles.stepNumber}>{i + 1}.</span>
            <Input
              className={styles.stepInput}
              value={step}
              onChange={(_, d) => updateStep(i, d.value)}
              data-testid={`bug-form-step-${i}`}
            />
            {steps.length > 1 && (
              <Button size="small" icon={<DeleteRegular />} appearance="subtle" onClick={() => removeStep(i)} data-testid={`bug-form-remove-step-${i}`} />
            )}
          </div>
        ))}
        {errors.stepsToReproduce && (
          <MessageBar intent="error">{errors.stepsToReproduce.message}</MessageBar>
        )}
      </div>

      <FormField label="Severity" required error={errors.severity?.message}>
        <Controller
          name="severity"
          control={control}
          render={({ field }) => (
            <Select {...field} data-testid="bug-form-severity">
              <option value="P0">Critical</option>
              <option value="P1">High</option>
              <option value="P2">Medium</option>
              <option value="P3">Low</option>
            </Select>
          )}
        />
      </FormField>

      <FormField label="Status" required error={errors.status?.message}>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select {...field} data-testid="bug-form-status">
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Works on My Machine">Works on My Machine</option>
            </Select>
          )}
        />
      </FormField>

      {updateMutation.error && (
        <MessageBar intent="error">{updateMutation.error.message}</MessageBar>
      )}

      <DialogActions>
        <Button appearance="secondary" onClick={onDismiss} data-testid="bug-form-cancel">Cancel</Button>
        <Button type="submit" appearance="primary" disabled={updateMutation.isPending} data-testid="bug-form-submit">
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
    </form>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
export function BugFormModal({ open, bug, onDismiss }: BugFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(_, d) => { if (!d.open) onDismiss(); }}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{bug ? 'Edit Bug' : 'Report Bug'}</DialogTitle>
          <DialogContent>
            {bug ? (
              <EditForm key={bug.id} bug={bug} onDismiss={onDismiss} />
            ) : (
              <CreateForm onDismiss={onDismiss} />
            )}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
