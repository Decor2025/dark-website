export const GOOGLE_SHEETS_CONFIG = {
  apiKey: 'AIzaSyAcUPet5yafJOl1BacuBT9moyg_jd_291c',
  spreadsheetId: '1OLarWFbvQgw1u7bZczrcrol2CnL--1KPgreLf9DFGjY',
  range: 'Sheet1!A1:Z1000',
};

export interface GoogleSheetsRow {
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  location: string;
  supplier: string;
  barcode?: string;
  imageUrl?: string;
}

export const fetchInventoryFromGoogleSheets = async (): Promise<GoogleSheetsRow[]> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/${GOOGLE_SHEETS_CONFIG.range}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch data from Google Sheets');
    }
    
    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length === 0) {
      return [];
    }
    
    // First row contains headers
    const headers = rows[0].map((header: string) => header.toLowerCase().trim());
    const inventoryItems: GoogleSheetsRow[] = [];
    
    // Process each row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const item: any = {};
      
      headers.forEach((header: string, index: number) => {
        const value = row[index] || '';
        
        switch (header) {
          case 'sku':
            item.sku = value;
            break;
          case 'name':
          case 'product_name':
            item.name = value;
            break;
          case 'description':
            item.description = value;
            break;
          case 'category':
            item.category = value;
            break;
          case 'unit':
            item.unit = value || 'pcs';
            break;
          case 'cost_price':
          case 'costprice':
            item.costPrice = parseFloat(value) || 0;
            break;
          case 'selling_price':
          case 'sellingprice':
          case 'price':
            item.sellingPrice = parseFloat(value) || 0;
            break;
          case 'current_stock':
          case 'stock':
          case 'quantity':
            item.currentStock = parseInt(value) || 0;
            break;
          case 'minimum_stock':
          case 'min_stock':
            item.minimumStock = parseInt(value) || 0;
            break;
          case 'maximum_stock':
          case 'max_stock':
            item.maximumStock = parseInt(value) || 1000;
            break;
          case 'reorder_level':
          case 'reorder':
            item.reorderLevel = parseInt(value) || 10;
            break;
          case 'location':
            item.location = value;
            break;
          case 'supplier':
            item.supplier = value;
            break;
          case 'barcode':
            item.barcode = value;
            break;
          case 'image_url':
          case 'imageurl':
          case 'image':
            item.imageUrl = value;
            break;
        }
      });
      
      // Only add items with required fields
      if (item.sku && item.name) {
        inventoryItems.push(item);
      }
    }
    
    return inventoryItems;
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    throw error;
  }
};

export const syncInventoryToFirebase = async (items: GoogleSheetsRow[]) => {
  // This function would sync the Google Sheets data to Firebase
  // Implementation depends on your Firebase setup
  console.log('Syncing inventory to Firebase:', items.length, 'items');
};