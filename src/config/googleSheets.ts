export const GOOGLE_SHEETS_CONFIG = {
  // Replace with your Google Sheets API key
  apiKey: 'AIzaSyAcUPet5yafJOl1BacuBT9moyg_jd_291c',
  // Replace with your Google Sheet ID (from the URL)
  spreadsheetId: '1OLarWFbvQgw1u7bZczrcrol2CnL--1KPgreLf9DFGjY',
  // The range of cells to read (e.g., 'Sheet1!A1:Z1000')
  range: 'Sheet1!A1:Z1000',
  // Service account credentials for write access
  serviceAccountEmail: 'your-service-account@project.iam.gserviceaccount.com',
  privateKey: 'your-private-key-here'
};

export interface GoogleSheetsRow {
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  unitType: 'sqft' | 'meter' | 'piece' | 'kg' | 'liter';
  costPrice: number;
  sellingPrice: number;
  pricePerUnit: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  location: string;
  supplier: string;
  barcode?: string;
  imageUrl?: string;
  groupTag?: string;
  width?: number;
  height?: number;
}

// Standard import format for Google Sheets
export const SHEETS_COLUMN_MAPPING = {
  'A': 'sku',           // Item SKU/Code
  'B': 'name',          // Item Name
  'C': 'description',   // Description
  'D': 'category',      // Category
  'E': 'unitType',      // Unit Type (sqft, meter, piece, kg, liter)
  'F': 'pricePerUnit',  // Price per unit
  'G': 'costPrice',     // Cost Price
  'H': 'sellingPrice',  // Selling Price
  'I': 'currentStock', // Current Stock
  'J': 'minimumStock', // Minimum Stock
  'K': 'maximumStock', // Maximum Stock
  'L': 'reorderLevel', // Reorder Level
  'M': 'location',     // Storage Location
  'N': 'supplier',     // Supplier
  'O': 'barcode',      // Barcode
  'P': 'imageUrl',     // Image URL
  'Q': 'groupTag',     // Group Tag
  'R': 'width',        // Width (for dimensional items)
  'S': 'height'        // Height (for dimensional items)
};

export const fetchInventoryFromGoogleSheets = async (): Promise<GoogleSheetsRow[]> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/${GOOGLE_SHEETS_CONFIG.range}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API Error:', errorData);
      throw new Error(`Failed to fetch data from Google Sheets: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length === 0) {
      console.warn('No data found in Google Sheets');
      return [];
    }
    
    // Skip header row and process data
    const inventoryItems: GoogleSheetsRow[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const item: GoogleSheetsRow = {
        sku: row[0] || '',
        name: row[1] || '',
        description: row[2] || '',
        category: row[3] || '',
        unitType: (row[4] as any) || 'piece',
        pricePerUnit: parseFloat(row[5]) || 0,
        costPrice: parseFloat(row[6]) || 0,
        sellingPrice: parseFloat(row[7]) || 0,
        currentStock: parseInt(row[8]) || 0,
        minimumStock: parseInt(row[9]) || 0,
        maximumStock: parseInt(row[10]) || 1000,
        reorderLevel: parseInt(row[11]) || 10,
        location: row[12] || '',
        supplier: row[13] || '',
        barcode: row[14] || '',
        imageUrl: row[15] || '',
        groupTag: row[16] || '',
        width: parseFloat(row[17]) || undefined,
        height: parseFloat(row[18]) || undefined,
        unit: row[4] || 'pcs'
      };
      
      // Only add items with required fields
      if (item.sku && item.name) {
        inventoryItems.push(item);
      }
    }
    
    console.log(`Successfully fetched ${inventoryItems.length} items from Google Sheets`);
    return inventoryItems;
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    throw error;
  }
};

export const updateGoogleSheetsInventory = async (item: GoogleSheetsRow, rowIndex?: number): Promise<boolean> => {
  try {
    // For write operations, you need OAuth2 or Service Account authentication
    // This is a simplified example - in production, implement proper authentication
    
    const values = [
      [
        item.sku,
        item.name,
        item.description,
        item.category,
        item.unitType,
        item.pricePerUnit,
        item.costPrice,
        item.sellingPrice,
        item.currentStock,
        item.minimumStock,
        item.maximumStock,
        item.reorderLevel,
        item.location,
        item.supplier,
        item.barcode || '',
        item.imageUrl || '',
        item.groupTag || '',
        item.width || '',
        item.height || ''
      ]
    ];

    const range = rowIndex ? `Sheet1!A${rowIndex + 1}:S${rowIndex + 1}` : 'Sheet1!A:S';
    
    // Note: This requires proper authentication setup
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update Google Sheets: ${response.status}`);
    }

    console.log('Successfully updated Google Sheets');
    return true;
  } catch (error) {
    console.error('Error updating Google Sheets:', error);
    return false;
  }
};

export const addToGoogleSheets = async (item: GoogleSheetsRow): Promise<boolean> => {
  try {
    const values = [
      [
        item.sku,
        item.name,
        item.description,
        item.category,
        item.unitType,
        item.pricePerUnit,
        item.costPrice,
        item.sellingPrice,
        item.currentStock,
        item.minimumStock,
        item.maximumStock,
        item.reorderLevel,
        item.location,
        item.supplier,
        item.barcode || '',
        item.imageUrl || '',
        item.groupTag || '',
        item.width || '',
        item.height || ''
      ]
    ];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/Sheet1!A:S:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add to Google Sheets: ${response.status}`);
    }

    console.log('Successfully added to Google Sheets');
    return true;
  } catch (error) {
    console.error('Error adding to Google Sheets:', error);
    return false;
  }
};

// Helper function to get access token (implement based on your auth method)
async function getAccessToken(): Promise<string> {
  // Implement OAuth2 or Service Account authentication
  // This is a placeholder - replace with actual implementation
  return 'your-access-token';
}

export const deleteFromGoogleSheets = async (sku: string): Promise<boolean> => {
  try {
    // First, find the row with the SKU
    const data = await fetchInventoryFromGoogleSheets();
    const rowIndex = data.findIndex(item => item.sku === sku);
    
    if (rowIndex === -1) {
      console.warn(`Item with SKU ${sku} not found in Google Sheets`);
      return false;
    }

    // Delete the row (this requires the Sheets API batchUpdate method)
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // Assuming first sheet
                dimension: 'ROWS',
                startIndex: rowIndex + 1, // +1 because of header row
                endIndex: rowIndex + 2
              }
            }
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete from Google Sheets: ${response.status}`);
    }

    console.log('Successfully deleted from Google Sheets');
    return true;
  } catch (error) {
    console.error('Error deleting from Google Sheets:', error);
    return false;
  }
};