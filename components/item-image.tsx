import { Shirt } from "lucide-react";

export function ItemImage({
  src,
  alt,
  className = "",
  count,
}: {
  src?: string;
  alt: string;
  className?: string;
  count?: number;
}) {
  return (
    <div className={`item-image ${className}`}>
      {src ? <img src={src} alt={alt} /> : <Shirt size={28} strokeWidth={1.4} aria-hidden="true" />}
      {count && count > 1 ? <span className="image-count">+{count - 1}</span> : null}
    </div>
  );
}
