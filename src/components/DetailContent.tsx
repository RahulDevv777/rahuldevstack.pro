import {
  Children,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  education,
  featuredProjects,
  finalYearProjects,
  profile,
  skillGroups,
} from '../data/content';

const MaskLine = ({
  children,
  className = '',
  as: Tag = 'p',
}: {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'h3' | 'h4' | 'li' | 'div';
}) => (
  <Tag className={`d-mask ${className}`}>
    <span className="d-line">{children}</span>
  </Tag>
);

const MaskBlock = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`d-mask ${className}`}>
    <div className="d-line">{children}</div>
  </div>
);

const Group = ({
  label,
  children,
  base = 0,
  major = false,
  entry = false,
  study = false,
}: {
  label: string;
  children: ReactNode;
  base?: number;
  major?: boolean;
  entry?: boolean;
  study?: boolean;
}) => {
  const items = Children.toArray(children);
  return (
    <section
      className={`d-group ${major ? 'd-group--major' : ''} ${study ? 'd-group--study' : ''}`}
      data-detail-group
      style={{ '--base': base } as CSSProperties}
    >
      <MaskLine className="d-label" as="div">
        {label}
      </MaskLine>
      {items.map((child, i) => (
        <div
          className={`d-item ${entry ? 'd-item--entry' : ''}`}
          style={{ '--j': i + 1 } as CSSProperties}
          key={i}
        >
          {child}
        </div>
      ))}
    </section>
  );
};

const Entry = ({
  title,
  meta,
  body,
  note,
  points,
  emphasis = false,
}: {
  title: string;
  meta: string;
  body: string;
  note?: string;
  points?: string[];
  emphasis?: boolean;
}) => (
  <div className={`d-entry ${emphasis ? 'd-entry--major' : ''}`}>
    <MaskLine className={`d-sub ${emphasis ? 'd-sub--lg' : ''}`} as="h3">
      {title}
    </MaskLine>
    <MaskLine className="d-meta">{meta}</MaskLine>
    <MaskLine className="d-body">{body}</MaskLine>
    {points && points.length > 0 ? (
      <MaskBlock className="d-points">
        <ul>
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </MaskBlock>
    ) : null}
    {note ? (
      <MaskLine className="d-body d-note">
        <span className="d-note-label">Real-world value</span> {note}
      </MaskLine>
    ) : null}
  </div>
);

export const AboutContent = () => (
  <>
    <Group label="Introduction" base={520}>
      <MaskLine className="d-kicker" as="h3">
        Technology Project Builder
      </MaskLine>
      <MaskLine className="d-lede">
        Turning ideas into products with code, creativity and AI.
      </MaskLine>
      <MaskLine className="d-body">{profile.summary}</MaskLine>
      <MaskLine className="d-meta">{profile.institution}</MaskLine>
    </Group>

    <Group label="Core competencies">
      <MaskBlock>
        <ul className="d-grid-list">
          {profile.competencies.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </MaskBlock>
    </Group>

    <Group label="Languages">
      <MaskBlock>
        <ul className="d-plain-list">
          {profile.languages.map((language) => (
            <li key={language.name}>
              <strong>{language.name}</strong>
              <span>{language.level}</span>
            </li>
          ))}
        </ul>
      </MaskBlock>
    </Group>

    <Group label="Why I'm a great fit">
      <MaskLine className="d-body">{profile.fit.join(' · ')}</MaskLine>
    </Group>

    <Group label="Contact">
      <div className="d-contact">
        <MaskLine className="d-meta">{profile.location}</MaskLine>
        <MaskLine className="d-body">
          <a className="d-link" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
        </MaskLine>
        <MaskLine className="d-body">
          <a
            className="d-link"
            href={profile.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {profile.linkedin}
          </a>
        </MaskLine>
      </div>
    </Group>

    <Group label="Closing">
      <MaskLine className="d-quote">“{profile.quote}”</MaskLine>
    </Group>
  </>
);

export const ProjectsContent = () => (
  <>
    <Group label="Featured technology projects" base={520} entry>
      {featuredProjects.map((project) => (
        <Entry
          key={project.title}
          title={project.title}
          meta={project.tags}
          body={project.description}
        />
      ))}
    </Group>

    <Group label="B.Tech final-year projects" major entry>
      {finalYearProjects.map((project) => (
        <Entry
          key={project.title}
          title={project.title}
          meta={project.tags}
          body={project.description}
          points={project.highlights}
          note={project.realWorldValue}
          emphasis
        />
      ))}
    </Group>
  </>
);

export const EducationContent = () => (
  <Group label="Education & accelerator" base={520} entry study>
    {education.map((item) => (
      <Entry
        key={item.institution}
        title={item.institution}
        meta={`${item.qualification} · ${item.meta}`}
        body={item.description}
        points={item.highlights}
        emphasis
      />
    ))}
  </Group>
);

export const SkillsContent = () => (
  <>
    <Group
      label="Backend & systems"
      base={520}
    >
      <p className="d-body">{skillGroups[0].items.join(' · ')}</p>
    </Group>
    <Group label="Frontend" base={400}>
      <p className="d-body">{skillGroups[1].items.join(' · ')}</p>
    </Group>
    <Group label="Tools & approach">
      <p className="d-body">{skillGroups[2].items.join(' · ')}</p>
    </Group>
    <Group label="Product & leadership">
      <p className="d-body">{skillGroups[3].items.join(' · ')}</p>
    </Group>
  </>
);

export type DetailId = 'about' | 'projects' | 'education' | 'skills';

export const DETAIL_CONTENT: Record<DetailId, () => ReactNode> = {
  about: AboutContent,
  projects: ProjectsContent,
  education: EducationContent,
  skills: SkillsContent,
};
