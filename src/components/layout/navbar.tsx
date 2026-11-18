'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { NAV_LINKS, SITE_NAME } from '@/lib/constants';
import { groupCollections } from '@/lib/product';
import { useAuthStore } from '@/store/auth.store';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';
import type { ProductCollection } from '@/types/collection';

function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative flex h-10 w-10 items-center justify-center text-white hover:text-gold"
    >
      <ShoppingBag size={20} />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('font-serif font-semibold tracking-wide text-gold', className)}>
      {SITE_NAME}
      <span className="text-white">.</span>
    </span>
  );
}

export function Navbar({
  announcement,
  collections = [],
}: {
  announcement?: string | null;
  collections?: ProductCollection[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, logout } = useAuthStore();
  const groups = useMemo(() => groupCollections(collections), [collections]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [mobileBrowseOpen, setMobileBrowseOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const browseRef = useRef<HTMLLIElement>(null);

  const onCollections = pathname === '/collections' || pathname.startsWith('/collections/');

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setBrowseOpen(false);
    setMobileBrowseOpen(pathname.startsWith('/collections'));
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setUserMenuOpen(false);
      if (browseRef.current && !browseRef.current.contains(target)) setBrowseOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBrowseOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    router.replace('/');
    router.refresh();
  };

  const isActive = (href: string) => pathname === href.split('?')[0];
  const isAdmin = user?.role === 'admin';

  const desktopLink = (active: boolean) =>
    cn(
      'border-b-2 py-1 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:text-gold',
      active ? 'border-gold text-gold' : 'border-transparent text-white/85',
    );

  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold bg-navy">
      {announcement && (
        <div className="bg-gold px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-navy sm:text-xs">
          {announcement}
        </div>
      )}

      <nav className="container-page relative flex h-16 items-center justify-between gap-4 sm:h-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="-ml-2 flex h-10 w-10 items-center justify-center text-white hover:text-gold lg:hidden"
          >
            <Menu size={22} />
          </button>

          <Link href="/">
            <Logo className="text-xl xs:text-2xl" />
          </Link>
        </div>

        {/* ============ Desktop menu ============ */}
        <ul className="hidden h-full items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href} className="flex h-full items-center">
              <Link href={link.href} className={desktopLink(isActive(link.href))}>
                {link.label}
              </Link>
            </li>
          ))}

          {/* Browse — mega menu */}
          <li
            ref={browseRef}
            className="flex h-full items-center"
            onMouseEnter={() => setBrowseOpen(true)}
            onMouseLeave={() => setBrowseOpen(false)}
          >
            <button
              type="button"
              onClick={() => setBrowseOpen((v) => !v)}
              aria-expanded={browseOpen}
              aria-haspopup="true"
              className={cn('flex items-center gap-1', desktopLink(onCollections || browseOpen))}
            >
              Browse
              <ChevronDown size={14} className={cn('transition-transform', browseOpen && 'rotate-180')} />
            </button>

            {browseOpen && (
              <div className="absolute inset-x-0 top-full z-50 border-t-2 border-gold bg-white text-navy shadow-2xl">
                <div className="px-4 py-8 sm:px-6 lg:px-8">
                  {groups.length === 0 ? (
                    <p className="text-sm text-navy/60">Collections are coming soon.</p>
                  ) : (
                    <div className={cn('grid gap-8', groups.length >= 3 ? 'grid-cols-3' : groups.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
                      {groups.map((g) => (
                        <div key={g.group}>
                          <p className="border-b border-gold/50 pb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gold-dark">
                            {g.label}
                          </p>
                          <ul className="mt-3 space-y-1">
                            {g.items.map((c) => (
                              <li key={c._id}>
                                <Link
                                  href={`/collections/${c.slug}`}
                                  className={cn(
                                    'block py-1.5 text-sm transition-colors hover:translate-x-1 hover:text-gold-dark',
                                    pathname === `/collections/${c.slug}` ? 'font-semibold text-gold-dark' : 'text-navy',
                                  )}
                                >
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-6 border-t border-navy/10 pt-4">
                    <Link
                      href="/collections"
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-navy underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-dark"
                    >
                      View all collections <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </li>
        </ul>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/perfumes?focus=search"
            aria-label="Search products"
            className="flex h-10 w-10 items-center justify-center text-white hover:text-gold"
          >
            <Search size={20} />
          </Link>

          <CartButton />

          {status === 'authenticated' && user ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={userMenuOpen}
                className="flex h-10 w-10 items-center justify-center bg-gold text-sm font-bold uppercase text-navy hover:bg-gold-light"
              >
                {user.name.charAt(0)}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 border-t-2 border-gold bg-white text-navy shadow-xl">
                  <div className="border-b border-navy/10 px-4 py-3">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-navy/50">{user.email}</p>
                  </div>
                  <div className="py-1">
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gold-dark hover:bg-surface">
                        <LayoutDashboard size={16} /> Admin Panel
                      </Link>
                    )}
                    <Link href="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface hover:text-gold-dark">
                      <User size={16} /> My Account
                    </Link>
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface hover:text-gold-dark">
                      <Package size={16} /> My Orders
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-error hover:bg-error/10"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" aria-label="Log in" className="flex h-10 items-center justify-center px-2 text-white hover:text-gold">
              <User size={20} className="sm:hidden" />
              <span className="hidden border border-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold hover:text-navy sm:inline">
                Log in
              </span>
            </Link>
          )}
        </div>
      </nav>

      {/* ============ Mobile drawer ============ */}
      <div
        className={cn('fixed inset-0 z-50 lg:hidden', mobileOpen ? 'pointer-events-auto' : 'pointer-events-none')}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn('absolute inset-0 bg-navy-dark/60 transition-opacity duration-300', mobileOpen ? 'opacity-100' : 'opacity-0')}
        />

        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white text-navy transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b-2 border-gold bg-navy px-4">
            <Logo className="text-xl" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center text-white hover:text-gold"
            >
              <X size={22} />
            </button>
          </div>

          <ul className="flex-1 overflow-y-auto py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center border-b border-navy/5 px-5 py-4 text-sm font-semibold uppercase tracking-[0.15em]',
                    isActive(link.href) ? 'border-l-4 border-l-gold bg-gold/15 text-navy' : 'text-navy hover:text-gold-dark',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {/* Browse — collections accordion */}
            <li>
              <button
                type="button"
                onClick={() => setMobileBrowseOpen((v) => !v)}
                aria-expanded={mobileBrowseOpen}
                className={cn(
                  'flex w-full items-center justify-between border-b border-navy/5 px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.15em]',
                  onCollections ? 'border-l-4 border-l-gold bg-gold/15 text-navy' : 'text-navy hover:text-gold-dark',
                )}
              >
                Browse
                <ChevronDown size={18} className={cn('text-gold-dark transition-transform', mobileBrowseOpen && 'rotate-180')} />
              </button>

              {mobileBrowseOpen && (
                <div className="border-b border-navy/5 bg-surface px-5 py-3">
                  {groups.length === 0 ? (
                    <p className="py-2 text-sm text-navy/60">Collections are coming soon.</p>
                  ) : (
                    groups.map((g) => (
                      <div key={g.group} className="py-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark">{g.label}</p>
                        <ul className="mt-1">
                          {g.items.map((c) => (
                            <li key={c._id}>
                              <Link
                                href={`/collections/${c.slug}`}
                                className={cn(
                                  'block border-l-2 py-2 pl-3 text-sm',
                                  pathname === `/collections/${c.slug}` ? 'border-gold font-semibold text-gold-dark' : 'border-transparent text-navy hover:text-gold-dark',
                                )}
                              >
                                {c.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                  <Link href="/collections" className="mt-2 inline-flex items-center gap-2 py-2 text-xs font-semibold uppercase tracking-wider text-navy underline decoration-gold decoration-2 underline-offset-4">
                    View all collections <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </li>

            <li>
              <Link
                href="/cart"
                className={cn(
                  'flex items-center border-b border-navy/5 px-5 py-4 text-sm font-semibold uppercase tracking-[0.15em]',
                  isActive('/cart') ? 'border-l-4 border-l-gold bg-gold/15 text-navy' : 'text-navy hover:text-gold-dark',
                )}
              >
                Cart
              </Link>
            </li>
          </ul>

          <div className="border-t border-navy/10 bg-surface p-4">
            {status === 'authenticated' && user ? (
              <div className="space-y-1">
                <p className="mb-3 truncate text-sm text-navy/70">
                  Signed in as <span className="font-semibold text-navy">{user.name}</span>
                </p>
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-3 py-2.5 text-sm font-medium text-gold-dark">
                    <LayoutDashboard size={16} /> Admin Panel
                  </Link>
                )}
                <Link href="/account" className="flex items-center gap-3 py-2.5 text-sm">
                  <User size={16} /> My Account
                </Link>
                <Link href="/orders" className="flex items-center gap-3 py-2.5 text-sm">
                  <Package size={16} /> My Orders
                </Link>
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 py-2.5 text-left text-sm text-error">
                  <LogOut size={16} /> Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/login" className="flex h-11 items-center justify-center border border-navy text-xs font-semibold uppercase tracking-wider text-navy">
                  Log in
                </Link>
                <Link href="/register" className="flex h-11 items-center justify-center bg-navy text-xs font-semibold uppercase tracking-wider text-gold">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </header>
  );
}