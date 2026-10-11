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
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  Timer,
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
  upiId: string;
  footerNote: string;
}

interface KOTItem {
  id: string;
  name: string;
  qty: number;
}

interface KOTTicket {
  id: string;
  kotNumber: number;
  table: string;
  timestamp: string;
  items: KOTItem[];
  status: "Preparing" | "Ready" | "Served";
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
  upiId: "restaurant@upi",
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
  
  // Table Carts
  const [tableCarts, setTableCarts] = useState<{ [table: string]: { [itemId: string]: number } }>({});
  
  // Active KOT Tickets list (Kitchen Display System)
  const [activeKOTs, setActiveKOTs] = useState<KOTTicket[]>([]);
  const [kotCounter, setKotCounter] = useState<number>(101);

  // Billing & History
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Card">("UPI");
  const [salesHistory, setSalesHistory] = useState<SettledOrder[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<"POS" | "KITCHEN" | "HISTORY" | "SETTINGS">("POS");

  // Print States
  const [printData, setPrintData] = useState<{
    mode: "BILL" | "KOT";
    title: string;
    items: { name: string; qty: number; price?: number }[];
    subtotal?: number;
    tax?: number;
    grandTotal?: number;
    table: string;
    kotNo?: number;
    paymentMode?: string;
  } | null>(null);

  // Form State
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
    const savedKots = localStorage.getItem("pos_active_kots");
    const savedKotCounter = localStorage.getItem("pos_kot_counter");

    if (savedConfig) setConfig(JSON.parse(savedConfig));
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedHistory) setSalesHistory(JSON.parse(savedHistory));
    if (savedCarts) setTableCarts(JSON.parse(savedCarts));
    if (savedKots) setActiveKOTs(JSON.parse(savedKots));
    if (savedKotCounter) setKotCounter(parseInt(savedKotCounter));
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

  const subtotal = useMemo(() => {
    return Object.entries(currentCart).reduce((sum, [id, qty]) => {
      const item = items.find((i) => i.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }, [currentCart, items]);

  const tax = Number(((subtotal * config.taxRate) / 100).toFixed(2));
  const grandTotal = subtotal + tax;

  // Generate UPI QR Code URL
  const qrCodeUrl = useMemo(() => {
    if (!config.upiId || grandTotal <= 0) return "";
    const upiUri = `upi://pay?pa=${encodeURIComponent(config.upiId)}&pn=${encodeURIComponent(config.name)}&am=${grandTotal}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;
  }, [config.upiId, config.name, grandTotal]);

  // Handle KOT Dispatch
  const handleDispatchKOT = () => {
    if (Object.keys(currentCart).length === 0) return;

    const kotItems: KOTItem[] = Object.entries(currentCart)
      .map(([id, qty]) => {
        const item = items.find((i) => i.id === id);
        return item ? { id, name: item.name, qty } : null;
      })
      .filter(Boolean) as KOTItem[];

    const newTicket: KOTTicket = {
      id: `KOT-${Date.now().toString().slice(-6)}`,
      kotNumber: kotCounter,
      table: selectedTable,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: kotItems,
      status: "Preparing",
    };

    const nextCounter = kotCounter + 1;
    const updatedKOTs = [newTicket, ...activeKOTs];

    setActiveKOTs(updatedKOTs);
    setKotCounter(nextCounter);
    localStorage.setItem("pos_active_kots", JSON.stringify(updatedKOTs));
    localStorage.setItem("pos_kot_counter", nextCounter.toString());

    // Prepare print slip for KOT
    setPrintData({
      mode: "KOT",
      title: "KITCHEN ORDER TICKET",
      table: selectedTable,
      kotNo: kotCounter,
      items: kotItems.map((i) => ({ name: i.name, qty: i.qty })),
    });

    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Update KOT Status (Preparing -> Ready -> Served)
  const updateKOTStatus = (id: string, newStatus: "Preparing" | "Ready" | "Served") => {
    const updated = activeKOTs.map((k) => (k.id === id ? { ...k, status: newStatus } : k));
    setActiveKOTs(updated);
    localStorage.setItem("pos_active_kots", JSON.stringify(updated));
  };

  const removeKOT = (id: string) => {
    const updated = activeKOTs.filter((k) => k.id !== id);
    setActiveKOTs(updated);
    localStorage.setItem("pos_active_kots", JSON.stringify(updated));
  };

  // Settle Bill
  const handleSettleBill = () => {
    if (subtotal === 0) return;

    const billItems = Object.entries(currentCart)
      .map(([id, qty]) => {
        const item = items.find((i) => i.id === id);
        return item ? { name: item.name, price: item.price, qty } : null;
      })
      .filter(Boolean) as { name: string; price: number; qty: number }[];

    setPrintData({
      mode: "BILL",
      title: "TAX INVOICE",
      table: selectedTable,
      paymentMode,
      items: billItems,
      subtotal,
      tax,
      grandTotal,
    });

    setTimeout(() => {
      window.print();

      // Record Sales
      const newRecord: SettledOrder = {
        id: `INV-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

      // Remove active KOTs of this table once bill is cleared
      const remainingKots = activeKOTs.filter((k) => k.table !== selectedTable);
      setActiveKOTs(remainingKots);
      localStorage.setItem("pos_active_kots", JSON.stringify(remainingKots));

      // Clear current table cart
      updateCurrentCart({});
    }, 200);
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

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  const activeKOTCount = activeKOTs.filter((k) => k.status !== "Served").length;

  if (!isClient) return null;

  return (
    <>
      {/* ================= Printable Thermal Receipt / KOT ================= */}
      <div id="thermal-receipt" className="hidden print:block p-3 max-w-[80mm] mx-auto text-black font-mono text-xs">
        <div className="text-center pb-2 border-b border-black">
          {printData?.mode === "BILL" ? (
            <>
              {config.logoUrl && (
                <img src={config.logoUrl} alt="Logo" className="w-12 h-12 mx-auto object-contain mb-1" />
              )}
              <h2 className="text-base font-bold uppercase">{config.name}</h2>
              <p className="text-[10px]">{config.tagline}</p>
              {config.gstNumber && <p className="text-[10px]">GSTIN: {config.gstNumber}</p>}
            </>
          ) : (
            <>
              <h2 className="text-base font-black tracking-wider">*** KITCHEN ORDER TICKET ***</h2>
              <p className="text-sm font-extrabold mt-1">KOT #{printData?.kotNo}</p>
            </>
          )}
          <p className="text-[10px] mt-1">{new Date().toLocaleString()}</p>
          <div className="flex justify-between font-bold text-xs mt-1">
            <span>Order Type: {printData?.table}</span>
            {printData?.paymentMode && <span>Mode: {printData.paymentMode}</span>}
          </div>
        </div>

        <div className="py-2 border-b border-black space-y-1">
          {printData?.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="font-semibold">{item.name} × {item.qty}</span>
              {printData.mode === "BILL" && item.price && (
                <span>{config.currency} {item.price * item.qty}</span>
              )}
            </div>
          ))}
        </div>

        {printData?.mode === "BILL" ? (
          <>
            <div className="pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{config.currency} {printData.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST/Tax ({config.taxRate}%):</span>
                <span>{config.currency} {printData.tax}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                <span>Grand Total:</span>
                <span>{config.currency} {printData.grandTotal}</span>
              </div>
            </div>

            {config.upiId && (
              <div className="text-center pt-3 border-t border-dashed border-black mt-2">
                <p className="text-[10px] font-bold mb-1">Scan to Pay via UPI</p>
                <img src={qrCodeUrl} alt="UPI QR" className="w-24 h-24 mx-auto" />
                <p className="text-[9px] mt-0.5">{config.upiId}</p>
              </div>
            )}

            <div className="text-center pt-2 mt-1">
              <p className="text-[10px]">{config.footerNote}</p>
            </div>
          </>
        ) : (
          <div className="text-center pt-2 font-bold text-[11px]">
            Please expedite this order!
          </div>
        )}
      </div>

      {/* ================= Interactive POS System ================= */}
      <main className="min-h-screen bg-slate-100 text-slate-900 pb-16 print:hidden">
        {/* Dynamic Header */}
        <header
          className="p-4 text-white shadow-md transition-colors"
          style={{ backgroundColor: config.secondaryColor }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              {config.logoUrl && (
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="w-10 h-10 rounded-xl bg-white p-1 object-contain shadow-sm"
                />
              )}
              <div>
                <h1 className="text-xl font-black tracking-tight">{config.name}</h1>
                <p className="text-xs opacity-80">{config.tagline}</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white/10 p-1 rounded-xl text-xs font-bold gap-1">
              <button
                onClick={() => setActiveTab("POS")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "POS" ? "bg-white text-slate-900 shadow-sm" : "text-white/80 hover:text-white"
                }`}
              >
                Billing POS
              </button>
              <button
                onClick={() => setActiveTab("KITCHEN")}
                className={`relative px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === "KITCHEN" ? "bg-white text-slate-900 shadow-sm" : "text-white/80 hover:text-white"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" /> Kitchen KDS
                {activeKOTCount > 0 && (
                  <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {activeKOTCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("HISTORY")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "HISTORY" ? "bg-white text-slate-900 shadow-sm" : "text-white/80 hover:text-white"
                }`}
              >
                Orders Audit
              </button>
              <button
                onClick={() => setActiveTab("SETTINGS")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "SETTINGS" ? "bg-white text-slate-900 shadow-sm" : "text-white/80 hover:text-white"
                }`}
              >
                Settings
              </button>
            </div>
          </div>
        </header>

        {/* ================= TAB 1: MAIN BILLING POS ================= */}
        {activeTab === "POS" && (
          <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-6">
              {/* Tables State Bar */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2.5">
                  <UtensilsCrossed className="w-4 h-4" /> Tables & Orders Tracker
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {tableList.map((tbl) => {
                    const hasActiveCart = Object.keys(tableCarts[tbl] || {}).length > 0;
                    const runningKots = activeKOTs.filter((k) => k.table === tbl && k.status !== "Served");
                    const isSelected = selectedTable === tbl;

                    return (
                      <button
                        key={tbl}
                        onClick={() => setSelectedTable(tbl)}
                        className={`relative py-3 px-2 rounded-xl text-xs font-bold transition border flex flex-col items-center gap-1 ${
                          isSelected
                            ? "text-white border-transparent shadow-md"
                            : runningKots.length > 0
                            ? "bg-amber-50 text-amber-900 border-amber-300"
                            : hasActiveCart
                            ? "bg-blue-50 text-blue-900 border-blue-200"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                        }`}
                        style={{
                          backgroundColor: isSelected ? config.primaryColor : undefined,
                        }}
                      >
                        <span>{tbl}</span>
                        {runningKots.length > 0 && (
                          <span className={`text-[9px] px-1.5 rounded-md font-semibold ${isSelected ? "bg-white/20 text-white" : "bg-amber-200 text-amber-900"}`}>
                            {runningKots[0].status}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Menu Catalog */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-slate-600" /> Catalog
                  </h2>
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
                          <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {config.currency} {item.price}
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

                {/* Quick Add Custom Item */}
                <form onSubmit={handleAddItem} className="mt-6 pt-4 border-t grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    placeholder="Quick Item Name"
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
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                  >
                    Add to Menu
                  </button>
                </form>
              </div>
            </section>

            {/* Right Column: Billing Counter with Live UPI */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h2 className="text-lg font-bold">Counter Ticket</h2>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-full text-slate-800">
                  {selectedTable}
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                {Object.keys(currentCart).length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">Empty order for {selectedTable}.</p>
                ) : (
                  Object.entries(currentCart).map(([id, qty]) => {
                    const item = items.find((i) => i.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="py-2 flex justify-between items-center text-xs">
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
                  <span>Tax ({config.taxRate}%):</span>
                  <span>{config.currency} {tax}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-2 border-t text-slate-900">
                  <span>Grand Total:</span>
                  <span>{config.currency} {grandTotal}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                  Payment Mode
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
                      className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition ${
                        paymentMode === mode
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Instant UPI QR Preview */}
              {paymentMode === "UPI" && config.upiId && subtotal > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <img src={qrCodeUrl} alt="Scan QR" className="w-16 h-16 bg-white p-1 rounded-lg border shadow-sm" />
                  <div className="text-[11px]">
                    <p className="font-bold text-slate-800">Scan to Pay Exact Total</p>
                    <p className="text-slate-500">{config.upiId}</p>
                    <p className="font-black text-emerald-600 mt-0.5">{config.currency} {grandTotal}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleDispatchKOT}
                  disabled={subtotal === 0}
                  className="py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-700 disabled:opacity-40 transition shadow-sm"
                >
                  <ChefHat className="w-4 h-4" /> Dispatch KOT
                </button>
                <button
                  onClick={handleSettleBill}
                  disabled={subtotal === 0}
                  className="py-2.5 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-40 transition shadow-md"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Printer className="w-4 h-4" /> Settle & Bill
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ================= TAB 2: LIVE KITCHEN DISPLAY SYSTEM (KDS) ================= */}
        {activeTab === "KITCHEN" && (
          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ChefHat className="w-6 h-6 text-rose-600" /> Kitchen Live Display
                </h2>
                <p className="text-xs text-slate-500">Live order tickets with status management</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
                {activeKOTCount} Active Orders
              </span>
            </div>

            {activeKOTs.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">All Kitchen Tickets Cleared!</h3>
                <p className="text-xs text-slate-400 mt-1">New KOTs dispatched from POS will appear here instantly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeKOTs.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`bg-white rounded-2xl p-4 border shadow-sm transition flex flex-col justify-between ${
                      ticket.status === "Preparing"
                        ? "border-amber-400 ring-2 ring-amber-100"
                        : ticket.status === "Ready"
                        ? "border-emerald-500 ring-2 ring-emerald-100"
                        : "border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start pb-2 border-b border-slate-100 mb-3">
                        <div>
                          <span className="text-xs font-black text-slate-900">KOT #{ticket.kotNumber}</span>
                          <h4 className="text-base font-black text-slate-800">{ticket.table}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3" /> {ticket.timestamp}
                          </span>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ticket.status === "Preparing"
                                ? "bg-amber-100 text-amber-800"
                                : ticket.status === "Ready"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 pb-3">
                        {ticket.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-800">{i.name}</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-900 font-bold">
                              × {i.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      {ticket.status === "Preparing" && (
                        <button
                          onClick={() => updateKOTStatus(ticket.id, "Ready")}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                        >
                          Mark Ready
                        </button>
                      )}
                      {ticket.status === "Ready" && (
                        <button
                          onClick={() => updateKOTStatus(ticket.id, "Served")}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                        >
                          Mark Served
                        </button>
                      )}
                      <button
                        onClick={() => removeKOT(ticket.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl border border-slate-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: AUDIT & SALES SUMMARY ================= */}
        {activeTab === "HISTORY" && (
          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-600" /> Settled Invoices Audit
              </h2>
              {salesHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-10 text-center">No orders settled today.</p>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 uppercase font-bold border-b pb-2">
                        <th className="py-2">Invoice</th>
                        <th className="py-2">Time</th>
                        <th className="py-2">Table</th>
                        <th className="py-2">Items</th>
                        <th className="py-2">Payment</th>
                        <th className="py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesHistory.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">{rec.id}</td>
                          <td className="py-3 text-slate-500">{rec.timestamp}</td>
                          <td className="py-3 font-semibold text-slate-700">{rec.table}</td>
                          <td className="py-3 text-slate-600">
                            {rec.items.map((i) => `${i.name} (${i.qty})`).join(", ")}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              {rec.paymentMode}
                            </span>
                          </td>
                          <td className="py-3 text-right font-black text-slate-900">
                            {config.currency} {rec.grandTotal}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: WHITE LABEL & SETTINGS ================= */}
        {activeTab === "SETTINGS" && (
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Palette className="w-5 h-5 text-slate-600" /> Branding & UPI Setup
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Customize your receipt, theme and UPI payments</p>
                </div>
                <div className="flex gap-1.5">
                  {themePresets.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setConfig({ ...config, primaryColor: p.primary, secondaryColor: p.secondary })}
                      className="w-5 h-5 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: p.primary }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  localStorage.setItem("pos_config", JSON.stringify(config));
                  alert("Settings Saved Successfully!");
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Restaurant Name</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Tagline</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">UPI VPA (PhonePe/GPay ID)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210@ybl"
                    value={config.upiId}
                    onChange={(e) => setConfig({ ...config, upiId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1 font-semibold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={config.gstNumber}
                    onChange={(e) => setConfig({ ...config, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">GST / Tax (%)</label>
                  <input
                    type="number"
                    value={config.taxRate}
                    onChange={(e) => setConfig({ ...config, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Logo Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={config.logoUrl}
                    onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Receipt Footer Note</label>
                  <input
                    type="text"
                    value={config.footerNote}
                    onChange={(e) => setConfig({ ...config, footerNote: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                  >
                    Save All Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
