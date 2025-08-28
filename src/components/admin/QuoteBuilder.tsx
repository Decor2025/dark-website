import { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref as dbRef } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { QRCodeCanvas as QRCode } from 'qrcode.react';

// Company details (hardcoded as requested)
const COMPANY_DETAILS = {
  name: "Decor Drapes Instyle",
  address: "123 Fashion Street, Mumbai, Maharashtra - 400001",
  phone: "+91 98765 43210",
  email: "info@decordrapesinstyle.com",
  gst: "27ABCDE1234F1Z5",
  msme: "UDYAM-MH-12-3456789",
  bankName: "State Bank of India",
  accountNumber: "12345678901",
  ifsc: "SBIN0000123",
  upiId: "decordrapesinstyle@oksbi"
};

type SiteSettings = Record<string, string> | null;

type Product = {
  name: string;
  ratePerSqft: number;
  gstPercent: number;
};

type Customer = {
  name: string;
  address?: string;
  mobile?: string;
  gstin?: string;
};

type QuoteItem = {
  id: string;
  fabricCode: string;
  fabricCategory: string;
  width: number;
  height: number;
  quantity: number;
  addSixInches: boolean;
  unit: "inch" | "cm" | "feet";
  sqft: number;
  rate: number;
  gstPercent: number;
  amount: number;
  gstAmount: number;
  lineTotal: number;
  note?: string;
};

type Quote = {
  quotationNo: string;
  dateISO: string;
  customer: Customer;
  items: QuoteItem[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
  notes?: string;
};

const CURRENCY = "INR";
const QUOTE_PREFIX = "DDI-Q-";
const QUOTE_START = 59999;

function parsePercent(s: string | number | undefined): number {
  if (s == null) return 0;
  if (typeof s === "number") return s;
  const m = /([\d.]+)\s*%?/.exec(s.trim());
  return m ? parseFloat(m[1]) : 0;
}

function convertToInches(value: number, unit: "inch" | "cm" | "feet"): number {
  switch (unit) {
    case "cm": return value * 0.393701;
    case "feet": return value * 12;
    default: return value;
  }
}

function calculateSqft(width: number, height: number, unit: "inch" | "cm" | "feet", addSixInches: boolean): number {
  const widthIn = convertToInches(width, unit);
  let heightIn = convertToInches(height, unit);
  
  if (addSixInches) heightIn += 6;
  
  const sqft = (widthIn * heightIn) / 144;
  return Math.max(0, parseFloat(sqft.toFixed(3)));
}

function inr(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: CURRENCY }).format(Math.round(n));
}

function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
                "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", 
                "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  if (num === 0) return "Zero";
  
  let words = "";
  
  if (Math.floor(num / 10000000) > 0) {
    words += numberToWords(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  
  if (Math.floor(num / 100000) > 0) {
    words += numberToWords(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  
  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  
  if (Math.floor(num / 100) > 0) {
    words += numberToWords(Math.floor(num / 100)) + " Hundred ";
    num %= 100;
  }
  
  if (num > 0) {
    if (words !== "") words += "and ";
    
    if (num < 20) {
      words += ones[num];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += " " + ones[num % 10];
      }
    }
  }
  
  return words.trim() + " Rupees Only";
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const SHEET_ID = '1OLarWFbvQgw1u7bZczrcrol2CnL--1KPgreLf9DFGjY';
const GOOGLE_API_KEY = 'AIzaSyAcUPet5yafJOl1BacuBT9moyg_jd_291c';
const GOOGLE_CLIENT_ID = '397355025915-iavbbbsne3bg9d3ctusa0g98rs86uscr.apps.googleusercontent.com';

const PRODUCTS_TAB = "Products";
const CUSTOMERS_TAB = "Customers";
const QUOTATIONS_TAB = "Quotations";

class SheetsClient {
  private ready = false;

  async init(): Promise<void> {
    if (this.ready) return;

    if (!window.gapi) {
      await new Promise<void>((resolve) => {
        const s = document.createElement("script");
        s.src = "https://apis.google.com/js/api.js";
        s.onload = () => resolve();
        document.body.appendChild(s);
      });
    }

    await new Promise<void>((resolve) => window.gapi.load("client", resolve));
    await window.gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [
      "https://sheets.googleapis.com/$discovery/rest?version=v4",
    ]});

    // Check if auth2 is already initialized to avoid the error
    if (window.gapi.auth2 && window.gapi.auth2.getAuthInstance()) {
      this.ready = true;
      return;
    }

    if (!window.gapi.auth2) {
      await new Promise<void>((resolve) => window.gapi.load("auth2", resolve));
    }
    
    try {
      await window.gapi.auth2.init({ client_id: GOOGLE_CLIENT_ID, scope: "https://www.googleapis.com/auth/spreadsheets" });
    } catch (error) {
      // If already initialized with different options, get the instance
      if (error.error === "idpiframe_initialization_failed") {
        console.log("Auth2 already initialized, getting instance");
      } else {
        throw error;
      }
    }

    const auth = window.gapi.auth2.getAuthInstance();
    if (!auth.isSignedIn.get()) {
      await auth.signIn({ prompt: "select_account" });
    }

    this.ready = true;
  }

  async getValues(rangeA1: string): Promise<string[][]> {
    await this.init();
    try {
      const res = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: rangeA1,
      });
      return (res.result.values || []) as string[][];
    } catch (err) {
      console.error("Sheets error", err);
      throw err;
    }
  }

  async appendValues(rangeA1: string, values: any[][]): Promise<void> {
    await this.init();
    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: rangeA1,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      resource: { values },
    });
  }

  async updateValues(rangeA1: string, values: any[][]): Promise<void> {
    await this.init();
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: rangeA1,
      valueInputOption: "USER_ENTERED",
      resource: { values },
    });
  }

  async clear(rangeA1: string): Promise<void> {
    await this.init();
    await window.gapi.client.sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: rangeA1 });
  }

  async listProducts(): Promise<Product[]> {
    try {
      const rows = await this.getValues(`${PRODUCTS_TAB}!A2:C`);
      return rows.filter(r => r[0]).map(r => ({
        name: r[0],
        ratePerSqft: Number(r[1] || 0),
        gstPercent: parsePercent(r[2] || 0),
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  async listCustomers(): Promise<Customer[]> {
    try {
      const rows = await this.getValues(`${CUSTOMERS_TAB}!A2:D`);
      return rows.filter(r => r[0]).map(r => ({
        name: r[0],
        address: r[1] || "",
        mobile: r[2] || "",
        gstin: r[3] || "",
      }));
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  }

  async listQuotationsRaw(): Promise<string[][]> {
    try {
      return await this.getValues(`${QUOTATIONS_TAB}!A2:Q`);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      return [];
    }
  }

  async getNextQuotationNo(): Promise<string> {
    try {
      const colA = await this.getValues(`${QUOTATIONS_TAB}!A2:A`);
      let maxNum = QUOTE_START;
      for (const [q] of colA) {
        if (!q) continue;
        const m = new RegExp(`^${QUOTE_PREFIX}(\\d+)$`).exec(q.trim());
        if (m) maxNum = Math.max(maxNum, Number(m[1]));
      }
      return `${QUOTE_PREFIX}${maxNum + 1}`;
    } catch (error) {
      console.error("Error getting next quotation number:", error);
      return `${QUOTE_PREFIX}${QUOTE_START + 1}`;
    }
  }

  async appendQuotation(q: Quote): Promise<void> {
    try {
      const row = this.quoteToRow(q);
      await this.appendValues(`${QUOTATIONS_TAB}!A:Q`, [row]);
    } catch (error) {
      console.error("Error appending quotation:", error);
      throw error;
    }
  }

  async findQuotationRowIndex(quotationNo: string): Promise<number | null> {
    try {
      const colA = await this.getValues(`${QUOTATIONS_TAB}!A2:A`);
      for (let i = 0; i < colA.length; i++) {
        if ((colA[i][0] || "").trim() === quotationNo) return i + 2;
      }
      return null;
    } catch (error) {
      console.error("Error finding quotation row:", error);
      return null;
    }
  }

  async updateQuotation(q: Quote): Promise<void> {
    try {
      const rowIndex = await this.findQuotationRowIndex(q.quotationNo);
      if (!rowIndex) throw new Error("Quotation not found to update");
      const row = this.quoteToRow(q);
      await this.updateValues(`${QUOTATIONS_TAB}!A${rowIndex}:Q${rowIndex}`, [row]);
    } catch (error) {
      console.error("Error updating quotation:", error);
      throw error;
    }
  }

  async deleteQuotation(quotationNo: string): Promise<void> {
    try {
      const rowIndex = await this.findQuotationRowIndex(quotationNo);
      if (!rowIndex) throw new Error("Quotation not found to delete");
      await this.clear(`${QUOTATIONS_TAB}!A${rowIndex}:Q${rowIndex}`);
    } catch (error) {
      console.error("Error deleting quotation:", error);
      throw error;
    }
  }

  async searchQuotations(query: string): Promise<Quote[]> {
    try {
      const rows = await this.listQuotationsRaw();
      const results: Quote[] = [];
      
      for (const row of rows) {
        if (row.length < 7) continue;
        
        const quotationNo = row[0];
        const customerName = row[2];
        
        if (quotationNo.toLowerCase().includes(query.toLowerCase()) || 
            customerName.toLowerCase().includes(query.toLowerCase())) {
          try {
            const items = JSON.parse(row[6] || "[]");
            results.push({
              quotationNo,
              dateISO: row[1],
              customer: {
                name: row[2],
                gstin: row[3],
                address: row[4],
                mobile: row[5]
              },
              items,
              subtotal: Number(row[7] || 0),
              totalGst: Number(row[8] || 0),
              grandTotal: Number(row[9] || 0),
              notes: row[10]
            });
          } catch (e) {
            console.error("Error parsing quote", e);
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error("Error searching quotations:", error);
      return [];
    }
  }

  async addCustomer(customer: Customer): Promise<void> {
    try {
      await this.appendValues(`${CUSTOMERS_TAB}!A2:D`, [[
        customer.name,
        customer.address || "",
        customer.mobile || "",
        customer.gstin || ""
      ]]);
    } catch (error) {
      console.error("Error adding customer:", error);
      throw error;
    }
  }

  async addProduct(product: Product): Promise<void> {
    try {
      await this.appendValues(`${PRODUCTS_TAB}!A2:C`, [[
        product.name,
        product.ratePerSqft,
        product.gstPercent
      ]]);
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  }

  private quoteToRow(q: Quote): any[] {
    return [
      q.quotationNo,
      q.dateISO,
      q.customer.name,
      q.customer.gstin || "",
      q.customer.address || "",
      q.customer.mobile || "",
      JSON.stringify(q.items),
      q.subtotal,
      q.totalGst,
      q.grandTotal,
      q.notes || "",
      "", "", "", "", "", ""
    ];
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyCKi2Irrp1sRKuHFOZDZv27BHsM3Gc3SmE",
  authDomain: "decor-drapes-instyle.firebaseapp.com",
  databaseURL: "https://decor-drapes-instyle-default-rtdb.firebaseio.com",
  projectId: "decor-drapes-instyle",
  storageBucket: "decor-drapes-instyle.firebasestorage.app",
  messagingSenderId: "936396093551",
  appId: "1:936396093551:web:e72e2c2a0aee81fd9e759a"
};

const fbApp = initializeApp(firebaseConfig);
const rtdb = getDatabase(fbApp);

function useSiteSettings(): { settings: SiteSettings; get: (k: string)=>string|undefined } {
  const [settings, setSettings] = useState<SiteSettings>(null);
  useEffect(() => {
    const unsub = onValue(dbRef(rtdb, "site_settings"), (snap) => {
      setSettings((snap.val() || null) as SiteSettings);
    });
    return () => unsub();
  }, []);
  const get = (k: string) => (settings?.[k] ?? undefined);
  return { settings, get };
}

function useWebRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  useEffect(() => {
    const unsub = onValue(dbRef(rtdb, "quotations"), (snap) => {
      const data = snap.val() || {};
      setRequests(Object.values(data));
    });
    return () => unsub();
  }, []);
  return requests;
}

function SearchSelect<T extends { label: string; value: string }>(props: {
  label: string;
  options: T[];
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { label, options, value, onChange, placeholder } = props;
  const [q, setQ] = useState("");
  const filtered = useMemo(() => options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())), [q, options]);

  return (
    <div className="w-full">
      <label className="text-sm text-gray-600 block mb-1">{label}</label>
      <input
        className="w-full border rounded-2xl px-3 py-2 mb-2 focus:outline-none focus:ring"
        placeholder={placeholder || "Search..."}
        value={q}
        onChange={(e)=>setQ(e.target.value)}
      />
      <div className="max-h-44 overflow-auto border rounded-2xl">
        {filtered.map((o, index) => (
          <button
            key={`${o.value}-${index}`}
            onClick={()=>onChange(o.value)}
            className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${o.value===value?"bg-gray-100":""}`}
          >{o.label}</button>
        ))}
        {filtered.length===0 && <div className="px-3 py-2 text-sm text-gray-500">No matches</div>}
      </div>
    </div>
  );
}

export default function QuoteBuilder() {
  const sheets = useRef(new SheetsClient());

  const { get } = useSiteSettings();
  const webRequests = useWebRequests();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quotationNo, setQuotationNo] = useState<string>("...");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [globalUnit, setGlobalUnit] = useState<"inch" | "cm" | "feet">("inch");

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Quote[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', address: '', mobile: '', gstin: '' });
  const [newProduct, setNewProduct] = useState({ name: '', ratePerSqft: 0, gstPercent: 0 });

  useEffect(() => {
    (async () => {
      try {
        setLoadingSheets(true);
        const [prod, cust, nextNo] = await Promise.all([
          sheets.current.listProducts(),
          sheets.current.listCustomers(),
          sheets.current.getNextQuotationNo(),
        ]);
        setProducts(prod);
        setCustomers(cust);
        setQuotationNo(nextNo);
      } catch (e:any) {
        console.error(e);
        setError(e.message || String(e));
      } finally {
        setLoadingSheets(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + it.amount, 0);
    const totalGst = items.reduce((s, it) => s + it.gstAmount, 0);
    const grandTotal = subtotal + totalGst;
    return { subtotal, totalGst, grandTotal };
  }, [items]);

  const gstBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    items.forEach(item => {
      const key = `${item.gstPercent}%`;
      breakdown[key] = (breakdown[key] || 0) + item.gstAmount;
    });
    return breakdown;
  }, [items]);

  function addProductToQuote(productName: string) {
    const p = products.find(p => p.name === productName);
    if (!p) return;
    const it: QuoteItem = {
      id: uid(),
      fabricCode: '',
      fabricCategory: p.name,
      width: 0,
      height: 0,
      quantity: 1,
      addSixInches: true,
      unit: globalUnit,
      sqft: 0,
      rate: p.ratePerSqft,
      gstPercent: p.gstPercent,
      amount: 0,
      gstAmount: 0,
      lineTotal: 0,
    };
    setItems(prev => [...prev, it]);
    setShowProductModal(false);
  }

  function updateItem(id: string, field: keyof QuoteItem, value: any) {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      
      const next: QuoteItem = { ...it, [field]: value } as QuoteItem;
      
      if (field === 'width' || field === 'height' || field === 'addSixInches' || field === 'unit' || field === 'quantity' || field === 'fabricCode') {
        const sqft = calculateSqft(next.width, next.height, next.unit, next.addSixInches);
        const amount = sqft * next.rate * next.quantity;
        const gstAmount = amount * (next.gstPercent / 100);
        const lineTotal = amount + gstAmount;
        return { ...next, sqft, amount, gstAmount, lineTotal };
      }
      
      return next;
    }));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  async function handleSave() {
    if (!selectedCustomer) { alert("Select a customer first"); return; }
    if (items.length === 0) { alert("Add at least one product"); return; }

    const quote: Quote = {
      quotationNo,
      dateISO: new Date().toISOString(),
      customer: selectedCustomer,
      items,
      subtotal: totals.subtotal,
      totalGst: totals.totalGst,
      grandTotal: totals.grandTotal,
      notes,
    };

    try {
      await sheets.current.appendQuotation(quote);
      alert(`Saved ${quotationNo} to Sheets`);
      const nextNo = await sheets.current.getNextQuotationNo();
      setQuotationNo(nextNo);
      setItems([]);
      setSelectedCustomer(null);
      setNotes("");
    } catch (e:any) {
      alert("Save failed: " + (e.message || String(e)));
    }
  }

  async function handleUpdate() {
    if (!editingQuote) return;
    if (!selectedCustomer) { alert("Select a customer first"); return; }

    const quote: Quote = {
      ...editingQuote,
      customer: selectedCustomer,
      items,
      subtotal: totals.subtotal,
      totalGst: totals.totalGst,
      grandTotal: totals.grandTotal,
      notes,
    };

    try {
      await sheets.current.updateQuotation(quote);
      alert(`Updated ${quotationNo}`);
      setEditingQuote(null);
    } catch (e:any) {
      alert("Update failed: " + (e.message || String(e)));
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${quotationNo}?`)) return;
    try {
      await sheets.current.deleteQuotation(quotationNo);
      alert(`Deleted ${quotationNo}`);
      const nextNo = await sheets.current.getNextQuotationNo();
      setQuotationNo(nextNo);
      setItems([]);
      setSelectedCustomer(null);
      setNotes("");
      setEditingQuote(null);
    } catch (e:any) {
      alert("Delete failed: " + (e.message || String(e)));
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await sheets.current.searchQuotations(searchQuery);
      setSearchResults(results);
    } catch (e:any) {
      alert("Search failed: " + (e.message || String(e)));
    } finally {
      setIsSearching(false);
    }
  }

  function loadQuoteForEditing(quote: Quote) {
    setEditingQuote(quote);
    setQuotationNo(quote.quotationNo);
    setSelectedCustomer(quote.customer);
    setItems(quote.items);
    setNotes(quote.notes || "");
    setSearchResults([]);
    setSearchQuery("");
  }

  async function handleAddCustomer() {
    try {
      await sheets.current.addCustomer(newCustomer);
      
      // Refresh customers list
      const updatedCustomers = await sheets.current.listCustomers();
      setCustomers(updatedCustomers);
      setShowAddCustomerModal(false);
      setNewCustomer({ name: '', address: '', mobile: '', gstin: '' });
      alert('Customer added successfully!');
    } catch (error: any) {
      alert('Error adding customer: ' + (error.message || String(error)));
    }
  }

  async function handleAddProduct() {
    try {
      await sheets.current.addProduct(newProduct);
      
      // Refresh products list
      const updatedProducts = await sheets.current.listProducts();
      setProducts(updatedProducts);
      setShowAddProductModal(false);
      setNewProduct({ name: '', ratePerSqft: 0, gstPercent: 0 });
      alert('Product added successfully!');
    } catch (error: any) {
      alert('Error adding product: ' + (error.message || String(error)));
    }
  }

  function exportPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;

    // Company Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_DETAILS.name, margin, y);
    y += 20;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const addressLines = doc.splitTextToSize(COMPANY_DETAILS.address, pageWidth - margin * 2);
    addressLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 12;
    });
    
    doc.text(`Phone: ${COMPANY_DETAILS.phone} | Email: ${COMPANY_DETAILS.email}`, margin, y);
    y += 15;
    doc.text(`GST: ${COMPANY_DETAILS.gst} | MSME: ${COMPANY_DETAILS.msme}`, margin, y);
    y += 30;

    // Quotation details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", pageWidth - margin - 50, margin);
    doc.setFont("helvetica", "normal");
    doc.text(`Quotation No: ${quotationNo}`, pageWidth - margin - 50, margin + 15);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - margin - 50, margin + 30);
    y = margin + 80;

    // Customer details
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details:", margin, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    if (selectedCustomer) {
      doc.text(`Name: ${selectedCustomer.name}`, margin, y);
      y += 15;
      if (selectedCustomer.address) {
        const addressLines = doc.splitTextToSize(selectedCustomer.address, pageWidth - margin * 2);
        addressLines.forEach((line: string) => {
          doc.text(line, margin, y);
          y += 12;
        });
      }
      if (selectedCustomer.mobile) {
        doc.text(`Mobile: ${selectedCustomer.mobile}`, margin, y);
        y += 15;
      }
      if (selectedCustomer.gstin) {
        doc.text(`GSTIN: ${selectedCustomer.gstin}`, margin, y);
        y += 15;
      }
    }
    y += 10;

    // Items table
    const itemsRows = items.map((it, idx) => ([
      String(idx + 1),
      it.fabricCode || "-",
      it.fabricCategory,
      `${it.width} ${it.unit}`,
      `${it.height} ${it.unit}${it.addSixInches ? " (+6\")" : ""}`,
      String(it.quantity),
      it.sqft.toFixed(2),
      inr(it.rate),
      inr(it.amount),
      `${it.gstPercent}%`,
      inr(it.gstAmount),
      inr(it.lineTotal),
    ]));

    autoTable(doc, {
      startY: y,
      head: [["#", "Fabric Code", "Category", "Width", "Height", "Qty", "Sqft", "Rate", "Amount", "GST %", "GST Amt", "Total"]],
      body: itemsRows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [230, 230, 230] },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // Totals
    doc.setFontSize(10);
    doc.text(`Subtotal: ${inr(totals.subtotal)}`, pageWidth - margin - 100, y);
    y += 15;
    
    for (const [rate, amount] of Object.entries(gstBreakdown)) {
      doc.text(`GST ${rate}: ${inr(amount)}`, pageWidth - margin - 100, y);
      y += 15;
    }
    
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total: ${inr(totals.grandTotal)}`, pageWidth - margin - 100, y);
    y += 20;
    
    // Amount in words
    doc.setFont("helvetica", "normal");
    const amountWords = doc.splitTextToSize(`Amount in Words: ${numberToWords(totals.grandTotal)}`, pageWidth - margin * 2);
    amountWords.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 12;
    });
    y += 20;

    // Bank details
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", margin, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.text(`Bank Name: ${COMPANY_DETAILS.bankName}`, margin, y);
    y += 15;
    doc.text(`Account Number: ${COMPANY_DETAILS.accountNumber}`, margin, y);
    y += 15;
    doc.text(`IFSC Code: ${COMPANY_DETAILS.ifsc}`, margin, y);
    y += 15;
    doc.text(`UPI ID: ${COMPANY_DETAILS.upiId}`, margin, y);
    y += 30;

    // UPI QR Code - We'll use a placeholder since jsPDF doesn't support QR natively
    doc.setFont("helvetica", "bold");
    doc.text("UPI Payment:", margin, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.text(`Scan the QR code or click the link below to pay:`, margin, y);
    y += 15;
    
    // Add a clickable link
    const upiLink = generateUpiLink(totals.grandTotal);
    doc.setTextColor(0, 0, 255);
    doc.textWithLink("Click here to pay via UPI", margin, y, { url: upiLink });
    doc.setTextColor(0, 0, 0);
    y += 30;

    // Terms and conditions
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", margin, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    const terms = [
      "1. This quotation is valid for 30 days from the date of issue.",
      "2. Prices are subject to change without prior notice.",
      "3. Delivery time: 15-20 days after order confirmation.",
      "4. Advance payment of 50% required to confirm order.",
      "5. Balance payment before delivery.",
      "6. Goods once sold will not be taken back.",
    ];
    
    terms.forEach(term => {
      const termLines = doc.splitTextToSize(term, pageWidth - margin * 2);
      termLines.forEach((line: string) => {
        doc.text(line, margin, y);
        y += 12;
      });
    });

    doc.save(`${quotationNo}.pdf`);
  }

  function generateUpiLink(amount: number): string {
    return `upi://pay?pa=${COMPANY_DETAILS.upiId}&pn=${encodeURIComponent(COMPANY_DETAILS.name)}&am=${amount}&cu=INR`;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Company Header */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold">{COMPANY_DETAILS.name}</h1>
          <p className="text-gray-600">{COMPANY_DETAILS.address}</p>
          <p className="text-gray-600">Phone: {COMPANY_DETAILS.phone} | Email: {COMPANY_DETAILS.email}</p>
          <p className="text-gray-600">GST: {COMPANY_DETAILS.gst} | MSME: {COMPANY_DETAILS.msme}</p>
        </div>

        <div className="flex flex-wrap justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Quote No.</div>
            <div className="text-xl font-mono">{quotationNo}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Date</div>
            <div className="text-lg">{new Date().toLocaleDateString('en-IN')}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Unit:</span>
            <select 
              value={globalUnit} 
              onChange={(e) => setGlobalUnit(e.target.value as "inch" | "cm" | "feet")}
              className="border rounded-xl px-3 py-1"
            >
              <option value="inch">Inch</option>
              <option value="cm">Cm</option>
              <option value="feet">Feet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Search Quotes</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Search by quote no or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border rounded-2xl px-3 py-2"
          />
          <button 
            onClick={handleSearch}
            className="px-4 py-2 rounded-2xl bg-blue-600 text-white"
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Search Results:</h3>
            <div className="grid gap-3 max-h-60 overflow-auto">
              {searchResults.map(quote => (
                <div key={quote.quotationNo} className="border rounded-2xl p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{quote.quotationNo}</div>
                      <div className="text-sm">{quote.customer.name}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(quote.dateISO).toLocaleDateString()} | {inr(quote.grandTotal)}
                      </div>
                    </div>
                    <button 
                      onClick={() => loadQuoteForEditing(quote)}
                      className="px-3 py-1 rounded-xl bg-blue-100 text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button className="px-4 py-2 rounded-2xl bg-black text-white" onClick={() => setShowCustomerModal(true)}>
          {selectedCustomer ? "Change Customer" : "Select Customer"}
        </button>
        <button className="px-4 py-2 rounded-2xl bg-blue-600 text-white" onClick={() => setShowAddCustomerModal(true)}>
          Add Customer
        </button>
        <button className="px-4 py-2 rounded-2xl bg-gray-900 text-white" onClick={() => setShowProductModal(true)}>
          Add Product
        </button>
        <button className="px-4 py-2 rounded-2xl bg-blue-600 text-white" onClick={() => setShowAddProductModal(true)}>
          Create Product
        </button>
        <button className="px-4 py-2 rounded-2xl border" onClick={handleSave}>
          Save to Sheets
        </button>
        {editingQuote && (
          <>
            <button className="px-4 py-2 rounded-2xl border" onClick={handleUpdate}>
              Update in Sheets
            </button>
            <button className="px-4 py-2 rounded-2xl border text-red-600" onClick={handleDelete}>
              Delete from Sheets
            </button>
          </>
        )}
        <button className="px-4 py-2 rounded-2xl border" onClick={exportPDF}>
          Export PDF
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-2xl p-3 mb-4">{error}</div>}
      {loadingSheets && <div className="text-sm text-gray-500 mb-4">Loading Products & Customers from Google Sheets…</div>}

      {/* Customer summary */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Customer</h2>
        {selectedCustomer ? (
          <div className="text-sm text-gray-800 space-y-1">
            <div className="font-medium">{selectedCustomer.name}</div>
            {selectedCustomer.address && <div className="text-gray-600">{selectedCustomer.address}</div>}
            <div className="text-gray-600">Mobile: {selectedCustomer.mobile || "-"}</div>
            <div className="text-gray-600">GSTIN: {selectedCustomer.gstin || "-"}</div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No customer selected.</div>
        )}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-3">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="pb-2">Fabric Code</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Width</th>
                <th className="pb-2">Height</th>
                <th className="pb-2">+6"</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2">Sqft</th>
                <th className="pb-2">Rate</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">GST %</th>
                <th className="pb-2">GST Amt</th>
                <th className="pb-2">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="py-2">
                    <input 
                      type="text" 
                      className="w-24 border rounded-xl px-2 py-1" 
                      value={it.fabricCode}
                      onChange={(e) => updateItem(it.id, "fabricCode", e.target.value)}
                      placeholder="Enter fabric code"
                    />
                  </td>
                  <td className="py-2">{it.fabricCategory}</td>
                  <td className="py-2">
                    <input 
                      type="number" 
                      className="w-20 border rounded-xl px-2 py-1" 
                      value={it.width || ''}
                      onChange={(e) => updateItem(it.id, "width", Number(e.target.value) || 0)}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="py-2">
                    <input 
                      type="number" 
                      className="w-20 border rounded-xl px-2 py-1" 
                      value={it.height || ''}
                      onChange={(e) => updateItem(it.id, "height", Number(e.target.value) || 0)}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="py-2 text-center">
                    <input 
                      type="checkbox" 
                      checked={it.addSixInches}
                      onChange={(e) => updateItem(it.id, "addSixInches", e.target.checked)}
                    />
                  </td>
                  <td className="py-2">
                    <input 
                      type="number" 
                      className="w-16 border rounded-xl px-2 py-1" 
                      value={it.quantity}
                      onChange={(e) => updateItem(it.id, "quantity", Number(e.target.value))}
                      min="1"
                    />
                  </td>
                  <td className="py-2 tabular-nums">{it.sqft.toFixed(2)}</td>
                  <td className="py-2 tabular-nums">{inr(it.rate)}</td>
                  <td className="py-2 tabular-nums">{inr(it.amount)}</td>
                  <td className="py-2 tabular-nums">{it.gstPercent}%</td>
                  <td className="py-2 tabular-nums">{inr(it.gstAmount)}</td>
                  <td className="py-2 tabular-nums font-semibold">{inr(it.lineTotal)}</td>
                  <td className="py-2 text-right">
                    <button className="text-red-600" onClick={() => removeItem(it.id)}>Remove</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-6 text-center text-gray-500">
                    No items yet. Click "Add Product".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals and Notes */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Notes (optional)</label>
          <textarea 
            className="w-full border rounded-2xl px-3 py-2 min-h-[100px]" 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
          />
        </div>
        <div className="md:justify-self-end w-full md:w-80">
          <div className="flex justify-between py-1">
            <span>Subtotal</span>
            <span className="tabular-nums">{inr(totals.subtotal)}</span>
          </div>
          {Object.entries(gstBreakdown).map(([rate, amount]) => (
            <div key={rate} className="flex justify-between py-1">
              <span>GST {rate}</span>
              <span className="tabular-nums">{inr(amount)}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 text-lg font-semibold border-t mt-2">
            <span>Grand Total</span>
            <span className="tabular-nums">{inr(totals.grandTotal)}</span>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            {numberToWords(totals.grandTotal)}
          </div>
        </div>
      </div>

      {/* Bank Details & Payment */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Payment Details</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Bank Transfer</h3>
            <div className="text-sm space-y-1">
              <div>Bank: {COMPANY_DETAILS.bankName}</div>
              <div>Account Number: {COMPANY_DETAILS.accountNumber}</div>
              <div>IFSC Code: {COMPANY_DETAILS.ifsc}</div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">UPI Payment</h3>
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="border p-2 rounded-xl bg-white">
                <QRCode 
                  value={generateUpiLink(totals.grandTotal)} 
                  size={100}
                />
              </div>
              <div className="text-sm">
                <div>Scan QR code to pay</div>
                <div className="mt-2">Or</div>
                <a 
                  href={generateUpiLink(totals.grandTotal)}
                  className="text-blue-600 underline mt-1 inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pay with UPI App
                </a>
                <div className="mt-2 text-xs text-gray-500">
                  UPI ID: {COMPANY_DETAILS.upiId}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Terms & Conditions</h2>
        <div className="text-sm space-y-2">
          <p>1. This quotation is valid for 30 days from the date of issue.</p>
          <p>2. Prices are subject to change without prior notice.</p>
          <p>3. Delivery time: 15-20 days after order confirmation.</p>
          <p>4. Advance payment of 50% required to confirm order.</p>
          <p>5. Balance payment before delivery.</p>
          <p>6. Goods once sold will not be taken back.</p>
        </div>
        <div className="mt-6 text-right">
          <div className="font-medium">For {COMPANY_DETAILS.name}</div>
          <div className="mt-8">Authorized Signatory</div>
        </div>
      </div>

      {/* Web Requests from Firebase */}
      {webRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Website Quote Requests ({webRequests.length})</h2>
          <div className="grid gap-3 max-h-60 overflow-auto">
            {webRequests.map((request, idx) => (
              <div key={idx} className="border rounded-2xl p-3">
                <div className="font-medium">{request.name || 'Unknown'}</div>
                <div className="text-sm text-gray-600">
                  {request.email} | {request.phone}
                </div>
                <div className="text-sm mt-1">{request.message || 'No message'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {request.timestamp ? new Date(request.timestamp).toLocaleString() : 'Unknown date'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div initial={{y:30, opacity:0}} animate={{y:0, opacity:1}} exit={{y:30, opacity:0}} className="bg-white w-full max-w-xl rounded-2xl shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Select Customer</h3>
                <button onClick={() => setShowCustomerModal(false)} className="text-gray-500">Close</button>
              </div>
              <SearchSelect
                label="Customers"
                options={customers.map((c, index) => ({ 
                  label: `${c.name}${c.mobile ? ` • ${c.mobile}` : ""}`, 
                  value: `${index}` 
                }))}
                value={selectedCustomer ? customers.indexOf(selectedCustomer).toString() : undefined}
                onChange={(value) => { 
                  const index = parseInt(value);
                  const c = customers[index] || null; 
                  setSelectedCustomer(c); 
                  setShowCustomerModal(false); 
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div initial={{y:30, opacity:0}} animate={{y:0, opacity:1}} exit={{y:30, opacity:0}} className="bg-white w-full max-w-xl rounded-2xl shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Add Product</h3>
                <button onClick={() => setShowProductModal(false)} className="text-gray-500">Close</button>
              </div>
              <SearchSelect
                label="Products"
                options={products.map((p, index) => ({ 
                  label: `${p.name} — ${inr(p.ratePerSqft)}/sqft • GST ${p.gstPercent}%`, 
                  value: `${index}` 
                }))}
                onChange={(value) => {
                  const index = parseInt(value);
                  const p = products[index];
                  if (p) addProductToQuote(p.name);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Customer Name *"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                className="w-full border rounded-xl px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                className="w-full border rounded-xl px-3 py-2"
              />
              <input
                type="text"
                placeholder="Mobile"
                value={newCustomer.mobile}
                onChange={(e) => setNewCustomer({...newCustomer, mobile: e.target.value})}
                className="w-full border rounded-xl px-3 py-2"
              />
              <input
                type="text"
                placeholder="GSTIN (Optional)"
                value={newCustomer.gstin}
                onChange={(e) => setNewCustomer({...newCustomer, gstin: e.target.value})}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddCustomerModal(false)} className="px-4 py-2 rounded-xl border">
                Cancel
              </button>
              <button onClick={handleAddCustomer} disabled={!newCustomer.name} className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:bg-gray-400">
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Product Name *"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                className="w-full border rounded-xl px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Rate per Sqft *"
                value={newProduct.ratePerSqft || ''}
                onChange={(e) => setNewProduct({...newProduct, ratePerSqft: Number(e.target.value)})}
                className="w-full border rounded-xl px-3 py-2"
                min="0"
                step="0.01"
                required
              />
              <input
                type="number"
                placeholder="GST Percentage *"
                value={newProduct.gstPercent || ''}
                onChange={(e) => setNewProduct({...newProduct, gstPercent: Number(e.target.value)})}
                className="w-full border rounded-xl px-3 py-2"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddProductModal(false)} className="px-4 py-2 rounded-xl border">
                Cancel
              </button>
              <button onClick={handleAddProduct} disabled={!newProduct.name || !newProduct.ratePerSqft || !newProduct.gstPercent} className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:bg-gray-400">
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}