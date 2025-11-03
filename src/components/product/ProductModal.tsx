import React, { useState } from "react";
import { X } from "lucide-react";

interface RatingData {
  rating: number;
  message?: string;
  userId: string;
  timestamp: number;
}

interface ProductWithRating {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  video?: string;
  category?: string;
  createdAt?: string;
  ratingSum?: number;
  ratingCount?: number;
  averageRating?: number;
  ratings?: { [userId: string]: RatingData };
}

interface ProductDetailsModalProps {
  product: ProductWithRating;
  onClose: () => void;
  onSubmitRating?: (rating: number, message: string) => Promise<void>; // 🔹 Optional now
}

const DEFAULT_IMG = 'https://via.placeholder.com/600x400?text=No+Image';

function getUserId(): string {
  const auth = (window as any).firebase?.auth?.();
  const user = auth?.currentUser;
  if (user) return user.uid;
  let anonId = localStorage.getItem('anonUserId');
  if (!anonId) {
    anonId = 'anon-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('anonUserId', anonId);
  }
  return anonId;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onSubmitRating,
}) => {
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!onSubmitRating) return; // 🔹 Skip if not provided
    if (ratingValue < 1 || ratingValue > 5) {
      setRatingError("Please select 1 to 5 stars.");
      return;
    }
    setRatingSubmitting(true);
    setRatingError(null);
    try {
      await onSubmitRating(ratingValue, ratingMessage.trim());
      setRatingValue(0);
      setRatingMessage("");
    } catch {
      setRatingError("Error submitting rating. Try again later.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 overflow-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100"
        >
          <X size={28} />
        </button>

        {/* Media */}
        <div className="flex gap-4 overflow-x-auto mb-6 py-2 no-scrollbar">
          {(product.images && product.images.length > 0
            ? product.images
            : product.imageUrl ? [product.imageUrl] : [DEFAULT_IMG]
          ).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${product.name} image ${idx + 1}`}
              className="w-48 h-48 object-cover rounded-lg flex-shrink-0 shadow-md"
            />
          ))}
          {product.video && (
            <video controls className="w-48 h-48 rounded-lg flex-shrink-0 shadow-md">
              <source src={product.video} type="video/mp4" />
            </video>
          )}
        </div>

        {/* Info */}
        <h2 className="text-3xl font-bold mb-2">{product.name}</h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line mb-6">{product.description}</p>

        {/* Rating Summary */}
        {product.averageRating !== undefined && (
          <section className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4">Overall Rating</h3>
            <div className="flex items-center gap-3">
              <div className="text-yellow-400 text-4xl font-bold select-none">
                {(product.averageRating || 0).toFixed(1)}
              </div>
              <div>
                <div className="flex gap-1 text-yellow-400 text-xl select-none">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= Math.round(product.averageRating || 0) ? '' : 'text-gray-300'}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {product.ratingCount || 0} rating{(product.ratingCount || 0) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Your Rating (only if onSubmitRating is given) */}
        {onSubmitRating && (
          <section className="mt-8 border-t pt-6">
            <h3 className="text-xl font-semibold mb-4">Rate This Product</h3>
            {product.ratings && Object.keys(product.ratings).includes(getUserId()) ? (
              <p className="text-green-600 mb-4">You have already rated this product.</p>
            ) : (
              <>
                <div className="flex items-center justify-center gap-4 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`text-5xl ${star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`}
                      onClick={() => setRatingValue(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-3 resize-none mb-4"
                  placeholder="Leave a comment (optional)"
                  rows={4}
                  value={ratingMessage}
                  onChange={(e) => setRatingMessage(e.target.value)}
                />
                {ratingError && <p className="text-red-600 mb-3">{ratingError}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={ratingSubmitting}
                  className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </>
            )}
          </section>
        )}

        {/* User Ratings */}
        {product.ratings && (
          <section className="mt-8 border-t pt-6 max-h-64 overflow-y-auto no-scrollbar">
            <h3 className="text-xl font-semibold mb-4">User Ratings</h3>
            {Object.keys(product.ratings).length > 0 ? (
              Object.values(product.ratings)
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((r, i) => (
                  <div key={i} className="mb-4 border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm uppercase select-none">
                        {(r.userId ?? '').startsWith('anon-') ? 'A' : 'U'}
                      </div>
                      <div className="flex gap-1 text-yellow-400 select-none">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={star <= r.rating ? '' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                    </div>
                    {r.message && <p className="text-gray-700 dark:text-gray-300">{r.message}</p>}
                  </div>
                ))
            ) : (
              <p className="text-gray-500">No ratings yet.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsModal;
