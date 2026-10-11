"use client";

import React, { useState, useEffect } from "react";
import { Store, Palette, Save, Plus, Trash2, ShoppingBag } from "lucide-react";

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
}

const defaultConfig: RestaurantConfig = {
  name: "Universal Food Hub",
  tagline: "Fresh, Hot & Delicious",
  currency: "₹",
  primaryColor: "#e11d48",
  secondaryColor: "#0f172a",
};

export default function UniversalPOS() {
  const [config, setConfig] = useState<RestaurantConfig>(defaultConfig);
  const [items, setItems] = useState<MenuItem[]>([
    { id: "1", name: "Special Burger", price: 120 },
    { id: "2", name: "Crispy French Fries", price: 80 },
  ]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  // Load from local storage
  useEffect(() => {
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
    const updated = [...items, { id: Date.now().toString(), name: newItemName, price: parseFloat(newItemPrice) }];
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

  const calculateTotal = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = items.find((i) => i.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  };

  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900 pb-12"
      style={{
        ["--primary" as string]: config.primaryColor,
        ["--secondary" as string]: config.secondaryColor,
      }}
    >
      {/* Dynamic Header */}
      <header className="p-6 text-white shadow-md transition-colors" style={{ backgroundColor: config.secondaryColor }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{config.name}</h1>
            <p className="text-sm opacity-80">{config.tagline}</p>
          </div>
          <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: config.primaryColor }}>
            Universal POS Live
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Menu Ordering */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-slate-600" /> Menu Items
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <div key={item.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-slate-600">
                      {config.currency} {item.price}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(item.id)}
                      className="px-3 py-1.5 text-white rounded-lg text-sm font-semibold transition"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      + Add
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-600">
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
                className="flex-1 min-w-[140px] px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Price"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-24 px-3 py-2 border rounded-lg text-sm"
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
            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="text-xs font-semibold text-slate-500 uppercase">Currency</label>
                <input
                  type="text"
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg mt-1 text-sm"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Primary Color</label>
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="w-full h-9 border rounded-lg mt-1 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Header Color</label>
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                    className="w-full h-9 border rounded-lg mt-1 cursor-pointer"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold flex justify-center items-center gap-2 hover:bg-slate-800"
                >
                  <Save className="w-4 h-4" /> Save Branding
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Right Column: Billing Counter */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">Counter Bill</h2>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {Object.keys(cart).length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">Cart is empty</p>
            ) : (
              Object.entries(cart).map(([id, qty]) => {
                const item = items.find((i) => i.id === id);
                if (!item) return null;
                return (
                  <div key={id} className="py-2.5 flex justify-between text-sm">
                    <span>
                      {item.name} × {qty}
                    </span>
                    <span className="font-semibold">
                      {config.currency} {item.price * qty}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t pt-3 flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>
              {config.currency} {calculateTotal()}
            </span>
          </div>

          <button
            onClick={() => {
              if (calculateTotal() === 0) return;
              alert(`Bill Generated: ${config.currency}${calculateTotal()}`);
              setCart({});
            }}
            className="w-full py-3 text-white rounded-xl font-bold shadow-md transition"
            style={{ backgroundColor: config.primaryColor }}
          >
            Print & Settle Bill
          </button>
        </section>
      </div>
    </main>
  );
}
