"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Palette,
  Save,
  Trash2,
  ShoppingBag,
  Plus,
  Minus,
  Printer,
  UtensilsCrossed,
  ChefHat,
  Download,
  Upload,
  Receipt,
  IndianRupee,
  CreditCard,
  Banknote,
  QrCode,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
}

interface RestaurantConfig {
  name: string;
  tagline: string;
  logoUrl: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  taxRate: number;
  gstNumber: string;
  footerNote: string;
}

interface SettledOrder {
  id: string;
  timestamp: string;
  table: string;
  items: { name: string; price: number; qty: number }[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  paymentMode: "Cash" | "UPI" | "Card";
}

interface PrintedBillSnapshot {
  items: { name: string; price: number; qty: number }[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  table: string;
  paymentMode: "Cash" | "UPI" | "Card";
}

const themePresets = [
  { name: "Crimson Red", primary: "#e11d48", secondary: "#0f172a" },
  { name: "Midnight Teal", primary: "#0d9488", secondary: "#111827" },
  { name: "Royal Amber", primary: "#d97706", secondary: "#1c1917" },
  { name: "Emerald Green", primary: "#16a34a", secondary: "#064e3b" },
];

const categories = ["All", "Fast Food", "Main Course", "Beverages", "Desserts"];
const tableList = ["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Table 6", "Parcel"];

const initialConfig: RestaurantConfig = {
  name: "Royal Spice Bistro",
  tagline: "Authentic Flavors & Fresh Meals",
  logoUrl: "",
  currency: "₹",
  primaryColor: "#e11d48",
  secondaryColor: "#0f172a",
  taxRate: 5,
  gstNumber: "07AAAAA0000A1Z5",
  footerNote: "Thanks for dining with us! Visit again.",
};

const initialItems: MenuItem[] = [
  { id: "1", name: "Paneer Butter Masala", price: 240, category: "Main Course", isVeg: true },
  { id: "2", name: "Chicken Biryani", price: 280, category: "Main Course", isVeg: false },
  { id: "3", name: "Crispy Veg Burger", price: 99, category: "Fast Food", isVeg: true },
  { id: "4", name: "Cold Coffee Shake", price: 80, category: "Beverages", isVeg: true },
  { id: "5", name: "Gulab Jamun (2 Pcs)", price: 60, category: "Desserts", isVeg: true },
];

export default function UniversalPOS() {
  const [config, setConfig] = useState<RestaurantConfig>(initialConfig);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [selectedTable, setSelectedTable] = useState<string>("Table 1");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  
  // Per-Table Carts: { "Table 1": { "item_id": 2 }, "Table 2": { ... } }
  const [tableCarts, setTableCarts] = useState<{ [table: string]: { [itemId: string]: number } }>({});
  
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Card">("Cash");
  const [salesHistory, setSalesHistory] = useState<SettledOrder[]>([]);
  const [printMode, setPrintMode] = useState<"BILL" | "KOT">("BILL");
  const [printedBill, setPrintedBill] = useState<PrintedBillSnapshot | null>(null);
  const [isClient, setIsClient] = useState(false);

  // New Item State
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Fast Food");
  const [itemIsVeg, setItemIsVeg] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const savedConfig = localStorage.getItem("pos_config");
    const savedItems = localStorage.getItem("pos_items");
    const savedHistory = localStorage.getItem("pos_sales_history");
    const savedCarts = localStorage.getItem("pos_table_carts");

    if (savedConfig) setConfig(JSON.parse(savedConfig));
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedHistory) setSalesHistory(JSON.parse(savedHistory));
    if (savedCarts) setTableCarts(JSON.parse(savedCarts));
  }, []);

  const currentCart = useMemo(() => {
    return tableCarts[selectedTable] || {};
  }, [tableCarts, selectedTable]);

  const updateCurrentCart = (newCart: { [itemId: string]: number }) => {
    setTableCarts((prev) => {
      const updated = { ...prev, [selectedTable]: newCart };
      localStorage.setItem("pos_table_carts", JSON.stringify(updated));
      return updated;
    });
  };

  const addToCart = (id: string) => {
    const updated = { ...currentCart, [id]: (currentCart[id] || 0) + 1 };
    updateCurrentCart(updated);
  };

  const removeFromCart = (id: string) => {
    const currentQty = currentCart[id] || 0;
    const updated = { ...currentCart };
    if (currentQty <= 1) {
      delete updated[id];
    } else {
      updated[id] = currentQty - 1;
    }
    updateCurrentCart(updated);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("pos_config", JSON.stringify(config));
    alert("Branding configurations saved!");
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: itemName,
      price: parseFloat(itemPrice),
      category: itemCategory,
      isVeg: itemIsVeg,
    };
    const updated = [...items, newItem];
    setItems(updated);
    localStorage.setItem("pos_items", JSON.stringify(updated));
    setItemName("");
    setItemPrice("");
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    localStorage.setItem("pos_items", JSON.stringify(updated));
  };

  // Calculations for current table
  const subtotal = useMemo(() => {
    return Object.entries(currentCart).reduce((sum, [id, qty]) => {
      const item = items.find((i) => i.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }, [currentCart, items]);

  const tax = Number(((subtotal * config.taxRate) / 100).toFixed(2));
  const grandTotal = subtotal + tax;

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  // Sales Summary
  const salesSummary = useMemo(() => {
    const totalRevenue = salesHistory.reduce((sum, o) => sum + o.grandTotal, 0);
    const cashTotal = salesHistory.filter((o) => o.paymentMode === "Cash").reduce((sum, o) => sum + o.grandTotal, 0);
    const upiTotal = salesHistory.filter((o) => o.paymentMode === "UPI").reduce((sum, o) => sum + o.grandTotal, 0);
    const cardTotal = salesHistory.filter((o) => o.paymentMode === "Card").reduce((sum, o) => sum + o.grandTotal, 0);
    return { totalRevenue, cashTotal, upiTotal, cardTotal, totalOrders: salesHistory.length };
  }, [salesHistory]);

  const triggerPrint = (mode: "BILL" | "KOT") => {
    if (Object.keys(currentCart).length === 0) return;

    const billItems = Object.entries(currentCart)
      .map(([id, qty]) => {
        const item = items.find((i) => i.id === id);
        return item ? { name: item.name, price: item.price, qty } : null;
      })
      .filter(Boolean) as { name: string; price: number; qty: number }[];

    setPrintedBill({
      items: billItems,
      subtotal,
      tax,
      grandTotal,
      table: selectedTable,
      paymentMode,
    });

    setPrintMode(mode);

    setTimeout(() => {
      window.print();
      if (mode === "BILL") {
        // Record sales history
        const newRecord: SettledOrder = {
          id: `ORD-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          table: selectedTable,
          items: billItems,
          subtotal,
          tax,
          grandTotal,
          paymentMode,
        };
        const updatedHistory = [newRecord, ...salesHistory];
        setSalesHistory(updatedHistory);
        localStorage.setItem("pos_sales_history", JSON.stringify(updatedHistory));

        // Clear current table cart only
        updateCurrentCart({});
      }
    }, 200);
  };

  const handleExportBackup = () => {
    const backupData = { config, items, salesHistory };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name.toLowerCase().replace(/\s+/g, "_")}_backup.json`;
    a.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.config && data.items) {
          setConfig(data.config);
          setItems(data.items);
          if (data.salesHistory) setSalesHistory(data.salesHistory);
          localStorage.setItem("pos_config", JSON.stringify(data.config));
          localStorage.setItem("pos_items", JSON.stringify(data.items));
          if (data.salesHistory) localStorage.setItem("pos_sales_history", JSON.stringify(data.salesHistory));
          alert("Backup restored successfully!");
        }
      } catch {
        alert("Invalid backup file!");
      }
    };
    reader.readAsText(file);
  };

  if (!isClient) return null;

  return (
    <>
      {/* ================= Printable Thermal Slip (KOT or Bill) ================= */}
      <div id="thermal-receipt" className="hidden print:block p-3 max-w-[80mm] mx-auto text-black font-mono text-xs">
        <div className="text-center pb-2 border-b border-black">
          {printMode === "BILL" ? (
            <>
              {config.logoUrl && (
                <img src={config.logoUrl} alt="Logo" className="w-12 h-12 mx-auto object-contain mb-1" />
              )}
              <h2 className="text-base font-bold uppercase">{config.name}</h2>
              <p className="text-[10px]">{config.tagline}</p>
              {config.gstNumber && <p className="text-[10px]">GSTIN: {config.gstNumber}</p>}
            </>
          ) : (
            <h2 className="text-lg font-black uppercase tracking-wider">*** KITCHEN TICKET (KOT) ***</h2>
          )}
          <p className="text-[10px] mt-1">{new Date().toLocaleString()}</p>
          <div className="flex justify-between font-bold text-xs mt-1">
            <span>Order: {printedBill?.table || selectedTable}</span>
            {printMode === "BILL" && <span>Mode: {printedBill?.paymentMode}</span>}
          </div>
        </div>

        <div className="py-2 border-b border-black space-y-1">
          {printedBill?.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="font-semibold">{item.name} × {item.qty}</span>
              {printMode === "BILL" && (
                <span>{config.currency} {item.price * item.qty}</span>
              )}
            </div>
          ))}
        </div>

        {printMode === "BILL" ? (
          <>
            <div className="pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{config.currency} {printedBill?.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST/Tax ({config.taxRate}%):</span>
                <span>{config.currency} {printedBill?.tax}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                <span>Grand Total:</span>
                <span>{config.currency} {printedBill?.grandTotal}</span>
              </div>
            </div>
            <div className="text-center pt-3 border-t border-dashed border-black mt-2">
              <p className="text-[10px]">{config.footerNote}</p>
            </div>
          </>
        ) : (
          <div className="text-center pt-2 font-bold text-[11px]">
            Please prepare promptly.
          </div>
        )}
      </div>

      {/* ================= Main Web Application ================= */}
      <main className="min-h-screen bg-slate-100 text-slate-900 pb-16 print:hidden">
        {/* Dynamic Header */}
        <header
          className="p-5 text-white shadow-md transition-colors"
          style={{ backgroundColor: config.secondaryColor }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              {config.logoUrl && (
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="w-12 h-12 rounded-xl bg-white p-1 object-contain shadow-sm"
                />
              )}
              <div>
                <h1 className="text-2xl font-black tracking-tight">{config.name}</h1>
                <p className="text-xs opacity-80">{config.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportBackup}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Export Data
              </button>
              <label className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" /> Import Data
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
              <div
                className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: config.primaryColor }}
              >
                Universal POS
              </div>
            </div>
          </div>
        </header>

        {/* Daily Summary Statistics Bar */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="border-r border-slate-100 pr-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Sales</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">
                {config.currency} {salesSummary.totalRevenue}
              </p>
            </div>
            <div className="border-r border-slate-100 pr-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Orders Settled</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">
                {salesSummary.totalOrders} <span className="text-xs font-medium text-slate-500">bills</span>
              </p>
            </div>
            <div className="border-r border-slate-100 pr-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Cash In Drawer</span>
              <p className="text-xl font-black text-emerald-600 mt-0.5">
                {config.currency} {salesSummary.cashTotal}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Digital (UPI/Card)</span>
              <p className="text-xl font-black text-blue-600 mt-0.5">
                {config.currency} {salesSummary.upiTotal + salesSummary.cardTotal}
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tables, Menu & Sales Records */}
          <section className="lg:col-span-2 space-y-6">
            {/* Table Selection Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2.5">
                <UtensilsCrossed className="w-4 h-4" /> Live Tables (Select to Manage Order)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {tableList.map((tbl) => {
                  const hasActiveItems = Object.keys(tableCarts[tbl] || {}).length > 0;
                  const isSelected = selectedTable === tbl;
                  return (
                    <button
                      key={tbl}
                      onClick={() => setSelectedTable(tbl)}
                      className={`relative py-2.5 px-2 rounded-xl text-xs font-bold transition border ${
                        isSelected
                          ? "text-white border-transparent shadow-sm"
                          : hasActiveItems
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                      }`}
                      style={{
                        backgroundColor: isSelected ? config.primaryColor : undefined,
                      }}
                    >
                      {tbl}
                      {hasActiveItems && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Items Explorer */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-slate-600" /> Menu Catalog
                </h2>
                {/* Category Filter Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                        activeCategory === cat
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center ${
                          item.isVeg ? "border-green-600" : "border-red-600"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.isVeg ? "bg-green-600" : "bg-red-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {config.currency} {item.price} • {item.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => addToCart(item.id)}
                        className="px-3 py-1 text-white rounded-lg text-xs font-bold transition shadow-sm"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        + Add
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Item */}
              <form onSubmit={handleAddItem} className="mt-6 pt-4 border-t grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  placeholder="New item name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 border rounded-lg text-xs"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-xs"
                />
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="px-2 py-2 border rounded-lg text-xs bg-white"
                >
                  {categories.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setItemIsVeg(!itemIsVeg)}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold border transition ${
                      itemIsVeg ? "bg-green-50 text-green-700 border-green-300" : "bg-red-50 text-red-700 border-red-300"
                    }`}
                  >
                    {itemIsVeg ? "Veg" : "Non-Veg"}
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Orders / Sales Audit Log */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                <Receipt className="w-5 h-5 text-slate-600" /> Settled Bills History
              </h2>
              {salesHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No settled bills recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                  {salesHistory.slice(0, 10).map((record) => (
                    <div key={record.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{record.id}</span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span className="font-semibold text-slate-700">{record.table}</span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span className="text-slate-500">{record.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {record.paymentMode}
                        </span>
                        <span className="font-bold text-slate-900">
                          {config.currency} {record.grandTotal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customization & White-Label Panel */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Palette className="w-5 h-5 text-slate-600" /> White-Label Configurations
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Presets:</span>
                  {themePresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setConfig({ ...config, primaryColor: preset.primary, secondaryColor: preset.secondary })}
                      className="w-5 h-5 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: preset.primary }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Restaurant Name</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tagline</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Logo Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={config.logoUrl}
                    onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={config.gstNumber}
                    onChange={(e) => setConfig({ ...config, gstNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">GST / Tax (%)</label>
                  <input
                    type="number"
                    value={config.taxRate}
                    onChange={(e) => setConfig({ ...config, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border rounded-lg mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Currency Symbol</label>
                  <input
                    type="text"
                    value={config.currency}
                    onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg mt-1 text-xs"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Primary Accent</label>
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-full h-8 border rounded-lg mt-1 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Header Color</label>
                    <input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="w-full h-8 border rounded-lg mt-1 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Receipt Footer Note</label>
                  <input
                    type="text"
                    value={config.footerNote}
                    onChange={(e) => setConfig({ ...config, footerNote: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg mt-1 text-xs"
                  />
                </div>
                <div className="sm:col-span-3 pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex justify-center items-center gap-2 hover:bg-slate-800 transition"
                  >
                    <Save className="w-4 h-4" /> Save All Branding Configurations
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Right Column: Billing & Settle Counter */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-lg font-bold">Billing Counter</h2>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-full text-slate-800">
                {selectedTable}
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
              {Object.keys(currentCart).length === 0 ? (
                <p className="text-xs text-slate-400 py-10 text-center">
                  No items in {selectedTable}. Add items from the catalog.
                </p>
              ) : (
                Object.entries(currentCart).map(([id, qty]) => {
                  const item = items.find((i) => i.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {config.currency} {item.price} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => removeFromCart(id)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                        >
                          <Minus className="w-3 h-3 text-slate-700" />
                        </button>
                        <span className="font-bold w-4 text-center">{qty}</span>
                        <button
                          onClick={() => addToCart(id)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                        >
                          <Plus className="w-3 h-3 text-slate-700" />
                        </button>
                        <span className="font-bold ml-2 w-14 text-right">
                          {config.currency} {item.price * qty}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{config.currency} {subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST/Tax ({config.taxRate}%):</span>
                <span>{config.currency} {tax}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t text-slate-900">
                <span>Grand Total:</span>
                <span>{config.currency} {grandTotal}</span>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { mode: "Cash" as const, icon: Banknote },
                  { mode: "UPI" as const, icon: QrCode },
                  { mode: "Card" as const, icon: CreditCard },
                ].map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition ${
                      paymentMode === mode
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => triggerPrint("KOT")}
                disabled={subtotal === 0}
                className="py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-700 disabled:opacity-40 transition"
              >
                <ChefHat className="w-4 h-4" /> Print KOT
              </button>
              <button
                onClick={() => triggerPrint("BILL")}
                disabled={subtotal === 0}
                className="py-2.5 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-40 transition"
                style={{ backgroundColor: config.primaryColor }}
              >
                <Printer className="w-4 h-4" /> Settle & Bill
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
