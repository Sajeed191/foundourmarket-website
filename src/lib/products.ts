import earbuds from "@/assets/product-earbuds.jpg";
import watch from "@/assets/product-watch.jpg";
import lamp from "@/assets/product-lamp.jpg";
import headphones from "@/assets/product-headphones.jpg";
import flask from "@/assets/product-flask.jpg";
import keyboard from "@/assets/product-keyboard.jpg";
import backpack from "@/assets/product-backpack.jpg";
import sunglasses from "@/assets/product-sunglasses.jpg";

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  price: number; // USD base
  rating: number;
  reviews: number;
  image: string;
  description: string;
  inStock: boolean;
  discount?: number;
};

export const PRODUCTS: Product[] = [
  { slug: "aero-x-buds", name: "Aero-X Buds", tagline: "Titanium Series", category: "electronics", price: 189, rating: 4.9, reviews: 1284, image: earbuds, description: "Studio-grade wireless earbuds with active noise cancellation and 36-hour playback.", inStock: true, discount: 15 },
  { slug: "tempus-one", name: "Tempus One", tagline: "Swiss Movement", category: "accessories", price: 340, rating: 4.8, reviews: 612, image: watch, description: "A precision automatic timepiece machined from a single block of brushed titanium.", inStock: true },
  { slug: "beam-desk-light", name: "Beam Desk Light", tagline: "Smart Dimmable", category: "home", price: 120, rating: 4.7, reviews: 942, image: lamp, description: "Sculpted aluminum desk lamp with circadian temperature control.", inStock: true },
  { slug: "obsidian-headphones", name: "Obsidian Headphones", tagline: "Reference Audio", category: "electronics", price: 399, rating: 4.9, reviews: 2103, image: headphones, description: "Reference-class over-ear headphones with planar magnetic drivers.", inStock: true, discount: 10 },
  { slug: "titan-flask", name: "Titan Flask", tagline: "Aerospace Grade", category: "fitness", price: 85, rating: 4.6, reviews: 478, image: flask, description: "Vacuum-insulated titanium flask. 24h cold, 12h hot.", inStock: true },
  { slug: "halo-keyboard", name: "Halo Keyboard", tagline: "Tactile Switch", category: "gaming", price: 240, rating: 4.8, reviews: 856, image: keyboard, description: "Low-profile mechanical keyboard with hot-swap switches.", inStock: true },
  { slug: "voyage-pack", name: "Voyage Pack", tagline: "Full-Grain Leather", category: "fashion", price: 295, rating: 4.7, reviews: 321, image: backpack, description: "Full-grain leather backpack with magnetic closures.", inStock: true },
  { slug: "ember-shades", name: "Ember Shades", tagline: "Polarized", category: "fashion", price: 160, rating: 4.5, reviews: 234, image: sunglasses, description: "Hand-finished acetate frames with polarized amber lenses.", inStock: true, discount: 20 },
];

export const CATEGORIES = [
  { slug: "electronics", name: "Electronics", count: 2 },
  { slug: "fashion", name: "Fashion", count: 2 },
  { slug: "home", name: "Home", count: 1 },
  { slug: "beauty", name: "Beauty", count: 0 },
  { slug: "fitness", name: "Fitness", count: 1 },
  { slug: "gaming", name: "Gaming", count: 1 },
  { slug: "accessories", name: "Accessories", count: 1 },
  { slug: "gadgets", name: "Gadgets", count: 0 },
];

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}
export function getProductsByCategory(slug: string) {
  return PRODUCTS.filter((p) => p.category === slug);
}
