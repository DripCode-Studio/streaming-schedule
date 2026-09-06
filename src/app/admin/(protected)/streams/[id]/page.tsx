import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { StreamForm } from '../stream-form';
import { utcToLocalInput } from '@/lib/time';

interface Props {
  params: { id: string };
}

export default async function EditStreamPage({ params }: Props) {
  const [stream, series, projects] = await Promise.all([
    db.stream.findUnique({ where: { id: params.id } }),
    db.series.findMany({ orderBy: { name: 'asc' } }),
    db.project.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!stream) notFound();

  return (
    <div>
      <h1 className="mb-8 text-xl font-semibold text-ink">Edit stream</h1>
      <StreamForm
        mode="edit"
        streamId={stream.id}
        seriesOptions={series}
        projectOptions={projects}
        initialValues={{
          title: stream.title,
          description: stream.description ?? '',
          status: stream.status,
          type: stream.type,
          startTimeLocal: utcToLocalInput(stream.startTime, stream.timezone),
          endTimeLocal: stream.endTime ? utcToLocalInput(stream.endTime, stream.timezone) : '',
          timezone: stream.timezone,
          category: stream.category ?? '',
          twitchVodUrl: stream.twitchVodUrl ?? '',
          youtubeUrl: stream.youtubeUrl ?? '',
          seriesId: stream.seriesId ?? '',
          projectId: stream.projectId ?? '',
          episodeNumber: stream.episodeNumber ? String(stream.episodeNumber) : '',
          githubRepository: stream.githubRepository ?? '',
          notes: stream.notes ?? '',
        }}
      />
    </div>
  );
}
