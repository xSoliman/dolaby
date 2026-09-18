import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { isShareToken, toSharedPayload } from "@/lib/sharing";
import type { Item, Outfit } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ShareRow {
  user_id: string;
}

interface SharedPhoto {
  storage_path: string;
  sort_order: number;
}

interface SharedItemRow {
  id: string;
  name: string | null;
  category: Item["category"];
  type: string;
  primary_color: string;
  size: string | null;
  material: string | null;
  formality_score: number;
  warmth_level: Item["warmthLevel"];
  ownership_status: Item["ownershipStatus"];
  needs_attention: boolean;
  satisfaction_rating: number | null;
  note: string | null;
  created_at: string;
  item_photos: SharedPhoto[] | null;
}

interface SharedOutfitRow {
  id: string;
  name: string | null;
  occasion: Outfit["occasion"];
  is_draft: boolean;
  created_at: string;
  outfit_items: { item_id: string }[] | null;
}

const notActive = () => Response.json({ error: "This link is no longer active." }, { status: 404 });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isShareToken(token)) return notActive();

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ error: "Sharing is not configured on the server." }, { status: 503 });
  }

  const { data: share, error: shareError } = await supabase
    .from("wardrobe_shares")
    .select("user_id")
    .eq("token", token)
    .eq("is_enabled", true)
    .maybeSingle();

  if (shareError) {
    console.error("Share lookup failed:", shareError);
    return notActive();
  }

  const shareRow = share as ShareRow | null;
  if (!shareRow) return notActive();

  const [profileResult, itemsResult, outfitsResult] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", shareRow.user_id).maybeSingle(),
    supabase
      .from("items")
      .select("*, item_photos(storage_path, sort_order)")
      .eq("user_id", shareRow.user_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("outfits")
      .select("*, outfit_items(item_id)")
      .eq("user_id", shareRow.user_id)
      .order("created_at", { ascending: false }),
  ]);

  if (itemsResult.error || outfitsResult.error) {
    console.error("Shared wardrobe load failed:", itemsResult.error ?? outfitsResult.error);
    return Response.json({ error: "Could not load this wardrobe." }, { status: 500 });
  }

  const itemRows = (itemsResult.data ?? []) as SharedItemRow[];
  const outfitRows = (outfitsResult.data ?? []) as SharedOutfitRow[];
  const paths = itemRows.flatMap((row) => (row.item_photos ?? []).map((photo) => photo.storage_path));

  let urlMap = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from("wardrobe-media")
      .createSignedUrls(paths, 60 * 60);
    urlMap = new Map(
      (signed ?? [])
        .filter((entry) => entry.signedUrl)
        .map((entry) => [entry.path ?? "", entry.signedUrl] as [string, string]),
    );
  }

  const items: Item[] = itemRows.map((row) => {
    const photos = [...(row.item_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: row.id,
      name: row.name ?? "",
      category: row.category,
      type: row.type,
      primaryColor: row.primary_color,
      size: row.size ?? "",
      material: row.material ?? "",
      formalityScore: row.formality_score,
      warmthLevel: row.warmth_level,
      ownershipStatus: row.ownership_status,
      needsAttention: row.needs_attention,
      satisfactionRating: row.satisfaction_rating ?? 0,
      price: null,
      acquiredDate: "",
      sourceStoreId: null,
      candidateStoreIds: [],
      note: row.note ?? "",
      photos: photos.map((photo) => urlMap.get(photo.storage_path) ?? ""),
      createdAt: row.created_at,
    };
  });

  const outfits: Outfit[] = outfitRows.map((row) => ({
    id: row.id,
    name: row.name ?? "",
    occasion: row.occasion,
    isDraft: row.is_draft,
    itemIds: (row.outfit_items ?? []).map((link) => link.item_id),
    createdAt: row.created_at,
  }));

  const profile = profileResult.data as { name: string } | null;

  return Response.json({
    ownerName: profile?.name || "A shared wardrobe",
    ...toSharedPayload(items, outfits),
  });
}
