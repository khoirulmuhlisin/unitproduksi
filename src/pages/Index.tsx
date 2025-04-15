
import { useEffect, useState } from "react";
import { toast } from "sonner";
import MainLayout from "../components/Layout/MainLayout";
import SummaryCards, { SummaryData } from "../components/Dashboard/SummaryCards";
import StockStatus, { StockItem } from "../components/Dashboard/StockStatus";
import SalesChart, { SalesDataPoint } from "../components/Dashboard/SalesChart";
import { fetchProducts, fetchTransactions } from "../utils/databaseUtils";
import { Product } from "../components/Products/ProductList";
import { Transaction } from "../components/Transactions/TransactionHistory";

// Initialize default summary data
const defaultSummaryData: SummaryData = {
  salesToday: 0,
  salesWeek: 0,
  salesMonth: 0,
  transactionsToday: 0,
  lowStockCount: 0,
  profitMonth: 0,
  profitGrowth: 0,
};

const Index = () => {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData>(defaultSummaryData);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load all data
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      
      // Load products
      const products = await fetchProducts();
      
      // Load transactions
      const transactions = await fetchTransactions();
      
      // Update stock items
      setStockItems(products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        currentStock: p.currentStock,
        minimumStock: p.minimumStock,
        price: p.sellPrice,
      })));
      
      // Generate sales data based on actual transactions
      const salesData = generateSalesData(transactions, products);
      setSalesData(salesData);
      
      // Calculate summary data
      const summaryData = calculateSummaryData(transactions, products);
      setSummaryData(summaryData);
      
      // Show low stock notification if any
      const lowStockItems = products.filter(
        item => item.currentStock <= item.minimumStock && item.currentStock > 0
      );
      
      if (lowStockItems.length > 0) {
        toast.warning(
          `${lowStockItems.length} produk memiliki stok rendah`,
          {
            description: "Silakan periksa status stok untuk informasi lebih lanjut.",
            duration: 5000,
          }
        );
      }
      
      // Show out of stock notification if any
      const outOfStockItems = products.filter(item => item.currentStock === 0);
      if (outOfStockItems.length > 0) {
        toast.error(
          `${outOfStockItems.length} produk habis stok`,
          {
            description: "Segera lakukan pengadaan untuk produk yang habis.",
            duration: 5000,
          }
        );
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Gagal memuat data dashboard");
      setIsLoading(false);
    }
  };
  
  // Generate 7 days of sales data based on actual transactions
  const generateSalesData = (transactions: Transaction[] = [], products: Product[] = []): SalesDataPoint[] => {
    const data: SalesDataPoint[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Initialize the last 7 days with zero values
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        sales: 0,
        profit: 0,
      });
    }
    
    // Populate the data with actual transaction values
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only consider transactions from the last 7 days
      if (daysDiff >= 0 && daysDiff < 7) {
        const index = 6 - daysDiff;
        data[index].sales += tx.total;
        
        // Calculate actual profit from items (sellPrice - buyPrice)
        let transactionProfit = 0;
        tx.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            transactionProfit += (product.sellPrice - product.buyPrice) * item.quantity;
          }
        });
        
        data[index].profit += transactionProfit;
      }
    });
    
    return data;
  };

  // Calculate summary data based on transactions and products
  const calculateSummaryData = (transactions: Transaction[] = [], products: Product[] = []): SummaryData => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);
    
    // Filter transactions by date ranges
    const todayTx = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === today.getTime();
    });
    
    const weekTx = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate >= oneWeekAgo;
    });
    
    const monthTx = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate >= oneMonthAgo;
    });
    
    const prevMonthTx = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate >= twoMonthsAgo && txDate < oneMonthAgo;
    });
    
    // Calculate sales figures
    const salesToday = todayTx.reduce((sum, tx) => sum + tx.total, 0);
    const salesWeek = weekTx.reduce((sum, tx) => sum + tx.total, 0);
    const salesMonth = monthTx.reduce((sum, tx) => sum + tx.total, 0);
    
    // Calculate profits correctly based on sell price - buy price
    const calculateProfit = (txList: Transaction[]) => {
      let totalProfit = 0;
      
      txList.forEach(tx => {
        tx.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            totalProfit += (product.sellPrice - product.buyPrice) * item.quantity;
          }
        });
      });
      
      return totalProfit;
    };
    
    const profitMonth = calculateProfit(monthTx);
    const prevMonthProfit = calculateProfit(prevMonthTx);
    
    // Calculate profit growth percentage
    let profitGrowth = 0;
    if (prevMonthProfit > 0) {
      profitGrowth = Math.round(((profitMonth - prevMonthProfit) / prevMonthProfit) * 100);
    } else if (profitMonth > 0) {
      profitGrowth = 100; // If there was no profit last month but there is this month
    }
    
    // Count low stock items
    const lowStockCount = products.filter(p => p.currentStock <= p.minimumStock).length;
    
    return {
      salesToday,
      salesWeek,
      salesMonth,
      transactionsToday: todayTx.length,
      lowStockCount,
      profitMonth,
      profitGrowth,
    };
  };

  useEffect(() => {
    // First load
    const timer = setTimeout(() => {
      loadAllData();
    }, 500);
    
    // Listen for storage events to update data in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'productsList' || e.key === 'transactionsList' || e.key === 'schoolSettings') {
        loadAllData();
      }
    };
    
    // Also listen for custom storage events for same-tab updates
    const handleCustomStorageChange = () => {
      loadAllData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storageUpdated', handleCustomStorageChange);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storageUpdated', handleCustomStorageChange);
    };
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold animate-fade-in">Dashboard</h1>
            <p className="text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Ringkasan data penjualan dan stok
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {isLoading ? (
          // Skeleton loader for summary cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="h-48 bg-gray-100 animate-pulse rounded-xl"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : (
          <SummaryCards data={summaryData} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="h-80 bg-gray-100 animate-pulse rounded-xl" />
            ) : (
              <SalesChart data={salesData} />
            )}
          </div>
          <div className="lg:col-span-1">
            {isLoading ? (
              <div className="h-80 bg-gray-100 animate-pulse rounded-xl" />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 h-full animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <h3 className="text-lg font-semibold mb-4">Status Stok Rendah</h3>
                <div className="space-y-3">
                  {stockItems
                    .filter(item => item.currentStock <= item.minimumStock)
                    .slice(0, 5) // Show max 5 items to prevent overflow
                    .map(item => (
                      <div key={item.id} className="p-3 border border-border rounded-lg flex justify-between items-center">
                        <div className="max-w-[65%]">
                          <h4 className="font-medium truncate">{item.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${item.currentStock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                            {item.currentStock}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Min: {item.minimumStock}
                          </p>
                        </div>
                      </div>
                    ))}
                  {stockItems.filter(item => item.currentStock <= item.minimumStock).length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      Semua stok dalam keadaan baik
                    </div>
                  )}
                  {stockItems.filter(item => item.currentStock <= item.minimumStock).length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      +{stockItems.filter(item => item.currentStock <= item.minimumStock).length - 5} item stok rendah lainnya
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
        ) : (
          <StockStatus items={stockItems} />
        )}
      </div>
    </MainLayout>
  );
};

export default Index;
