import {
  Boxes,
  Briefcase,
  ChartLine,
  GraduationCap,
  Megaphone,
  Monitor,
  MousePointerClick,
  ScanBarcode,
  Search,
  ShoppingCart,
  Stethoscope,
  Target,
  UtensilsCrossed,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

const icons = {
  school: GraduationCap,
  hospital: Stethoscope,
  restaurant: UtensilsCrossed,
  pos: ScanBarcode,
  inventory: Boxes,
  business: Briefcase,
  search: Search,
  ads: MousePointerClick,
  social: Megaphone,
  conversion: Target,
  web: Monitor,
  cart: ShoppingCart,
  analytics: ChartLine,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Component = icons[name];
  return <Component aria-hidden="true" {...props} />;
}
