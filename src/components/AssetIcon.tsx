import {
  Briefcase,
  Code,
  Compass,
  Cpu,
  Globe,
  GraduationCap,
  Link,
  Mail,
  MapPin,
  Radio,
  Send,
  Target,
  User,
  Users,
  Video,
  Wrench,
  Zap,
} from 'lucide-react';
import type { AssetIcon as AssetIconName } from '../data/assets';

const ICONS = {
  zap: Zap,
  users: Users,
  send: Send,
  video: Video,
  radio: Radio,
  user: User,
  pin: MapPin,
  mail: Mail,
  link: Link,
  cap: GraduationCap,
  briefcase: Briefcase,
  target: Target,
  globe: Globe,
  cpu: Cpu,
  code: Code,
  wrench: Wrench,
  compass: Compass,
};

export const AssetIcon = ({
  name,
  size = 48,
  strokeWidth = 1.6,
}: {
  name: AssetIconName;
  size?: number;
  strokeWidth?: number;
}) => {
  const Icon = ICONS[name] ?? Zap;
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
};
