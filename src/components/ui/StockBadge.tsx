
import { cn } from "@/lib/utils";

interface StockBadgeProps {
  level?: "high" | "medium" | "low" | "out";
  stock?: number;
  minStock?: number;
  className?: string;
}

export default function StockBadge({ level, stock, minStock, className }: StockBadgeProps) {
  // Determine level based on stock and minStock if level is not provided
  let stockLevel = level;
  
  if (stockLevel === undefined && stock !== undefined && minStock !== undefined) {
    if (stock === 0) {
      stockLevel = "out";
    } else if (stock <= minStock) {
      stockLevel = "low";
    } else if (stock <= minStock * 2) {
      stockLevel = "medium";
    } else {
      stockLevel = "high";
    }
  }
  
  // Default to "high" if no level is determined (should not happen)
  stockLevel = stockLevel || "high";

  const badgeClasses = {
    high: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-blue-100 text-blue-800 border-blue-200",
    low: "bg-amber-100 text-amber-800 border-amber-200",
    out: "bg-red-100 text-red-800 border-red-200",
  };

  const badgeText = {
    high: "In Stock",
    medium: "Medium Stock",
    low: "Low Stock",
    out: "Out of Stock",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        badgeClasses[stockLevel],
        className
      )}
    >
      {badgeText[stockLevel]}
    </span>
  );
}
