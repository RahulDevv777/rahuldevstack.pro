import cvData from './cv.json' with { type: 'json' };

/* ============================================================================
   Types (mirror prd/data/cv.json structure)
   ============================================================================ */

export type MenuId = 'about' | 'projects' | 'education' | 'skills' | 'assets';

export interface MenuSection {
  id: MenuId;
  label: string;
  caption: string;
  count: string;
  teaser: string[];
}

export interface ProjectEntry {
  title: string;
  subtitle: string;
  tags: string;
  description: string;
  highlights?: string[];
  realWorldValue?: string;
}

export interface EducationEntry {
  institution: string;
  meta: string;
  qualification: string;
  description: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  institution: string;
  quote: string;
  location: string;
  email: string;
  linkedin: string;
  linkedinUrl: string;
  summary: string;
  roles: { title: string; description: string }[];
  competencies: string[];
  languages: { name: string; level: string }[];
  fit: string[];
}

export type AssetCategory = 'projects' | 'profile' | 'skills';
export type AssetFilter = 'all' | AssetCategory;

export type AssetIcon =
  | 'zap' | 'users' | 'send' | 'video' | 'radio' | 'user' | 'pin' | 'mail'
  | 'link' | 'cap' | 'briefcase' | 'target' | 'globe' | 'cpu' | 'code'
  | 'wrench' | 'compass';

export interface AssetLink {
  label: string;
  href: string;
}

export interface AssetCard {
  id: string;
  cat: AssetCategory;
  icon: AssetIcon;
  title: string;
  subtitle: string;
  period: string;
  summary: string;
  tags: string[];
  details: string[];
  links?: AssetLink[];
}

export interface AssetColor {
  bg: string;
  text: string;
}

/* ============================================================================
   Data (typed views over cv.json)
   ============================================================================ */

export const profile: Profile = cvData.profile as Profile;

export const MENU_SECTIONS: MenuSection[] = cvData.menuSections as MenuSection[];

export const featuredProjects: ProjectEntry[] =
  cvData.featuredProjects as ProjectEntry[];

export const finalYearProjects: ProjectEntry[] =
  cvData.finalYearProjects as ProjectEntry[];

export const education: EducationEntry[] =
  cvData.education as EducationEntry[];

export const skillGroups: SkillGroup[] = cvData.skillGroups as SkillGroup[];

export const ASSETS: AssetCard[] = cvData.assets as AssetCard[];

export const ASSET_COLORS: AssetColor[] = cvData.assetColors as AssetColor[];

/* ============================================================================
   Helpers
   ============================================================================ */

export const assetColor = (index: number): AssetColor =>
  ASSET_COLORS[(index * 5) % ASSET_COLORS.length];

export const assetById = (id: string): AssetCard | undefined =>
  ASSETS.find((card) => card.id === id);

export const ASSET_COUNTS = {
  all: ASSETS.length,
  projects: ASSETS.filter((card) => card.cat === 'projects').length,
  skills: ASSETS.filter((card) => card.cat === 'skills').length,
  profile: ASSETS.filter((card) => card.cat === 'profile').length,
};