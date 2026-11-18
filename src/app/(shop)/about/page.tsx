import type { Metadata } from 'next';
import Link from 'next/link';
import { Gem, QrCode, ShieldCheck, Truck } from 'lucide-react';
import { SITE_NAME } from '@/lib/constants';
import { InfoPage, Prose } from '@/components/info/info-page';

export const metadata: Metadata = {
  title: 'About us',
  description: `Learn about ${SITE_NAME} — carefully sourced designer and niche perfumes, perfume oils, diffusers and lifestyle products, verified by QR.`,
  alternates: { canonical: '/about' },
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Only authentic',
    text: 'We source our products from trusted suppliers and are committed to offering genuine branded products, never counterfeit or falsely branded goods.',
  },
  {
    icon: QrCode,
    title: 'Verifiable',
    text: `Every ${SITE_NAME} product carries a QR code that opens its official page on our website.`,
  },
  {
    icon: Gem,
    title: 'Carefully curated',
    text: 'Designer classics, niche discoveries and lifestyle essentials, thoughtfully selected for quality and distinction.',
  },
  {
    icon: Truck,
    title: 'Delivered with care',
    text: 'Securely packed and delivered across all 36 states of Nigeria and the FCT.',
  },
];

const HOW_WE_WORK = [
  { title: 'Transparent Pricing', text: 'Clear prices in naira, with available sizes and corresponding prices displayed.' },
  { title: 'Secure Payments', text: 'Convenient payment options through Paystack and direct bank transfer.' },
  { title: 'Verified Customer Reviews', text: 'Reviews are accepted from customers whose purchases have been confirmed.' },
  { title: 'Customer Support', text: 'Assistance through WhatsApp, phone and email.' },
  {
    title: 'Carefully Curated Products',
    text: 'A growing selection of fragrances, diffusers and lifestyle products chosen with attention to quality, presentation and customer experience.',
  },
];

export default function AboutPage() {
  return (
    <InfoPage eyebrow="Our story" title={`About ${SITE_NAME}`} description="Shop with confidence. Verify NORÚ products by QR code.">
      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <Prose>
          <h2>Why we started</h2>
          <p>
            Buying fragrances and lifestyle products should be an enjoyable experience, not a gamble. Customers deserve quality
            products, honest information and confidence in what they purchase.
          </p>
          <p>
            Established in 2022, {SITE_NAME} has grown from a small fragrance business into a fragrance and lifestyle brand offering
            carefully sourced designer and niche perfumes, perfume oils, diffusers and lifestyle products to individual consumers,
            wholesalers and retailers.
          </p>
          <p>
            We believe that every purchase should come with confidence. That’s why we pay attention to product quality, presentation
            and consistency, providing clear product descriptions, available sizes and transparent pricing to help customers make
            informed choices.
          </p>

          <h2>The NORÚ QR promise</h2>
          <p>We take product verification seriously.</p>
          <p>
            NORÚ products included in our QR verification system carry unique QR codes that customers can scan using their phone
            cameras. Each code connects to the corresponding product information on our official website and confirms whether the
            product originates from {SITE_NAME}.
          </p>
          <p>
            If a product claims to be an authentic NORÚ product but cannot be verified through our official system, customers are
            encouraged to <Link href="/contact">contact us</Link> for confirmation.
          </p>

          <h2>How we work</h2>
          <ul>
            {HOW_WE_WORK.map((item) => (
              <li key={item.title}>
                <strong>{item.title}:</strong> {item.text}
              </li>
            ))}
          </ul>

          <p className="!mt-8">
            <Link href="/collections">Explore the NORÚ Collection</Link> and discover products that complement your personal style,
            spaces and everyday experiences — or <Link href="/contact">get in touch</Link>.
          </p>
        </Prose>

        <ul className="grid h-fit gap-4 xs:grid-cols-2 lg:grid-cols-1">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 border-t-4 border-gold bg-surface p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-navy text-gold">
                <Icon size={20} />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-navy/65">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </InfoPage>
  );
}