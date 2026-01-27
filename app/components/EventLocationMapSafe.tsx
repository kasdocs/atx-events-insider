'use client';

import dynamic from 'next/dynamic';

const EventLocationMap = dynamic(() => import('@/app/components/EventLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full overflow-hidden rounded-xl border border-purple-200 bg-purple-50">
      <div className="h-64 w-full sm:h-72 flex items-center justify-center text-sm text-gray-600">
        Loading map…
      </div>
    </div>
  ),
});

type Props = {
  lat: number;
  lng: number;
  title?: string | null;
};

export default function EventLocationMapSafe({ title, ...rest }: Props) {
  return <EventLocationMap {...rest} label={title ?? null} />;
}
