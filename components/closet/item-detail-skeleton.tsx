/**
 * Placeholder for the item detail view, shown instantly during route
 * transitions (see `app/(app)/closet/[id]/loading.tsx`) and while the
 * wardrobe is still loading. Pure markup + CSS so both server and client
 * boundaries can render it.
 */
export function ItemDetailSkeleton() {
  return (
    <div className="item-detail-page" role="status" aria-label="Loading item details">
      <div className="detail-topline">
        <span className="skeleton" style={{ width: 110, height: 20 }} />
        <div>
          <span className="skeleton" style={{ width: 118, height: 42, borderRadius: 10 }} />
          <span className="skeleton" style={{ width: 38, height: 38, borderRadius: 10 }} />
        </div>
      </div>

      <div className="detail-skeleton-grid">
        <div className="skeleton detail-skeleton-photo" />
        <div className="detail-skeleton-copy">
          <span className="skeleton" style={{ width: 180, height: 12 }} />
          <span className="skeleton" style={{ width: "75%", height: 52, marginTop: 10 }} />
          <span className="skeleton" style={{ width: 160, height: 16, marginTop: 14 }} />
          <span className="skeleton" style={{ width: "90%", height: 44, marginTop: 22 }} />
          <div className="detail-skeleton-specs">
            {[0, 1, 2, 3, 4, 5].map((slot) => (
              <span className="skeleton" style={{ height: 59 }} key={slot} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
