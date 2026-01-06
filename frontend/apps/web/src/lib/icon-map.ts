import {
  Home,
  LayoutDashboard,
  Users,
  Settings,
  Layout,
  Boxes,
  User,
  Bell,
  Palette,
  Languages,
  Shield,
  Warehouse,
  Sliders,
  ClipboardList,
  TrendingUp,
  MapPin,
  Building2,
  ShoppingCart,
  Ticket,
  Search,
  Calendar,
  Building,
  type LucideIcon,
  DollarSign,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Home,
  LayoutDashboard,
  Users,
  Settings,
  Layout,
  Boxes,
  User,
  Bell,
  Palette,
  Languages,
  Shield,
  Warehouse,
  Sliders,
  ClipboardList,
  TrendingUp,
  MapPin,
  Building2,
  ShoppingCart,
  Ticket,
  Search,
  Calendar,
  Building,
  DollarSign

};

export function resolveIcon(name?: string): LucideIcon | undefined {
  if (!name) return undefined;
  return ICONS[name] || undefined;
}


