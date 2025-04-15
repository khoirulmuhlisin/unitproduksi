
import html2canvas from 'html2canvas';

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
