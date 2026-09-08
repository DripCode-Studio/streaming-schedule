import { db } from '@/lib/db';
import { StreamForm, type StreamFormValues } from '../stream-form';

interface Props {
  searchParams: { duplicateFrom?: string };
}

export default async function NewStreamPage({ searchParams }: Props) {
  let initialValues: Partial<StreamFormValues> | undefined;

  if (searchParams.duplicateFrom) {
    const source = await db.stream.findUnique({ where: { id: searchParams.duplicateFrom } });
    if (source) {
      initialValues = {
        title: `${source.title} (copy)`,
        description: source.description ?? '',
        status: 'SCHEDULED',
        type: source.type,
        // Intentionally leave start/end blank — duplicating requires a new date/time.
        startTimeLocal: '',
        endTimeLocal: '',
        timezone: source.timezone,
        category: source.category ?? '',
      };
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-xl font-semibold text-ink">
        {searchParams.duplicateFrom ? 'Duplicate stream' : 'New stream'}
      </h1>
      {searchParams.duplicateFrom && (
        <p className="mb-6 text-sm text-muted">
          Copied from the original — pick a new date and time below before saving.
        </p>
      )}
      <StreamForm mode="create" initialValues={initialValues} />
    </div>
  );
}
