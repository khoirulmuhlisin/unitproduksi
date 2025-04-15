
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  ChartBar,
  ChartPie,
  FileText,
  LogOut
} from "lucide-react";
import { useAuth } from "../Auth/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Produk", path: "/products", icon: Package },
  { name: "Transaksi", path: "/transactions", icon: ShoppingCart },
  { 
    name: "Laporan", 
    path: "/reports", 
    icon: BarChart3,
    subItems: [
      { name: "Penjualan", path: "/reports?tab=sales", icon: ChartBar },
      { name: "Produk", path: "/reports?tab=products", icon: ChartPie },
      { name: "Transaksi", path: "/reports?tab=transactions", icon: FileText },
    ]
  },
  { name: "Pengaturan", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "Laporan": true // Default expanded state for Reports menu
  });
  const { user, logout } = useAuth();
  
  const location = useLocation();
  
  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };
  
  const isItemActive = (path: string): boolean => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-50 top-4 left-4 p-2 rounded-full bg-white shadow-md lg:hidden transition-all duration-300 hover:bg-gray-100"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-spring transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 bg-sidebar text-sidebar-foreground w-64 shadow-xl flex flex-col`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-semibold text-white">UP - GLOBIN</h1>
        </div>

        {user && (
          <div className="px-6 py-4 border-b border-sidebar-border">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-lg">
                {user.displayName.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.displayName}</p>
                <p className="text-xs text-gray-400">{user.role === 'admin' ? 'Administrator' : 'Staff'}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name} className="space-y-1">
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 ${
                        isItemActive(item.path)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.name}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedItems[item.name] ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    
                    {expandedItems[item.name] && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.name}>
                            <NavLink
                              to={subItem.path}
                              className={({ isActive }) =>
                                `flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                                  isActive || location.pathname + location.search === subItem.path
                                    ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                                }`
                              }
                              onClick={() => {
                                if (window.innerWidth < 1024) {
                                  setIsOpen(false);
                                }
                              }}
                            >
                              <subItem.icon className="w-4 h-4 mr-3" />
                              <span className="text-sm">{subItem.name}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`
                    }
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setIsOpen(false);
                      }
                    }}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          {user ? (
            <Button 
              variant="outline" 
              className="w-full text-white border-white/20 hover:bg-white/10 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          ) : (
            <NavLink to="/login">
              <Button
                variant="outline"
                className="w-full text-white border-white/20 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Login
              </Button>
            </NavLink>
          )}
          <div className="mt-4 text-xs text-sidebar-foreground/70 text-center">
            <p>© 2023 UP - GLOBIN</p>
          </div>
        </div>
      </aside>
    </>
  );
}
