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
  CircleDot,
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

const themePresets = [
  { name: "Crimson Red", primary: "#e11d48", secondary: "#0f172a" },
  { name: "Midnight Teal", primary: "#0d9488", secondary: "#111827" },
  { name: "Royal Amber", primary: "#d97706", secondary: "#1c1917" },
  { name: "Emerald Green", primary: "#16a34a", secondary: "#064e3b" },
];

const categories = ["All", "Fast Food", "Main Course", "Beverages", "Desserts"];

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
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [printMode, setPrintMode] = useState<"BILL" | "KOT">("BILL");
  const [isClient, setIsClient] = useState(false);

  // New Item Form State
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Fast Food");
  const [itemIsVeg, setItemIsVeg] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const savedConfig = localStorage.getItem("pos_config");
    const savedItems = localStorage.getItem("pos_items");
    if (savedConfig) setConfig(JSON.parse(savedConfig));
    if (savedItems) setItems(JSON.parse(savedItems));
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("pos_config", JSON.stringify(config));
    alert("Branding & Restaurant profile saved!");
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

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  // Calculations
  const subtotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = items.find((i) => i.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }, [cart, items]);

  const tax = Number(((subtotal * config.taxRate) / 100).toFixed(2));
  const grandTotal = subtotal + tax;

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  const triggerPrint = (mode: "BILL" | "KOT") => {
    if (Object.keys(cart).length === 0) return;
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      if (mode === "BILL") {
        setCart({});
      }
    }, 100);
  };

  // Backup Import & Export
  const handleExportBackup = () => {
    const backupData = { config, items };
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
          localStorage.setItem("pos_config", JSON.stringify(data.config));
          localStorage.setItem("pos_items", JSON.stringify(data.items));
          alert("Backup data restored successfully!");
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
          <p className="font-bold text-xs mt-0.5">Order Type: {selectedTable}</p>
        </div>

        <div className="py-2 border-b border-black space-y-1">
          {Object.entries(cart).map(([id, qty]) => {
            const item = items.find((i) => i.id === id);
            if (!item) return null;
            return (
              <div key={id} className="flex justify-between items-center">
                <span className="font-semibold">{item.name} × {qty}</span>
                {printMode === "BILL" && (
                  <span>{config.currency} {item.price * qty}</span>
                )}
              </div>
            );
          })}
        </div>

        {printMode === "BILL" ? (
          <>
            <div className="pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{config.currency} {subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST/Tax ({config.taxRate}%):</span>
                <span>{config.currency} {tax}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                <span>Grand Total:</span>
                <span>{config.currency} {grandTotal}</span>
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

        <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Operations & Menu */}
          <section className="lg:col-span-2 space-y-6">
            {/* Table Selection Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2.5">
                <UtensilsCrossed className="w-4 h-4" /> Select Table / Counter
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Table 6", "Parcel"].map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => setSelectedTable(tbl)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
                      selectedTable === tbl
                        ? "text-white border-transparent shadow-sm"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    style={{
                      backgroundColor: selectedTable === tbl ? config.primaryColor : undefined,
                    }}
                  >
                    {tbl}
                  </button>
                ))}
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
                        title={item.isVeg ? "Pure Veg" : "Non-Veg"}
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

              {/* Add New Item Section */}
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

            {/* Customization & White-Label Panel */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Palette className="w-5 h-5 text-slate-600" /> White-Label Settings
                </h2>
                {/* Theme Presets */}
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

          {/* Right Column: Billing & KOT Counter */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-lg font-bold">Current Order</h2>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-full text-slate-800">
                {selectedTable}
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {Object.keys(cart).length === 0 ? (
                <p className="text-xs text-slate-400 py-10 text-center">Cart is empty. Select items to order.</p>
              ) : (
                Object.entries(cart).map(([id, qty]) => {
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

            {/* Print Action Buttons */}
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
