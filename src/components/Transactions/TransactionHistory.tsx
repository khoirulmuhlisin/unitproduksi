
import { useState } from "react";
import { Search, Calendar, FileText, Download, FileIcon, FileSpreadsheet, Edit, Trash2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { exportTransactionsToPDF, exportTransactionsToExcel } from "../../utils/exportUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Transaction {
  id: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
    productId?: string; // Add productId for stock management
  }[];
  total: number;
  cashReceived: number;
  change: number;
  date: Date;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onViewReceipt: (transaction: Transaction) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
}

export default function TransactionHistory({ 
  transactions, 
  onViewReceipt,
  onEditTransaction,
  onDeleteTransaction
}: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.items.some(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Date filter
    const matchesDate = 
      !dateFilter || 
      new Date(transaction.date).toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesDate;
  });

  // Sort transactions by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Handle export functions
  const handleExportPDF = () => {
    exportTransactionsToPDF(sortedTransactions);
  };

  const handleExportExcel = () => {
    exportTransactionsToExcel(sortedTransactions);
  };
  
  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };
  
  const confirmDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
    }
  };

  // Calculate totals
  const totalSales = sortedTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
  const totalItems = sortedTransactions.reduce((sum, transaction) => {
    return sum + transaction.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <h3 className="text-lg font-semibold">Riwayat Transaksi</h3>
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
              />
            </div>
            <div className="relative w-full md:w-auto">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
              />
            </div>
            
            {/* Add Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="flex items-center h-10">
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
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>ID Transaksi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Item Yang Dibeli</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((transaction, idx) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>
                    <div>{formatDate(transaction.date)}</div>
                    <div className="text-sm text-muted-foreground">{formatTime(transaction.date)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {transaction.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.productName}
                        </div>
                      ))}
                      {transaction.items.length > 2 && (
                        <div className="text-sm text-muted-foreground">
                          + {transaction.items.length - 2} item lainnya
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </TableCell>
                  <TableCell className="font-medium text-right">
                    Rp {transaction.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onViewReceipt(transaction)}
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Lihat
                      </button>
                      <button
                        onClick={() => onEditTransaction(transaction)}
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(transaction)}
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Hapus
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {searchTerm || dateFilter
                    ? "Tidak ada transaksi yang sesuai dengan filter"
                    : "Belum ada transaksi"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="text-right">Total Penjualan:</TableCell>
              <TableCell className="text-right">Rp {totalSales.toLocaleString()}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Transaksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi dengan ID {transactionToDelete?.id}? 
              Tindakan ini tidak dapat dibatalkan dan stok produk akan dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
