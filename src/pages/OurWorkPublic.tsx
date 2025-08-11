import React, { useEffect, useState } from "react";
import { database as db } from "../config/firebase";
import { ref, onValue } from "firebase/database";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

interface WorkItem {
  id: string;
  url?: string;
  caption?: string;
  type?: "image" | "video";
  videoUrl?: string;
}

const OurWorkPublic: React.FC = () => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "ourWork"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.keys(data).map((key) => ({
          id: key,
          url: data[key].url,
          caption: data[key].caption,
          type: data[key].type || "image",
          videoUrl: data[key].videoUrl,
        }));
        setItems(arr);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const Skeleton = () => (
    <div className="animate-pulse bg-gray-300 rounded-lg w-full aspect-[4/3]" />
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Our Work</h1>

      <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-6">
        {loading
          ? Array(8)
              .fill(0)
              .map((_, i) => <Skeleton key={i} />)
          : items.map((item, i) => (
              <div
                key={item.id}
                className="rounded-lg shadow-md cursor-pointer overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => item.type === "image" && setIndex(i)}
              >
                {item.type === "image" && (
                  <>
                    <img
                      src={item.url}
                      alt={item.caption || "Our Work"}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    {item.caption && (
                      <p className="p-2 text-center text-sm text-gray-700">
                        {item.caption}
                      </p>
                    )}
                  </>
                )}

                {item.type === "video" && item.videoUrl && (
                  <div className="relative pb-[56.25%] h-0">
                    <iframe
                      src={item.videoUrl}
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={item.caption || "Video"}
                    ></iframe>
                    {item.caption && (
                      <p className="p-2 text-center text-sm text-gray-700">
                        {item.caption}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
      </div>

      {/* Lightbox for images only */}
      {index !== null && (
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
    </div>
  );
};

export default OurWorkPublic;
