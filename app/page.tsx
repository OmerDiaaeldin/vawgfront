'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with ssr disabled for the map component
// This is necessary because Leaflet requires window object
const LocationMapWithNoSSR = dynamic(
  () => import('@/components/LocationMap'),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="container">
      <main>
        <LocationMapWithNoSSR />
      </main>
    </div>
  );
}