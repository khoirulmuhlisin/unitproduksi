
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Product } from "./ProductList";

interface ProductFormProps {
  product?: Product;
  onSave: (product: Omit<Product, "id"> & { id?: string }) => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    id: product?.id || "",
    name: product?.name || "",
    category: product?.category || "",
    buyPrice: product?.buyPrice || 0,
    sellPrice: product?.sellPrice || 0,
    currentStock: product?.currentStock || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const categories = [
    "Alat Tulis",
    "Kertas",
    "Amplop & Pengiriman",
    "Binder & Penyimpanan",
    "Printer & Perlengkapan",
    "Peralatan Kantor",
    "Lainnya",
  ];

  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    if (Object.keys(formData).some(key => key !== 'id' && formData[key as keyof typeof formData] !== (product?.[key as keyof Product] || (key === 'category' ? '' : 0)))) {
      const validationErrors = validateForm(false);
      if (Object.keys(validationErrors).length === 0) {
        const timeout = setTimeout(() => {
          // Disabled auto-save as it's causing issues
          // handleSubmit(undefined, true);
        }, 1500);
        setAutoSaveTimeout(timeout);
      }
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;
    
    if (name === "buyPrice" || name === "sellPrice" || name === "currentStock") {
      parsedValue = value === "" ? 0 : parseInt(value, 10);
      
      if (isNaN(parsedValue as number)) {
        parsedValue = 0;
      }
    }
    
    setFormData({
      ...formData,
      [name]: parsedValue,
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = (showErrors = true): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Nama produk harus diisi";
    }
    
    if (!formData.category) {
      newErrors.category = "Kategori harus dipilih";
    }
    
    if (formData.buyPrice <= 0) {
      newErrors.buyPrice = "Harga beli harus lebih dari 0";
    }
    
    if (formData.sellPrice <= 0) {
      newErrors.sellPrice = "Harga jual harus lebih dari 0";
    }
    
    if (formData.sellPrice <= formData.buyPrice) {
      newErrors.sellPrice = "Harga jual harus lebih besar dari harga beli";
    }
    
    if (showErrors) {
      setErrors(newErrors);
    }
    
    return newErrors;
  };

  const handleSubmit = (e?: React.FormEvent, isAutoSave = false) => {
    if (e) {
      e.preventDefault();
    }
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      // Create a copy of the form data for submission
      const productData = {
        ...formData
      };
      
      // Pass to parent component
      onSave(productData);
      
      if (!isAutoSave) {
        console.log("Product submitted:", productData);
      }
    } else {
      console.error("Validation errors:", validationErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Nama Produk
          </label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.name ? "border-red-300 focus:ring-red-500" : "border-input focus:ring-ring"
            } rounded-md focus:outline-none focus:ring-2`}
            placeholder="Masukkan nama produk"
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium">
            Kategori
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.category ? "border-red-300 focus:ring-red-500" : "border-input focus:ring-ring"
            } rounded-md focus:outline-none focus:ring-2`}
          >
            <option value="">Pilih Kategori</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="buyPrice" className="block text-sm font-medium">
            Harga Beli (Rp)
          </label>
          <input
            id="buyPrice"
            name="buyPrice"
            type="number"
            value={formData.buyPrice}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.buyPrice ? "border-red-300 focus:ring-red-500" : "border-input focus:ring-ring"
            } rounded-md focus:outline-none focus:ring-2`}
            placeholder="0"
            min="0"
          />
          {errors.buyPrice && <p className="text-sm text-red-600">{errors.buyPrice}</p>}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="sellPrice" className="block text-sm font-medium">
            Harga Jual (Rp)
          </label>
          <input
            id="sellPrice"
            name="sellPrice"
            type="number"
            value={formData.sellPrice}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.sellPrice ? "border-red-300 focus:ring-red-500" : "border-input focus:ring-ring"
            } rounded-md focus:outline-none focus:ring-2`}
            placeholder="0"
            min="0"
          />
          {errors.sellPrice && <p className="text-sm text-red-600">{errors.sellPrice}</p>}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="currentStock" className="block text-sm font-medium">
            Stok Saat Ini
          </label>
          <input
            id="currentStock"
            name="currentStock"
            type="number"
            value={formData.currentStock}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.currentStock ? "border-red-300 focus:ring-red-500" : "border-input focus:ring-ring"
            } rounded-md focus:outline-none focus:ring-2`}
            placeholder="0"
            min="0"
          />
          {errors.currentStock && <p className="text-sm text-red-600">{errors.currentStock}</p>}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md border border-input text-muted-foreground hover:bg-muted transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          {product ? "Perbarui Produk" : "Tambah Produk"}
        </button>
      </div>
    </form>
  );
}
