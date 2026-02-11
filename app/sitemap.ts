import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trysellio.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamic store pages - only published stores
  let storePages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminClient();
    const { data: creators } = await supabase
      .from('creators')
      .select('username, updated_at')
      .eq('is_published', true);

    if (creators) {
      storePages = creators.map((creator) => ({
        url: `${baseUrl}/u/${creator.username}`,
        lastModified: creator.updated_at ? new Date(creator.updated_at) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    // If DB is unavailable, just return static pages
    console.error('Sitemap: Failed to fetch store pages:', error);
  }

  return [...staticPages, ...storePages];
}
