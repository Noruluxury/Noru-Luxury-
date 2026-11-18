import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { WhatsAppButton } from '@/components/layout/whatsapp-button';
import { getPublicSettings } from '@/lib/settings';
import { getCollections } from '@/lib/collections';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, collections] = await Promise.all([getPublicSettings(), getCollections()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar announcement={settings.announcement} collections={collections} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <WhatsAppButton whatsapp={settings.whatsapp} />
    </div>
  );
}