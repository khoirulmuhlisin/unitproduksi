import { Product } from "../components/Products/ProductList";
import { Transaction } from "../components/Transactions/TransactionHistory";

// Flag to determine if we're using a real database or localStorage
// This would be set to true when connected to a real database
const USE_REAL_DATABASE = false;

// Mock API endpoints - replace these with actual API endpoints when deploying
const API_BASE_URL = '/api';

/**
 * Fetches products from the data source
 */
export const fetchProducts = async (): Promise<Product[]> => {
  if (USE_REAL_DATABASE) {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  } else {
    // Use localStorage
    try {
      const storedProducts = localStorage.getItem('productsList');
      if (storedProducts) {
        return JSON.parse(storedProducts);
      }
      return [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }
};

/**
 * Saves products to the data source
 */
export const saveProducts = async (products: Product[]): Promise<boolean> => {
  if (USE_REAL_DATABASE) {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(products),
      });
      return response.ok;
    } catch (error) {
      console.error('Error saving products:', error);
      return false;
    }
  } else {
    // Use localStorage
    try {
      localStorage.setItem('productsList', JSON.stringify(products));
      // Dispatch event to notify other components of data change
      window.dispatchEvent(new Event('storageUpdated'));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  }
};

/**
 * Fetches transactions from the data source
 */
export const fetchTransactions = async (): Promise<Transaction[]> => {
  if (USE_REAL_DATABASE) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const transactions = await response.json();
      
      // Convert date strings to Date objects
      return transactions.map((t: any) => ({
        ...t,
        date: new Date(t.date)
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  } else {
    // Use localStorage
    try {
      const storedTransactions = localStorage.getItem('transactionsList');
      if (storedTransactions) {
        const parsed = JSON.parse(storedTransactions);
        // Convert date strings to Date objects
        return parsed.map((t: any) => ({
          ...t,
          date: new Date(t.date)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }
};

/**
 * Saves a transaction to the data source
 */
export const saveTransaction = async (transaction: Transaction): Promise<boolean> => {
  if (USE_REAL_DATABASE) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });
      return response.ok;
    } catch (error) {
      console.error('Error saving transaction:', error);
      return false;
    }
  } else {
    // Use localStorage
    try {
      const storedTransactions = localStorage.getItem('transactionsList');
      const transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
      transactions.push(transaction);
      localStorage.setItem('transactionsList', JSON.stringify(transactions));
      // Dispatch event to notify other components of data change
      window.dispatchEvent(new Event('storageUpdated'));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  }
};

/**
 * Updates an existing transaction
 * @param updatedTransaction The updated transaction data
 */
export const updateTransaction = async (updatedTransaction: Transaction): Promise<boolean> => {
  if (USE_REAL_DATABASE) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${updatedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTransaction),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
  } else {
    // Use localStorage
    try {
      const storedTransactions = localStorage.getItem('transactionsList');
      if (storedTransactions) {
        const transactions: Transaction[] = JSON.parse(storedTransactions);
        const transactionIndex = transactions.findIndex(t => t.id === updatedTransaction.id);
        
        if (transactionIndex !== -1) {
          // Replace the old transaction with the updated one
          transactions[transactionIndex] = updatedTransaction;
          localStorage.setItem('transactionsList', JSON.stringify(transactions));
          // Dispatch event to notify other components of data change
          window.dispatchEvent(new Event('storageUpdated'));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating transaction in localStorage:', error);
      return false;
    }
  }
};

/**
 * Deletes a transaction
 * @param transactionId ID of the transaction to delete
 */
export const deleteTransaction = async (transactionId: string): Promise<boolean> => {
  if (USE_REAL_DATABASE) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  } else {
    // Use localStorage
    try {
      const storedTransactions = localStorage.getItem('transactionsList');
      if (storedTransactions) {
        const transactions: Transaction[] = JSON.parse(storedTransactions);
        const updatedTransactions = transactions.filter(t => t.id !== transactionId);
        
        // Update localStorage with filtered transactions
        localStorage.setItem('transactionsList', JSON.stringify(updatedTransactions));
        // Dispatch event to notify other components of data change
        window.dispatchEvent(new Event('storageUpdated'));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting transaction from localStorage:', error);
      return false;
    }
  }
};

/**
 * Updates product stock after a transaction
 */
export const updateProductStock = async (
  productId: string, 
  quantitySold: number
): Promise<boolean> => {
  if (USE_REAL_DATABASE) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantitySold }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating product stock:', error);
      return false;
    }
  } else {
    // Use localStorage
    try {
      const storedProducts = localStorage.getItem('productsList');
      if (storedProducts) {
        const products: Product[] = JSON.parse(storedProducts);
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
          products[productIndex] = {
            ...products[productIndex],
            currentStock: products[productIndex].currentStock - quantitySold
          };
          localStorage.setItem('productsList', JSON.stringify(products));
          // Dispatch event to notify other components of data change
          window.dispatchEvent(new Event('storageUpdated'));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating product stock in localStorage:', error);
      return false;
    }
  }
};

/**
 * Revert product stock after deleting or updating transaction
 * @param items Transaction items to revert stock for
 */
export const revertProductStock = async (
  items: { productName: string; quantity: number; price: number; subtotal: number; productId?: string }[]
): Promise<boolean> => {
  if (USE_REAL_DATABASE) {
    try {
      const updatePromises = items.map(item => {
        if (!item.productId) return Promise.resolve(true);
        return fetch(`${API_BASE_URL}/products/${item.productId}/restore-stock`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: item.quantity })
        }).then(response => response.ok);
      });
      
      const results = await Promise.all(updatePromises);
      return !results.includes(false);
    } catch (error) {
      console.error('Error reverting product stock:', error);
      return false;
    }
  } else {
    // Use localStorage
    try {
      const storedProducts = localStorage.getItem('productsList');
      if (storedProducts) {
        const products: Product[] = JSON.parse(storedProducts);
        
        // For each item in the transaction, find the matching product and restore stock
        for (const item of items) {
          if (!item.productId) continue;
          
          const productIndex = products.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            // Restore the stock by adding the quantity back
            products[productIndex] = {
              ...products[productIndex],
              currentStock: products[productIndex].currentStock + item.quantity
            };
          }
        }
        
        localStorage.setItem('productsList', JSON.stringify(products));
        // Dispatch event to notify other components of data change
        window.dispatchEvent(new Event('storageUpdated'));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error reverting product stock in localStorage:', error);
      return false;
    }
  }
};

/**
 * Clears all data (for testing/reset purposes)
 */
export const clearAllData = (): void => {
  localStorage.removeItem('productsList');
  localStorage.removeItem('transactionsList');
  // Initialize with empty arrays 
  localStorage.setItem('productsList', JSON.stringify([]));
  localStorage.setItem('transactionsList', JSON.stringify([]));
  // Dispatch event to notify other components of data change
  window.dispatchEvent(new Event('storageUpdated'));
};

// Initialize with empty data only if it doesn't exist
export const initializeEmptyData = (): void => {
  // Initialize product list as empty if not exists
  if (!localStorage.getItem('productsList')) {
    localStorage.setItem('productsList', JSON.stringify([]));
  }
  
  // Initialize transaction list as empty if not exists
  if (!localStorage.getItem('transactionsList')) {
    localStorage.setItem('transactionsList', JSON.stringify([]));
  }
  
  // Set default school settings if not exist
  if (!localStorage.getItem('schoolSettings')) {
    const defaultSettings = {
      schoolName: "SMK GLOBIN",
      schoolAddress: "Jl. Cibeureum Tengah RT.06/01 Ds. Sinarsari",
      principalName: "Saepullah, S.Kom.",
      managerName: "Sari Maya, S.Pd., Gr.",
    };
    localStorage.setItem('schoolSettings', JSON.stringify(defaultSettings));
  }
};

// Call initialization when module loads
initializeEmptyData();
