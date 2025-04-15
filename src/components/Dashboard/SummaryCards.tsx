
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, Package } from "lucide-react";

export interface SummaryData {
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  transactionsToday: number;
  lowStockCount: number;
  profitMonth: number;
  profitGrowth: number;
}

interface SummaryCardsProps {
  data: SummaryData;
}

export default function SummaryCards({ data }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Sales Summary Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md animate-scale-in">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Penjualan</p>
            <h3 className="text-2xl font-bold mt-1">Rp {data.salesToday.toLocaleString()}</h3>
          </div>
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Hari ini</span>
            <span className="font-medium">Rp {data.salesToday.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Minggu ini</span>
            <span className="font-medium">Rp {data.salesWeek.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Bulan ini</span>
            <span className="font-medium">Rp {data.salesMonth.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Transactions Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md animate-scale-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Transaksi</p>
            <h3 className="text-2xl font-bold mt-1">{data.transactionsToday}</h3>
          </div>
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="mt-6">
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min((data.transactionsToday / 30) * 100, 100)}%` }}></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0</span>
            <span>Target: 30</span>
          </div>
        </div>
      </div>

      {/* Profit Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md animate-scale-in" style={{ animationDelay: "0.2s" }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Keuntungan Bulan Ini</p>
            <h3 className="text-2xl font-bold mt-1">Rp {data.profitMonth.toLocaleString()}</h3>
          </div>
          <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center">
            <Package className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center">
            {data.profitGrowth > 0 ? (
              <div className="flex items-center text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{data.profitGrowth}%</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{Math.abs(data.profitGrowth)}%</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground ml-2">dibanding bulan lalu</span>
          </div>
        </div>
      </div>
    </div>
  );
}
