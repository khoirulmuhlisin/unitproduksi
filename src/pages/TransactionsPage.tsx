
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import MainLayout from "../components/Layout/MainLayout";
import TransactionForm from "../components/Transactions/TransactionForm";
import TransactionHistory, { Transaction } from "../components/Transactions/TransactionHistory";
import { Product } from "../components/Products/ProductList";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { 
  fetchProducts, 
  fetchTransactions, 
  saveTransaction, 
  updateTransaction, 
  deleteTransaction,
  revertProductStock
} from "../utils/databaseUtils";

interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  principalName: string;
  managerName: string;
}

const defaultSettings: SchoolSettings = {
  schoolName: "GLOBIN",
  schoolAddress: "Jl. Cibeureum Tengah RT.06/01 Ds. Sinarsari",
  principalName: "Dr. H. Ahmad Fauzi, M.Pd",
  managerName: "Hj. Siti Nurjanah, S.Pd",
};

const TransactionsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<Transaction | null>(null);
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('schoolSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings from localStorage:', error);
      }
    }
    
    const handleStorageChange = (event: StorageEvent | Event) => {
      if (event instanceof StorageEvent && event.key === 'schoolSettings') {
        try {
          const updatedSettings = localStorage.getItem('schoolSettings');
          if (updatedSettings) {
            setSettings(JSON.parse(updatedSettings));
          }
        } catch (error) {
          console.error('Error loading updated settings:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storageUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storageUpdated', handleStorageChange);
    };
  }, []);

  // Load products and transactions
  const loadData = async () => {
    try {
      setIsLoading(true);
      const loadedProducts = await fetchProducts();
      setProducts(loadedProducts);
      
      const loadedTransactions = await fetchTransactions();
      setTransactions(loadedTransactions);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("Gagal memuat data. Silakan coba lagi.");
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storageUpdated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storageUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleTransactionComplete = async (data: {
    items: {
      product: Product;
      quantity: number;
      subtotal: number;
    }[];
    total: number;
    cashReceived: number;
    change: number;
    date: Date;
  }) => {
    try {
      if (isEditMode && editingTransaction) {
        // Handle update of existing transaction
        const updatedTransaction: Transaction = {
          id: editingTransaction.id,
          items: data.items.map((item) => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.sellPrice,
            subtotal: item.subtotal,
            productId: item.product.id,
          })),
          total: data.total,
          cashReceived: data.cashReceived,
          change: data.change,
          date: data.date,
        };
        
        // First, revert the stock for the original transaction items
        await revertProductStock(editingTransaction.items);
        
        // Then update the transaction
        const success = await updateTransaction(updatedTransaction);
        
        if (success) {
          // Update stock for each product in the new transaction
          const updatePromises = data.items.map(item => {
            return fetch(`/api/products/${item.product.id}/stock`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity: -item.quantity })
            }).catch(() => {
              // Fall back to localStorage if API fails
              const storedProducts = localStorage.getItem('productsList');
              if (storedProducts) {
                const products: Product[] = JSON.parse(storedProducts);
                const productIndex = products.findIndex(p => p.id === item.product.id);
                
                if (productIndex !== -1) {
                  products[productIndex] = {
                    ...products[productIndex],
                    currentStock: products[productIndex].currentStock - item.quantity,
                  };
                  localStorage.setItem('productsList', JSON.stringify(products));
                  return true;
                }
              }
              return false;
            });
          });
          
          await Promise.all(updatePromises);
          
          // Show receipt
          setCurrentReceipt(updatedTransaction);
          setIsReceiptDialogOpen(true);
          
          // Reset edit mode
          setIsEditMode(false);
          setEditingTransaction(null);
          
          // Refresh data
          loadData();
          
          toast.success("Transaksi berhasil diperbarui");
        } else {
          toast.error("Gagal memperbarui transaksi");
        }
      } else {
        // Handle new transaction creation
        // Generate a transaction ID (T001, T002, etc.)
        const newId = `T${(transactions.length + 1).toString().padStart(3, "0")}`;
        
        const newTransaction: Transaction = {
          id: newId,
          items: data.items.map((item) => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.sellPrice,
            subtotal: item.subtotal,
            productId: item.product.id,
          })),
          total: data.total,
          cashReceived: data.cashReceived,
          change: data.change,
          date: data.date,
        };
        
        // Save transaction to database/localStorage
        const success = await saveTransaction(newTransaction);
        
        if (success) {
          // Update stock for each product
          const updatePromises = data.items.map(item => {
            return fetch(`/api/products/${item.product.id}/stock`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity: -item.quantity })
            }).catch(() => {
              // Fall back to localStorage if API fails
              const storedProducts = localStorage.getItem('productsList');
              if (storedProducts) {
                const products: Product[] = JSON.parse(storedProducts);
                const productIndex = products.findIndex(p => p.id === item.product.id);
                
                if (productIndex !== -1) {
                  products[productIndex] = {
                    ...products[productIndex],
                    currentStock: products[productIndex].currentStock - item.quantity,
                  };
                  localStorage.setItem('productsList', JSON.stringify(products));
                  return true;
                }
              }
              return false;
            });
          });
          
          await Promise.all(updatePromises);
          
          // Show receipt
          setCurrentReceipt(newTransaction);
          setIsReceiptDialogOpen(true);
          
          // Refresh product list
          loadData();
          
          toast.success("Transaksi berhasil disimpan");
        } else {
          toast.error("Gagal menyimpan transaksi");
        }
      }
    } catch (error) {
      console.error("Error completing transaction:", error);
      toast.error("Terjadi kesalahan saat menyelesaikan transaksi");
    }
  };

  const handleViewReceipt = (transaction: Transaction) => {
    setCurrentReceipt(transaction);
    setIsReceiptDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditMode(true);
    // Scroll to transaction form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info(`Mengedit transaksi ${transaction.id}`);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      // First revert the product stock
      await revertProductStock(transaction.items);
      
      // Then delete the transaction
      const success = await deleteTransaction(transaction.id);
      
      if (success) {
        toast.success(`Transaksi ${transaction.id} berhasil dihapus`);
        loadData(); // Reload data
      } else {
        toast.error(`Gagal menghapus transaksi ${transaction.id}`);
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Terjadi kesalahan saat menghapus transaksi");
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingTransaction(null);
  };

  const formatReceiptDateTime = (date: Date) => {
    return new Date(date).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadReceiptAsImage = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `struk-${currentReceipt?.id || 'transaksi'}.png`);
          toast.success("Struk berhasil diunduh sebagai gambar");
        }
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Gagal mengunduh struk. Silakan coba lagi.");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold animate-fade-in">Transaksi</h1>
          <p className="text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Buat transaksi baru dan lihat riwayat transaksi
          </p>
        </div>

        {isLoading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : (
          <div>
            {isEditMode && (
              <div className="bg-blue-50 p-4 rounded-md mb-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Mode Edit Transaksi: {editingTransaction?.id}</p>
                  <p className="text-sm text-muted-foreground">
                    Setelah mengedit, stok produk akan disesuaikan kembali
                  </p>
                </div>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Batal Edit
                </Button>
              </div>
            )}
            <TransactionForm 
              onComplete={handleTransactionComplete}
              editMode={isEditMode}
              editData={editingTransaction}
            />
          </div>
        )}

        <div className="mt-8">
          {isLoading ? (
            <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
          ) : (
            <TransactionHistory
              transactions={transactions}
              onViewReceipt={handleViewReceipt}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}
        </div>
      </div>

      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Struk Pembelian</DialogTitle>
          {currentReceipt && (
            <div className="py-4 space-y-6">
              <div ref={receiptRef} className="bg-white p-4">
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-lg">UP - {settings.schoolName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {settings.schoolAddress}
                  </p>
                  <p className="text-sm">No. Transaksi: {currentReceipt.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatReceiptDateTime(currentReceipt.date)}
                  </p>
                </div>
                
                <div className="border-t border-b border-dashed border-border py-4 my-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-sm font-medium">
                        <th className="text-left pb-2">Item</th>
                        <th className="text-center pb-2">Qty</th>
                        <th className="text-right pb-2">Harga</th>
                        <th className="text-right pb-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {currentReceipt.items.map((item, index) => (
                        <tr key={index}>
                          <td className="py-1 max-w-[120px] truncate">{item.productName}</td>
                          <td className="text-center py-1">{item.quantity}</td>
                          <td className="text-right py-1">
                            Rp {item.price.toLocaleString()}
                          </td>
                          <td className="text-right py-1">
                            Rp {item.subtotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Total</span>
                    <span className="font-bold">
                      Rp {currentReceipt.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tunai</span>
                    <span>Rp {currentReceipt.cashReceived.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Kembalian</span>
                    <span>Rp {currentReceipt.change.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="text-center text-sm space-y-2 mt-4">
                  <p>Terima kasih telah berbelanja</p>
                  <p className="text-muted-foreground">
                    Barang yang sudah dibeli tidak dapat dikembalikan
                  </p>
                </div>
              </div>
              <div className="flex justify-between">
                <Button 
                  onClick={downloadReceiptAsImage} 
                  variant="outline"
                >
                  Unduh Struk (PNG)
                </Button>
                <button
                  onClick={() => setIsReceiptDialogOpen(false)}
                  className="px-4 py-2 rounded-md border border-input text-muted-foreground hover:bg-muted transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TransactionsPage;
