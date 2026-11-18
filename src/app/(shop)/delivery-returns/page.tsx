import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicSettings } from '@/lib/settings';
import { isAlwaysFree } from '@/lib/delivery';
import { formatNaira } from '@/lib/utils';
import { NIGERIAN_STATES } from '@/lib/constants';
import { InfoPage, Prose } from '@/components/info/info-page';

export const metadata: Metadata = {
  title: 'Delivery & returns',
  description: 'Delivery fees by state, delivery times, payment window, returns, exchanges and refunds.',
  alternates: { canonical: '/delivery-returns' },
};

const FALLBACK_EMAIL = 'noruluxury01@gmail.com';
const FALLBACK_DAYS = '2–7 working days';

export default async function DeliveryReturnsPage() {
  const { delivery, contact, whatsapp } = await getPublicSettings();
  const free = isAlwaysFree(delivery);
  const customFee = new Map(delivery.stateFees.map((f) => [f.state.toLowerCase(), f.fee]));
  const feeFor = (state: string) => customFee.get(state.toLowerCase()) ?? delivery.defaultFee;

  const email = contact.email || FALLBACK_EMAIL;
  const days = delivery.estimatedDays || FALLBACK_DAYS;

  return (
    <InfoPage
      eyebrow="Help"
      title="Delivery & returns"
      description="Everything you need to know about receiving your order — and what happens if something isn’t right."
    >
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <Prose>
          <h2>Delivery</h2>
          <ul>
            <li>We deliver to all 36 states of Nigeria and the Federal Capital Territory (FCT).</li>
            {free ? (
              <li><strong>Delivery is currently free</strong> on every order.</li>
            ) : (
              <li>Delivery fees vary by location. The applicable fee will be displayed at checkout before payment.</li>
            )}
            {!free && delivery.freeShippingMin > 0 && (
              <li><strong>Free delivery</strong> on orders of {formatNaira(delivery.freeShippingMin)} or more.</li>
            )}
            <li>Estimated delivery time is <strong>{days}</strong> after payment is confirmed.</li>
            <li>
              We’ll send you email updates when your order is dispatched and delivered. You can also track its status under{' '}
              <Link href="/orders">My Orders</Link>.
            </li>
          </ul>

          <h2>Payment window</h2>
          <p>
            Items are reserved once an order is placed. For bank transfers, please complete payment and upload your payment receipt
            within <strong>24 hours</strong>. Unpaid orders are automatically cancelled, and the reserved items are released.
          </p>

          <h2>Returns &amp; exchanges</h2>
          <p>For hygiene and product-safety reasons, returns are accepted only when items are:</p>
          <ul>
            <li><strong>Unopened</strong>, with the original seal and cellophane intact, where applicable.</li>
            <li>Reported within <strong>7 days</strong> of delivery.</li>
            <li>Returned in their original packaging, with the QR sticker intact, where applicable.</li>
          </ul>
          <p>Opened or used perfumes cannot be returned unless they are faulty.</p>

          <h3>Damaged, faulty or incorrect items?</h3>
          <p>
            Please contact us within <strong>48 hours</strong> of delivery with your order number and clear photographs of the
            affected item.
          </p>
          <p>
            If your order arrives damaged, leaking, faulty or contains an incorrect item, we’ll arrange a replacement or issue a full
            refund, including the original delivery fee.
          </p>

          <h2>Refunds</h2>
          <ul>
            <li>
              Approved refunds will be sent to the original payment method: card payments through Paystack, or the customer’s bank
              account for bank transfers.
            </li>
            <li>
              Refunds are usually processed within <strong>5–10 working days</strong> after the returned item has been received and
              inspected.
            </li>
            <li>If an order is cancelled after payment — for example, because an item is no longer available — a full refund will be issued.</li>
          </ul>

          <h2>Need help?</h2>
          <p>
            Reach us via the <Link href="/contact">contact page</Link>
            {whatsapp ? ' or the WhatsApp button on any page' : ''}, or email <a href={`mailto:${email}`}>{email}</a>.
          </p>
        </Prose>

        {/* Fee table */}
        <aside className="h-fit border-t-4 border-gold bg-surface p-5 sm:p-6 lg:sticky lg:top-32">
          <h2 className="font-serif text-2xl">Delivery fees</h2>
          <p className="mt-1 text-xs text-navy/60">Estimated delivery: {days}</p>
          {free ? (
            <p className="mt-3 text-sm">All states: <strong className="text-success">Free</strong></p>
          ) : (
            <>
              {delivery.freeShippingMin > 0 && (
                <p className="mt-2 text-sm text-navy/70">Free on orders over <strong>{formatNaira(delivery.freeShippingMin)}</strong></p>
              )}
              <div className="mt-4 max-h-[28rem] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-navy text-left text-[11px] uppercase tracking-wider text-gold">
                    <tr>
                      <th className="px-3 py-2">State</th>
                      <th className="px-3 py-2 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/10">
                    {NIGERIAN_STATES.map((s) => {
                      const fee = feeFor(s);
                      return (
                        <tr key={s}>
                          <td className="px-3 py-2">{s}</td>
                          <td className="px-3 py-2 text-right font-semibold">{fee === 0 ? <span className="text-success">Free</span> : formatNaira(fee)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </aside>
      </div>
    </InfoPage>
  );
}