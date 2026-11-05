import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpRight, Check, Copy, Download, FileText, Mail } from 'lucide-react';
import { profile } from '../data/content';

const CV_URL = '/Rahuldev_Muthamsetty_Resume.pdf';
const CV_NAME = CV_URL.split('/').pop() ?? 'Rahuldev_Muthamsetty_Resume.pdf';
const CV_META = 'PDF · 82 KB · two pages';

const LinkedinGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6.5 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95C20.6 8.75 22 10.6 22 14v7h-4v-6.2c0-1.5-.03-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21h-4V9Z" />
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

const ROLE_LINE = profile.roles.map((role) => role.title).join(' and ');

export const ContactPage = ({ active }: ContactPageProps) => {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard
      ?.writeText(profile.email)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      })
      .catch(() => undefined);
  };

  return (
    <section
      id="contact"
      className={`panel contact-page ${active ? 'is-active' : ''}`}
      aria-labelledby="contact-heading"
      inert={active ? undefined : true}
    >
      <div className="contact-inner">
        <header className="contact-head">
          <span className="contact-eyebrow">
            <span className="contact-dot" aria-hidden="true" />
            Initiate conversation
          </span>
          <h2 id="contact-heading" className="contact-title">
            Let&rsquo;s talk about the role.
          </h2>
          <p className="contact-lede">
            I&rsquo;m open to {ROLE_LINE} roles — internships or full-time.
            Reach out about the resume, my availability, or a quick
            conversation.
          </p>
        </header>

        <div className="contact-cards">
          <article
            className="contact-card"
            style={{ '--d': '0ms' } as CSSProperties}
          >
            <div className="cc-top">
              <span className="cc-icon">
                <Mail size={18} strokeWidth={1.7} />
              </span>
              <h3 className="cc-title">Email</h3>
              <p className="cc-desc">
                Fastest way to reach me for opportunities, technical queries, or
                feedback.
              </p>
              <span className="cc-value">{profile.email}</span>
            </div>
            <div className="cc-actions">
              <a
                className="c-btn c-btn-primary"
                href={`mailto:${profile.email}`}
              >
                <Mail size={14} strokeWidth={1.8} />
                <span>Send email</span>
              </a>
              <button
                type="button"
                className="c-btn c-btn-ghost"
                onClick={copyEmail}
                aria-label="Copy email address to clipboard"
              >
                {copied ? (
                  <Check size={14} strokeWidth={2} />
                ) : (
                  <Copy size={14} strokeWidth={1.8} />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </article>

          <article
            className="contact-card"
            style={{ '--d': '110ms' } as CSSProperties}
          >
            <div className="cc-top">
              <span className="cc-icon">
                <LinkedinGlyph />
              </span>
              <h3 className="cc-title">LinkedIn</h3>
              <p className="cc-desc">
                Connect professionally, discuss career opportunities, or view
                the full background.
              </p>
              <span className="cc-value">{profile.linkedin}</span>
            </div>
            <div className="cc-actions">
              <a
                className="c-btn c-btn-primary c-btn-wide"
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedinGlyph />
                <span>Connect on LinkedIn</span>
                <ArrowUpRight size={14} strokeWidth={1.8} className="c-btn-end" />
              </a>
            </div>
          </article>

          <article
            className="contact-card"
            style={{ '--d': '220ms' } as CSSProperties}
          >
            <div className="cc-top">
              <span className="cc-icon">
                <FileText size={18} strokeWidth={1.7} />
              </span>
              <h3 className="cc-title">Download CV</h3>
              <p className="cc-desc">
                The official resume — one click to view it or save the PDF for
                your team.
              </p>
              <span className="cc-value">{CV_META}</span>
            </div>
            <div className="cc-actions">
              <a
                className="c-btn c-btn-primary"
                href={CV_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText size={14} strokeWidth={1.8} />
                <span>View CV</span>
              </a>
              <a
                className="c-btn c-btn-ghost"
                href={CV_URL}
                download={CV_NAME}
                aria-label={`Download ${CV_NAME}`}
              >
                <Download size={14} strokeWidth={1.8} />
                <span>Download</span>
              </a>
            </div>
          </article>
        </div>

        <div className="cv-strip" style={{ '--d': '360ms' } as CSSProperties}>
          <div className="cv-strip-info">
            <span className="cc-icon">
              <FileText size={18} strokeWidth={1.7} />
            </span>
            <div>
              <div className="cv-strip-title">
                Official resume document (PDF)
              </div>
              <div className="cv-strip-meta">
                {CV_NAME} · {CV_META} · verified for recruiters
              </div>
            </div>
          </div>
          <a className="c-btn c-btn-primary" href={CV_URL} download={CV_NAME}>
            <Download size={14} strokeWidth={1.8} />
            <span>Download resume</span>
          </a>
        </div>
      </div>
    </section>
  );
};
