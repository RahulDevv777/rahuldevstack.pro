import type { CSSProperties } from 'react';
import { FitHeading } from './FitHeading';
import { profile } from '../data/content';

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
  onBackToTop: () => void;
}

export const ContactPage = ({ active, onBackToTop }: ContactPageProps) => (
  <section
    id="contact"
    className={`panel contact-page ${active ? 'is-active' : ''}`}
    aria-labelledby="contact-heading"
    inert={active ? undefined : true}
  >
    <div className="contact-head">
      <div className="contact-heading-wrap">
        <FitHeading
          text="CONTACT"
          className="contact-heading"
          id="contact-heading"
        />
      </div>
    </div>

    <div className="contact-content">
      <div className="c-group" style={{ '--d': '0ms' } as CSSProperties}>
        <span className="c-label">Email</span>
        <a className="c-email" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
      </div>

      <div className="c-group" style={{ '--d': '110ms' } as CSSProperties}>
        <span className="c-label">LinkedIn</span>
        <a
          className="c-link"
          href={profile.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {profile.linkedin}
        </a>
      </div>

      <div className="c-group" style={{ '--d': '220ms' } as CSSProperties}>
        <span className="c-label">Location</span>
        <p className="c-body">{profile.location}</p>
      </div>

      <div className="c-group" style={{ '--d': '330ms' } as CSSProperties}>
        <span className="c-label">Open to</span>
        <ul className="c-roles">
          {profile.roles.map((role) => (
            <li key={role.title}>{role.title}</li>
          ))}
        </ul>
      </div>

      <div
        className="c-group c-group-quote"
        style={{ '--d': '470ms' } as CSSProperties}
      >
        <p className="c-quote">“{profile.quote}”</p>
      </div>
    </div>

    <footer className="contact-foot">
      <button type="button" className="glass-pill" onClick={onBackToTop}>
        <span aria-hidden="true">↑</span> back to top
      </button>
      <span className="contact-copy">© 2026 Rahuldev Muthamsetty</span>
    </footer>
  </section>
);
