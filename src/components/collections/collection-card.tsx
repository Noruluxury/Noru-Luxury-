import Image from 'next/image';
import Link from 'next/link';
import type { ProductCollection } from '@/types/collection';

export function CollectionCard({ collection }: { collection: ProductCollection }) {
  const count = collection.productCount ?? 0;

  return (
    <Link href={`/collections/${collection.slug}`} className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden bg-navy p-4">
      {collection.image ? (
        <Image
          src={collection.image.url}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-serif text-7xl italic text-gold/25">
          {collection.name.charAt(0)}
        </span>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
      <span className="relative font-serif text-lg leading-tight text-white group-hover:text-gold sm:text-xl">{collection.name}</span>
      <span className="relative mt-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
        {count} product{count === 1 ? '' : 's'}
      </span>
      <span className="relative mt-2 h-0.5 w-8 bg-gold transition-all group-hover:w-14" />
    </Link>
  );
}