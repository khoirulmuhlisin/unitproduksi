
import { 
  Home, 
  Package, 
  ShoppingCart, 
  PieChart, 
  Settings,
  PanelRight
} from "lucide-react";

export interface SidebarLink {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const sidebarLinks: SidebarLink[] = [
  {
    name: "Dashboard",
    path: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "Produk",
    path: "/products",
    icon: <Package className="h-5 w-5" />,
  },
  {
    name: "Transaksi",
    path: "/transactions",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    name: "Laporan",
    path: "/reports",
    icon: <PieChart className="h-5 w-5" />,
  },
  {
    name: "Pengaturan",
    path: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];
