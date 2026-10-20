"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import { MAX_QTY_PER_LINE } from "./pricing";

export interface CartLine {
  sku: string;
  productId: string;
  slug: string;
  title: string;
  color: string;
  size: string | null;
  image: string;
  price: number;
  qty: number;
}

export interface WishList {
  id: string;
  name: string;
  productIds: string[];
}

export interface SavedOrder {
  id: string;
  token: string;
  createdAt: string;
}

interface State {
  cart: CartLine[];
  wishlists: WishList[];
  recentlyViewed: string[];
  recentSearches: string[];
  pincode: string | null;
  orders: SavedOrder[];
  couponCode: string | null;

  addToCart: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (sku: string, qty: number) => void;
  removeFromCart: (sku: string) => void;
  clearCart: () => void;

  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => boolean;
  createList: (name: string) => string;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  setInList: (listId: string, productId: string, on: boolean) => void;

  viewed: (productId: string) => void;
  clearViewed: () => void;
  addSearch: (q: string) => void;
  clearSearches: () => void;
  setPincode: (p: string | null) => void;
  saveOrder: (o: SavedOrder) => void;
  setCoupon: (c: string | null) => void;
}

const DEFAULT_LIST: WishList = { id: "saved", name: "Saved", productIds: [] };
const uid = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlists: [DEFAULT_LIST],
      recentlyViewed: [],
      recentSearches: [],
      pincode: null,
      orders: [],
      couponCode: null,

      addToCart: (line, qty = 1) =>
        set((s) => {
          const existing = s.cart.find((l) => l.sku === line.sku);
          if (existing) {
            return {
              cart: s.cart.map((l) =>
                l.sku === line.sku ? { ...l, ...line, qty: Math.min(MAX_QTY_PER_LINE, l.qty + qty) } : l,
              ),
            };
          }
          return { cart: [...s.cart, { ...line, qty: Math.min(MAX_QTY_PER_LINE, qty) }] };
        }),
      setQty: (sku, qty) =>
        set((s) => ({
          cart: s.cart.map((l) => (l.sku === sku ? { ...l, qty: Math.max(1, Math.min(MAX_QTY_PER_LINE, qty)) } : l)),
        })),
      removeFromCart: (sku) => set((s) => ({ cart: s.cart.filter((l) => l.sku !== sku) })),
      clearCart: () => set({ cart: [], couponCode: null }),

      isWishlisted: (productId) => get().wishlists.some((w) => w.productIds.includes(productId)),
      toggleWishlist: (productId) => {
        const on = !get().isWishlisted(productId);
        set((s) => ({
          wishlists: s.wishlists.map((w) =>
            on
              ? w.id === "saved" ? { ...w, productIds: [productId, ...w.productIds] } : w
              : { ...w, productIds: w.productIds.filter((id) => id !== productId) },
          ),
        }));
        return on;
      },
      createList: (name) => {
        const id = uid();
        set((s) => ({ wishlists: [...s.wishlists, { id, name: name.trim().slice(0, 40) || "New list", productIds: [] }] }));
        return id;
      },
      renameList: (id, name) =>
        set((s) => ({ wishlists: s.wishlists.map((w) => (w.id === id ? { ...w, name: name.trim().slice(0, 40) || w.name } : w)) })),
      deleteList: (id) => id !== "saved" && set((s) => ({ wishlists: s.wishlists.filter((w) => w.id !== id) })),
      setInList: (listId, productId, on) =>
        set((s) => ({
          wishlists: s.wishlists.map((w) =>
            w.id !== listId
              ? w
              : { ...w, productIds: on ? [productId, ...w.productIds.filter((x) => x !== productId)] : w.productIds.filter((x) => x !== productId) },
          ),
        })),

      viewed: (productId) =>
        set((s) => ({ recentlyViewed: [productId, ...s.recentlyViewed.filter((x) => x !== productId)].slice(0, 20) })),
      clearViewed: () => set({ recentlyViewed: [] }),
      addSearch: (q) => {
        const t = q.trim().slice(0, 60);
        if (!t) return;
        set((s) => ({ recentSearches: [t, ...s.recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8) }));
      },
      clearSearches: () => set({ recentSearches: [] }),
      setPincode: (p) => set({ pincode: p }),
      saveOrder: (o) => set((s) => ({ orders: [o, ...s.orders.filter((x) => x.id !== o.id)].slice(0, 50) })),
      setCoupon: (c) => set({ couponCode: c }),
    }),
    {
      name: "krip-store-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => ({
        cart: s.cart,
        wishlists: s.wishlists,
        recentlyViewed: s.recentlyViewed,
        recentSearches: s.recentSearches,
        pincode: s.pincode,
        orders: s.orders,
        couponCode: s.couponCode,
      }),
    },
  ),
);

/** True after the persisted store has loaded on the client (avoids hydration mismatch). */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setH(true);
    return useStore.persist.onFinishHydration(() => setH(true));
  }, []);
  return h;
}

export const cartCount = (cart: CartLine[]) => cart.reduce((n, l) => n + l.qty, 0);

// ---------- toasts ----------
export interface Toast {
  id: number;
  message: string;
  action?: { label: string; href: string };
  tone?: "success" | "error" | "info";
}

export const useToasts = create<{ toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; dismiss: (id: number) => void }>(
  (set) => ({
    toasts: [],
    push: (t) => {
      const id = Date.now() + Math.random();
      set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
      setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3500);
    },
    dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  }),
);
export const toast = (t: Omit<Toast, "id">) => useToasts.getState().push(t);
