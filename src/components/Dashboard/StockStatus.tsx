
import { useState } from "react";
import StockBadge from "../ui/StockBadge";

export interface StockItem {
  id: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  category: string;
  price: number;
}

interface StockStatusProps {
  items: StockItem[];
}

export default function StockStatus({ items }: StockStatusProps) {
  const [filter, setFilter] = useState<"all" | "low">("all");
  
  const getStockLevel = (item: StockItem): "high" | "medium" | "low" | "out" => {
    if (item.currentStock === 0) return "out";
    if (item.currentStock <= item.minimumStock) return "low";
    if (item.currentStock <= item.minimumStock * 2) return "medium";
    return "high";
  };

  const filteredItems = filter === "all" 
    ? items 
    : items.filter(item => getStockLevel(item) === "low" || getStockLevel(item) === "out");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Status Stok</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "all" 
                ? "bg-primary text-white" 
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            Semua
          </button>
          <button 
            onClick={() => setFilter("low")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "low" 
                ? "bg-primary text-white" 
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            Stok Rendah
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Produk</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Kategori</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Harga</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Stok</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-4 px-6">{item.name}</td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{item.category}</td>
                  <td className="py-4 px-6">Rp {item.price.toLocaleString()}</td>
                  <td className="py-4 px-6 font-medium">{item.currentStock}</td>
                  <td className="py-4 px-6">
                    <StockBadge level={getStockLevel(item)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Tidak ada produk yang sesuai dengan filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
