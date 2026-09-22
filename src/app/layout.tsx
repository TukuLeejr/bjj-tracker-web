'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

const navItems = [
  {
    label: 'Home',
    href: '/',
    icon: '⌂',
  },
  {
    label: 'Train',
    href: '/train',
    icon: '⚡',
  },
  {
    label: 'Journal',
    href: '/journal',
    icon: '▣',
  },
  {
    label: 'Stats',
    href: '/stats',
    icon: '▥',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: '◉',
  },
];

function isActive(
  pathname: string,
  href: string
) {
  if (
    href === '/'
  ) {
    return pathname === '/';
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname =
    usePathname();

  return (
    <html lang="en">
      <head>
        <meta
          name="application-name"
          content="BJJ Tracker"
        />

        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <meta
          name="apple-mobile-web-app-title"
          content="BJJ Tracker"
        />

        <meta
          name="mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="theme-color"
          content="#090A0C"
        />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
        />

        <link
          rel="manifest"
          href="/manifest.webmanifest"
        />
      </head>

      <body>
        <div className="app-shell">
          <aside className="desktop-sidebar">
            <div className="desktop-sidebar-inner">
              <Link
                href="/"
                className="brand-block"
              >
                <div className="brand-mark">
                  BJJ
                </div>

                <div>
                  <div className="brand-title">
                    BJJ Tracker
                  </div>

                  <div className="brand-subtitle">
                    Training dashboard
                  </div>
                </div>
              </Link>

              <nav className="desktop-nav">
                {navItems.map(
                  (
                    item
                  ) => {
                    const active =
                      isActive(
                        pathname,
                        item.href
                      );

                    return (
                      <Link
                        key={
                          item.href
                        }
                        href={
                          item.href
                        }
                        className={
                          active
                            ? 'desktop-nav-item active'
                            : 'desktop-nav-item'
                        }
                        aria-current={
                          active
                            ? 'page'
                            : undefined
                        }
                      >
                        <span className="desktop-nav-icon">
                          {
                            item.icon
                          }
                        </span>

                        <span className="desktop-nav-label">
                          {
                            item.label
                          }
                        </span>
                      </Link>
                    );
                  }
                )}
              </nav>

              <div className="desktop-sidebar-footer">
                <span className="status-dot" />

                <span>
                  Web app
                </span>
              </div>
            </div>
          </aside>

          <main className="app-main">
            <div className="app-content">
              {
                children
              }
            </div>
          </main>

          <nav className="mobile-bottom-nav">
            {navItems.map(
              (
                item
              ) => {
                const active =
                  isActive(
                    pathname,
                    item.href
                  );

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    className={
                      active
                        ? 'mobile-nav-item active'
                        : 'mobile-nav-item'
                    }
                    aria-current={
                      active
                        ? 'page'
                        : undefined
                    }
                  >
                    <span className="mobile-nav-icon">
                      {
                        item.icon
                      }
                    </span>

                    <span className="mobile-nav-label">
                      {
                        item.label
                      }
                    </span>
                  </Link>
                );
              }
            )}
          </nav>
        </div>

        <style jsx global>{`
          .brand-block {
            text-decoration: none;
          }

          .desktop-nav-item,
          .mobile-nav-item {
            transition:
              background 0.15s ease,
              color 0.15s ease,
              border-color 0.15s ease,
              transform 0.15s ease;
          }

          .desktop-nav-item.active {
            border-color: #343840;
            background: #1a1d22;
            color: #ffffff;
          }

          .desktop-nav-item.active .desktop-nav-icon,
          .desktop-nav-item.active .desktop-nav-label {
            color: #ffffff;
          }

          .mobile-nav-item.active {
            color: #ffffff;
          }

          .mobile-nav-item.active .mobile-nav-icon {
            color: #ffffff;
            transform: translateY(-1px);
          }

          .mobile-nav-item.active .mobile-nav-label {
            color: #ffffff;
            font-weight: 900;
          }

          @media (max-width: 859px) {
            .app-main {
              min-height: 100dvh;
            }

            .app-content {
              padding-bottom:
                calc(
                  var(--mobile-nav-height, 78px) +
                  env(safe-area-inset-bottom) +
                  24px
                );
            }

            .mobile-bottom-nav {
              padding-bottom:
                env(safe-area-inset-bottom);
            }
          }
        `}</style>
      </body>
    </html>
  );
}


