import { useEffect, useState } from 'react';
import { fetchPublicFeed } from '../lib/feed';
import type { Asset } from '../lib/types';

export default function Home() {
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchPublicFeed(50);
      setItems(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((a) => (
        <figure key={a.id} className="rounded-2xl shadow p-2">
          {/* Render Cloudinary media by public_id */}
          {/* Example: <img src={`https://res.cloudinary.com/${cloud}/image/upload/${a.cloudinary_public_id}.jpg`} /> */}
          <figcaption className="text-sm opacity-70 mt-2">
            {a.preset_key ?? 'custom'} • {new Date(a.published_at!).toLocaleString()}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
