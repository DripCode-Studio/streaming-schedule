'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { streamStatusValues, streamTypeValues } from '@/lib/validation';
import { localInputToUtc, utcToLocalInput } from '@/lib/time';

export interface StreamFormValues {
  title: string;
  description: string;
  status: (typeof streamStatusValues)[number];
  type: (typeof streamTypeValues)[number];
  startTimeLocal: string; // datetime-local string
  endTimeLocal: string;
  timezone: string;
  category: string;
}

const EMPTY: StreamFormValues = {
  title: '',
  description: '',
  status: 'SCHEDULED',
  type: 'CODING',
  startTimeLocal: '',
  endTimeLocal: '',
  timezone: 'America/Toronto',
  category: '',
};

interface Props {
  mode: 'create' | 'edit';
  streamId?: string;
  initialValues?: Partial<StreamFormValues>;
}

export function StreamForm({ mode, streamId, initialValues }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<StreamFormValues>({ ...EMPTY, ...initialValues });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof StreamFormValues>(key: K, value: StreamFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!values.startTimeLocal) {
      setError('Start time is required.');
      setSubmitting(false);
      return;
    }

    const payload = {
      title: values.title,
      description: values.description || null,
      status: values.status,
      type: values.type,
      startTime: localInputToUtc(values.startTimeLocal, values.timezone).toISOString(),
      endTime: values.endTimeLocal
        ? localInputToUtc(values.endTimeLocal, values.timezone).toISOString()
        : null,
      timezone: values.timezone,
      category: values.category || null,
    };

    const res = await fetch(mode === 'create' ? '/api/streams' : `/api/streams/${streamId}`, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error ? 'Please check the form for errors.' : 'Something went wrong.');
      return;
    }

    router.push('/admin/streams');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <Field label="Title">
        <input
          required
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Description">
        <textarea
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          rows={4}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Status">
          <select
            value={values.status}
            onChange={(e) => set('status', e.target.value as StreamFormValues['status'])}
            className={inputClass}
          >
            {streamStatusValues.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Type">
          <select
            value={values.type}
            onChange={(e) => set('type', e.target.value as StreamFormValues['type'])}
            className={inputClass}
          >
            {streamTypeValues.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start time">
          <input
            type="datetime-local"
            required
            value={values.startTimeLocal}
            onChange={(e) => set('startTimeLocal', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="End time">
          <input
            type="datetime-local"
            value={values.endTimeLocal}
            onChange={(e) => set('endTimeLocal', e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Timezone" hint="e.g. America/Toronto — used to interpret the times above">
        <input
          value={values.timezone}
          onChange={(e) => set('timezone', e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Category">
        <input
          value={values.category}
          onChange={(e) => set('category', e.target.value)}
          className={inputClass}
          placeholder="Java, Spring Boot, PostgreSQL"
        />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-accent px-5 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Create stream' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-xs uppercase tracking-wide text-faint">{label}</span>
      {children}
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </label>
  );
}

const inputClass =
  'rounded border border-border bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-accent';

export { utcToLocalInput };
