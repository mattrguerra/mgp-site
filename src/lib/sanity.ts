import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
});

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// --- GROQ Queries ---

export const projectsQuery = `*[_type == "project"] | order(date desc) {
  _id,
  title,
  slug,
  category->{title, slug},
  coverImage,
  date,
  client,
  excerpt
}`;

export const projectBySlugQuery = `*[_type == "project" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  category->{title, slug},
  coverImage,
  images[]{
    asset->,
    caption,
    alt
  },
  date,
  client,
  excerpt,
  description
}`;

export const categoriesQuery = `*[_type == "category"] | order(title asc) {
  _id,
  title,
  slug
}`;

export const blogPostsQuery = `*[_type == "blogPost"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  coverImage,
  publishedAt,
  category->{title, slug},
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180)
}`;

export const blogPostBySlugQuery = `*[_type == "blogPost" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  excerpt,
  coverImage,
  publishedAt,
  category->{title, slug},
  body,
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180)
}`;

export const pricingQuery = `*[_type == "pricingPackage"] | order(order asc) {
  _id,
  title,
  price,
  description,
  features,
  highlighted,
  cta
}`;

export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  title,
  description,
  ogImage,
  heroImage,
  heroTagline,
  aboutTeaser,
  contactEmail,
  phone,
  socialLinks
}`;
