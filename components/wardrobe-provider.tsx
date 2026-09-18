"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { seedData } from "@/lib/seed-data";
import { newShareToken } from "@/lib/sharing";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";
import type {
  Item,
  ItemDraft,
  Outfit,
  OutfitDraft,
  Profile,
  Store,
  StoreDraft,
  WardrobeData,
  WardrobeShare,
  WearEntry,
  WearEntryDraft,
} from "@/lib/types";

const STORAGE_KEY = "dolaby.wardrobe.v1";
const DEMO_KEY = "dolaby.demo";
const SHARE_KEY = "dolaby.share.v1";

interface WardrobeContextValue extends WardrobeData {
  loading: boolean;
  authReady: boolean;
  profile: Profile | null;
  isDemo: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  enterDemo: () => void;
  resetDemo: () => void;
  addItem: (draft: ItemDraft) => Promise<Item>;
  updateItem: (id: string, draft: ItemDraft) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
  setItemArchived: (id: string, archived: boolean) => Promise<void>;
  addStore: (draft: StoreDraft) => Promise<Store>;
  updateStore: (id: string, draft: StoreDraft) => Promise<Store>;
  deleteStore: (id: string) => Promise<void>;
  setStoreArchived: (id: string, archived: boolean) => Promise<void>;
  addOutfit: (draft: OutfitDraft) => Promise<Outfit>;
  updateOutfit: (id: string, draft: OutfitDraft) => Promise<Outfit>;
  deleteOutfit: (id: string) => Promise<void>;
  setOutfitArchived: (id: string, archived: boolean) => Promise<void>;
  addWearEntry: (draft: WearEntryDraft) => Promise<WearEntry>;
  deleteWearEntry: (id: string) => Promise<void>;
  share: WardrobeShare | null;
  shareLoading: boolean;
  createShare: () => Promise<WardrobeShare>;
  setShareEnabled: (enabled: boolean) => Promise<void>;
  regenerateShare: () => Promise<WardrobeShare>;
}

interface DbPhoto {
  storage_path: string;
  sort_order: number;
}

interface DbStoreLink {
  store_id: string;
}

interface DbItem {
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
  price: number | null;
  acquired_date: string | null;
  source_store_id: string | null;
  note: string | null;
  is_archived: boolean | null;
  created_at: string;
  item_photos: DbPhoto[] | null;
  item_store_candidates: DbStoreLink[] | null;
}

interface DbStore {
  id: string;
  name: string;
  type: Store["type"] | null;
  url: string | null;
  location: string | null;
  photo_path: string | null;
  note: string | null;
  is_archived: boolean | null;
  created_at: string;
}

interface DbOutfit {
  id: string;
  name: string | null;
  occasion: Outfit["occasion"];
  is_draft: boolean;
  is_archived: boolean | null;
  created_at: string;
  outfit_items: { item_id: string }[] | null;
}

interface DbWearEntry {
  id: string;
  date: string;
  occasion: WearEntry["occasion"];
  outfit_id: string | null;
  feeling: WearEntry["feeling"];
  note: string | null;
  created_at: string;
  wear_entry_items: { item_id: string }[] | null;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

function profileFromUser(user: User): Profile {
  return {
    id: user.id,
    name: String(user.user_metadata?.full_name || user.email?.split("@")[0] || "My wardrobe"),
    email: user.email || "",
  };
}

function itemFields(item: ItemDraft) {
  return {
    name: item.name || null,
    category: item.category,
    type: item.type,
    primary_color: item.primaryColor,
    size: item.size || null,
    material: item.material || null,
    formality_score: item.formalityScore,
    warmth_level: item.warmthLevel,
    ownership_status: item.ownershipStatus,
    needs_attention: item.needsAttention,
    satisfaction_rating: item.satisfactionRating || null,
    price: item.price,
    acquired_date: item.acquiredDate || null,
    source_store_id: item.ownershipStatus === "own" ? item.sourceStoreId : null,
    note: item.note || null,
  };
}

function itemRow(item: ItemDraft, id: string, userId: string) {
  return { id, user_id: userId, ...itemFields(item) };
}

async function uploadDataUrl(path: string, value: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !value.startsWith("data:")) return null;
  const blob = await fetch(value).then((response) => response.blob());
  const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const storagePath = `${path}.${extension}`;
  const { error } = await supabase.storage
    .from("wardrobe-media")
    .upload(storagePath, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  return storagePath;
}

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WardrobeData>(seedData);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(
    hasSupabaseConfig ? null : { id: "demo-user", name: "Nour Hassan", email: "demo@dolaby.app" },
  );
  const [isDemo, setIsDemo] = useState(!hasSupabaseConfig);
  const [share, setShare] = useState<WardrobeShare | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const hydrated = useRef(false);

  const signedUrls = useCallback(async (paths: string[]) => {
    if (!paths.length) return new Map<string, string>();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return new Map<string, string>();
    const { data: signed, error } = await supabase.storage
      .from("wardrobe-media")
      .createSignedUrls(paths, 60 * 60);
    if (error) throw error;
    return new Map(
      signed
        .filter((entry) => entry.signedUrl)
        .map((entry) => [entry.path ?? "", entry.signedUrl] as [string, string]),
    );
  }, []);

  const loadRemote = useCallback(
    async (user: User) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      setLoading(true);
      const [itemsResult, storesResult, outfitsResult, wearResult] = await Promise.all([
        supabase
          .from("items")
          .select("*, item_photos(storage_path, sort_order), item_store_candidates(store_id)")
          .order("created_at", { ascending: false }),
        supabase.from("stores").select("*").order("name"),
        supabase
          .from("outfits")
          .select("*, outfit_items(item_id)")
          .order("created_at", { ascending: false }),
        supabase
          .from("wear_entries")
          .select("*, wear_entry_items(item_id)")
          .order("date", { ascending: false }),
      ]);

      const firstError =
        itemsResult.error || storesResult.error || outfitsResult.error || wearResult.error;
      if (firstError) throw firstError;

      const itemRows = (itemsResult.data ?? []) as DbItem[];
      const storeRows = (storesResult.data ?? []) as DbStore[];
      const allPaths = [
        ...itemRows.flatMap((row) => (row.item_photos ?? []).map((photo) => photo.storage_path)),
        ...storeRows.flatMap((row) => (row.photo_path ? [row.photo_path] : [])),
      ];
      const urlMap = await signedUrls(allPaths);

      setData({
        items: itemRows.map((row) => {
          const photos = [...(row.item_photos ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order,
          );
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
            price: row.price,
            acquiredDate: row.acquired_date ?? "",
            sourceStoreId: row.source_store_id,
            candidateStoreIds: (row.item_store_candidates ?? []).map((link) => link.store_id),
            note: row.note ?? "",
            isArchived: row.is_archived ?? false,
            photos: photos.map((photo) => urlMap.get(photo.storage_path) ?? ""),
            photoPaths: photos.map((photo) => photo.storage_path),
            createdAt: row.created_at,
          };
        }),
        stores: storeRows.map((row) => ({
          id: row.id,
          name: row.name,
          type: row.type ?? "both",
          url: row.url ?? "",
          location: row.location ?? "",
          photo: row.photo_path ? urlMap.get(row.photo_path) ?? "" : "",
          photoPath: row.photo_path ?? undefined,
          note: row.note ?? "",
          isArchived: row.is_archived ?? false,
          createdAt: row.created_at,
        })),
        outfits: ((outfitsResult.data ?? []) as DbOutfit[]).map((row) => ({
          id: row.id,
          name: row.name ?? "",
          occasion: row.occasion,
          isDraft: row.is_draft,
          itemIds: (row.outfit_items ?? []).map((link) => link.item_id),
          isArchived: row.is_archived ?? false,
          createdAt: row.created_at,
        })),
        wearEntries: ((wearResult.data ?? []) as DbWearEntry[]).map((row) => ({
          id: row.id,
          date: row.date,
          occasion: row.occasion,
          outfitId: row.outfit_id,
          itemIds: (row.wear_entry_items ?? []).map((link) => link.item_id),
          feeling: row.feeling,
          note: row.note ?? "",
          createdAt: row.created_at,
        })),
      });
      setProfile(profileFromUser(user));
      setIsDemo(false);
      try {
        const { data: shareRow } = await supabase
          .from("wardrobe_shares")
          .select("token, is_enabled, created_at")
          .eq("user_id", user.id)
          .maybeSingle();
        const row = shareRow as { token: string; is_enabled: boolean; created_at: string } | null;
        setShare(
          row ? { token: row.token, isEnabled: row.is_enabled, createdAt: row.created_at } : null,
        );
      } catch {
        // Sharing table may not exist yet on older databases; stay unshared.
        setShare(null);
      }
      setLoading(false);
    },
    [signedUrls],
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const savedDemo = window.localStorage.getItem(DEMO_KEY) === "true";

    if (!supabase || savedDemo) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setData(JSON.parse(saved) as WardrobeData);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      try {
        const savedShare = window.localStorage.getItem(SHARE_KEY);
        setShare(savedShare ? (JSON.parse(savedShare) as WardrobeShare) : null);
      } catch {
        setShare(null);
      }
      setProfile({ id: "demo-user", name: "Nour Hassan", email: "demo@dolaby.app" });
      setIsDemo(true);
      setLoading(false);
      setAuthReady(true);
      hydrated.current = true;
      return;
    }

    supabase.auth.getUser().then(({ data: authData }) => {
      if (authData.user) {
        void loadRemote(authData.user).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
      setAuthReady(true);
      hydrated.current = true;
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadRemote(session.user).catch(() => setLoading(false));
      } else {
        setProfile(null);
        setShare(null);
        setData({ items: [], stores: [], outfits: [], wearEntries: [] });
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadRemote]);

  useEffect(() => {
    if (!hydrated.current || !isDemo) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, isDemo]);

  const requireRemote = () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !profile || isDemo) return null;
    return { supabase, userId: profile.id };
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase is not configured. Open the demo instead.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (name: string, email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase is not configured. Open the demo instead.");
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return Boolean(authData.session);
  };

  const signOut = async () => {
    if (isDemo) {
      window.localStorage.removeItem(DEMO_KEY);
      if (hasSupabaseConfig) {
        setIsDemo(false);
        setProfile(null);
        setShare(null);
        setData({ items: [], stores: [], outfits: [], wearEntries: [] });
      }
      return;
    }
    await getSupabaseBrowserClient()?.auth.signOut();
  };

  const enterDemo = () => {
    window.localStorage.setItem(DEMO_KEY, "true");
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setData(saved ? (JSON.parse(saved) as WardrobeData) : seedData);
    try {
      const savedShare = window.localStorage.getItem(SHARE_KEY);
      setShare(savedShare ? (JSON.parse(savedShare) as WardrobeShare) : null);
    } catch {
      setShare(null);
    }
    setProfile({ id: "demo-user", name: "Nour Hassan", email: "demo@dolaby.app" });
    setIsDemo(true);
  };

  const resetDemo = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setData(seedData);
  };

  const addItem = async (draft: ItemDraft) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const remote = requireRemote();
    let photos = draft.photos;
    let photoPaths: string[] | undefined;

    if (remote) {
      const { error } = await remote.supabase
        .from("items")
        .insert(itemRow(draft, id, remote.userId));
      if (error) throw error;
      if (draft.candidateStoreIds.length) {
        const { error: linksError } = await remote.supabase
          .from("item_store_candidates")
          .insert(
            draft.candidateStoreIds.map((storeId) => ({
              item_id: id,
              store_id: storeId,
              user_id: remote.userId,
            })),
          );
        if (linksError) throw linksError;
      }
      const uploaded = await Promise.all(
        draft.photos.map((photo, index) =>
          uploadDataUrl(`${remote.userId}/items/${id}/${crypto.randomUUID()}-${index}`, photo),
        ),
      );
      photoPaths = uploaded.filter((path): path is string => Boolean(path));
      if (photoPaths.length) {
        const { error: photoError } = await remote.supabase.from("item_photos").insert(
          photoPaths.map((path, index) => ({
            item_id: id,
            user_id: remote.userId,
            storage_path: path,
            sort_order: index,
          })),
        );
        if (photoError) throw photoError;
        const map = await signedUrls(photoPaths);
        photos = photoPaths.map((path) => map.get(path) ?? "");
      } else {
        photos = [];
      }
    }

    const item: Item = { ...draft, id, photos, photoPaths, isArchived: false, createdAt };
    setData((current) => ({ ...current, items: [item, ...current.items] }));
    return item;
  };

  const updateItem = async (id: string, draft: ItemDraft) => {
    const existing = data.items.find((item) => item.id === id);
    if (!existing) throw new Error("Item not found");
    const remote = requireRemote();
    let photos = draft.photos;
    let photoPaths = existing.photoPaths;
    if (remote) {
      const { error } = await remote.supabase.from("items").update(itemFields(draft)).eq("id", id);
      if (error) throw error;
      await remote.supabase.from("item_store_candidates").delete().eq("item_id", id);
      if (draft.candidateStoreIds.length) {
        const { error: linkError } = await remote.supabase
          .from("item_store_candidates")
          .insert(
            draft.candidateStoreIds.map((storeId) => ({
              item_id: id,
              store_id: storeId,
              user_id: remote.userId,
            })),
        );
        if (linkError) throw linkError;
      }

      const existingPathByUrl = new Map(
        existing.photos.map((photo, index) => [photo, existing.photoPaths?.[index]]),
      );
      const resolvedPaths = await Promise.all(
        draft.photos.map(async (photo, index) => {
          if (photo.startsWith("data:")) {
            return uploadDataUrl(
              `${remote.userId}/items/${id}/${crypto.randomUUID()}-${index}`,
              photo,
            );
          }
          return existingPathByUrl.get(photo) ?? null;
        }),
      );
      photoPaths = resolvedPaths.filter((path): path is string => Boolean(path));
      const removedPaths = (existing.photoPaths ?? []).filter((path) => !photoPaths?.includes(path));

      const { error: clearPhotosError } = await remote.supabase
        .from("item_photos")
        .delete()
        .eq("item_id", id);
      if (clearPhotosError) throw clearPhotosError;
      if (photoPaths.length) {
        const { error: photoError } = await remote.supabase.from("item_photos").insert(
          photoPaths.map((path, index) => ({
            item_id: id,
            user_id: remote.userId,
            storage_path: path,
            sort_order: index,
          })),
        );
        if (photoError) throw photoError;
        const urlMap = await signedUrls(photoPaths);
        photos = photoPaths.map((path) => urlMap.get(path) ?? "");
      } else {
        photos = [];
      }
      if (removedPaths.length) {
        await remote.supabase.storage.from("wardrobe-media").remove(removedPaths);
      }
    }
    const item: Item = { ...existing, ...draft, photos, photoPaths };
    setData((current) => ({
      ...current,
      items: current.items.map((entry) => (entry.id === id ? item : entry)),
    }));
    return item;
  };

  const deleteItem = async (id: string) => {
    const existing = data.items.find((item) => item.id === id);
    const remote = requireRemote();
    if (remote) {
      if (existing?.photoPaths?.length) {
        await remote.supabase.storage.from("wardrobe-media").remove(existing.photoPaths);
      }
      const { error } = await remote.supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    }
    setData((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
      outfits: current.outfits.map((outfit) => ({
        ...outfit,
        itemIds: outfit.itemIds.filter((itemId) => itemId !== id),
      })),
    }));
  };

  const setItemArchived = async (id: string, archived: boolean) => {
    const remote = requireRemote();
    if (remote) {
      const { error } = await remote.supabase.from("items").update({ is_archived: archived }).eq("id", id);
      if (error) throw error;
    }
    setData((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, isArchived: archived } : item)),
    }));
  };

  const addStore = async (draft: StoreDraft) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const remote = requireRemote();
    let photo = draft.photo;
    let photoPath: string | undefined;
    if (remote) {
      photoPath =
        (await uploadDataUrl(
          `${remote.userId}/stores/${id}/${crypto.randomUUID()}`,
          draft.photo,
        )) ?? undefined;
      const { error } = await remote.supabase.from("stores").insert({
        id,
        user_id: remote.userId,
        name: draft.name,
        type: draft.type,
        url: draft.url || null,
        location: draft.location || null,
        photo_path: photoPath ?? null,
        note: draft.note || null,
      });
      if (error) throw error;
      if (photoPath) photo = (await signedUrls([photoPath])).get(photoPath) ?? "";
      else photo = "";
    }
    const store: Store = { ...draft, id, photo, photoPath, isArchived: false, createdAt };
    setData((current) => ({ ...current, stores: [store, ...current.stores] }));
    return store;
  };

  const updateStore = async (id: string, draft: StoreDraft) => {
    const existing = data.stores.find((store) => store.id === id);
    if (!existing) throw new Error("Store not found");
    const remote = requireRemote();
    let photo = draft.photo;
    let photoPath = existing.photoPath;
    if (remote) {
      if (draft.photo.startsWith("data:")) {
        photoPath =
          (await uploadDataUrl(
            `${remote.userId}/stores/${id}/${crypto.randomUUID()}`,
            draft.photo,
          )) ?? undefined;
      } else if (!draft.photo) {
        photoPath = undefined;
      }
      const { error } = await remote.supabase
        .from("stores")
        .update({
          name: draft.name,
          type: draft.type,
          url: draft.url || null,
          location: draft.location || null,
          photo_path: photoPath ?? null,
          note: draft.note || null,
        })
        .eq("id", id);
      if (error) throw error;
      if (existing.photoPath && existing.photoPath !== photoPath) {
        await remote.supabase.storage.from("wardrobe-media").remove([existing.photoPath]);
      }
      if (photoPath) photo = (await signedUrls([photoPath])).get(photoPath) ?? "";
      else photo = "";
    }
    const store: Store = { ...existing, ...draft, photo, photoPath };
    setData((current) => ({
      ...current,
      stores: current.stores.map((entry) => (entry.id === id ? store : entry)),
    }));
    return store;
  };

  const deleteStore = async (id: string) => {
    const existing = data.stores.find((store) => store.id === id);
    const remote = requireRemote();
    if (remote) {
      if (existing?.photoPath) {
        await remote.supabase.storage.from("wardrobe-media").remove([existing.photoPath]);
      }
      const { error } = await remote.supabase.from("stores").delete().eq("id", id);
      if (error) throw error;
    }
    setData((current) => ({
      ...current,
      stores: current.stores.filter((store) => store.id !== id),
      items: current.items.map((item) => ({
        ...item,
        sourceStoreId: item.sourceStoreId === id ? null : item.sourceStoreId,
        candidateStoreIds: item.candidateStoreIds.filter((storeId) => storeId !== id),
      })),
    }));
  };

  const setStoreArchived = async (id: string, archived: boolean) => {
    const remote = requireRemote();
    if (remote) {
      const { error } = await remote.supabase
        .from("stores")
        .update({ is_archived: archived })
        .eq("id", id);
      if (error) throw error;
    }
    setData((current) => ({
      ...current,
      stores: current.stores.map((store) =>
        store.id === id ? { ...store, isArchived: archived } : store,
      ),
    }));
  };

  const addOutfit = async (draft: OutfitDraft) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const remote = requireRemote();
    if (remote) {
      const { error } = await remote.supabase.from("outfits").insert({
        id,
        user_id: remote.userId,
        name: draft.name || null,
        occasion: draft.occasion,
        is_draft: draft.isDraft,
      });
      if (error) throw error;
      const { error: linksError } = await remote.supabase.from("outfit_items").insert(
        draft.itemIds.map((itemId, index) => ({
          outfit_id: id,
          item_id: itemId,
          user_id: remote.userId,
          sort_order: index,
        })),
      );
      if (linksError) throw linksError;
    }
    const outfit: Outfit = { ...draft, id, isArchived: false, createdAt };
    setData((current) => ({ ...current, outfits: [outfit, ...current.outfits] }));
    return outfit;
  };

  const updateOutfit = async (id: string, draft: OutfitDraft) => {
    const existing = data.outfits.find((outfit) => outfit.id === id);
    if (!existing) throw new Error("Outfit not found");
    const remote = requireRemote();
    if (remote) {
      const { error } = await remote.supabase
        .from("outfits")
        .update({ name: draft.name || null, occasion: draft.occasion, is_draft: draft.isDraft })
        .eq("id", id);
      if (error) throw error;
      await remote.supabase.from("outfit_items").delete().eq("outfit_id", id);
      const { error: linksError } = await remote.supabase.from("outfit_items").insert(
        draft.itemIds.map((itemId, index) => ({
          outfit_id: id,
          item_id: itemId,
          user_id: remote.userId,
          sort_order: index,
        })),
      );
      if (linksError) throw linksError;
    }
    const outfit: Outfit = { ...existing, ...draft };
    setData((current) => ({
      ...current,
      outfits: current.outfits.map((entry) => (entry.id === id ? outfit : entry)),
    }));
    return outfit;
  };

  const deleteOutfit = async (id: string) => {
    const remote = requireRemote();
    if (remote) {
      const { error } = await remote.supabase.from("outfits").delete().eq("id", id);
      if (error) throw error;
    }
    setData((current) => ({
      ...current,
      outfits: current.outfits.filter((outfit) => outfit.id !== id),
      wearEntries: current.wearEntries.map((entry) =>
        entry.outfitId === id ? { ...entry, outfitId: null } : entry,
      ),
    }));
  };

  const setOutfitArchived = async (id: string, archived: boolean) => {
    const remote = requireRemote();
    if (remote) {
      const { error } = await remote.supabase
        .from("outfits")
        .update({ is_archived: archived })
        .eq("id", id);
      if (error) throw error;
    }
    setData((current) => ({
      ...current,
      outfits: current.outfits.map((outfit) =>
        outfit.id === id ? { ...outfit, isArchived: archived } : outfit,
      ),
    }));
  };

  const addWearEntry = async (draft: WearEntryDraft) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const remote = requireRemote();
    if (remote) {
      const { error } = await remote.supabase.from("wear_entries").insert({
        id,
        user_id: remote.userId,
        date: draft.date,
        occasion: draft.occasion,
        outfit_id: draft.outfitId,
        feeling: draft.feeling,
        note: draft.note || null,
      });
      if (error) throw error;
      if (!draft.outfitId && draft.itemIds.length) {
        const { error: linksError } = await remote.supabase.from("wear_entry_items").insert(
          draft.itemIds.map((itemId) => ({
            wear_entry_id: id,
            item_id: itemId,
            user_id: remote.userId,
          })),
        );
        if (linksError) throw linksError;
      }
    }
    const entry: WearEntry = { ...draft, id, createdAt };
    setData((current) => ({
      ...current,
      wearEntries: [entry, ...current.wearEntries].sort((a, b) => b.date.localeCompare(a.date)),
    }));
    return entry;
  };

  const deleteWearEntry = async (id: string) => {
    const remote = requireRemote();
    if (remote) {
      const { error } = await remote.supabase.from("wear_entries").delete().eq("id", id);
      if (error) throw error;
    }
    setData((current) => ({
      ...current,
      wearEntries: current.wearEntries.filter((entry) => entry.id !== id),
    }));
  };

  const saveShareToken = async (token: string) => {
    const remote = requireRemote();
    if (remote) {
      setShareLoading(true);
      try {
        const { data, error } = await remote.supabase
          .from("wardrobe_shares")
          .upsert({ user_id: remote.userId, token, is_enabled: true }, { onConflict: "user_id" })
          .select("token, is_enabled, created_at")
          .single();
        if (error) throw error;
        const row = data as { token: string; is_enabled: boolean; created_at: string };
        const next: WardrobeShare = {
          token: row.token,
          isEnabled: row.is_enabled,
          createdAt: row.created_at,
        };
        setShare(next);
        return next;
      } finally {
        setShareLoading(false);
      }
    }
    const next: WardrobeShare = { token, isEnabled: true, createdAt: new Date().toISOString() };
    window.localStorage.setItem(SHARE_KEY, JSON.stringify(next));
    setShare(next);
    return next;
  };

  const createShare = () => saveShareToken(newShareToken());

  const regenerateShare = () => saveShareToken(newShareToken());

  const setShareEnabled = async (enabled: boolean) => {
    if (!share) {
      if (!enabled) return;
      await createShare();
      return;
    }
    const remote = requireRemote();
    if (remote) {
      setShareLoading(true);
      try {
        const { error } = await remote.supabase
          .from("wardrobe_shares")
          .update({ is_enabled: enabled })
          .eq("user_id", remote.userId);
        if (error) throw error;
        setShare({ ...share, isEnabled: enabled });
      } finally {
        setShareLoading(false);
      }
      return;
    }
    const next = { ...share, isEnabled: enabled };
    window.localStorage.setItem(SHARE_KEY, JSON.stringify(next));
    setShare(next);
  };

  const value = useMemo<WardrobeContextValue>(
    () => ({
      ...data,
      loading,
      authReady,
      profile,
      isDemo,
      isConfigured: hasSupabaseConfig,
      signIn,
      signUp,
      signOut,
      enterDemo,
      resetDemo,
      addItem,
      updateItem,
      deleteItem,
      setItemArchived,
      addStore,
      updateStore,
      deleteStore,
      setStoreArchived,
      addOutfit,
      updateOutfit,
      deleteOutfit,
      setOutfitArchived,
      addWearEntry,
      deleteWearEntry,
      share,
      shareLoading,
      createShare,
      setShareEnabled,
      regenerateShare,
    }),
    // CRUD functions intentionally close over the latest data and auth state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, loading, authReady, profile, isDemo, share, shareLoading],
  );

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const value = useContext(WardrobeContext);
  if (!value) throw new Error("useWardrobe must be used inside WardrobeProvider");
  return value;
}
