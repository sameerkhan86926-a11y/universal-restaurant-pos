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
  Percent,
  Calendar,
  Edit,
  RotateCcw,
  X,
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
  recipe?: { ingredientId: string; qty: number }[];
}

export interface CartItem {
  cartId: string;
  itemId: string;
  name: string;
  variantName?: string;
  price: number;
  qty: number;
  notes?: string;
}

export interface TableInfo {
  id: string;
  name: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "BILLED" | "CLEANING";
  occupiedSince?: string;
  activeCart: CartItem[];
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
  creditBalance: number;
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
  taxRate: number;
  primaryColor: string;
  secondaryColor: string;
  footerNote: string;
}

// ================= DEFAULT FALLBACKS =================
const initialBranding: RestaurantBranding = {
  name: "My Restaurant & Cafe",
  tagline: "Fresh, Hot & Authentic",
  address: "Main Market Road, City Center",
  phone: "+91 98765 43210",
  gstNumber: "07AAAAA0000A1Z5",
  fssaiNumber: "10020011000456",
  upiId: "restaurant@upi",
  currency: "₹",
  taxRate: 5,
  primaryColor: "#e11d48",
  secondaryColor: "#0f172a",
  footerNote: "GST Registered. Thank you for your visit!",
};

export default function UltimateRestaurantPOS() {
  const [isClient, setIsClient] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("OWNER");
  const [activeModule, setActiveModule] = useState<
    "POS" | "DASHBOARD" | "MENU_MGMT" | "TABLES" | "KDS" | "INVENTORY" | "EXPENSES" | "CUSTOMERS" | "AUDIT" | "SETTINGS"
  >("POS");

  // Core Data
  const [branding, setBranding] = useState<RestaurantBranding>(initialBranding);
  const [tables, setTables] = useState<TableInfo[]>([
    { id: "t1", name: "Table 1", capacity: 2, status: "AVAILABLE", activeCart: [] },
    { id: "t2", name: "Table 2", capacity: 4, status: "AVAILABLE", activeCart: [] },
    { id: "t3", name: "Table 3", capacity: 6, status: "AVAILABLE", activeCart: [] },
    { id: "t4", name: "Parcel Counter", capacity: 1, status: "AVAILABLE", activeCart: [] },
  ]);
  const [menu, setMenu] = useState<MenuItem[]>([
    { id: "m1", name: "Paneer Butter Masala", category: "Main Course", basePrice: 240, isVeg: true },
    { id: "m2", name: "Crispy Veg Burger", category: "Fast Food", basePrice: 99, isVeg: true },
    { id: "m3", name: "Cold Coffee", category: "Beverages", basePrice: 80, isVeg: true },
  ]);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: "inv-1", name: "Paneer", unit: "kg", currentStock: 5.0, minStockLevel: 2.0, costPerUnit: 340 },
    { id: "inv-2", name: "Milk", unit: "l", currentStock: 8.0, minStockLevel: 3.0, costPerUnit: 64 },
  ]);
  const [activeKOTs, setActiveKOTs] = useState<KOTTicket[]>([]);
  const [kotSequence, setKotSequence] = useState<number>(101);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [invoices, setInvoices] = useState<SettledInvoice[]>([]);

  // POS State
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

  // Modals & Forms State
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);

  // New Menu Item Form States
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuCategory, setNewMenuCategory] = useState("Main Course");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuIsVeg, setNewMenuIsVeg] = useState(true);
  const [newMenuHasVariants, setNewMenuHasVariants] = useState(false);
  const [variantHalfPrice, setVariantHalfPrice] = useState("");
  const [variantFullPrice, setVariantFullPrice] = useState("");

  // New Table Form States
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");

  // New Inventory Form States
  const [newInvName, setNewInvName] = useState("");
  const [newInvUnit, setNewInvUnit] = useState<"kg" | "g" | "l" | "ml" | "pcs">("kg");
  const [newInvStock, setNewInvStock] = useState("");
  const [newInvMinStock, setNewInvMinStock] = useState("");
  const [newInvCost, setNewInvCost] = useState("");

  // Print Data
  const [printInvoiceData, setPrintInvoiceData] = useState<SettledInvoice | null>(null);
  const [printKOTData, setPrintKOTData] = useState<KOTTicket | null>(null);

  // Load from LocalStorage
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

  // Helper to Reset all demo data to clean slate
  const handleResetData = () => {
    if (confirm("Are you sure you want to reset demo data? All records will be cleared for a fresh start.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Active Table
  const currentTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0] || {
      id: "t_def",
      name: "Table 1",
      capacity: 4,
      status: "AVAILABLE",
      activeCart: [],
    };
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

  const addItemToCart = (item: MenuItem, variant?: ItemVariant) => {
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

     // Calculations
  const cartSubtotal = useMemo(() => {
    return (currentTable.activeCart || []).reduce(
      (sum: number, item: CartItem) => sum + item.price * item.qty,
      0
    );
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

  const upiQrUrl = useMemo(() => {
    if (!branding.upiId || finalPayable <= 0) return "";
    const upiUri = `upi://pay?pa=${encodeURIComponent(branding.upiId)}&pn=${encodeURIComponent(branding.name)}&am=${finalPayable}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUri)}`;
  }, [branding.upiId, branding.name, finalPayable]);

  // Dispatch KOT
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

  // Settle Bill
  const settleBill = () => {
    if (cartSubtotal === 0) return;

    const invoice: SettledInvoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      invoiceNo: `INV/${new Date().getFullYear()}/${(invoices.length + 1).toString().padStart(4, "0")}`,
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

    setPrintInvoiceData(invoice);
    setPrintKOTData(null);
    setDiscountPercent(0);
    setDiscountFlat(0);
    setCustomerNameInput("");
    setCustomerPhoneInput("");

    setTimeout(() => window.print(), 150);
  };

  // Dashboard Stats
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
      tableOccupancyRate: tables.length > 0 ? Math.round((occupiedTables / tables.length) * 100) : 0,
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

  // ================= ACTION HANDLERS =================
  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName || !newMenuPrice) return;

    const newItem: MenuItem = {
      id: `m_${Date.now()}`,
      name: newMenuName,
      category: newMenuCategory,
      basePrice: parseFloat(newMenuPrice),
      isVeg: newMenuIsVeg,
      variants: newMenuHasVariants && variantHalfPrice && variantFullPrice
        ? [
            { name: "Half", price: parseFloat(variantHalfPrice) },
            { name: "Full", price: parseFloat(variantFullPrice) },
          ]
        : undefined,
    };

    const updated = [newItem, ...menu];
    setMenu(updated);
    saveToDisk("rms_menu", updated);

    // Reset Form
    setNewMenuName("");
    setNewMenuPrice("");
    setNewMenuHasVariants(false);
    setVariantHalfPrice("");
    setVariantFullPrice("");
    setShowAddMenuModal(false);
    alert("New Menu Item added successfully!");
  };

  const handleDeleteMenuItem = (id: string) => {
    if (confirm("Delete this menu dish permanently?")) {
      const updated = menu.filter((m) => m.id !== id);
      setMenu(updated);
      saveToDisk("rms_menu", updated);
    }
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName) return;
    const newTbl: TableInfo = {
      id: `tbl_${Date.now()}`,
      name: newTableName,
      capacity: parseInt(newTableCapacity) || 4,
      status: "AVAILABLE",
      activeCart: [],
    };
    const updated = [...tables, newTbl];
    setTables(updated);
    saveToDisk("rms_tables", updated);
    setNewTableName("");
    setShowAddTableModal(false);
    alert("New Table added successfully!");
  };

  const handleDeleteTable = (id: string) => {
    if (tables.length <= 1) {
      alert("At least one table or counter must exist!");
      return;
    }
    if (confirm("Delete this table?")) {
      const updated = tables.filter((t) => t.id !== id);
      setTables(updated);
      saveToDisk("rms_tables", updated);
      if (selectedTableId === id) setSelectedTableId(updated[0].id);
    }
  };

  const handleCreateInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName || !newInvStock) return;
    const newInv: InventoryItem = {
      id: `inv_${Date.now()}`,
      name: newInvName,
      unit: newInvUnit,
      currentStock: parseFloat(newInvStock) || 0,
      minStockLevel: parseFloat(newInvMinStock) || 1,
      costPerUnit: parseFloat(newInvCost) || 0,
    };
    const updated = [...inventory, newInv];
    setInventory(updated);
    saveToDisk("rms_inventory", updated);
    setNewInvName("");
    setNewInvStock("");
    setNewInvMinStock("");
    setNewInvCost("");
    setShowAddInventoryModal(false);
    alert("New Raw Material Ingredient added!");
  };

  const handleDeleteInventory = (id: string) => {
    if (confirm("Delete this inventory item?")) {
      const updated = inventory.filter((i) => i.id !== id);
      setInventory(updated);
      saveToDisk("rms_inventory", updated);
    }
  };

  if (!isClient) return null;

  return (
    <>
      {/* =========================================================================
          THERMAL PRINTER RECEIPT / KOT
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
          MODALS: ADD MENU DISH / ADD TABLE / ADD INVENTORY
      ========================================================================= */}
      {/* 1. Add Menu Dish Modal */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-lg text-slate-900">Add New Menu Dish</h3>
              <button onClick={() => setShowAddMenuModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Item / Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa, Cold Coffee, Veg Pizza"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fast Food, Beverages"
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Dietary Type</label>
                  <select
                    value={newMenuIsVeg ? "true" : "false"}
                    onChange={(e) => setNewMenuIsVeg(e.target.value === "true")}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="true">Pure Veg (Green)</option>
                    <option value="false">Non-Veg (Red)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Base Selling Price (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150"
                  value={newMenuPrice}
                  onChange={(e) => setNewMenuPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* Sizes / Variants Toggle */}
              <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMenuHasVariants}
                    onChange={(e) => setNewMenuHasVariants(e.target.checked)}
                    className="rounded"
                  />
                  <span>Has Sizes / Portions (Half & Full)?</span>
                </label>

                {newMenuHasVariants && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Half Price (₹)</span>
                      <input
                        type="number"
                        placeholder="Half Price"
                        value={variantHalfPrice}
                        onChange={(e) => setVariantHalfPrice(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Full Price (₹)</span>
                      <input
                        type="number"
                        placeholder="Full Price"
                        value={variantFullPrice}
                        onChange={(e) => setVariantFullPrice(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
              >
                Save Dish to Menu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-lg text-slate-900">Add New Dining Table</h3>
              <button onClick={() => setShowAddTableModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Table / Counter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 5, Rooftop 1, Takeaway 2"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Guest Seating Capacity</label>
                <input
                  type="number"
                  required
                  placeholder="4"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
              >
                Create Table
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Raw Material Inventory Modal */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-lg text-slate-900">Add Raw Material Ingredient</h3>
              <button onClick={() => setShowAddInventoryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInventoryItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cooking Oil, Mozzarella Cheese, Basmati Rice"
                  value={newInvName}
                  onChange={(e) => setNewInvName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Unit of Measure</label>
                  <select
                    value={newInvUnit}
                    onChange={(e) => setNewInvUnit(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Opening Stock</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={newInvStock}
                    onChange={(e) => setNewInvStock(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Low Stock Warning Level</label>
                  <input
                    type="number"
                    required
                    placeholder="2"
                    value={newInvMinStock}
                    onChange={(e) => setNewInvMinStock(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Cost Per Unit (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="120"
                    value={newInvCost}
                    onChange={(e) => setNewInvCost(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
              >
                Add to Stock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN INTERACTIVE SAAS APPLICATION (SCREEN VIEW)
      ========================================================================= */}
      <div className="min-h-screen bg-slate-100 flex flex-col print:hidden font-sans text-slate-900">
        {/* Header */}
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

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              title="Reset all demo data"
              className="p-1.5 bg-white/10 hover:bg-red-500/80 rounded-lg text-white transition text-xs flex items-center gap-1 font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            <select
              value={currentUserRole}
              onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="OWNER" className="text-slate-900">Owner (Full Admin)</option>
              <option value="MANAGER" className="text-slate-900">Manager</option>
              <option value="CASHIER" className="text-slate-900">Cashier</option>
              <option value="WAITER" className="text-slate-900">Waiter</option>
              <option value="CHEF" className="text-slate-900">Chef (KDS)</option>
              <option value="ACCOUNTANT" className="text-slate-900">Accountant</option>
            </select>
          </div>
        </header>

        {/* Global Navigation Menu Tabs */}
        <nav className="bg-white border-b border-slate-200 px-4 md:px-6 flex gap-1 overflow-x-auto text-xs font-bold">
          {[
            { id: "POS", label: "POS Billing", icon: ShoppingBag },
            { id: "MENU_MGMT", label: "Menu Catalog & Add Items", icon: Edit },
            { id: "TABLES", label: "Tables Floor Plan", icon: UtensilsCrossed },
            { id: "KDS", label: "Kitchen KDS", icon: ChefHat },
            { id: "INVENTORY", label: "Stock & Ingredients", icon: Boxes },
            { id: "DASHBOARD", label: "Executive Analytics", icon: LayoutDashboard },
            { id: "EXPENSES", label: "Expenses & P&L", icon: Wallet },
            { id: "CUSTOMERS", label: "CRM & Udhar Ledger", icon: Users },
            { id: "AUDIT", label: "Invoices Audit", icon: Receipt },
            { id: "SETTINGS", label: "Branding & GST", icon: Settings },
          ].map((tab) => {
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
            MODULE: MENU CATALOG & FULL EDITABLE MANAGER
        ========================================================================= */}
        {activeModule === "MENU_MGMT" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Complete Menu Management</h2>
                <p className="text-xs text-slate-500">Create new dishes, configure half/full portions, and manage prices</p>
              </div>
              <button
                onClick={() => setShowAddMenuModal(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition"
              >
                <Plus className="w-4 h-4" /> + Add New Menu Dish
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase font-bold border-b pb-2">
                      <th className="py-2">Dish Name</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Dietary</th>
                      <th className="py-2">Base Price</th>
                      <th className="py-2">Variants (Sizes)</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {menu.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 text-slate-600">{item.category}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isVeg ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {item.isVeg ? "Pure Veg" : "Non-Veg"}
                          </span>
                        </td>
                        <td className="py-3 font-black text-slate-900">{branding.currency} {item.basePrice}</td>
                        <td className="py-3 text-slate-600">
                          {item.variants ? item.variants.map((v) => `${v.name} (₹${v.price})`).join(", ") : "Single Size"}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
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
            MODULE: POS BILLING SYSTEM
        ========================================================================= */}
        {activeModule === "POS" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Items & Catalog */}
            <div className="lg:col-span-7 space-y-4">
              {/* Tables Switch Bar */}
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <UtensilsCrossed className="w-3.5 h-3.5" /> Dining Table / Takeaway
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddTableModal(true)}
                      className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Table
                    </button>
                    <span className="text-xs font-black text-slate-800">| {currentTable.name} Active</span>
                  </div>
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

              {/* Search & Categories */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search dishes by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddMenuModal(true)}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Dish
                  </button>
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

              {/* Items Grid */}
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

            {/* Right 5 Columns: Active Terminal Bill */}
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

                {/* Customer CRM inputs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <input
                    type="tel"
                    placeholder="Mobile (CRM)"
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

                {/* Cart list */}
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

              {/* Settlement Footer */}
              <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                {/* Discount */}
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
                      <span>Discount:</span>
                      <span>- {branding.currency} {discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST ({branding.taxRate}%):</span>
                    <span>{branding.currency} {cgstAmount + sgstAmount}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t">
                    <span>Net Payable:</span>
                    <span>{branding.currency} {finalPayable}</span>
                  </div>
                </div>

                {/* Modes */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Payment Method</span>
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

                {/* Split fields */}
                {activePaymentMode === "Split" && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl">
                    <input
                      type="number"
                      placeholder="₹ Cash Part"
                      value={splitCashAmount}
                      onChange={(e) => setSplitCashAmount(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-xs"
                    />
                    <input
                      type="number"
                      placeholder="₹ Online Part"
                      value={splitOnlineAmount}
                      onChange={(e) => setSplitOnlineAmount(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-xs"
                    />
                  </div>
                )}

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
            MODULE: TABLES & FLOOR PLAN
        ========================================================================= */}
        {activeModule === "TABLES" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Floor Tables & Layout</h2>
                <p className="text-xs text-slate-500">Add, remove, and monitor live occupancy</p>
              </div>
              <button
                onClick={() => setShowAddTableModal(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" /> Add New Table
              </button>
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
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOccupied ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {tbl.status}
                          </span>
                          <button onClick={() => handleDeleteTable(tbl.id)} className="text-slate-300 hover:text-red-500 p-0.5">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Seating: {tbl.capacity} Persons</p>
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
                        {isOccupied ? "Manage Order / Bill" : "Punch Order"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* =========================================================================
            MODULE: KITCHEN DISPLAY SCREEN (KDS)
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
                <p className="text-xs text-slate-400 mt-1">Orders punched from POS appear here automatically.</p>
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
                          Mark Ready
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
                          Mark Served
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
            MODULE: RAW INGREDIENTS & STOCK INWARD
        ========================================================================= */}
        {activeModule === "INVENTORY" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Inventory & Raw Materials</h2>
                <p className="text-xs text-slate-500">Add ingredients, log purchases and view stock deductions</p>
              </div>
              <button
                onClick={() => setShowAddInventoryModal(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" /> + Add New Raw Material
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase font-bold border-b pb-2">
                      <th className="py-2">Ingredient</th>
                      <th className="py-2">Unit</th>
                      <th className="py-2">Current Stock</th>
                      <th className="py-2">Low Warning Level</th>
                      <th className="py-2">Cost / Unit</th>
                      <th className="py-2 text-right">Quick Stock Inward</th>
                      <th className="py-2 text-center">Action</th>
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
                                const addAmount = prompt(`Add stock inward for ${item.name} (${item.unit}):`, "5");
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
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDeleteInventory(item.id)}
                              className="p-1.5 text-slate-300 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
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
            MODULE: EXECUTIVE ANALYTICS DASHBOARD
        ========================================================================= */}
        {activeModule === "DASHBOARD" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">Executive Performance Dashboard</h2>
                <p className="text-xs text-slate-500">Consolidated financial overview & floor metrics</p>
              </div>
            </div>

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
                <span className="text-[10px] text-slate-500 font-medium mt-1">Operational costs</span>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Estimated Net Profit</span>
                <p className={`text-2xl font-black mt-1 ${dashboardStats.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {branding.currency} {dashboardStats.netProfit}
                </p>
                <span className="text-[10px] text-slate-500 font-medium mt-1">Gross sales minus expenses</span>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Table Occupancy</span>
                <p className="text-2xl font-black text-blue-600 mt-1">{dashboardStats.tableOccupancyRate}%</p>
                <span className="text-[10px] text-slate-500 font-medium mt-1">{dashboardStats.occupiedTables} of {tables.length} tables dining</span>
              </div>
            </div>

            {/* Collections Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Collections Breakdown</h3>
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
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-purple-600" /> Card / POS:</span>
                    <span className="font-black text-slate-900">{branding.currency} {dashboardStats.cardSales}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-600" /> Customer Credit (Udhar):</span>
                    <span className="font-black text-slate-900">{branding.currency} {dashboardStats.creditSales}</span>
                  </div>
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Alerts
                  </h3>
                  <button onClick={() => setActiveModule("INVENTORY")} className="text-xs text-rose-600 font-bold hover:underline">
                    Manage ➔
                  </button>
                </div>
                {dashboardStats.lowStockCount === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">All inventory stocks are above minimum thresholds.</p>
                ) : (
                  <div className="space-y-2">
                    {inventory
                      .filter((i) => i.currentStock <= i.minStockLevel)
                      .map((item) => (
                        <div key={item.id} className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-amber-900">{item.name}</p>
                            <p className="text-[10px] text-amber-700">Min Alert: {item.minStockLevel} {item.unit}</p>
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
            MODULE: EXPENSES MANAGEMENT
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
                  placeholder="Expense Details (e.g. Milk & Dairy Delivery)"
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

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Expenses Ledger</h3>
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
            MODULE: CUSTOMERS CRM & UDHAR
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
            MODULE: INVOICE AUDIT
        ========================================================================= */}
        {activeModule === "AUDIT" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-600" /> Settled Invoices Audit
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
                            title="Reprint Bill"
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
            MODULE: BRANDING & SETTINGS
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
                  <label className="font-bold text-slate-500 uppercase block mb-1">UPI VPA (PhonePe/GPay for QR)</label>
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
                    Save Branding Configurations
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
