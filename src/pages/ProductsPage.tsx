
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import MainLayout from "../components/Layout/MainLayout";
import ProductList, { Product } from "../components/Products/ProductList";
import ProductForm from "../components/Products/ProductForm";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileIcon, FileSpreadsheet, Download } from "lucide-react";
import { exportProductsToPDF, exportProductsToExcel } from "../utils/exportUtils";
import { fetchProducts, saveProducts } from "../utils/databaseUtils";

// Global products state for sharing between components
// This ensures the product list is shared across all components
export const getStoredProducts = (): Promise<Product[]> => {
  return fetchProducts();
};

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date()); 
  const [isLoading, setIsLoading] = useState(true);

  // Load products from data source
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const loadedProducts = await fetchProducts();
      setProducts(loadedProducts);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Gagal memuat daftar produk");
      setIsLoading(false);
    }
  };

  // Load products on component mount and when storage changes
  useEffect(() => {
    loadProducts();
    
    const handleStorageChange = () => {
      loadProducts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storageUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storageUpdated', handleStorageChange);
    };
  }, []);

  const handleSaveProduct = async (product: Omit<Product, "id"> & { id?: string }) => {
    try {
      let updatedProducts: Product[] = [];
      
      if (product.id) {
        // Edit existing product
        updatedProducts = products.map((p) => 
          p.id === product.id ? product as Product : p
        );
        await saveProducts(updatedProducts);
        setIsEditDialogOpen(false);
        toast.success("Produk berhasil diperbarui");
      } else {
        // Add new product with proper ID generation
        const newId = `p${Date.now()}`;
        const newProduct: Product = {
          ...product as Omit<Product, "id">,
          id: newId
        };
        
        updatedProducts = [...products, newProduct];
        await saveProducts(updatedProducts);
        setIsAddDialogOpen(false);
        toast.success("Produk berhasil ditambahkan");
      }
      
      setProducts(updatedProducts);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Gagal menyimpan produk");
    }
  };

  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        const updatedProducts = products.filter((p) => p.id !== productToDelete);
        await saveProducts(updatedProducts);
        setProducts(updatedProducts);
        toast.success("Produk berhasil dihapus");
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Gagal menghapus produk");
      }
      
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Export functions
  const handleExportPDF = () => {
    try {
      exportProductsToPDF(products);
      toast.success("Daftar produk berhasil diexport ke PDF");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Gagal mengexport PDF. Silakan coba lagi.");
    }
  };

  const handleExportExcel = () => {
    try {
      exportProductsToExcel(products);
      toast.success("Daftar produk berhasil diexport ke Excel");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Gagal mengexport Excel. Silakan coba lagi.");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold animate-fade-in">Manajemen Produk</h1>
            <p className="text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Tambah, edit, dan hapus produk
            </p>
          </div>
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
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

        {isLoading ? (
          <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
        ) : (
          <ProductList
            products={products}
            onEdit={handleEditProduct}
            onDelete={handleDeleteClick}
            onAdd={() => setIsAddDialogOpen(true)}
            lastUpdate={lastUpdate}
          />
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogTitle>Tambah Produk Baru</DialogTitle>
          <ProductForm
            onSave={handleSaveProduct}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogTitle>Edit Produk</DialogTitle>
          {currentProduct && (
            <ProductForm
              product={currentProduct}
              onSave={handleSaveProduct}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Konfirmasi Hapus</DialogTitle>
          <div className="py-4">
            <p>Apakah Anda yakin ingin menghapus produk ini?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-md border border-input text-muted-foreground hover:bg-muted transition-colors"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Batal
            </button>
            <button
              className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              onClick={confirmDelete}
            >
              Hapus
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ProductsPage;
