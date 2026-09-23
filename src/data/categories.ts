import type { Category } from "@/types";

/**
 * Browse categories for the homepage (Stage 2). Counts are mock values
 * until the database stage provides real aggregates.
 */
export const CATEGORIES: Category[] = [
  {
    slug: "paintings",
    name: "Paintings",
    description: "Oil, acrylic and watercolour originals.",
    gradient: "linear-gradient(150deg, #f2d6a5 0%, #d3811f 100%)",
    count: 312,
  },
  {
    slug: "digital-art",
    name: "Digital Art",
    description: "Generative, 3D and screen-native work.",
    gradient: "linear-gradient(150deg, #4c3a78 0%, #1f1d2b 100%)",
    count: 187,
  },
  {
    slug: "photography",
    name: "Photography",
    description: "Limited archival prints, signed.",
    gradient: "linear-gradient(150deg, #e5e1da 0%, #665c50 100%)",
    count: 241,
  },
  {
    slug: "illustrations",
    name: "Illustrations",
    description: "Drawn, painted and mixed-media works.",
    gradient: "linear-gradient(150deg, #f9ecd3 0%, #e09c42 100%)",
    count: 156,
  },
  {
    slug: "sculptures",
    name: "Sculptures",
    description: "Bronze, stone and found-material forms.",
    gradient: "linear-gradient(150deg, #b76617 0%, #633418 100%)",
    count: 74,
  },
  {
    slug: "abstract",
    name: "Abstract",
    description: "Colour, gesture and geometry.",
    gradient: "linear-gradient(150deg, #f2d6a5 0%, #944d18 60%, #50483f 100%)",
    count: 268,
  },
  {
    slug: "traditional-art",
    name: "Traditional Art",
    description: "Ink, tempera and classical technique.",
    gradient: "linear-gradient(150deg, #faf9f7 0%, #83786a 100%)",
    count: 129,
  },
  {
    slug: "portraits",
    name: "Portraits",
    description: "Faces, figures and character studies.",
    gradient: "linear-gradient(150deg, #cfc8bd 0%, #38322c 100%)",
    count: 203,
  },
];
