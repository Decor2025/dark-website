interface ProductCardProps {
  product: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  onViewDetails: () => void;
}

export default function ProductCard({
  product,
  onViewDetails,
}: ProductCardProps) {
  const DEFAULT_IMG = "https://via.placeholder.com/600x400?text=No+Image";

  return (
    <div
      className="cursor-pointer bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-lg transition flex flex-col w-40 md:w-60 lg:w-100 overflow-hidden"
      onClick={onViewDetails}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onViewDetails();
      }}
    >
      <div className="w-full aspect-square overflow-hidden rounded-t-xl bg-gray-100 dark:bg-gray-800">
        <img
          src={product.imageUrl || DEFAULT_IMG}
          alt={product.name}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="bold text-sm mb-2 truncate">{product.name}</h3>
      </div>
    </div>
  );
}
