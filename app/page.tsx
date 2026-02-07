import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Navbar, Hero, Features, HowItWorks, Pricing, Testimonials, CTA, Footer } from '@/components/landing';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    alternates: { canonical: "/" },
  };
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
