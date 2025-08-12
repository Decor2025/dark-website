import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database as db } from '../config/firebase';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

interface WorkItem {
  id: string;
  url?: string;
  caption?: string;
  type?: 'image' | 'video';
  videoUrl?: string;
  category?: string;
  title?: string;
}

interface OurWorkPublicProps {
  horizontalPreview?: boolean;
  previewCount?: number;
  items?: WorkItem[]; // Add items prop for direct passing
}

const OurWorkPublic: React.FC<OurWorkPublicProps> = ({
  horizontalPreview = false,
  previewCount,
  items: propItems
}) => {
  const [items, setItems] = useState<WorkItem[]>(propItems || []);
  const [loading, setLoading] = useState(propItems ? false : true);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    // Only fetch data if items aren't passed as props
    if (!propItems) {
      const unsubscribe = onValue(ref(db, "ourWork"), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const arr = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
            title: data[key].caption || 'Our Work',
          }));

          setItems(previewCount ? arr.slice(0, previewCount) : arr);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [horizontalPreview, previewCount, propItems]);

  const Skeleton = () => (
    <div className="animate-pulse bg-gray-300 rounded-lg w-full aspect-[4/3]" />
  );

  const renderItem = (item: WorkItem, i: number) => {
    return (
      <div 
        key={item.id}
        className={`
          bg-white rounded-2xl shadow-md overflow-hidden flex flex-col h-full 
          transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg
          ${horizontalPreview ? 'flex-shrink-0 w-72' : 'w-full'}
        `}
        onClick={() => !horizontalPreview && setIndex(i)}
      >
        <div className="relative pb-[75%]"> {/* 4:3 aspect ratio */}
          {item.type === 'video' && item.videoUrl ? (
            <iframe
              src={item.videoUrl}
              className="absolute inset-0 w-full h-full object-cover"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={item.title}
            />
          ) : (
            <img 
              src={item.url || '/placeholder-work.jpg'} 
              alt={item.title} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-4 flex-grow">
          
          {item.caption && (
            <p className="text-gray-600 text-sm line-clamp-2">{item.caption}</p>
          )}
        </div>
        {item.category && (
          <div className="px-4 pb-4">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {item.category}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={horizontalPreview ? "" : "max-w-7xl mx-auto px-4 py-8"}>
      {!horizontalPreview && (
        <h1 className="text-3xl font-bold text-center mb-8">
          Our Work
        </h1>
      )}

      <div
        className={
          horizontalPreview
            ? "flex gap-4 w-full overflow-x-auto pb-4 hide-scrollbar"
            : "columns-2 sm:columns-3 md:columns-4 gap-4 space-y-6"
        }
      >
        {loading
          ? Array(previewCount || 8)
              .fill(0)
              .map((_, i) => <Skeleton key={i} />)
          : items.map((item, i) => renderItem(item, i))}
      </div>

      {!horizontalPreview && index !== null && (
        <Lightbox
          slides={items
            .filter((i) => i.type === "image")
            .map((i) => ({ src: i.url! }))}
          open={index !== null}
          index={index}
          close={() => setIndex(null)}
          plugins={[Zoom, Thumbnails]}
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default OurWorkPublic;