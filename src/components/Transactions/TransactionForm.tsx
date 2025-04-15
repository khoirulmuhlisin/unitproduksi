
import { useState, useEffect } from "react";
import { Search, X, Plus, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Product } from "../Products/ProductList";
import { Transaction } from "./TransactionHistory";
import StockBadge from "../ui/StockBadge";
import { fetchProducts } from "../../utils/databaseUtils";
import { toast } from "sonner";

interface TransactionFormProps {
  onComplete: (data: {
    items: {
      product: Product;
      quantity: number;
      subtotal: number;
    }[];
    total: number;
    cashReceived: number;
    change: number;
    date: Date;
  }) => void;
  editMode?: boolean;
  editData?: Transaction | null;
}

export default function TransactionForm({ onComplete, editMode = false, editData = null }: TransactionFormProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<{
    product: Product;
    quantity: number;
    subtotal: number;
  }[]>([]);
  const [total, setTotal] = useState(0);
  const [change, setChange] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load all products
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const fetchedProducts = await fetchProducts();
      setProducts(fetchedProducts);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat data produk");
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadProducts();
    
    const handleStorageChange = () => {
      loadProducts();
    };
    
    window.addEventListener('storageUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storageUpdated', handleStorageChange);
    };
  }, []);
  
  // Effect for filtering products based on search term
  useEffect(() => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);
  
  // Load transaction data for editing
  useEffect(() => {
    if (editMode && editData && products.length > 0) {
      // Map the transaction items to cart items
      const mappedCartItems = editData.items.map(item => {
        const foundProduct = products.find(p => p.name === item.productName);
        if (!foundProduct) {
          console.error(`Product not found: ${item.productName}`);
          return null;
        }
        
        return {
          product: foundProduct,
          quantity: item.quantity,
          subtotal: item.subtotal
        };
      }).filter(Boolean) as {
        product: Product;
        quantity: number;
        subtotal: number;
      }[];
      
      setCartItems(mappedCartItems);
      setTotal(editData.total);
      setCashReceived(editData.cashReceived.toString());
      setChange(editData.change);
    }
  }, [editMode, editData, products]);
  
  // Calculate total and change whenever cart or cash received changes
  useEffect(() => {
    const newTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    setTotal(newTotal);
    
    const cash = parseFloat(cashReceived) || 0;
    const newChange = cash - newTotal;
    setChange(newChange >= 0 ? newChange : 0);
  }, [cartItems, cashReceived]);
  
  const handleAddToCart = (product: Product) => {
    const existingItemIndex = cartItems.findIndex(
      (item) => item.product.id === product.id
    );
    
    if (existingItemIndex !== -1) {
      // Product already in cart, increment quantity
      const updatedCartItems = [...cartItems];
      const newQuantity = updatedCartItems[existingItemIndex].quantity + 1;
      
      // Check if there's enough stock
      if (newQuantity > product.currentStock) {
        toast.error("Stok tidak mencukupi");
        return;
      }
      
      updatedCartItems[existingItemIndex] = {
        ...updatedCartItems[existingItemIndex],
        quantity: newQuantity,
        subtotal: product.sellPrice * newQuantity,
      };
      
      setCartItems(updatedCartItems);
    } else {
      // Check if there's stock available
      if (product.currentStock <= 0) {
        toast.error("Stok tidak mencukupi");
        return;
      }
      
      // Add new product to cart
      setCartItems([
        ...cartItems,
        {
          product,
          quantity: 1,
          subtotal: product.sellPrice,
        },
      ]);
    }
    
    setSearchTerm("");
  };
  
  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or negative
      const updatedCartItems = cartItems.filter((_, i) => i !== index);
      setCartItems(updatedCartItems);
      return;
    }
    
    const product = cartItems[index].product;
    
    // Check if there's enough stock
    if (newQuantity > product.currentStock) {
      toast.error("Stok tidak mencukupi");
      return;
    }
    
    const updatedCartItems = [...cartItems];
    updatedCartItems[index] = {
      ...updatedCartItems[index],
      quantity: newQuantity,
      subtotal: product.sellPrice * newQuantity,
    };
    
    setCartItems(updatedCartItems);
  };
  
  const handleRemoveItem = (index: number) => {
    const updatedCartItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedCartItems);
  };
  
  const handleCompleteTransaction = () => {
    if (cartItems.length === 0) {
      toast.error("Keranjang belanja kosong");
      return;
    }
    
    const cashValue = parseFloat(cashReceived);
    
    if (!cashValue || cashValue < total) {
      toast.error("Jumlah uang tidak mencukupi");
      return;
    }
    
    onComplete({
      items: cartItems,
      total,
      cashReceived: cashValue,
      change,
      date: new Date(),
    });
    
    // Reset form
    setCartItems([]);
    setTotal(0);
    setCashReceived("");
    setChange(0);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">
          {editMode ? "Edit Transaksi" : "Transaksi Baru"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {editMode 
            ? "Ubah item atau jumlah barang dalam transaksi ini" 
            : "Tambahkan produk ke keranjang untuk membuat transaksi baru"}
        </p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6 p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="h-[300px] overflow-y-auto border rounded-md">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <ul className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <li
                    key={product.id}
                    className={`p-3 flex items-center justify-between hover:bg-muted/30 transition cursor-pointer ${
                      product.currentStock <= 0 ? "opacity-50" : ""
                    }`}
                    onClick={() => product.currentStock > 0 && handleAddToCart(product)}
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Kategori: {product.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        Rp {product.sellPrice.toLocaleString()}
                      </div>
                      <StockBadge stock={product.currentStock} minStock={product.minimumStock} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : searchTerm ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Tidak ada produk yang cocok
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Tidak ada produk tersedia
              </div>
            )}
          </div>
        </div>
        
        <Card className="shadow-none border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Keranjang
              </h4>
              <span className="text-sm text-muted-foreground">
                {cartItems.length} item
              </span>
            </div>
            
            {cartItems.length > 0 ? (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                {cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-dashed last:border-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Rp {item.product.sellPrice.toLocaleString()} x {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="font-medium">
                        Rp {item.subtotal.toLocaleString()}
                      </div>
                      <div className="flex items-center border rounded-md">
                        <button
                          className="px-2 py-0.5 text-muted-foreground hover:bg-muted transition"
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          className="w-12 text-center border-x border-border py-0.5"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                              handleUpdateQuantity(index, val);
                            }
                          }}
                        />
                        <button
                          className="px-2 py-0.5 text-muted-foreground hover:bg-muted transition"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-center border border-dashed rounded-md">
                <ShoppingCart className="h-12 w-12 mb-2 opacity-30" />
                <div>Keranjang kosong</div>
                <div className="text-sm">Cari produk untuk ditambahkan</div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-6 pt-0 flex-col">
            <div className="w-full space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold">Rp {total.toLocaleString()}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Tunai</span>
                <Input
                  type="text"
                  className="w-32 text-right"
                  placeholder="0"
                  value={cashReceived}
                  onChange={(e) => {
                    // Only allow numbers and a single decimal point
                    const value = e.target.value.replace(/[^0-9.]/g, "");
                    setCashReceived(value);
                  }}
                />
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Kembalian</span>
                <span className="font-bold">
                  Rp {change.toLocaleString()}
                </span>
              </div>
              
              <Button
                className="w-full"
                disabled={cartItems.length === 0 || parseFloat(cashReceived) < total}
                onClick={handleCompleteTransaction}
              >
                <Plus className="h-4 w-4 mr-2" />
                {editMode ? "Perbarui Transaksi" : "Selesaikan Transaksi"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
