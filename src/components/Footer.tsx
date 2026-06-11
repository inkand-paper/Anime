import Link from "next/link";
import { Github, Twitter, MessageCircle, Send } from "lucide-react";

const NAV = [
  { label: "Home",      href: "/" },
  { label: "Browse",    href: "/browse" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Profile",   href: "/profile" },
];

const LEGAL = [
  { label: "Privacy Policy",  href: "/privacy" },
  { label: "Terms of Service",href: "/terms" },
  { label: "DMCA",            href: "/dmca" },
];

const SOCIAL = [
  { label: "GitHub",   href: "https://github.com", Icon: Github },
  { label: "Twitter",  href: "https://twitter.com", Icon: Twitter },
  { label: "Discord",  href: "https://discord.com", Icon: MessageCircle },
  { label: "Telegram", href: "https://t.me",        Icon: Send },
];

export default function Footer() {
  return (
    <footer
      className="mt-20 border-t"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
    >
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg"
                style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}
              >
                A
              </div>
              <span className="text-xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                AniStream
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--text-secondary)" }}>
              Stream thousands of anime titles in HD. Watch subbed or dubbed.
              Sync playback with friends in real time.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit our ${label}`}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:text-white"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Navigate
            </h4>
            <ul className="space-y-2.5">
              {NAV.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Legal
            </h4>
            <ul className="space-y-2.5">
              {LEGAL.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
        >
          <span>
            &copy; {new Date().getFullYear()} AniStream. All rights reserved.
          </span>
          <span>
            Video content served via{" "}
            <a
              href="https://github.com/consumet/api.consumet.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white transition-colors"
            >
              Consumet API
            </a>
            . We do not host any files.
          </span>
        </div>
      </div>
    </footer>
  );
}
