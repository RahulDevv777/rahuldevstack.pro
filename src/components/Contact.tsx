import type { CSSProperties, ReactElement } from 'react';
import { profile } from '../data/content';

const CV_URL = '/Rahuldev_Muthamsetty_Resume.pdf';
const CV_NAME = CV_URL.split('/').pop() ?? 'Rahuldev_Muthamsetty_Resume.pdf';

const Envelope = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <polyline points="22,12 12,7 2,12" />
  </svg>
);

const LinkedIn = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="7" height="9" rx="1" ry="1" />
    <path d="M16 19h2" />
    <path d="M16 3h2" />
  </svg>
);

const Download = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

interface FloatingNavProps {
  page: number;
  menuIndex: number;
  hidden: boolean;
  onNavigate: (page: number, menuIndex?: number) => void;
}

const SECTIONS = [
  { label: 'About', index: 0 },
  { label: 'Projects', index: 1 },
  { label: 'Education', index: 2 },
  { label: 'Skills', index: 3 },
];

export const FloatingNav = ({
  page,
  menuIndex,
  hidden,
  onNavigate,
}: FloatingNavProps) => {
  const menuActive = page === 1 ? menuIndex : -1;
  const showMenuKey = page === 2;
  const activeSection = hidden ? -1 : menuActive;
  const assetsActive = page === 2 || (page === 1 && menuIndex === 4);
  const contactActive = page === 3;

  return (
    <nav
      className={`site-nav ${hidden || page === 0 ? 'is-hidden' : ''}`}
      aria-label="Portfolio pages"
    >
      {showMenuKey ? (
        <button
          type="button"
          className="nav-brand"
          onClick={() => onNavigate(1, 4)}
          aria-label="Back to the sections"
        >
          <span aria-hidden="true">↑</span> menu
        </button>
      ) : (
        <button
          type="button"
          className="nav-brand"
          onClick={() => onNavigate(0)}
          aria-label="Rahuldev Muthamsetty — back to the top"
        >
          RM
        </button>
      )}

      <span className="nav-rule" aria-hidden="true" />

      {SECTIONS.map((section) => (
        <button
          key={section.label}
          type="button"
          className={`nav-link ${activeSection === section.index ? 'is-active' : ''}`}
          aria-current={activeSection === section.index ? 'true' : undefined}
          onClick={() => onNavigate(1, section.index)}
        >
          {section.label}
        </button>
      ))}

      <button
        type="button"
        className={`nav-link ${assetsActive ? 'is-active' : ''}`}
        aria-current={assetsActive ? 'true' : undefined}
        onClick={() => onNavigate(2)}
      >
        Assets
      </button>

      <button
        type="button"
        className={`nav-link ${contactActive ? 'is-active' : ''}`}
        aria-current={contactActive ? 'true' : undefined}
        onClick={() => onNavigate(3)}
      >
        Contact
      </button>
    </nav>
  );
};

interface ContactPageProps {
  active: boolean;
}

const CV_INFO = 'PDF · 82 KB';

interface ICardProps {
  label: string;
  value: string;
  href: string;
  icon: ReactElement;
  external?: boolean;
  download?: boolean;
  delay: string;
  ariaValue?: string;
}

const ICard = ({
  label,
  value,
  href,
  icon,
  external,
  download,
  delay,
  ariaValue,
}: ICardProps) => (
  <a
    className="i-card"
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
    download={download ? CV_NAME : undefined}
    style={{ '--d': delay } as CSSProperties}
    aria-label={`${label}: ${ariaValue ?? value}`}
    title={ariaValue ?? value}
  >
    <span className="i-icon">{icon}</span>
    <div className="i-body">
      <span className="i-label">{label}</span>
      <span className="i-value">{value}</span>
    </div>
    <span className="i-arrow" aria-hidden="true">›</span>
  </a>
);

export const ContactPage = ({ active }: ContactPageProps) => (
  <section
    id="contact"
    className={`panel contact-page ${active ? 'is-active' : ''}`}
    aria-labelledby="contact-heading"
    inert={active ? undefined : true}
  >
    {/* Big faded letter across the top of the page — same size and full width
       as the PORTFOLIO letter on the hero page, faded back. */}
    <div className="contact-letter">
      <svg viewBox="0 0 1000 104" aria-hidden="true">
        <text
          x="0"
          y="102"
          textLength="1000"
          lengthAdjust="spacingAndGlyphs"
        >
          CONTACT
        </text>
      </svg>
    </div>

    <div className="i-cards">
      <ICard
        label="Email"
        value={profile.email}
        href={`mailto:${profile.email}`}
        icon={<Envelope />}
        delay="0ms"
      />
      <ICard
        label="LinkedIn"
        value={profile.linkedin}
        href={profile.linkedinUrl}
        icon={<LinkedIn />}
        external
        delay="140ms"
      />
      <ICard
        label="Download CV"
        value={CV_INFO}
        href={CV_URL}
        icon={<Download />}
        download
        delay="280ms"
        ariaValue={`${CV_NAME} — ${CV_INFO}`}
      />
    </div>
  </section>
);
