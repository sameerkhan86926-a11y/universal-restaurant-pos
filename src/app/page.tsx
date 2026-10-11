"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Save,
  Trash2,
  ShoppingBag,
  Plus,
  Minus,
  Printer,
  UtensilsCrossed,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface RestaurantConfig {
  name: string;
  tagline: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  taxRate: number;
}

const defaultConfig: RestaurantConfig = {
  name: "Universal Food Hub",
  tagline: "Fresh, Hot & Delicious",
  currency: "₹",
  primaryColor: "#e11d48",
  secondaryColor: "#0f172a",
  taxRate: 5,
};

export default function UniversalPOS() {
  const [config, setConfig] = useState<RestaurantConfig>(defaultConfig);
  const [items, setItems] = useState<MenuItem[]>([
    { id: "1", name: "Special Burger", price: 120 },
    { id: "2", name: "Crispy French Fries", price: 80 },
    { id: "3", name: "Cold Coffee", price: 60 },
  ]);
  const [selectedTable, setSelectedTable] = useState<string>("Table 1");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedConfig = localStorage.getItem("pos_config");
    const savedItems = localStorage.getItem("pos_items");
    if (savedConfig) setConfig(JSON.parse(savedConfig));
    if (savedItems) setItems(JSON.parse(savedItems));
  }, []);

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("pos_config", JSON.stringify(config));
    alert("Restaurant customization saved successfully!");
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    const updated = [
      ...items,
      {
        id: Date.now().toString(),
        name: newItemName,
        price: parseFloat(newItemPrice),
      },
    ];
    setItems(updated);
    localStorage.setItem("pos_items", JSON.stringify(updated));
    setNewItemName("");
    setNewItemPrice("");
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

  const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = items.find((i) => i.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const tax = Number(((subtotal * config.taxRate) / 100).toFixed(2));
  const grandTotal = subtotal + tax;

  const handlePrint = () => {
    if (subtotal === 0) return;
    window.print();
    setCart({});
  };

  if (!isClient) return null;

  return (
    <>
      {/* ================= Printable Thermal Receipt (Visible only on window.print) ================= */}
      <div id="thermal-receipt" className="hidden print:block p-4 max-w-[80mm] mx-auto text-black font-mono text-xs">
        <div className="text-center pb-2 border-b border-black">
          <h2 className="text-base font-bold uppercase">{config.name}</h2>
          <p className="text-[10px]">{config.tagline}</p>
          <p className="text-[10px] mt-1">{new Date().toLocaleString()}</p>
          <p className="font-bold text-xs mt-0.5">Order: {selectedTable}</p>
        </div>

        <div className="py-2 border-b border-black space-y-1">
          {Object.entries(cart).map(([id, qty]) => {
            const item = items.find((i) => i.id === id);
            if (!item) return null;
            return (
              <div key={id} className="flex justify-between">
                <span>{item.name} × {qty}</span>
                <span>{config.currency} {item.price * qty}</span>
              </div>
            );
          })}
        </div>

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

        <div className="text-center pt-4 border-t border-dashed border-black mt-2">
          <p>Thank You! Visit Again.</p>
        </div>
      </div>

      {/* ================= Main Interactive POS Screen ================= */}
      <main className="min-h-screen bg-slate-50 text-slate-900 pb-12 print:hidden">
        {/* Dynamic Header */}
        <header
          className="p-6 text-white shadow-md transition-colors"
          style={{ backgroundColor: config.secondaryColor }}
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{config.name}</h1>
              <p className="text-sm opacity-80">{config.tagline}</p>
            </div>
            <div
              className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: config.primaryColor }}
            >
              Universal POS Live
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tables & Menu */}
          <section className="lg:col-span-2 space-y-6">
            {/* Table Selection Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                <UtensilsCrossed className="w-4 h-4" /> Select Table / Order Type
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                {["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Table 6", "Parcel"].map(
                  (tbl) => (
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
                  )
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-slate-600" /> Menu Items
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50 hover:border-slate-300 transition"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm font-medium text-slate-600">
                        {config.currency} {item.price}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => addToCart(item.id)}
                        className="px-3.5 py-1.5 text-white rounded-lg text-sm font-semibold transition"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        + Add
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item Form */}
              <form onSubmit={handleAddItem} className="mt-6 pt-4 border-t flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1 min-w-[140px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-24 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                >
                  Add Item
                </button>
              </form>
            </div>

            {/* Customization Settings Form */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-slate-600" /> Theme & Branding Settings
              </h2>
              <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Restaurant Name</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Tagline</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Tax / GST (%)</label>
                  <input
                    type="number"
                    value={config.taxRate}
                    onChange={(e) => setConfig({ ...config, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Currency</label>
                  <input
                    type="text"
                    value={config.currency}
                    onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Primary Accent</label>
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="w-full h-9 border rounded-lg mt-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Header Color</label>
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                    className="w-full h-9 border rounded-lg mt-1 cursor-pointer"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold flex justify-center items-center gap-2 hover:bg-slate-800 transition"
                  >
                    <Save className="w-4 h-4" /> Save Branding & Taxes
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Right Column: Billing Counter */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-xl font-bold">Counter Bill</h2>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-full text-slate-700">
                {selectedTable}
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {Object.keys(cart).length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No items added to cart</p>
              ) : (
                Object.entries(cart).map(([id, qty]) => {
                  const item = items.find((i) => i.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="py-2.5 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {config.currency} {item.price} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(id)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                        >
                          <Minus className="w-3.5 h-3.5 text-slate-700" />
                        </button>
                        <span className="font-bold w-4 text-center">{qty}</span>
                        <button
                          onClick={() => addToCart(id)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-700" />
                        </button>
                        <span className="font-semibold ml-2 w-16 text-right">
                          {config.currency} {item.price * qty}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{config.currency} {subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST/Tax ({config.taxRate}%):</span>
                <span>{config.currency} {tax}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t text-slate-900">
                <span>Grand Total:</span>
                <span>{config.currency} {grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handlePrint}
              disabled={subtotal === 0}
              className="w-full py-3 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ backgroundColor: config.primaryColor }}
            >
              <Printer className="w-5 h-5" /> Print Thermal Receipt
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
