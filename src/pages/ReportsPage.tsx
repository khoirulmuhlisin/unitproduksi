import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  ChartBar, 
  ChartPie, 
  FileText, 
  Calendar, 
  ListChecks, 
  Download,
  FileSpreadsheet,
  FileIcon,
  ArrowUpDown
} from "lucide-react";
import { Product } from "../components/Products/ProductList";
import { Transaction } from "../components/Transactions/TransactionHistory";
import SalesChart, { SalesDataPoint } from "../components/Dashboard/SalesChart";
import { 
  exportProductsToExcel,
  exportProductsToPDF,
  exportSalesToExcel,
  exportSalesToPDF,
  exportTransactionsToExcel,
  exportTransactionsToPDF
} from "../utils/exportUtils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { fetchProducts, fetchTransactions } from "../utils/databaseUtils";

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState<string>("sales");
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [filteredSalesData, setFilteredSalesData] = useState<SalesDataPoint[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<{field: string, direction: 'asc' | 'desc'}>({
    field: 'name',
    direction: 'asc'
  });
  
  const loadData = async () => {
    try {
      const loadedProducts = await fetchProducts();
      setProducts(loadedProducts);
      
      const loadedTransactions = await fetchTransactions();
      setTransactions(loadedTransactions);
      
      generateSalesDataFromTransactions(loadedTransactions, loadedProducts);
      
      const filtered = loadedTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
        return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
      });
      setFilteredTransactions(filtered);
      
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  
  useEffect(() => {
    loadData();
    
    const handleStorageUpdate = () => {
      loadData();
    };
    
    window.addEventListener('storageUpdated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    
    return () => {
      window.removeEventListener('storageUpdated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);
  
  const calculateTransactionProfit = (transaction: Transaction, productsList: Product[]) => {
    let profit = 0;
    
    transaction.items.forEach(item => {
      const product = productsList.find(p => p.id === item.productId);
      if (product) {
        const itemProfit = (product.sellPrice - product.buyPrice) * item.quantity;
        profit += itemProfit;
      }
    });
    
    return profit;
  };
  
  const generateSalesDataFromTransactions = (transactionList: Transaction[], productsList: Product[]) => {
    const salesMap = new Map<string, {sales: number, profit: number}>();
    
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      salesMap.set(dateStr, { sales: 0, profit: 0 });
    }
    
    transactionList.forEach(transaction => {
      const dateStr = new Date(transaction.date).toISOString().split('T')[0];
      const existing = salesMap.get(dateStr) || { sales: 0, profit: 0 };
      
      const profit = calculateTransactionProfit(transaction, productsList);
      
      salesMap.set(dateStr, {
        sales: existing.sales + transaction.total,
        profit: existing.profit + profit
      });
    });
    
    const data: SalesDataPoint[] = Array.from(salesMap).map(([date, values]) => ({
      date,
      sales: values.sales,
      profit: values.profit
    }));
    
    data.sort((a, b) => a.date.localeCompare(b.date));
    
    setSalesData(data);
    setFilteredSalesData(data);
  };
  
  const applyDateFilter = () => {
    try {
      const filtered = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
        return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
      });
      setFilteredTransactions(filtered);
      
      const filteredSalesMap = new Map<string, {sales: number, profit: number}>();
      
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      const dateArray: string[] = [];
      let currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dateArray.push(dateStr);
        filteredSalesMap.set(dateStr, { sales: 0, profit: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      filtered.forEach(transaction => {
        const dateStr = new Date(transaction.date).toISOString().split('T')[0];
        const existing = filteredSalesMap.get(dateStr) || { sales: 0, profit: 0 };
        
        const profit = calculateTransactionProfit(transaction, products);
        
        filteredSalesMap.set(dateStr, {
          sales: existing.sales + transaction.total,
          profit: existing.profit + profit
        });
      });
      
      const data: SalesDataPoint[] = Array.from(filteredSalesMap).map(([date, values]) => ({
        date,
        sales: values.sales,
        profit: values.profit
      }));
      
      data.sort((a, b) => a.date.localeCompare(b.date));
      
      setFilteredSalesData(data);
      toast.success("Filter diterapkan");
    } catch (error) {
      console.error('Error applying filter:', error);
      toast.error("Gagal menerapkan filter");
    }
  };
  
  const generateCategoryData = () => {
    const categories: Record<string, number> = {};
    
    products.forEach(product => {
      if (!categories[product.category]) {
        categories[product.category] = 0;
      }
      categories[product.category] += 1;
    });
    
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  const totalSales = filteredSalesData.reduce((sum, day) => sum + day.sales, 0);
  const totalProfit = filteredSalesData.reduce((sum, day) => sum + day.profit, 0);
  const categoryData = generateCategoryData();

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
  };
  
  const handleSort = (field: string) => {
    if (sortOrder.field === field) {
      setSortOrder({
        field,
        direction: sortOrder.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortOrder({
        field,
        direction: 'asc'
      });
    }
  };
  
  const getSortedProducts = () => {
    let filtered = [...products];
    
    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    filtered.sort((a, b) => {
      const fieldA = a[sortOrder.field as keyof Product];
      const fieldB = b[sortOrder.field as keyof Product];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortOrder.direction === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortOrder.direction === 'asc' 
          ? fieldA - fieldB 
          : fieldB - fieldA;
      }
      
      return 0;
    });
    
    return filtered;
  };
  
  const getUniqueCategories = () => {
    const categories = new Set<string>();
    products.forEach(p => categories.add(p.category));
    return Array.from(categories);
  };

  const handleExportPDF = () => {
    switch (activeTab) {
      case "sales":
        exportSalesToPDF(filteredSalesData);
        break;
      case "products":
        exportProductsToPDF(products);
        break;
      case "transactions":
        exportTransactionsToPDF(filteredTransactions);
        break;
    }
  };

  const handleExportExcel = () => {
    switch (activeTab) {
      case "sales":
        exportSalesToExcel(filteredSalesData);
        break;
      case "products":
        exportProductsToExcel(products);
        break;
      case "transactions":
        exportTransactionsToExcel(filteredTransactions);
        break;
    }
  };

  const exportProductData = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      exportProductsToPDF(products);
    } else {
      exportProductsToExcel(products);
    }
  };
  
  const exportTransactionData = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      exportTransactionsToPDF(filteredTransactions);
    } else {
      exportTransactionsToExcel(filteredTransactions);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold animate-fade-in">Laporan</h1>
          <p className="text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Lihat laporan lengkap tentang penjualan, produk, dan keuntungan
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 items-end animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full pl-9 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
              />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Tanggal Akhir</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full pl-9 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
              />
            </div>
          </div>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center"
            onClick={applyDateFilter}
          >
            <ListChecks className="h-4 w-4 mr-2" />
            Terapkan Filter
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                <FileIcon className="h-4 w-4 mr-2" />
                <span>Export PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                <span>Export Excel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Penjualan</p>
                <h3 className="text-2xl font-bold mt-1">Rp {totalSales.toLocaleString()}</h3>
              </div>
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                <ChartBar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Dari {dateRange.start} sampai {dateRange.end}
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Keuntungan</p>
                <h3 className="text-2xl font-bold mt-1">Rp {totalProfit.toLocaleString()}</h3>
              </div>
              <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center">
                <ChartPie className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Margin: {totalSales > 0 ? Math.round((totalProfit/totalSales) * 100) : 0}%
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
                <h3 className="text-2xl font-bold mt-1">{filteredTransactions.length}</h3>
              </div>
              <div className="bg-amber-100 w-10 h-10 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Rata-rata: Rp {filteredTransactions.length > 0 ? (totalSales / filteredTransactions.length).toLocaleString() : 0} per transaksi
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Tabs 
            defaultValue="sales" 
            className="w-full"
            onValueChange={(value) => setActiveTab(value)}
          >
            <div className="px-6 pt-6 border-b border-border">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sales" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ChartBar className="h-4 w-4 mr-2" />
                  Penjualan
                </TabsTrigger>
                <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ChartPie className="h-4 w-4 mr-2" />
                  Produk
                </TabsTrigger>
                <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  Transaksi
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="sales" className="p-6">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Grafik Penjualan</h3>
                  <SalesChart data={filteredSalesData} />
                </div>
                
                <div className="pt-2">
                  <h3 className="text-lg font-semibold mb-4">Detail Penjualan Harian</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tanggal</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Penjualan</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Keuntungan</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredSalesData.length > 0 ? (
                          filteredSalesData.map((day, index) => (
                            <tr key={index} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3 px-4">
                                {new Date(day.date).toLocaleDateString('id-ID', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="py-3 px-4 text-right">
                                Rp {day.sales.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right text-green-600">
                                Rp {day.profit.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {day.sales > 0 ? Math.round((day.profit / day.sales) * 100) : 0}%
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-muted-foreground">
                              Tidak ada data penjualan untuk periode ini
                            </td>
                          </tr>
                        )}
                        
                        {filteredSalesData.length > 0 && (
                          <tr className="bg-muted/30 font-medium">
                            <td className="py-3 px-4">
                              Total
                            </td>
                            <td className="py-3 px-4 text-right">
                              Rp {totalSales.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-green-600">
                              Rp {totalProfit.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0}%
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="products" className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Daftar Produk</h3>
                  
                  <div className="flex space-x-2">
                    <select 
                      className="border border-input rounded-md px-3 py-1.5 text-sm"
                      value={categoryFilter}
                      onChange={(e) => handleCategoryFilter(e.target.value)}
                    >
                      <option value="">Semua Kategori</option>
                      {getUniqueCategories().map((category, idx) => (
                        <option key={idx} value={category}>{category}</option>
                      ))}
                    </select>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => exportProductData('pdf')}
                      className="flex items-center"
                    >
                      <FileIcon className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => exportProductData('excel')}
                      className="flex items-center"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">No</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID Produk</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer" onClick={() => handleSort('name')}>
                          <div className="flex items-center">
                            Nama Produk
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer" onClick={() => handleSort('category')}>
                          <div className="flex items-center">
                            Kategori
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          </div>
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Harga Beli</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Harga Jual</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {getSortedProducts().length > 0 ? (
                        getSortedProducts().map((product, index) => (
                          <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4">{index + 1}</td>
                            <td className="py-3 px-4">{product.id}</td>
                            <td className="py-3 px-4 font-medium">{product.name}</td>
                            <td className="py-3 px-4">{product.category}</td>
                            <td className="py-3 px-4 text-right">Rp {product.buyPrice.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">Rp {product.sellPrice.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">{product.currentStock}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">
                            Tidak ada data produk
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="transactions" className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Daftar Transaksi</h3>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => exportTransactionData('pdf')}
                      className="flex items-center"
                    >
                      <FileIcon className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => exportTransactionData('excel')}
                      className="flex items-center"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">No</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID Transaksi</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tanggal</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Item Yang Dibeli</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Jumlah</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction, idx) => (
                          <tr key={transaction.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4">{idx + 1}</td>
                            <td className="py-3 px-4 font-medium">{transaction.id}</td>
                            <td className="py-3 px-4">
                              {new Date(transaction.date).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                {transaction.items.map((item, index) => (
                                  <div key={index} className="text-sm">
                                    {item.productName}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {transaction.items.reduce((sum, item) => sum + item.quantity, 0)}
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              Rp {transaction.total.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            Tidak ada data transaksi untuk periode ini
                          </td>
                        </tr>
                      )}
                      {filteredTransactions.length > 0 && (
                        <tr className="bg-muted/30 font-medium">
                          <td colSpan={5} className="py-3 px-4 text-right">
                            Total Penjualan
                          </td>
                          <td className="py-3 px-4 text-right">
                            Rp {totalSales.toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportsPage;
