
import { ReactNode } from "react";
import Sidebar from "../Navigation/Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 transition-all duration-300 min-h-screen">
        <div className="container py-8 px-4 md:px-6 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
