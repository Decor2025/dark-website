import React, { useState, useEffect } from "react";
import { ref, onValue, set, push, remove } from "firebase/database";
import { database } from "../../config/firebase";
import {
  fetchInventoryFromGoogleSheets,
  syncInventoryToFirebase,
} from "../../config/googleSheets";
import { useAuth } from "../../context/AuthContext";
import StockGroupManagement from "./StockGroupManagement";
import {
  InventoryItem,
  InventoryTransaction,
  InventoryGroup,
} from "../../types";
import {
  Package,
  RefreshCw,
  Download,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Grid,
  List,
  MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";

const InventoryManagement: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [groups, setGroups] = useState<InventoryGroup[]>([]);
  const [activeTab, setActiveTab] = useState("items");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    category: "",
    unit: "pcs",
    unitType: "piece" as "sqft" | "meter" | "piece" | "kg" | "liter",
    costPrice: "",
    sellingPrice: "",
    pricePerUnit: "",
    currentStock: "",
    minimumStock: "",
    maximumStock: "",
    reorderLevel: "",
    location: "",
    supplier: "",
    barcode: "",
    imageUrl: "",
    groupTag: "",
    width: "",
    height: "",
  });

  useEffect(() => {
    // Load inventory items
    const inventoryRef = ref(database, "inventory");
    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items: InventoryItem[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setInventory(items);
      }
    });

    // Load transactions
    const transactionsRef = ref(database, "inventoryTransactions");
    const unsubscribeTransactions = onValue(transactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const txns: InventoryTransaction[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setTransactions(
          txns.sort(
            (a, b) =>
              new Date(b.performedAt).getTime() -
              new Date(a.performedAt).getTime()
          )
        );
      }
    });

    // Load inventory groups
    const groupsRef = ref(database, "inventoryGroups");
    const unsubscribeGroups = onValue(groupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const groupList: InventoryGroup[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setGroups(groupList);
      }
    });

    return () => {
      unsubscribeInventory();
      unsubscribeTransactions();
      unsubscribeGroups();
    };
  }, []);

  const syncFromGoogleSheets = async () => {
    setSyncing(true);
    try {
      const sheetsData = await fetchInventoryFromGoogleSheets();

      // Add new data from Google Sheets
      const inventoryRef = ref(database, "inventory");
      for (const item of sheetsData) {
        // Check if item already exists
        const existingItems = inventory.filter((inv) => inv.sku === item.sku);

        if (existingItems.length > 0) {
          // Update existing item
          const existingItem = existingItems[0];
          const itemRef = ref(database, `inventory/${existingItem.id}`);
          await set(itemRef, {
            ...existingItem,
            ...item,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser?.email || "admin",
            isActive: true,
          });
        } else {
          const newItemRef = push(inventoryRef);
          const cleanItem = Object.fromEntries(
            Object.entries({
              ...item,
              lastUpdated: new Date().toISOString(),
              updatedBy: currentUser?.email || "admin",
              createdAt: new Date().toISOString(),
              isActive: true,
            }).filter(([_, value]) => value !== undefined)
          );

          await set(newItemRef, cleanItem);
        }
      }

      toast.success(`Synced ${sheetsData.length} items from Google Sheets!`);
    } catch (error) {
      toast.error(
        "Failed to sync from Google Sheets. Check your configuration."
      );
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  const syncToGoogleSheets = async (item: InventoryItem) => {
    try {
      const sheetsItem = {
        sku: item.sku,
        name: item.name,
        description: item.description,
        category: item.category,
        unitType: item.unitType || "piece",
        pricePerUnit: item.pricePerUnit || item.sellingPrice,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        maximumStock: item.maximumStock,
        reorderLevel: item.reorderLevel,
        location: item.location,
        supplier: item.supplier,
        barcode: item.barcode,
        imageUrl: item.imageUrl,
        groupTag: item.groupTag,
        width: item.width,
        height: item.height,
        unit: item.unit,
      };

      await updateGoogleSheetsInventory(sheetsItem);
      console.log("Successfully synced to Google Sheets");
    } catch (error) {
      console.error("Failed to sync to Google Sheets:", error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        unit: formData.unit,
        unitType: formData.unitType,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        pricePerUnit:
          parseFloat(formData.pricePerUnit) ||
          parseFloat(formData.sellingPrice),
        currentStock: parseInt(formData.currentStock),
        minimumStock: parseInt(formData.minimumStock),
        maximumStock: parseInt(formData.maximumStock),
        reorderLevel: parseInt(formData.reorderLevel),
        location: formData.location,
        supplier: formData.supplier,
        barcode: formData.barcode,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.email || "admin",
        isActive: true,
        imageUrl: formData.imageUrl || "",
        groupTag: formData.groupTag || "",
        width: parseFloat(formData.width) || undefined,
        height: parseFloat(formData.height) || undefined,
        ...(editingItem ? {} : { createdAt: new Date().toISOString() }),
      };

      if (editingItem) {
        const itemRef = ref(database, `inventory/${editingItem.id}`);
        await set(itemRef, itemData);
        // Sync to Google Sheets
        await syncToGoogleSheets({ ...editingItem, ...itemData });
        toast.success("Inventory item updated successfully!");
      } else {
        const inventoryRef = ref(database, "inventory");
        const newItemRef = push(inventoryRef);
        await set(newItemRef, itemData);
        // Sync to Google Sheets
        await syncToGoogleSheets({
          id: newItemRef.key!,
          ...itemData,
        } as InventoryItem);
        toast.success("Inventory item added successfully!");
      }

      resetForm();
    } catch (error) {
      toast.error("Failed to save inventory item");
      console.error("Error saving inventory item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      description: item.description,
      category: item.category,
      unit: item.unit,
      unitType: item.unitType || "piece",
      costPrice: item.costPrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      pricePerUnit: (item.pricePerUnit || item.sellingPrice).toString(),
      currentStock: item.currentStock.toString(),
      minimumStock: item.minimumStock.toString(),
      maximumStock: item.maximumStock.toString(),
      reorderLevel: item.reorderLevel.toString(),
      location: item.location,
      supplier: item.supplier,
      barcode: item.barcode || "",
      imageUrl: item.imageUrl || "",
      groupTag: item.groupTag || "",
      width: item.width?.toString() || "",
      height: item.height?.toString() || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      try {
        const itemRef = ref(database, `inventory/${itemId}`);
        await remove(itemRef);
        toast.success("Inventory item deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete inventory item");
        console.error("Error deleting inventory item:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      description: "",
      category: "",
      unit: "pcs",
      unitType: "piece",
      costPrice: "",
      sellingPrice: "",
      pricePerUnit: "",
      currentStock: "",
      minimumStock: "",
      maximumStock: "",
      reorderLevel: "",
      location: "",
      supplier: "",
      barcode: "",
      imageUrl: "",
      groupTag: "",
      width: "",
      height: "",
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const exportToCSV = () => {
    const headers = [
      "SKU",
      "Name",
      "Description",
      "Category",
      "Unit",
      "Cost Price",
      "Selling Price",
      "Current Stock",
      "Minimum Stock",
      "Maximum Stock",
      "Reorder Level",
      "Location",
      "Supplier",
      "Barcode",
    ];

    const csvContent = [
      headers.join(","),
      ...inventory.map((item) =>
        [
          item.sku,
          item.name,
          item.description,
          item.category,
          item.unit,
          item.costPrice,
          item.sellingPrice,
          item.currentStock,
          item.minimumStock,
          item.maximumStock,
          item.reorderLevel,
          item.location,
          item.supplier,
          item.barcode || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
    (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sku || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
    categoryFilter === "all" || item.category === categoryFilter;
    const matchesGroup = groupFilter === "all" || item.groupTag === groupFilter;
    return matchesSearch && matchesCategory && matchesGroup;
  });
  
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });
  const categories = Array.from(
    new Set(inventory.map((item) => item.category))
  );
  const groupTags = Array.from(
    new Set(inventory.map((item) => item.groupTag).filter(Boolean))
  );
  const lowStockItems = inventory.filter(
    (item) => item.currentStock <= item.reorderLevel
  );

  const tabs = [
    { id: "items", label: "Inventory Items", icon: Package },
    { id: "transactions", label: "Transaction History", icon: FileText },
    { id: "groups", label: "Inventory Groups", icon: Users },
  ];

  // Inventory stats for dashboard
  const inventoryStats = {
    totalItems: inventory.length,
    lowStockItems: lowStockItems.length,
    totalValue: inventory.reduce((sum, item) => sum + (item.costPrice * item.currentStock), 0),
    categoriesCount: categories.length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h2>
          <p className="text-gray-600 mt-1">Manage your inventory items, transactions and groups</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={syncFromGoogleSheets}
            disabled={syncing}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm hover:shadow-md"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync from Sheets"}
          </button>
          <a
            href="https://docs.google.com/spreadsheets"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm hover:shadow-md"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Google Sheets
          </a>
          <button
            onClick={exportToCSV}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm hover:shadow-md"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <Package className="w-5 h-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Items</h3>
              <p className="text-2xl font-bold text-gray-900">{inventoryStats.totalItems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Low Stock</h3>
              <p className="text-2xl font-bold text-gray-900">{inventoryStats.lowStockItems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Value</h3>
              <p className="text-2xl font-bold text-gray-900">₹{inventoryStats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
              <Filter className="w-5 h-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Categories</h3>
              <p className="text-2xl font-bold text-gray-900">{inventoryStats.categoriesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-yellow-800">
              Low Stock Alert
            </h3>
          </div>
          <p className="text-yellow-700 mt-1">
            {lowStockItems.length} items are at or below reorder level
          </p>
          <button 
            className="mt-2 text-yellow-800 underline text-sm"
            onClick={() => setCategoryFilter("all")}
          >
            View all low stock items
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex flex-col sm:flex-row sm:space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "items" && (
        <>
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 md:flex-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="flex-1 md:flex-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Groups</option>
                {groupTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Inventory Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sortedInventory.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                    item.currentStock <= item.reorderLevel ? "border-yellow-200" : "border-gray-100"
                  }`}
                >
                  {item.imageUrl && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">SKU: {item.sku}</p>
                      </div>
                      <button 
                        className="text-gray-400 hover:text-gray-600 p-1"
                        onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {item.groupTag && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-2">
                        {item.groupTag}
                      </span>
                    )}
                    
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          ₹{item.pricePerUnit || item.sellingPrice}
                          <span className="text-xs text-gray-500">/{item.unitType || item.unit}</span>
                        </p>
                        <p className="text-xs text-gray-500">Cost: ₹{item.costPrice}</p>
                      </div>
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.currentStock <= item.reorderLevel 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {item.currentStock} {item.unit}
                      </div>
                    </div>
                    
                    {expandedItem === item.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Category</p>
                            <p className="font-medium">{item.category}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Location</p>
                            <p className="font-medium">{item.location || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Min Stock</p>
                            <p className="font-medium">{item.minimumStock}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Reorder Level</p>
                            <p className="font-medium">{item.reorderLevel}</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 px-3 rounded-lg font-medium transition-colors text-sm flex items-center justify-center"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-1.5 px-3 rounded-lg font-medium transition-colors text-sm flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inventory List View */}
          {viewMode === "list" && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          Item Details
                          {sortConfig.key === "name" && (
                            sortConfig.direction === "asc" ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("currentStock")}
                      >
                        <div className="flex items-center">
                          Stock
                          {sortConfig.key === "currentStock" && (
                            sortConfig.direction === "asc" ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("sellingPrice")}
                      >
                        <div className="flex items-center">
                          Pricing
                          {sortConfig.key === "sellingPrice" && (
                            sortConfig.direction === "asc" ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedInventory.map((item) => (
                      <tr
                        key={item.id}
                        className={
                          item.currentStock <= item.reorderLevel
                            ? "bg-yellow-50"
                            : ""
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {item.sku}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.category}
                              </div>
                              {item.groupTag && (
                                <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                                  {item.groupTag}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.currentStock} {item.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            Min: {item.minimumStock} | Reorder:{" "}
                            {item.reorderLevel}
                          </div>
                          {item.width && item.height && (
                            <div className="text-sm text-gray-500">
                              {item.width} × {item.height} {item.unitType}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{item.pricePerUnit || item.sellingPrice}
                          </div>
                          <div className="text-sm text-gray-500">
                            per {item.unitType || item.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            Cost: ₹{item.costPrice}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "transactions" && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => {
                  const item = inventory.find(
                    (i) => i.id === transaction.inventoryItemId
                  );
                  return (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.performedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item?.name || "Unknown Item"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === "purchase"
                              ? "bg-green-100 text-green-800"
                              : transaction.type === "sale"
                              ? "bg-blue-100 text-blue-800"
                              : transaction.type === "damage"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {transaction.type === "purchase" ||
                          transaction.type === "return" ? (
                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                          )}
                          {transaction.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.performedBy}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === "groups" && <StockGroupManagement />}

      {/* Add/Edit Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Type
                  </label>
                  <select
                    value={formData.unitType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="piece">Pieces</option>
                    <option value="sqft">Square Feet</option>
                    <option value="meter">Square Meter</option>
                    <option value="kg">Kilograms</option>
                    <option value="liter">Liters</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Unit (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.pricePerUnit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerUnit: e.target.value,
                        sellingPrice: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.currentStock}
                    onChange={(e) =>
                      setFormData({ ...formData, currentStock: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Stock
                  </label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumStock: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Stock
                  </label>
                  <input
                    type="number"
                    value={formData.maximumStock}
                    onChange={(e) =>
                      setFormData({ ...formData, maximumStock: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, reorderLevel: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Tag
                  </label>
                  <input
                    type="text"
                    value={formData.groupTag}
                    onChange={(e) =>
                      setFormData({ ...formData, groupTag: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Premium, Budget, Luxury"
                  />
                </div>
              </div>

              {(formData.unitType === "sqft" ||
                formData.unitType === "meter") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width ({formData.unitType === "sqft" ? "ft" : "m"})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.width}
                      onChange={(e) =>
                        setFormData({ ...formData, width: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Width"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height ({formData.unitType === "sqft" ? "ft" : "m"})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData({ ...formData, height: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Height"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm hover:shadow-md"
                >
                  {loading ? "Saving..." : editingItem ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;