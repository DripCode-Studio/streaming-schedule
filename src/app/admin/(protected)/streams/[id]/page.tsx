import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { StreamForm } from '../stream-form';
import { utcToLocalInput } from '@/lib/time';

interface Props {
  params: { id: string };
}

export default async function EditStreamPage({ params }: Props) {
  const stream = await db.stream.findUnique({ where: { id: params.id } });

  if (!stream) notFound();

  return (
    <div>
      <h1 className="mb-8 text-xl font-semibold text-ink">Edit stream</h1>
      <StreamForm
        mode="edit"
        streamId={stream.id}
        initialValues={{
          title: stream.title,
          description: stream.description ?? '',
          status: stream.status,
          type: stream.type,
          startTimeLocal: utcToLocalInput(stream.startTime, stream.timezone),
          endTimeLocal: stream.endTime ? utcToLocalInput(stream.endTime, stream.timezone) : '',
          timezone: stream.timezone,
          category: stream.category ?? '',
        }}
      />
    </div>
  );
}
