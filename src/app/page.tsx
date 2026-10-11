"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  UtensilsCrossed,
  Boxes,
  Receipt,
  Users,
  Wallet,
  Settings,
  Plus,
  Minus,
  Trash2,
  Printer,
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  DollarSign,
  Download,
  Upload,
  UserCheck,
  PauseCircle,
  PlayCircle,
  Percent,
  Calendar,
} from "lucide-react";

// ================= TYPES & INTERFACES =================
export type UserRole = "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "CHEF" | "ACCOUNTANT";

export interface ItemVariant {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  isVeg: boolean;
  variants?: ItemVariant[];
  addons?: { name: string; price: number }[];
  recipe?: { ingredientId: string; qty: number }[]; // For auto-inventory deduction
}

export interface CartItem {
  cartId: string;
  itemId: string;
  name: string;
  variantName?: string;
  price: number;
  qty: number;
  selectedAddons?: string[];
  notes?: string;
}

export interface TableInfo {
  id: string;
  name: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "BILLED" | "CLEANING";
  occupiedSince?: string;
  activeCart: CartItem[];
  heldOrder?: CartItem[];
  customerName?: string;
  customerPhone?: string;
}

export interface KOTTicket {
  id: string;
  kotNo: number;
  table: string;
  timestamp: string;
  items: { name: string; qty: number; notes?: string }[];
  status: "PREPARING" | "READY" | "SERVED";
}

export interface ExpenseRecord {
  id: string;
  date: string;
  title: string;
  category: "Rent" | "Raw Material" | "Electricity & Gas" | "Salaries" | "Maintenance" | "Misc";
  amount: number;
  paymentMode: string;
  staff: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: "kg" | "g" | "l" | "ml" | "pcs";
  currentStock: number;
  minStockLevel: number;
  costPerUnit: number;
}

export interface CustomerProfile {
  phone: string;
  name: string;
  totalSpent: number;
  visits: number;
  creditBalance: number; // Udhar
}

export interface SettledInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  table: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  paymentMode: "Cash" | "UPI" | "Card" | "Credit" | "Split";
  splitDetails?: { cash: number; online: number };
  cashier: string;
}

export interface RestaurantBranding {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  gstNumber: string;
  fssaiNumber: string;
  upiId: string;
  currency: string;
  taxRate: number; // e.g. 5 for 2.5% CGST + 2.5% SGST
  primaryColor: string;
  secondaryColor: string;
  footerNote: string;
}

// ================= DEFAULT SYSTEM DATA =================
const defaultBranding: RestaurantBranding = {
  name: "The Royal Crown Bistro & Cafe",
  tagline: "Fine Dine & Artisan Coffee",
  address: "Plot 42, Metro Commercial Hub, New Delhi",
  phone: "+91 98765 43210",
  gstNumber: "07AAAAA0000A1Z5",
  fssaiNumber: "10020011000456",
  upiId: "royalbistro@upi",
  currency: "₹",
  taxRate: 5,
  primaryColor: "#e11d48",
  secondaryColor: "#0f172a",
  footerNote: "GST Registered. Thank you for dining with us!",
};

const defaultTables: TableInfo[] = [
  { id: "t1", name: "Table 1 (Window)", capacity: 2, status: "AVAILABLE", activeCart: [] },
  { id: "t2", name: "Table 2 (Booth)", capacity: 4, status: "AVAILABLE", activeCart: [] },
  { id: "t3", name: "Table 3 (Family)", capacity: 6, status: "AVAILABLE", activeCart: [] },
  { id: "t4", name: "Table 4 (Center)", capacity: 4, status: "AVAILABLE", activeCart: [] },
  { id: "t5", name: "Table 5 (Terrace)", capacity: 2, status: "AVAILABLE", activeCart: [] },
  { id: "t6", name: "Table 6 (VIP Lounge)", capacity: 8, status: "AVAILABLE", activeCart: [] },
  { id: "t7", name: "Parcel Counter 1", capacity: 1, status: "AVAILABLE", activeCart: [] },
  { id: "t8", name: "Parcel Counter 2", capacity: 1, status: "AVAILABLE", activeCart: [] },
];

const defaultInventory: InventoryItem[] = [
  { id: "inv-1", name: "Paneer (Fresh)", unit: "kg", currentStock: 8.5, minStockLevel: 3.0, costPerUnit: 340 },
  { id: "inv-2", name: "Chicken Breast", unit: "kg", currentStock: 12.0, minStockLevel: 5.0, costPerUnit: 220 },
  { id: "inv-3", name: "Basmati Rice", unit: "kg", currentStock: 25.0, minStockLevel: 10.0, costPerUnit: 90 },
  { id: "inv-4", name: "Cooking Oil / Ghee", unit: "l", currentStock: 14.0, minStockLevel: 5.0, costPerUnit: 140 },
  { id: "inv-5", name: "Coffee Beans", unit: "kg", currentStock: 1.8, minStockLevel: 2.0, costPerUnit: 850 },
  { id: "inv-6", name: "Full Cream Milk", unit: "l", currentStock: 6.0, minStockLevel: 10.0, costPerUnit: 64 },
];

const defaultMenu: MenuItem[] = [
  {
    id: "m1",
    name: "Butter Paneer Masala",
    category: "Main Course",
    basePrice: 260,
    isVeg: true,
    variants: [
      { name: "Half", price: 160 },
      { name: "Full", price: 260 },
    ],
    addons: [{ name: "Extra Butter Cube", price: 25 }],
    recipe: [{ ingredientId: "inv-1", qty: 0.2 }],
  },
  {
    id: "m2",
    name: "Royal Chicken Dum Biryani",
    category: "Main Course",
    basePrice: 320,
    isVeg: false,
    variants: [
      { name: "Single Pot", price: 220 },
      { name: "Family Handi", price: 420 },
    ],
    addons: [{ name: "Extra Salan", price: 30 }, { name: "Boiled Egg (2)", price: 40 }],
    recipe: [{ ingredientId: "inv-2", qty: 0.25 }, { ingredientId: "inv-3", qty: 0.2 }],
  },
  {
    id: "m3",
    name: "Crispy Cheese Burger",
    category: "Fast Food",
    basePrice: 139,
    isVeg: true,
    addons: [{ name: "Extra Cheddar Slice", price: 30 }, { name: "French Fries Combo", price: 60 }],
  },
  {
    id: "m4",
    name: "Artisan Cappuccino",
    category: "Beverages",
    basePrice: 120,
    isVeg: true,
    variants: [
      { name: "Regular", price: 120 },
      { name: "Large Grande", price: 160 },
    ],
    addons: [{ name: "Hazelnut Syrup", price: 35 }, { name: "Extra Espresso Shot", price: 40 }],
    recipe: [{ ingredientId: "inv-5", qty: 0.02 }, { ingredientId: "inv-6", qty: 0.2 }],
  },
  {
    id: "m5",
    name: "Sizzling Brownie with Ice Cream",
    category: "Desserts",
    basePrice: 150,
    isVeg: true,
  },
];

// ================= MAIN SYSTEM COMPONENT =================
export default function UltimateRestaurantPOS() {
  const [isClient, setIsClient] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("OWNER");
  const [activeModule, setActiveModule] = useState<
    "DASHBOARD" | "POS" | "TABLES" | "KDS" | "INVENTORY" | "EXPENSES" | "CUSTOMERS" | "AUDIT" | "SETTINGS"
  >("POS");

  // State collections
  const [branding, setBranding] = useState<RestaurantBranding>(defaultBranding);
  const [tables, setTables] = useState<TableInfo[]>(defaultTables);
  const [menu, setMenu] = useState<MenuItem[]>(defaultMenu);
  const [inventory, setInventory] = useState<InventoryItem[]>(defaultInventory);
  const [activeKOTs, setActiveKOTs] = useState<KOTTicket[]>([]);
  const [kotSequence, setKotSequence] = useState<number>(101);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([
    { phone: "9876500001", name: "Rahul Sharma", totalSpent: 4200, visits: 6, creditBalance: 0 },
    { phone: "9876500002", name: "Ananya Gupta", totalSpent: 1850, visits: 2, creditBalance: 350 },
  ]);
  const [invoices, setInvoices] = useState<SettledInvoice[]>([]);

  // POS Interaction States
  const [selectedTableId, setSelectedTableId] = useState<string>("t1");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFlat, setDiscountFlat] = useState<number>(0);
  const [activePaymentMode, setActivePaymentMode] = useState<"Cash" | "UPI" | "Card" | "Credit" | "Split">("UPI");
  const [splitCashAmount, setSplitCashAmount] = useState<string>("");
  const [splitOnlineAmount, setSplitOnlineAmount] = useState<string>("");
  const [customerPhoneInput, setCustomerPhoneInput] = useState("");
  const [customerNameInput, setCustomerNameInput] = useState("");

  // Print Snapshot State
  const [printInvoiceData, setPrintInvoiceData] = useState<SettledInvoice | null>(null);
  const [printKOTData, setPrintKOTData] = useState<KOTTicket | null>(null);

  // LocalStorage Sync
  useEffect(() => {
    setIsClient(true);
    const getSaved = (k: string) => localStorage.getItem(k);
    if (getSaved("rms_branding")) setBranding(JSON.parse(getSaved("rms_branding")!));
    if (getSaved("rms_tables")) setTables(JSON.parse(getSaved("rms_tables")!));
    if (getSaved("rms_menu")) setMenu(JSON.parse(getSaved("rms_menu")!));
    if (getSaved("rms_inventory")) setInventory(JSON.parse(getSaved("rms_inventory")!));
    if (getSaved("rms_kots")) setActiveKOTs(JSON.parse(getSaved("rms_kots")!));
    if (getSaved("rms_expenses")) setExpenses(JSON.parse(getSaved("rms_expenses")!));
    if (getSaved("rms_customers")) setCustomers(JSON.parse(getSaved("rms_customers")!));
    if (getSaved("rms_invoices")) setInvoices(JSON.parse(getSaved("rms_invoices")!));
    if (getSaved("rms_kot_seq")) setKotSequence(parseInt(getSaved("rms_kot_seq")!));
  }, []);

  const saveToDisk = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Active Selected Table & Cart
  const currentTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0];
  }, [tables, selectedTableId]);

  const updateCurrentTableCart = (newCart: CartItem[]) => {
    const updated = tables.map((t) => {
      if (t.id === selectedTableId) {
        return {
          ...t,
          activeCart: newCart,
          status: newCart.length > 0 ? ("OCCUPIED" as const) : ("AVAILABLE" as const),
          occupiedSince: newCart.length > 0 && !t.occupiedSince ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : t.occupiedSince,
          customerName: customerNameInput || t.customerName,
          customerPhone: customerPhoneInput || t.customerPhone,
        };
      }
      return t;
    });
    setTables(updated);
    saveToDisk("rms_tables", updated);
  };

  // Add Item to Cart (Handles Variants & Add-ons)
  const addItemToCart = (item: MenuItem, variant?: ItemVariant, addon?: { name: string; price: number }) => {
    const price = variant ? variant.price : item.basePrice;
    const variantName = variant ? variant.name : undefined;
    const cartId = `${item.id}-${variantName || "base"}`;

    const existingIndex = currentTable.activeCart.findIndex((ci) => ci.cartId === cartId);
    let updatedCart = [...currentTable.activeCart];

    if (existingIndex > -1) {
      updatedCart[existingIndex].qty += 1;
    } else {
      updatedCart.push({
        cartId,
        itemId: item.id,
        name: item.name,
        variantName,
        price,
        qty: 1,
        selectedAddons: addon ? [addon.name] : [],
      });
    }

    updateCurrentTableCart(updatedCart);
  };

  const updateCartQty = (cartId: string, delta: number) => {
    let updatedCart = currentTable.activeCart
      .map((ci) => {
        if (ci.cartId === cartId) {
          const newQ = ci.qty + delta;
          return newQ > 0 ? { ...ci, qty: newQ } : null;
        }
        return ci;
      })
      .filter(Boolean) as CartItem[];

    updateCurrentTableCart(updatedCart);
  };

  // Bill Calculations
  const cartSubtotal = useMemo(() => {
    return currentTable.activeCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [currentTable.activeCart]);

  const discountAmount = useMemo(() => {
    if (discountPercent > 0) return (cartSubtotal * discountPercent) / 100;
    return Math.min(discountFlat, cartSubtotal);
  }, [cartSubtotal, discountPercent, discountFlat]);

  const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
  const halfTaxRate = branding.taxRate / 2;
  const cgstAmount = Number(((taxableAmount * halfTaxRate) / 100).toFixed(2));
  const sgstAmount = Number(((taxableAmount * halfTaxRate) / 100).toFixed(2));
  const finalPayable = Math.round(taxableAmount + cgstAmount + sgstAmount);

  // Dynamic UPI URL
  const upiQrUrl = useMemo(() => {
    if (!branding.upiId || finalPayable <= 0) return "";
    const upiUri = `upi://pay?pa=${encodeURIComponent(branding.upiId)}&pn=${encodeURIComponent(branding.name)}&am=${finalPayable}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUri)}`;
  }, [branding.upiId, branding.name, finalPayable]);

  // Dispatch Kitchen Order Ticket (KOT)
  const dispatchKOT = () => {
    if (currentTable.activeCart.length === 0) return;

    const newKOT: KOTTicket = {
      id: `KOT-${Date.now().toString().slice(-6)}`,
      kotNo: kotSequence,
      table: currentTable.name,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: currentTable.activeCart.map((i) => ({
        name: i.variantName ? `${i.name} (${i.variantName})` : i.name,
        qty: i.qty,
        notes: i.notes,
      })),
      status: "PREPARING",
    };

    const updatedKots = [newKOT, ...activeKOTs];
    const nextSeq = kotSequence + 1;
    setActiveKOTs(updatedKots);
    setKotSequence(nextSeq);
    saveToDisk("rms_kots", updatedKots);
    saveToDisk("rms_kot_seq", nextSeq);

    setPrintKOTData(newKOT);
    setPrintInvoiceData(null);
    setTimeout(() => window.print(), 150);
  };

  // Settle Bill & Auto-Deduct Inventory
  const settleBill = () => {
    if (cartSubtotal === 0) return;

    const invoice: SettledInvoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      invoiceNo: `RCB/${new Date().getFullYear()}/${(invoices.length + 1).toString().padStart(4, "0")}`,
      date: new Date().toLocaleString(),
      table: currentTable.name,
      customerName: customerNameInput || currentTable.customerName || "Walk-in Guest",
      customerPhone: customerPhoneInput || currentTable.customerPhone,
      items: currentTable.activeCart,
      subtotal: cartSubtotal,
      discount: discountAmount,
      cgst: cgstAmount,
      sgst: sgstAmount,
      grandTotal: finalPayable,
      paymentMode: activePaymentMode,
      splitDetails:
        activePaymentMode === "Split"
          ? { cash: parseFloat(splitCashAmount) || 0, online: parseFloat(splitOnlineAmount) || 0 }
          : undefined,
      cashier: currentUserRole,
    };

    // Auto Recipe Inventory Deduction
    let updatedInventory = [...inventory];
    currentTable.activeCart.forEach((cItem) => {
      const originalMenu = menu.find((m) => m.id === cItem.itemId);
      if (originalMenu?.recipe) {
        originalMenu.recipe.forEach((rec) => {
          const invIdx = updatedInventory.findIndex((inv) => inv.id === rec.ingredientId);
          if (invIdx > -1) {
            const deducted = updatedInventory[invIdx].currentStock - rec.qty * cItem.qty;
            updatedInventory[invIdx].currentStock = Math.max(0, parseFloat(deducted.toFixed(2)));
          }
        });
      }
    });
    setInventory(updatedInventory);
    saveToDisk("rms_inventory", updatedInventory);

    // Update Customer CRM
    if (customerPhoneInput) {
      const existingCust = customers.find((c) => c.phone === customerPhoneInput);
      let updatedCustList = [...customers];
      if (existingCust) {
        existingCust.totalSpent += finalPayable;
        existingCust.visits += 1;
        if (activePaymentMode === "Credit") existingCust.creditBalance += finalPayable;
      } else {
        updatedCustList.push({
          phone: customerPhoneInput,
          name: customerNameInput || "Guest",
          totalSpent: finalPayable,
          visits: 1,
          creditBalance: activePaymentMode === "Credit" ? finalPayable : 0,
        });
      }
      setCustomers(updatedCustList);
      saveToDisk("rms_customers", updatedCustList);
    }

    // Save Invoice
    const updatedInvoices = [invoice, ...invoices];
    setInvoices(updatedInvoices);
    saveToDisk("rms_invoices", updatedInvoices);

    // Free the Table
    const updatedTables = tables.map((t) => {
      if (t.id === selectedTableId) {
        return {
          ...t,
          status: "AVAILABLE" as const,
          activeCart: [],
          occupiedSince: undefined,
          customerName: undefined,
          customerPhone: undefined,
        };
      }
      return t;
    });
    setTables(updatedTables);
    saveToDisk("rms_tables", updatedTables);

    // Trigger Print
    setPrintInvoiceData(invoice);
    setPrintKOTData(null);
    setDiscountPercent(0);
    setDiscountFlat(0);
    setCustomerNameInput("");
    setCustomerPhoneInput("");

    setTimeout(() => window.print(), 150);
  };

  // Calculations for Executive Dashboard
  const dashboardStats = useMemo(() => {
    const totalSales = invoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const cashSales = invoices.filter((i) => i.paymentMode === "Cash").reduce((s, i) => s + i.grandTotal, 0);
    const upiSales = invoices.filter((i) => i.paymentMode === "UPI").reduce((s, i) => s + i.grandTotal, 0);
    const cardSales = invoices.filter((i) => i.paymentMode === "Card").reduce((s, i) => s + i.grandTotal, 0);
    const creditSales = invoices.filter((i) => i.paymentMode === "Credit").reduce((s, i) => s + i.grandTotal, 0);
    const occupiedTables = tables.filter((t) => t.status === "OCCUPIED").length;
    const lowStockCount = inventory.filter((i) => i.currentStock <= i.minStockLevel).length;

    return {
      totalSales,
      totalExpense,
      netProfit: totalSales - totalExpense,
      totalOrders: invoices.length,
      cashSales,
      upiSales,
      cardSales,
      creditSales,
      occupiedTables,
      tableOccupancyRate: Math.round((occupiedTables / tables.length) * 100),
      lowStockCount,
    };
  }, [invoices, expenses, tables, inventory]);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(menu.map((m) => m.category)))];
  }, [menu]);

  const filteredMenuItems = useMemo(() => {
    return menu.filter((m) => {
      const matchCat = selectedCategory === "All" || m.category === selectedCategory;
      const matchQuery = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [menu, selectedCategory, searchQuery]);

  if (!isClient) return null;

  return (
    <>
      {/* =========================================================================
          PRINT ONLY THERMAL SLIP ENGINE (Invoice & KOT)
      ========================================================================= */}
      <div id="thermal-receipt" className="hidden print:block p-2 max-w-[80mm] mx-auto text-black font-mono text-[11px] leading-tight">
        {printInvoiceData && (
          <div className="space-y-1.5">
            <div className="text-center border-b pb-2 border-black">
              <h2 className="text-sm font-black uppercase">{branding.name}</h2>
              <p className="text-[9px]">{branding.tagline}</p>
              <p className="text-[9px]">{branding.address}</p>
              <p className="text-[9px]">Ph: {branding.phone}</p>
              {branding.gstNumber && <p className="text-[9px] font-bold">GSTIN: {branding.gstNumber}</p>}
              {branding.fssaiNumber && <p className="text-[9px]">FSSAI: {branding.fssaiNumber}</p>}
            </div>

            <div className="flex justify-between text-[10px] pt-1 border-b border-black pb-1">
              <div>
                <p><span className="font-bold">Bill No:</span> {printInvoiceData.invoiceNo}</p>
                <p><span className="font-bold">Table:</span> {printInvoiceData.table}</p>
                {printInvoiceData.customerName && <p><span className="font-bold">Guest:</span> {printInvoiceData.customerName}</p>}
              </div>
              <div className="text-right">
                <p>{printInvoiceData.date.split(",")[0]}</p>
                <p>{printInvoiceData.date.split(",")[1]}</p>
                <p className="font-bold">Mode: {printInvoiceData.paymentMode}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="w-full text-left text-[10px] pt-1">
              <thead>
                <tr className="border-b border-black font-bold">
                  <th className="py-0.5">Item</th>
                  <th className="text-center py-0.5">Qty</th>
                  <th className="text-right py-0.5">Rate</th>
                  <th className="text-right py-0.5">Amt</th>
                </tr>
              </thead>
              <tbody>
                {printInvoiceData.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-dashed border-slate-300">
                    <td className="py-1">
                      {it.name} {it.variantName && `(${it.variantName})`}
                    </td>
                    <td className="text-center py-1 font-bold">{it.qty}</td>
                    <td className="text-right py-1">{it.price}</td>
                    <td className="text-right py-1 font-bold">{it.price * it.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations */}
            <div className="pt-1.5 space-y-0.5 text-[10px] border-t border-black">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{branding.currency} {printInvoiceData.subtotal}</span>
              </div>
              {printInvoiceData.discount > 0 && (
                <div className="flex justify-between font-semibold text-red-600">
                  <span>Discount:</span>
                  <span>- {branding.currency} {printInvoiceData.discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CGST ({branding.taxRate / 2}%):</span>
                <span>{branding.currency} {printInvoiceData.cgst}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST ({branding.taxRate / 2}%):</span>
                <span>{branding.currency} {printInvoiceData.sgst}</span>
              </div>
              <div className="flex justify-between text-xs font-black pt-1 border-t border-black">
                <span>NET PAYABLE:</span>
                <span>{branding.currency} {printInvoiceData.grandTotal}</span>
              </div>
            </div>

            {/* Dynamic UPI QR Code on Bill */}
            {branding.upiId && (
              <div className="text-center pt-2 border-t border-dashed border-black mt-2">
                <p className="text-[9px] font-bold">Scan to Pay via PhonePe / GPay / Paytm</p>
                <img src={upiQrUrl} alt="UPI QR" className="w-24 h-24 mx-auto my-1" />
                <p className="text-[8px]">{branding.upiId}</p>
              </div>
            )}

            <div className="text-center pt-2 border-t border-black text-[9px]">
              <p>{branding.footerNote}</p>
            </div>
          </div>
        )}

        {printKOTData && (
          <div className="space-y-2 text-center">
            <div className="border-b-2 border-black pb-2">
              <h2 className="text-sm font-black uppercase">*** KITCHEN ORDER TICKET (KOT) ***</h2>
              <p className="text-xs font-extrabold mt-0.5">KOT #{printKOTData.kotNo}</p>
              <p className="text-xs font-black mt-1">TABLE: {printKOTData.table}</p>
              <p className="text-[9px]">{printKOTData.timestamp}</p>
            </div>

            <table className="w-full text-left text-xs my-2">
              <thead>
                <tr className="border-b border-black font-black">
                  <th className="py-1">Ordered Item</th>
                  <th className="text-right py-1">Qty</th>
                </tr>
              </thead>
              <tbody>
                {printKOTData.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-dashed border-slate-400">
                    <td className="py-1.5 font-bold">{it.name}</td>
                    <td className="text-right py-1.5 font-black text-sm">× {it.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-2 border-t border-black text-[10px] font-bold">
              Dispatch to Kitchen Line Immediately
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MAIN INTERACTIVE SAAS APPLICATION (SCREEN VIEW)
      ========================================================================= */}
      <div className="min-h-screen bg-slate-100 flex flex-col print:hidden font-sans text-slate-900">
        {/* Top Executive Navigation Bar */}
        <header
          className="px-5 py-3 text-white flex justify-between items-center shadow-lg transition-colors"
          style={{ backgroundColor: branding.secondaryColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-md" style={{ backgroundColor: branding.primaryColor }}>
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight leading-none">{branding.name}</h1>
              <span className="text-[10px] opacity-75 font-medium">{branding.tagline}</span>
            </div>
          </div>

          {/* Quick Role-Switcher (RBAC Simulation) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/70 font-semibold hidden md:inline">Logged In Role:</span>
            <select
              value={currentUserRole}
              onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="OWNER" className="text-slate-900">Owner (Full Admin)</option>
              <option value="MANAGER" className="text-slate-900">Restaurant Manager</option>
              <option value="CASHIER" className="text-slate-900">Cashier Counter</option>
              <option value="WAITER" className="text-slate-900">Waiter / Floor Staff</option>
              <option value="CHEF" className="text-slate-900">Executive Chef (KDS)</option>
              <option value="ACCOUNTANT" className="text-slate-900">Accountant (Ledger)</option>
            </select>
          </div>
        </header>

        {/* Global Navigation Menu Tabs */}
        <nav className="bg-white border-b border-slate-200 px-4 md:px-6 flex gap-1 overflow-x-auto text-xs font-bold">
          {[
            { id: "POS", label: "POS Billing", icon: ShoppingBag, roles: ["OWNER", "MANAGER", "CASHIER", "WAITER"] },
            { id: "DASHBOARD", label: "Executive Analytics", icon: LayoutDashboard, roles: ["OWNER", "MANAGER", "ACCOUNTANT"] },
            { id: "TABLES", label: "Digital Floor Plan", icon: UtensilsCrossed, roles: ["OWNER", "MANAGER", "WAITER", "CASHIER"] },
            { id: "KDS", label: "Kitchen Display (KDS)", icon: ChefHat, roles: ["OWNER", "MANAGER", "CHEF"] },
            { id: "INVENTORY", label: "Recipe & Inventory", icon: Boxes, roles: ["OWNER", "MANAGER"] },
            { id: "EXPENSES", label: "Expenses & P&L", icon: Wallet, roles: ["OWNER", "MANAGER", "ACCOUNTANT"] },
            { id: "CUSTOMERS", label: "CRM & Udhar Ledger", icon: Users, roles: ["OWNER", "MANAGER", "CASHIER"] },
            { id: "AUDIT", label: "Invoices Audit", icon: Receipt, roles: ["OWNER", "MANAGER", "CASHIER", "ACCOUNTANT"] },
            { id: "SETTINGS", label: "Branding & GST", icon: Settings, roles: ["OWNER"] },
          ]
            .filter((tab) => tab.roles.includes(currentUserRole))
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeModule === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveModule(tab.id as any)}
                  className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
                    isActive
                      ? "border-rose-600 text-rose-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                  }`}
                  style={{
                    borderColor: isActive ? branding.primaryColor : undefined,
                    color: isActive ? branding.primaryColor : undefined,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </nav>

        {/* =========================================================================
            MODULE 1: EXECUTIVE ANALYTICS DASHBOARD
        ========================================================================= */}
        {activeModule === "DASHBOARD" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Executive Real-time Performance</h2>
                <p className="text-xs text-slate-500">Live consolidated financial reports & operations status</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg font-bold border border-emerald-200">
                  Net Estimated Margin: {dashboardStats.totalSales > 0 ? Math.round((dashboardStats.netProfit / dashboardStats.totalSales) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Sales Revenue</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{branding.currency} {dashboardStats.totalSales}</p>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3 h-3" /> {dashboardStats.totalOrders} Settled Orders
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Total Expenses</span>
                <p className="text-2xl font-black text-rose-600 mt-1">{branding.currency} {dashboardStats.totalExpense}</p>
                <span className="text-[10px] text-slate-500 font-medium mt-1">Rent, stock & salaries</span>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Estimated Net Profit</span>
                <p className={`text-2xl font-black mt-1 ${dashboardStats.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {branding.currency} {dashboardStats.netProfit}
                </p>
                <span className="text-[10px] text-slate-500 font-medium mt-1">Gross sales minus operational costs</span>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Floor Table Occupancy</span>
                <p className="text-2xl font-black text-blue-600 mt-1">{dashboardStats.tableOccupancyRate}%</p>
                <span className="text-[10px] text-slate-500 font-medium mt-1">{dashboardStats.occupiedTables} of {tables.length} tables dining</span>
              </div>
            </div>

            {/* Payment Modes Split & Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Payment Collections Breakdown</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5"><Banknote className="w-4 h-4 text-emerald-600" /> Cash Drawer:</span>
                    <span className="font-black text-slate-900">{branding.currency} {dashboardStats.cashSales}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5"><QrCode className="w-4 h-4 text-blue-600" /> UPI Online:</span>
                    <span className="font-black text-slate-900">{branding.currency} {dashboardStats.upiSales}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-purple-600" /> Debit / Credit Cards:</span>
                    <span className="font-black text-slate-900">{branding.currency} {dashboardStats.cardSales}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-600" /> Customer Credit (Udhar):</span>
                    <span className="font-black text-slate-900">{branding.currency} {dashboardStats.creditSales}</span>
                  </div>
                </div>
              </div>

              {/* Low Stock Warnings */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 md:col-span-2 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Critical Low Stock Ingredients
                  </h3>
                  <button onClick={() => setActiveModule("INVENTORY")} className="text-xs text-rose-600 font-bold hover:underline">
                    Manage Inventory ➔
                  </button>
                </div>
                {dashboardStats.lowStockCount === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">All raw materials are well above minimum thresholds.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {inventory
                      .filter((i) => i.currentStock <= i.minStockLevel)
                      .map((item) => (
                        <div key={item.id} className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-amber-900">{item.name}</p>
                            <p className="text-[10px] text-amber-700">Min Threshold: {item.minStockLevel} {item.unit}</p>
                          </div>
                          <span className="px-2 py-1 bg-amber-200 text-amber-900 font-black rounded-lg">
                            {item.currentStock} {item.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* =========================================================================
            MODULE 2: POWER POS BILLING SYSTEM
        ========================================================================= */}
        {activeModule === "POS" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Categories, Search & Items Catalog */}
            <div className="lg:col-span-7 space-y-4">
              {/* Quick Table Switch Bar */}
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <UtensilsCrossed className="w-3.5 h-3.5" /> Dining Table / Takeaway
                  </span>
                  <span className="text-xs font-black text-rose-600">{currentTable.name} Active</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {tables.map((tbl) => {
                    const isSelected = selectedTableId === tbl.id;
                    const hasItems = tbl.activeCart.length > 0;
                    return (
                      <button
                        key={tbl.id}
                        onClick={() => setSelectedTableId(tbl.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : hasItems
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        {tbl.name} {hasItems && `(${tbl.activeCart.length})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search & Category Pills */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search dishes by name (e.g. Biryani, Burger, Coffee)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid with Variants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center ${
                            item.isVeg ? "border-green-600" : "border-red-600"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        {item.variants ? "Multiple Sizes" : `${branding.currency} ${item.basePrice}`} • {item.category}
                      </p>
                    </div>

                    {/* Variant Buttons OR Base Add Button */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {item.variants ? (
                        item.variants.map((v) => (
                          <button
                            key={v.name}
                            onClick={() => addItemToCart(item, v)}
                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition"
                          >
                            + {v.name} ({branding.currency}{v.price})
                          </button>
                        ))
                      ) : (
                        <button
                          onClick={() => addItemToCart(item)}
                          className="w-full py-1.5 text-white rounded-lg text-xs font-bold transition shadow-sm"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          + Add to Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Columns: Active Cart & Multi-Payment Settle */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-base text-slate-900">Order Terminal</h3>
                    <p className="text-[10px] text-slate-500">{currentTable.name} • Waiter: {currentUserRole}</p>
                  </div>
                  {currentTable.activeCart.length > 0 && (
                    <button
                      onClick={() => updateCurrentTableCart([])}
                      className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Cart
                    </button>
                  )}
                </div>

                {/* Customer Details Inputs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <input
                    type="tel"
                    placeholder="Customer Mobile (CRM)"
                    value={customerPhoneInput}
                    onChange={(e) => setCustomerPhoneInput(e.target.value)}
                    className="px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Guest Name"
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    className="px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                  />
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                  {currentTable.activeCart.length === 0 ? (
                    <p className="text-xs text-slate-400 py-12 text-center">No items added to {currentTable.name}.</p>
                  ) : (
                    currentTable.activeCart.map((it) => (
                      <div key={it.cartId} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">
                            {it.name} {it.variantName && <span className="text-[10px] text-slate-500 font-medium">({it.variantName})</span>}
                          </p>
                          <p className="text-[10px] text-slate-500">{branding.currency} {it.price} each</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartQty(it.cartId, -1)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                          >
                            <Minus className="w-3 h-3 text-slate-700" />
                          </button>
                          <span className="font-bold w-4 text-center">{it.qty}</span>
                          <button
                            onClick={() => updateCartQty(it.cartId, 1)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                          >
                            <Plus className="w-3 h-3 text-slate-700" />
                          </button>
                          <span className="font-bold ml-2 w-14 text-right">
                            {branding.currency} {it.price * it.qty}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary, Discounts, Taxes & Settlement */}
              <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                {/* Discount Inputs */}
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5"><Percent className="w-3 h-3" /> Discount:</span>
                  <input
                    type="number"
                    placeholder="%"
                    value={discountPercent || ""}
                    onChange={(e) => {
                      setDiscountPercent(parseFloat(e.target.value) || 0);
                      setDiscountFlat(0);
                    }}
                    className="w-12 px-2 py-1 border rounded text-xs text-center bg-white"
                  />
                  <span className="text-slate-400">or</span>
                  <input
                    type="number"
                    placeholder="₹ Flat"
                    value={discountFlat || ""}
                    onChange={(e) => {
                      setDiscountFlat(parseFloat(e.target.value) || 0);
                      setDiscountPercent(0);
                    }}
                    className="w-16 px-2 py-1 border rounded text-xs text-center bg-white"
                  />
                </div>

                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{branding.currency} {cartSubtotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-600 font-semibold">
                      <span>Discount Applied:</span>
                      <span>- {branding.currency} {discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST ({branding.taxRate}% Total):</span>
                    <span>{branding.currency} {cgstAmount + sgstAmount}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t">
                    <span>Final Amount:</span>
                    <span>{branding.currency} {finalPayable}</span>
                  </div>
                </div>

                {/* Multi-Payment Mode Selector */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Payment Mode</span>
                  <div className="grid grid-cols-5 gap-1 text-[11px] font-bold">
                    {(["Cash", "UPI", "Card", "Credit", "Split"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setActivePaymentMode(m)}
                        className={`py-1.5 rounded-lg border transition ${
                          activePaymentMode === m
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split Payment Form */}
                {activePaymentMode === "Split" && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500">Cash Part</label>
                      <input
                        type="number"
                        placeholder="₹ Cash"
                        value={splitCashAmount}
                        onChange={(e) => setSplitCashAmount(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500">Online Part</label>
                      <input
                        type="number"
                        placeholder="₹ Online"
                        value={splitOnlineAmount}
                        onChange={(e) => setSplitOnlineAmount(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons: KOT & Settle */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={dispatchKOT}
                    disabled={currentTable.activeCart.length === 0}
                    className="py-2.5 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-slate-700 disabled:opacity-40 transition shadow-sm"
                  >
                    <ChefHat className="w-4 h-4" /> Punch KOT
                  </button>
                  <button
                    onClick={settleBill}
                    disabled={cartSubtotal === 0}
                    className="py-2.5 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 hover:opacity-95 disabled:opacity-40 transition shadow-md"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    <Printer className="w-4 h-4" /> Settle & Bill
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* =========================================================================
            MODULE 3: DIGITAL FLOOR PLAN & TABLE MANAGEMENT
        ========================================================================= */}
        {activeModule === "TABLES" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Interactive Digital Floor Plan</h2>
                <p className="text-xs text-slate-500">Live occupancy tracking, guest seated timers and capacity</p>
              </div>
              <div className="flex gap-2 text-xs font-bold">
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Occupied
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tables.map((tbl) => {
                const isOccupied = tbl.status === "OCCUPIED";
                return (
                  <div
                    key={tbl.id}
                    className={`bg-white rounded-2xl p-5 border shadow-sm transition flex flex-col justify-between ${
                      isOccupied ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-extrabold text-base text-slate-900">{tbl.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOccupied ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {tbl.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Capacity: {tbl.capacity} Persons</p>
                      {isOccupied && (
                        <div className="mt-3 p-2 bg-slate-50 rounded-xl space-y-1 text-xs">
                          <p className="text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Seated: {tbl.occupiedSince || "Just now"}
                          </p>
                          <p className="font-bold text-slate-800">
                            Active Items: {tbl.activeCart.reduce((s, i) => s + i.qty, 0)} dishes
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedTableId(tbl.id);
                          setActiveModule("POS");
                        }}
                        className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                      >
                        {isOccupied ? "Manage Order / Bill" : "Punch New Dine-in Order"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* =========================================================================
            MODULE 4: MULTI-STATION KITCHEN DISPLAY SYSTEM (KDS)
        ========================================================================= */}
        {activeModule === "KDS" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ChefHat className="w-6 h-6 text-rose-600" /> Kitchen Display Screen (KDS)
                </h2>
                <p className="text-xs text-slate-500">Live order tickets with multi-stage status management</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
                {activeKOTs.filter((k) => k.status !== "SERVED").length} Active Kitchen Tickets
              </span>
            </div>

            {activeKOTs.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Pending Kitchen Orders!</h3>
                <p className="text-xs text-slate-400 mt-1">Orders dispatched from POS will pop up here in real-time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeKOTs.map((k) => (
                  <div
                    key={k.id}
                    className={`bg-white rounded-2xl p-4 border shadow-sm transition flex flex-col justify-between ${
                      k.status === "PREPARING"
                        ? "border-amber-400 ring-2 ring-amber-100"
                        : k.status === "READY"
                        ? "border-emerald-500 ring-2 ring-emerald-100"
                        : "border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start pb-2 border-b border-slate-100 mb-3">
                        <div>
                          <span className="text-xs font-black text-slate-900">KOT #{k.kotNo}</span>
                          <h4 className="text-base font-black text-slate-800">{k.table}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3" /> {k.timestamp}
                          </span>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              k.status === "PREPARING"
                                ? "bg-amber-100 text-amber-800"
                                : k.status === "READY"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {k.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pb-3">
                        {k.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-800">{it.name}</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-900 font-bold">
                              × {it.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      {k.status === "PREPARING" && (
                        <button
                          onClick={() => {
                            const updated = activeKOTs.map((t) => (t.id === k.id ? { ...t, status: "READY" as const } : t));
                            setActiveKOTs(updated);
                            saveToDisk("rms_kots", updated);
                          }}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                        >
                          Mark Ready to Serve
                        </button>
                      )}
                      {k.status === "READY" && (
                        <button
                          onClick={() => {
                            const updated = activeKOTs.map((t) => (t.id === k.id ? { ...t, status: "SERVED" as const } : t));
                            setActiveKOTs(updated);
                            saveToDisk("rms_kots", updated);
                          }}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                        >
                          Mark Food Served
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const updated = activeKOTs.filter((t) => t.id !== k.id);
                          setActiveKOTs(updated);
                          saveToDisk("rms_kots", updated);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl border border-slate-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {/* =========================================================================
            MODULE 5: INVENTORY, RECIPE COSTING & STOCK INWARD
        ========================================================================= */}
        {activeModule === "INVENTORY" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Raw Ingredients & Recipe Inventory</h2>
                <p className="text-xs text-slate-500">Auto-deducted upon billing with low stock threshold indicators</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase font-bold border-b pb-2">
                      <th className="py-2">Ingredient Name</th>
                      <th className="py-2">Unit</th>
                      <th className="py-2">Current Stock</th>
                      <th className="py-2">Min Warning Level</th>
                      <th className="py-2">Unit Cost</th>
                      <th className="py-2 text-right">Quick Stock Entry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map((item) => {
                      const isLow = item.currentStock <= item.minStockLevel;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">{item.name}</td>
                          <td className="py-3 text-slate-500 uppercase">{item.unit}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${isLow ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                              {item.currentStock} {item.unit}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600">{item.minStockLevel} {item.unit}</td>
                          <td className="py-3 font-semibold text-slate-800">{branding.currency} {item.costPerUnit}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                const addAmount = prompt(`Add stock for ${item.name} in ${item.unit}:`, "5");
                                if (addAmount && !isNaN(parseFloat(addAmount))) {
                                  const updated = inventory.map((i) =>
                                    i.id === item.id ? { ...i, currentStock: parseFloat((i.currentStock + parseFloat(addAmount)).toFixed(2)) } : i
                                  );
                                  setInventory(updated);
                                  saveToDisk("rms_inventory", updated);
                                }
                              }}
                              className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
                            >
                              + Inward Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* =========================================================================
            MODULE 6: EXPENSE MANAGEMENT & FINANCIAL LEDGER
        ========================================================================= */}
        {activeModule === "EXPENSES" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-black text-slate-900 mb-4">Record Operating Expense</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const newExpense: ExpenseRecord = {
                    id: `EXP-${Date.now().toString().slice(-6)}`,
                    date: new Date().toLocaleDateString(),
                    title: target.title.value,
                    category: target.category.value,
                    amount: parseFloat(target.amount.value) || 0,
                    paymentMode: target.paymentMode.value,
                    staff: currentUserRole,
                  };
                  const updated = [newExpense, ...expenses];
                  setExpenses(updated);
                  saveToDisk("rms_expenses", updated);
                  target.reset();
                }}
                className="grid grid-cols-1 sm:grid-cols-5 gap-3"
              >
                <input
                  name="title"
                  required
                  placeholder="Expense Details (e.g. Dairy Milk Delivery)"
                  className="sm:col-span-2 px-3 py-2 border rounded-xl text-xs"
                />
                <select name="category" className="px-3 py-2 border rounded-xl text-xs bg-white">
                  <option value="Raw Material">Raw Material</option>
                  <option value="Electricity & Gas">Electricity & Gas</option>
                  <option value="Rent">Rent</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Misc">Misc</option>
                </select>
                <input
                  name="amount"
                  type="number"
                  required
                  placeholder="Amount (₹)"
                  className="px-3 py-2 border rounded-xl text-xs"
                />
                <div className="flex gap-2">
                  <select name="paymentMode" className="px-2 py-2 border rounded-xl text-xs bg-white flex-1">
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank</option>
                  </select>
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">
                    Add
                  </button>
                </div>
              </form>
            </div>

            {/* Expenses List */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Expenses Record Ledger</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase font-bold border-b pb-2">
                      <th className="py-2">Date</th>
                      <th className="py-2">Details</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Payment</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="py-3 text-slate-500">{exp.date}</td>
                        <td className="py-3 font-bold text-slate-900">{exp.title}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{exp.paymentMode}</td>
                        <td className="py-3 text-right font-black text-rose-600">
                          {branding.currency} {exp.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* =========================================================================
            MODULE 7: CUSTOMER CRM & CREDIT (UDHAR) LEDGER
        ========================================================================= */}
        {activeModule === "CUSTOMERS" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black text-slate-900 mb-1">Customer CRM & Credit Ledger</h2>
              <p className="text-xs text-slate-500 mb-4">Track recurring guest orders and outstanding balances</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase font-bold border-b pb-2">
                      <th className="py-2">Customer Name</th>
                      <th className="py-2">Mobile Phone</th>
                      <th className="py-2">Visits Count</th>
                      <th className="py-2">Lifetime Spent</th>
                      <th className="py-2 text-right">Udhar / Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((cust, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{cust.name}</td>
                        <td className="py-3 text-slate-600 font-mono">{cust.phone}</td>
                        <td className="py-3">{cust.visits} Orders</td>
                        <td className="py-3 font-bold text-slate-900">{branding.currency} {cust.totalSpent}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-1 rounded-lg font-black ${cust.creditBalance > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                            {branding.currency} {cust.creditBalance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* =========================================================================
            MODULE 8: INVOICES AUDIT & GST COMPLIANCE
        ========================================================================= */}
        {activeModule === "AUDIT" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-600" /> Complete Tax Invoices Audit
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase font-bold border-b pb-2">
                      <th className="py-2">Invoice No</th>
                      <th className="py-2">Date & Time</th>
                      <th className="py-2">Table</th>
                      <th className="py-2">Customer</th>
                      <th className="py-2">Mode</th>
                      <th className="py-2 text-right">CGST</th>
                      <th className="py-2 text-right">SGST</th>
                      <th className="py-2 text-right">Grand Total</th>
                      <th className="py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-3 font-mono font-bold text-slate-900">{inv.invoiceNo}</td>
                        <td className="py-3 text-slate-500">{inv.date}</td>
                        <td className="py-3 font-semibold text-slate-700">{inv.table}</td>
                        <td className="py-3 text-slate-600">{inv.customerName || "Guest"}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                            {inv.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 text-right">{branding.currency} {inv.cgst}</td>
                        <td className="py-3 text-right">{branding.currency} {inv.sgst}</td>
                        <td className="py-3 text-right font-black text-slate-900">{branding.currency} {inv.grandTotal}</td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => {
                              setPrintInvoiceData(inv);
                              setPrintKOTData(null);
                              setTimeout(() => window.print(), 100);
                            }}
                            className="p-1 hover:text-rose-600 text-slate-600"
                            title="Reprint Tax Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* =========================================================================
            MODULE 9: WHITE-LABEL BRANDING & GST SETTINGS
        ========================================================================= */}
        {activeModule === "SETTINGS" && (
          <main className="p-4 md:p-6 max-w-4xl mx-auto w-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black text-slate-900 mb-1">Branding, UPI & Tax Settings</h2>
              <p className="text-xs text-slate-500 mb-6">Thermal receipt layout, GSTIN, FSSAI & UPI configuration</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveToDisk("rms_branding", branding);
                  alert("Settings saved successfully!");
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-500 uppercase block mb-1">Restaurant Legal Name</label>
                  <input
                    type="text"
                    value={branding.name}
                    onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 uppercase block mb-1">Tagline</label>
                  <input
                    type="text"
                    value={branding.tagline}
                    onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 uppercase block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={branding.gstNumber}
                    onChange={(e) => setBranding({ ...branding, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 uppercase block mb-1">FSSAI License No</label>
                  <input
                    type="text"
                    value={branding.fssaiNumber}
                    onChange={(e) => setBranding({ ...branding, fssaiNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 uppercase block mb-1">UPI VPA (for auto QR)</label>
                  <input
                    type="text"
                    value={branding.upiId}
                    onChange={(e) => setBranding({ ...branding, upiId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 uppercase block mb-1">Total GST Rate (%)</label>
                  <input
                    type="number"
                    value={branding.taxRate}
                    onChange={(e) => setBranding({ ...branding, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-500 uppercase block mb-1">Store Address</label>
                  <input
                    type="text"
                    value={branding.address}
                    onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-500 uppercase block mb-1">Thermal Receipt Footer Note</label>
                  <input
                    type="text"
                    value={branding.footerNote}
                    onChange={(e) => setBranding({ ...branding, footerNote: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">
                    Save Branding & System Configuration
                  </button>
                </div>
              </form>
            </div>
          </main>
        )}
      </div>
    </>
  );
}
