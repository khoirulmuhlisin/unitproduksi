
import { useState, useEffect } from "react";
import { Package, Edit, Trash2, Search, Plus } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  currentStock: number;
  minimumStock?: number; // Making this optional
}

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  lastUpdate?: Date; // Optional timestamp for real-time updates
}

export default function ProductList({ products, onEdit, onDelete, onAdd, lastUpdate }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  
  // Update filtered products when products or search term changes
  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm, lastUpdate]);

  const calculateProfit = (product: Product): number => {
    return product.sellPrice - product.buyPrice;
  };

  const calculateMargin = (product: Product): number => {
    return (calculateProfit(product) / product.sellPrice) * 100;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-semibold">Daftar Produk</h3>
            {lastUpdate && (
              <span className="ml-3 text-xs text-muted-foreground">
                Pembaruan terakhir: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
              />
            </div>
            <button
              onClick={onAdd}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Nama Produk</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Kategori</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Harga Beli</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Harga Jual</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Margin</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Stok</th>
              <th className="text-right py-3 px-6 text-sm font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-4 px-6 font-medium">{product.name}</td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{product.category}</td>
                  <td className="py-4 px-6">Rp {product.buyPrice.toLocaleString()}</td>
                  <td className="py-4 px-6">Rp {product.sellPrice.toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-green-600">
                      {calculateMargin(product).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium">{product.currentStock}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  {searchTerm ? "Tidak ada produk yang sesuai dengan pencarian" : "Belum ada produk"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
