
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { Product } from "../components/Products/ProductList";
import { SalesDataPoint } from "../components/Dashboard/SalesChart";
import { Transaction } from "../components/Transactions/TransactionHistory";

// Interface for autoTable's result data
interface AutoTableResult {
  finalY?: number;
  [key: string]: any;
}

// Get school settings from localStorage
const getSchoolSettings = () => {
  try {
    const settingsStr = localStorage.getItem('schoolSettings');
    if (settingsStr) {
      return JSON.parse(settingsStr);
    }
  } catch (error) {
    console.error('Error reading school settings:', error);
  }
  
  // Default settings if localStorage is empty
  return {
    schoolName: 'SMK GLOBIN',
    schoolAddress: 'Jl. Cibeureum Tengah RT.06/01 Ds. Sinarsari',
    principalName: 'Dr. H. Ahmad Fauzi, M.Pd',
    managerName: 'Hj. Siti Nurjanah, S.Pd'
  };
};

export const exportTransactionsToPDF = (transactions: Transaction[]) => {
  const settings = getSchoolSettings();
  const doc = new jsPDF();
  
  // Add logo
  try {
    doc.addImage("/lovable-uploads/2b938512-b568-413b-9ca8-7d869d333a03.png", "PNG", 95, 10, 20, 20);
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Add title
  doc.setFontSize(18);
  doc.text(`UP - ${settings.schoolName}`, 105, 38, { align: 'center' });
  
  // Add subtitle
  doc.setFontSize(12);
  doc.text('Laporan Transaksi Penjualan', 105, 45, { align: 'center' });
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })}`, 105, 52, { align: 'center' });
  
  // Add school address
  doc.setFontSize(9);
  doc.text(settings.schoolAddress, 105, 58, { align: 'center' });
  
  // Set up the table data
  const tableData = transactions.map(transaction => [
    transaction.id,
    new Date(transaction.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    transaction.items.map(item => `${item.quantity}x ${item.productName}`).join(', '),
    `Rp ${transaction.total.toLocaleString()}`
  ]);
  
  // Create the table
  let tableResult: AutoTableResult = {};
  
  autoTable(doc, {
    head: [['ID Transaksi', 'Tanggal', 'Item', 'Total']],
    body: tableData,
    startY: 65,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [75, 85, 99],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    didDrawPage: function(data) {
      tableResult = data;
    }
  });
  
  // Calculate total amount
  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.total, 0);
  
  // Get finalY position from tableResult or use default
  const finalY = tableResult?.finalY ?? 65;
  
  doc.setFontSize(10);
  doc.text(`Total Transaksi: ${transactions.length}`, 15, finalY + 10);
  doc.text(`Total Penjualan: Rp ${totalAmount.toLocaleString()}`, 15, finalY + 16);
  
  // Add signatures below the table with more spacing (added much more space here)
  doc.text('Mengetahui,', 40, finalY + 45, { align: 'center' });
  doc.text('Kepala Sekolah', 40, finalY + 50, { align: 'center' });
  doc.text(settings.principalName, 40, finalY + 70, { align: 'center' });
  
  doc.text('Bogor, ' + new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }), 160, finalY + 45, { align: 'center' });
  doc.text('Pengelola UP', 160, finalY + 50, { align: 'center' });
  doc.text(settings.managerName, 160, finalY + 70, { align: 'center' });
  
  // Save the PDF using try/catch to ensure download works
  try {
    doc.save('laporan-transaksi.pdf');
  } catch (error) {
    console.error('Error saving PDF:', error);
    // Fallback method
    const blob = doc.output('blob');
    saveAs(blob, 'laporan-transaksi.pdf');
  }
};

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  const settings = getSchoolSettings();
  
  // Format the data for Excel
  const data = [
    [`UP - ${settings.schoolName}`],
    ['Laporan Transaksi Penjualan'],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    ['ID Transaksi', 'Tanggal', 'Waktu', 'Daftar Item', 'Total', 'Uang Diterima', 'Kembalian']
  ];
  
  // Add transaction data
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    data.push([
      transaction.id,
      date.toLocaleDateString('id-ID'),
      date.toLocaleTimeString('id-ID'),
      transaction.items.map(item => `${item.quantity}x ${item.productName}`).join(', '),
      transaction.total.toString(),
      transaction.cashReceived.toString(),
      transaction.change.toString()
    ]);
  });
  
  // Add summary
  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.total, 0);
  data.push([]);
  data.push(['Total Transaksi:', transactions.length.toString()]);
  data.push(['Total Penjualan:', totalAmount.toString()]);
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Style the header rows
  const range = XLSX.utils.decode_range(ws['!ref'] || '');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = ws[XLSX.utils.encode_cell({ r: 4, c: C })];
    if (!cell) continue;
    cell.s = { font: { bold: true } };
  }
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Transaksi');
  
  // Generate Excel file and save
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, 'laporan-transaksi.xlsx');
};

export const exportProductsToPDF = (products: Product[]) => {
  const settings = getSchoolSettings();
  const doc = new jsPDF();
  
  // Add logo
  try {
    doc.addImage("/lovable-uploads/2b938512-b568-413b-9ca8-7d869d333a03.png", "PNG", 95, 10, 20, 20);
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Add title
  doc.setFontSize(18);
  doc.text(`UP - ${settings.schoolName}`, 105, 38, { align: 'center' });
  
  // Add subtitle
  doc.setFontSize(12);
  doc.text('Laporan Daftar Produk', 105, 45, { align: 'center' });
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })}`, 105, 52, { align: 'center' });
  
  // Add school address
  doc.setFontSize(9);
  doc.text(settings.schoolAddress, 105, 58, { align: 'center' });
  
  // Set up the table data
  const tableData = products.map(product => [
    product.id,
    product.name,
    product.category,
    `Rp ${product.buyPrice.toLocaleString()}`,
    `Rp ${product.sellPrice.toLocaleString()}`,
    product.currentStock
  ]);
  
  // Create the table
  let tableResult: AutoTableResult = {};
  
  autoTable(doc, {
    head: [['ID', 'Nama Produk', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok']],
    body: tableData,
    startY: 65,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [75, 85, 99],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    didDrawPage: function(data) {
      tableResult = data;
    }
  });
  
  // Get finalY position from tableResult or use default
  const finalY = tableResult?.finalY ?? 65;
  
  // Add signatures below the table with more spacing (added more space here)
  doc.setFontSize(10);
  doc.text('Mengetahui,', 40, finalY + 45, { align: 'center' });
  doc.text('Kepala Sekolah', 40, finalY + 50, { align: 'center' });
  doc.text(settings.principalName, 40, finalY + 70, { align: 'center' });
  
  doc.text('Bogor, ' + new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }), 160, finalY + 45, { align: 'center' });
  doc.text('Pengelola UP', 160, finalY + 50, { align: 'center' });
  doc.text(settings.managerName, 160, finalY + 70, { align: 'center' });
  
  // Save the PDF using try/catch to ensure download works
  try {
    doc.save('laporan-produk.pdf');
  } catch (error) {
    console.error('Error saving PDF:', error);
    // Fallback method
    const blob = doc.output('blob');
    saveAs(blob, 'laporan-produk.pdf');
  }
};

export const exportProductsToExcel = (products: Product[]) => {
  const settings = getSchoolSettings();
  
  // Format the data for Excel
  const data = [
    [`UP - ${settings.schoolName}`],
    ['Laporan Daftar Produk'],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    ['ID', 'Nama Produk', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok', 'Status']
  ];
  
  // Add product data
  products.forEach(product => {
    let status = 'In Stock';
    if (product.currentStock === 0) {
      status = 'Out of Stock';
    } else if (product.currentStock < (product.minimumStock || 5)) {
      status = 'Low Stock';
    }
    
    data.push([
      product.id,
      product.name,
      product.category,
      product.buyPrice.toString(),
      product.sellPrice.toString(),
      product.currentStock.toString(),
      status
    ]);
  });
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Style the header rows
  const range = XLSX.utils.decode_range(ws['!ref'] || '');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = ws[XLSX.utils.encode_cell({ r: 4, c: C })];
    if (!cell) continue;
    cell.s = { font: { bold: true } };
  }
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Daftar Produk');
  
  // Generate Excel file and save
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, 'laporan-produk.xlsx');
};

export const exportSalesToPDF = (salesData: SalesDataPoint[]) => {
  const settings = getSchoolSettings();
  const doc = new jsPDF();
  
  // Add logo
  try {
    doc.addImage("/lovable-uploads/2b938512-b568-413b-9ca8-7d869d333a03.png", "PNG", 95, 10, 20, 20);
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Add title
  doc.setFontSize(18);
  doc.text(`UP - ${settings.schoolName}`, 105, 38, { align: 'center' });
  
  // Add subtitle
  doc.setFontSize(12);
  doc.text('Laporan Penjualan', 105, 45, { align: 'center' });
  
  // Add date range
  const startDate = salesData.length > 0 ? salesData[0].date : '';
  const endDate = salesData.length > 0 ? salesData[salesData.length - 1].date : '';
  
  doc.setFontSize(10);
  doc.text(`Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`, 105, 52, { align: 'center' });
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 105, 58, { align: 'center' });
  
  // Add school address
  doc.setFontSize(9);
  doc.text(settings.schoolAddress, 105, 64, { align: 'center' });
  
  // Set up the table data with corrected profit calculation (selling price - buying price)
  const tableData = salesData.map(day => {
    // Actual profit is now directly from the day.profit property
    // which should be calculated correctly in the component
    const profit = day.profit || 0;
    
    return [
      new Date(day.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      `Rp ${day.sales.toLocaleString()}`,
      `Rp ${profit.toLocaleString()}`,
      `${day.sales > 0 ? Math.round((profit / day.sales) * 100) : 0}%`
    ];
  });
  
  // Add a row for totals
  const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0);
  const totalProfit = salesData.reduce((sum, day) => sum + (day.profit || 0), 0);
  const averageMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;
  
  tableData.push([
    'Total',
    `Rp ${totalSales.toLocaleString()}`,
    `Rp ${totalProfit.toLocaleString()}`,
    `${averageMargin}%`
  ]);
  
  // Create the table
  let tableResult: AutoTableResult = {};
  
  autoTable(doc, {
    head: [['Tanggal', 'Penjualan', 'Keuntungan', 'Margin']],
    body: tableData,
    startY: 70,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [75, 85, 99],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    didDrawPage: function(data) {
      tableResult = data;
    }
  });
  
  // Get finalY position from tableResult or use default
  const finalY = tableResult?.finalY ?? 70;
  
  // Add signatures below the table with more spacing
  doc.setFontSize(10);
  doc.text('Mengetahui,', 40, finalY + 45, { align: 'center' });
  doc.text('Kepala Sekolah', 40, finalY + 50, { align: 'center' });
  doc.text(settings.principalName, 40, finalY + 70, { align: 'center' });
  
  doc.text('Bogor, ' + new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }), 160, finalY + 45, { align: 'center' });
  doc.text('Pengelola UP', 160, finalY + 50, { align: 'center' });
  doc.text(settings.managerName, 160, finalY + 70, { align: 'center' });
  
  // Save the PDF using try/catch to ensure download works
  try {
    doc.save('laporan-penjualan.pdf');
  } catch (error) {
    console.error('Error saving PDF:', error);
    // Fallback method
    const blob = doc.output('blob');
    saveAs(blob, 'laporan-penjualan.pdf');
  }
};

export const exportSalesToExcel = (salesData: SalesDataPoint[]) => {
  const settings = getSchoolSettings();
  
  // Get date range
  const startDate = salesData.length > 0 ? salesData[0].date : '';
  const endDate = salesData.length > 0 ? salesData[salesData.length - 1].date : '';
  
  // Format the data for Excel
  const data = [
    [`UP - ${settings.schoolName}`],
    ['Laporan Penjualan'],
    [`Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    ['Tanggal', 'Penjualan', 'Keuntungan', 'Margin']
  ];
  
  // Add sales data with correct profit calculation
  salesData.forEach(day => {
    // Use the actual profit value from the day.profit property
    const profit = day.profit || 0;
    
    data.push([
      new Date(day.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      day.sales.toString(),
      profit.toString(),
      `${day.sales > 0 ? Math.round((profit / day.sales) * 100) : 0}%`
    ]);
  });
  
  // Calculate totals with correct profit calculation
  const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0);
  const totalProfit = salesData.reduce((sum, day) => sum + (day.profit || 0), 0);
  const averageMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;
  
  // Add total row
  data.push([
    'Total',
    totalSales.toString(),
    totalProfit.toString(),
    `${averageMargin}%`
  ]);
  
  // Add summary
  data.push([]);
  data.push(['Total Penjualan:', totalSales.toString()]);
  data.push(['Total Keuntungan:', totalProfit.toString()]);
  data.push(['Rata-rata Margin:', `${averageMargin}%`]);
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Style the header rows
  const range = XLSX.utils.decode_range(ws['!ref'] || '');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = ws[XLSX.utils.encode_cell({ r: 5, c: C })];
    if (!cell) continue;
    cell.s = { font: { bold: true } };
  }
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penjualan');
  
  // Generate Excel file and save
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, 'laporan-penjualan.xlsx');
};

export const saveReceiptAsImage = async (receiptElementId: string, transactionId: string) => {
  try {
    const element = document.getElementById(receiptElementId);
    if (!element) {
      throw new Error("Receipt element not found");
    }
    
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    
    // Convert to image and download
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `receipt-${transactionId}.png`;
    link.click();
    
    return true;
  } catch (error) {
    console.error("Error saving receipt as image:", error);
    return false;
  }
};
