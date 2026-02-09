import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { StoreHeader } from './store-header';
import { ProductGrid } from './product-grid';
import { StoreWrapper } from './store-wrapper';
import { ShareButtons } from '@/components/shared/share-buttons';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  params: Promise<{ username: string }>;
}

interface StoreSection {
  id: string;
  title: string;
  sort_order: number;
  is_visible: boolean;
}

interface StoreItem {
  id: string;
  product_id: string;
  section_id: string | null;
  sort_order: number;
  is_visible: boolean;
  product: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    price: number;
    image_url: string | null;
    type_config: Record<string, unknown> | null;
    is_published: boolean;
  };
}

async function getCreatorByUsername(username: string) {
  const supabase = await createClient();
  
  const { data: creator, error } = await supabase
    .from('creators')
    .select(`
      id,
      display_name,
      username,
      bio,
      avatar_url,
      is_published,
      plan,
      contact_phone,
      contact_line,
      contact_ig,
      contact_email,
      store_design,
      seo_title,
      seo_description,
      seo_keywords,
      og_image_url,
      store_language
    `)
    .eq('username', username)
    .eq('is_published', true)
    .single();

  console.log('Creator lookup:', { username, creator, error: error?.message });

  if (error || !creator) {
    return null;
  }

  return creator;
}

async function getStoreData(creatorId: string) {
  const supabase = await createClient();
  
  // Try to get store_items first (new system)
  const { data: storeItems, error: itemsError } = await supabase
    .from('store_items')
    .select(`
      id,
      product_id,
      section_id,
      sort_order,
      is_visible,
      product:products(
        id,
        title,
        description,
        type,
        price,
        image_url,
        type_config,
        is_published
      )
    `)
    .eq('creator_id', creatorId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  // Get sections
  const { data: sections } = await supabase
    .from('store_sections')
    .select('id, title, sort_order, is_visible')
    .eq('creator_id', creatorId)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  // If store_items exist and have data, use them
  if (!itemsError && storeItems && storeItems.length > 0) {
    // Filter only published products and valid items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validItems = (storeItems as any[]).filter(
      (item: any) => item.product && item.product.is_published
    );
    
    // Organize by sections
    const unsectionedProducts = validItems
      .filter((item: any) => !item.section_id)
      .map((item: any) => item.product);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sectionedProducts: { section: StoreSection; products: any[] }[] = 
      (sections || []).map((section: StoreSection) => ({
        section,
        products: validItems
          .filter((item: any) => item.section_id === section.id)
          .map((item: any) => item.product)
      })).filter((s: { section: StoreSection; products: any[] }) => s.products.length > 0);

    return { unsectionedProducts, sectionedProducts };
  }

  // Fallback to old system (direct products query)
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      description,
      type,
      price,
      image_url,
      type_config
    `)
    .eq('creator_id', creatorId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return { unsectionedProducts: [], sectionedProducts: [] };
  }

  return { unsectionedProducts: products || [], sectionedProducts: [] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);
  
  const t = await getTranslations('StoreFront');

  if (!creator) {
    return {
      title: t('storeNotFound'),
    };
  }

  // Use SEO settings if available, fallback to defaults
  const title = creator.seo_title || `${creator.display_name || creator.username} | Sellio`;
  const description = creator.seo_description || creator.bio || t('storeOf', { name: creator.display_name || creator.username });
  const keywords = creator.seo_keywords || undefined;
  const ogImage = creator.og_image_url || creator.avatar_url;

  return {
    title,
    description,
    keywords: keywords ? keywords.split(',').map((k: string) => k.trim()) : undefined,
    openGraph: {
      title: creator.seo_title || creator.display_name || creator.username,
      description,
      images: ogImage ? [ogImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: creator.seo_title || creator.display_name || creator.username,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function StorePage({ params }: PageProps) {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);

  if (!creator) {
    notFound();
  }

  // Set locale cookie to match creator's store language for visitors
  const cookieStore = await cookies();
  const currentLocale = cookieStore.get('locale')?.value;
  if (!currentLocale && creator.store_language) {
    try {
      cookieStore.set('locale', creator.store_language, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    } catch {
      // cookies().set() may throw in Server Components in some Next.js versions
      // The language switcher handles this client-side instead
    }
  }

  const t = await getTranslations('StoreFront');

  const { unsectionedProducts, sectionedProducts } = await getStoreData(creator.id);
  const hasProducts = unsectionedProducts.length > 0 || sectionedProducts.length > 0;
  const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/u/${username}`;

  return (
    <StoreWrapper design={creator.store_design}>
      {/* Language Switcher */}
      <div className="flex justify-end max-w-2xl mx-auto px-4 pt-3">
        <LanguageSwitcher />
      </div>

      {/* Store Header */}
      <StoreHeader creator={creator} />

      {/* Share Buttons */}
      <div className="max-w-2xl mx-auto px-4 py-2 flex justify-center">
        <ShareButtons
          url={storeUrl}
          title={creator.display_name || creator.username}
          description={creator.bio || undefined}
          compact
        />
      </div>

      {/* Products */}
      <main className="max-w-2xl mx-auto px-4 pb-12">
        {!hasProducts ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('noProducts')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unsectioned Products */}
            {unsectionedProducts.length > 0 && (
              <ProductGrid products={unsectionedProducts} creatorUsername={username} design={creator.store_design} />
            )}

            {/* Sectioned Products */}
            {sectionedProducts.map(({ section, products }) => (
              <div key={section.id}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                  {section.title}
                </h3>
                <ProductGrid products={products} creatorUsername={username} design={creator.store_design} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer - hidden for Pro users */}
      {creator.plan !== 'pro' && (
        <footer className="text-center py-6 text-sm text-muted-foreground border-t">
          <a href="https://sellio.me" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            Powered by Sellio
          </a>
        </footer>
      )}
    </StoreWrapper>
  );
}
