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
  CreditCard,
  Banknote,
  RotateCcw,
  Percent,
  Edit,
  X,
  Lock,
  KeyRound,
  ShieldAlert,
  HandCoins,
  FileEdit,
  Download,
  Flame,
  Wine,
  Cake,
  PauseCircle,
  PlayCircle,
  Award,
  Building2,
  FileSpreadsheet,
} from "lucide-react";

// ================= TYPES & INTERFACES =================
export type UserRole = "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "CHEF" | "ACCOUNTANT";
export type DigitalSplitMethod = "UPI" | "Card" | "Bank Transfer";
export type KitchenStation = "Main Kitchen" | "Tandoor" | "Bar/Beverages" | "Bakery/Desserts";
export type OrderChannel = "Dine-in" | "Takeaway" | "Swiggy" | "Zomato";

export interface ItemVariant {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  station: KitchenStation;
  basePrice: number;
  isVeg: boolean;
  variants?: ItemVariant[];
  recipe?: { ingredientId: string; qty: number }[];
}

export interface CartItem {
  cartId: string;
  itemId: string;
  name: string;
  station: KitchenStation;
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
  heldOrder?: CartItem[];
  orderChannel: OrderChannel;
  customerName?: string;
  customerPhone?: string;
  customerGst?: string;
  customerCompany?: string;
}

export interface KOTTicket {
  id: string;
  kotNo: number;
  table: string;
  channel: OrderChannel;
  timestamp: string;
  items: { name: string; qty: number; station: KitchenStation; notes?: string }[];
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
  companyName?: string;
  gstin?: string;
  totalSpent: number;
  visits: number;
  loyaltyPoints: number;
  creditBalance: number;
}

export interface CreditCollection {
  id: string;
  date: string;
  customerPhone: string;
  customerName: string;
  amount: number;
  paymentMode: "Cash" | "UPI";
  collectedBy: string;
}

export interface SplitPaymentDetail {
  cash: number;
  digitalAmount: number;
  digitalMode: DigitalSplitMethod;
}

export interface SettledInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  table: string;
  channel: OrderChannel;
  customerName?: string;
  customerPhone?: string;
  customerGst?: string;
  customerCompany?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  pointsRedeemed?: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  paymentMode: "Cash" | "UPI" | "Card" | "Credit" | "Split";
  splitDetails?: SplitPaymentDetail;
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

const defaultRolePins: Record<UserRole, string> = {
  OWNER: "1111",
  MANAGER: "2222",
  CASHIER: "3333",
  WAITER: "4444",
  CHEF: "5555",
  ACCOUNTANT: "6666",
};

const roleAllowedModules: Record<UserRole, string[]> = {
  OWNER: ["POS", "MENU_MGMT", "TABLES", "KDS", "INVENTORY", "DASHBOARD", "EXPENSES", "CUSTOMERS", "AUDIT", "EOD", "SETTINGS"],
  MANAGER: ["POS", "MENU_MGMT", "TABLES", "KDS", "INVENTORY", "DASHBOARD", "CUSTOMERS", "AUDIT", "EOD"],
  CASHIER: ["POS", "TABLES", "CUSTOMERS", "AUDIT", "EOD"],
  WAITER: ["POS", "TABLES"],
  CHEF: ["KDS"],
  ACCOUNTANT: ["DASHBOARD", "EXPENSES", "AUDIT", "EOD"],
};

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
  footerNote: "GST Registered. Thank you for dining with us!",
};

export default function UltimateRestaurantPOS() {
  const [isClient, setIsClient] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("OWNER");
  const [rolePins, setRolePins] = useState<Record<UserRole, string>>(defaultRolePins);
  const [activeModule, setActiveModule] = useState<string>("POS");

  // Role Security Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetRole, setTargetRole] = useState<UserRole>("OWNER");
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Credit Receive Modal
  const [showReceiveCreditModal, setShowReceiveCreditModal] = useState(false);
  const [selectedCustForCredit, setSelectedCustForCredit] = useState<CustomerProfile | null>(null);
  const [receivedAmountInput, setReceivedAmountInput] = useState("");
  const [receivedPaymentMode, setReceivedPaymentMode] = useState<"Cash" | "UPI">("Cash");

  // Digital Self-Menu Preview Modal
  const [showQrMenuModal, setShowQrMenuModal] = useState(false);

  // Admin Bill Edit Modal States
  const [showBillEditModal, setShowBillEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SettledInvoice | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editPaymentMode, setEditPaymentMode] = useState<"Cash" | "UPI" | "Card" | "Credit" | "Split">("Cash");
  const [editDiscountAmount, setEditDiscountAmount] = useState<number>(0);
  const [editSplitCash, setEditSplitCash] = useState<number>(0);
  const [editSplitDigital, setEditSplitDigital] = useState<number>(0);
  const [editSplitDigitalMode, setEditSplitDigitalMode] = useState<DigitalSplitMethod>("UPI");

  // Core Data
  const [branding, setBranding] = useState<RestaurantBranding>(initialBranding);
  const [tables, setTables] = useState<TableInfo[]>([
    { id: "t1", name: "Table 1", capacity: 2, status: "AVAILABLE", activeCart: [], orderChannel: "Dine-in" },
    { id: "t2", name: "Table 2", capacity: 4, status: "AVAILABLE", activeCart: [], orderChannel: "Dine-in" },
    { id: "t3", name: "Table 3", capacity: 6, status: "AVAILABLE", activeCart: [], orderChannel: "Dine-in" },
    { id: "t4", name: "Takeaway Counter", capacity: 1, status: "AVAILABLE", activeCart: [], orderChannel: "Takeaway" },
    { id: "t5", name: "Swiggy Delivery Queue", capacity: 1, status: "AVAILABLE", activeCart: [], orderChannel: "Swiggy" },
    { id: "t6", name: "Zomato Delivery Queue", capacity: 1, status: "AVAILABLE", activeCart: [], orderChannel: "Zomato" },
  ]);
  const [menu, setMenu] = useState<MenuItem[]>([
    { id: "m1", name: "Paneer Butter Masala", category: "Main Course", station: "Main Kitchen", basePrice: 240, isVeg: true },
    { id: "m2", name: "Tandoori Chicken Tikka", category: "Starters", station: "Tandoor", basePrice: 280, isVeg: false },
    { id: "m3", name: "Artisan Cappuccino", category: "Beverages", station: "Bar/Beverages", basePrice: 120, isVeg: true },
    { id: "m4", name: "Sizzling Choco Brownie", category: "Desserts", station: "Bakery/Desserts", basePrice: 150, isVeg: true },
  ]);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: "inv-1", name: "Paneer", unit: "kg", currentStock: 5.0, minStockLevel: 2.0, costPerUnit: 340 },
    { id: "inv-2", name: "Milk", unit: "l", currentStock: 8.0, minStockLevel: 3.0, costPerUnit: 64 },
  ]);
  const [activeKOTs, setActiveKOTs] = useState<KOTTicket[]>([]);
  const [kotSequence, setKotSequence] = useState<number>(101);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [creditCollections, setCreditCollections] = useState<CreditCollection[]>([]);
  const [invoices, setInvoices] = useState<SettledInvoice[]>([]);
  const [openingFloat, setOpeningFloat] = useState<number>(1000);

  // POS State
  const [selectedTableId, setSelectedTableId] = useState<string>("t1");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [kdsStationFilter, setKdsStationFilter] = useState<string>("All Stations");

  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFlat, setDiscountFlat] = useState<number>(0);
  const [redeemPoints, setRedeemPoints] = useState<boolean>(false);
  const [activePaymentMode, setActivePaymentMode] = useState<"Cash" | "UPI" | "Card" | "Credit" | "Split">("UPI");

  // Specific Split States
  const [splitCashAmount, setSplitCashAmount] = useState<string>("");
  const [splitDigitalAmount, setSplitDigitalAmount] = useState<string>("");
  const [splitDigitalMethod, setSplitDigitalMethod] = useState<DigitalSplitMethod>("UPI");

  // Customer & B2B GST Form States
  const [customerPhoneInput, setCustomerPhoneInput] = useState("");
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [customerGstInput, setCustomerGstInput] = useState("");
  const [customerCompanyInput, setCustomerCompanyInput] = useState("");
  const [itemCustomNote, setItemCustomNote] = useState("");

  // Modals
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);

  // Form State
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuCategory, setNewMenuCategory] = useState("Main Course");
  const [newMenuStation, setNewMenuStation] = useState<KitchenStation>("Main Kitchen");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuIsVeg, setNewMenuIsVeg] = useState(true);
  const [newMenuHasVariants, setNewMenuHasVariants] = useState(false);
  const [variantHalfPrice, setVariantHalfPrice] = useState("");
  const [variantFullPrice, setVariantFullPrice] = useState("");

  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");
  const [newTableChannel, setNewTableChannel] = useState<OrderChannel>("Dine-in");

  const [newInvName, setNewInvName] = useState("");
  const [newInvUnit, setNewInvUnit] = useState<"kg" | "g" | "l" | "ml" | "pcs">("kg");
  const [newInvStock, setNewInvStock] = useState("");
  const [newInvMinStock, setNewInvMinStock] = useState("");
  const [newInvCost, setNewInvCost] = useState("");

  // Print Data
  const [printInvoiceData, setPrintInvoiceData] = useState<SettledInvoice | null>(null);
  const [printKOTData, setPrintKOTData] = useState<KOTTicket | null>(null);
  const [printEODSnapshot, setPrintEODSnapshot] = useState<any>(null);

  // Load from Storage
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
    if (getSaved("rms_credit_collections")) setCreditCollections(JSON.parse(getSaved("rms_credit_collections")!));
    if (getSaved("rms_invoices")) setInvoices(JSON.parse(getSaved("rms_invoices")!));
    if (getSaved("rms_kot_seq")) setKotSequence(parseInt(getSaved("rms_kot_seq")!));
    if (getSaved("rms_role_pins")) setRolePins(JSON.parse(getSaved("rms_role_pins")!));
    if (getSaved("rms_opening_float")) setOpeningFloat(parseFloat(getSaved("rms_opening_float")!));
  }, []);

  const saveToDisk = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleAdminResetData = () => {
    if (currentUserRole !== "OWNER") {
      alert("Unauthorized! Only the Restaurant Owner can reset software data.");
      return;
    }
    const entered = prompt("WARNING: This will permanently wipe all local records!\nType 'RESET' to confirm:");
    if (entered === "RESET") {
      localStorage.clear();
      window.location.reload();
    } else {
      alert("Reset cancelled.");
    }
  };

  const requestRoleSwitch = (role: UserRole) => {
    if (role === currentUserRole) return;
    setTargetRole(role);
    setEnteredPin("");
    setPinError(false);
    setShowPinModal(true);
  };

  const verifyPinAndSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === rolePins[targetRole]) {
      setCurrentUserRole(targetRole);
      setShowPinModal(false);
      setPinError(false);
      const allowed = roleAllowedModules[targetRole];
      if (!allowed.includes(activeModule)) {
        setActiveModule(allowed[0]);
      }
    } else {
      setPinError(true);
    }
  };

  const fallbackTable: TableInfo = {
    id: "t_def",
    name: "Table 1",
    capacity: 4,
    status: "AVAILABLE",
    activeCart: [],
    orderChannel: "Dine-in",
    customerName: "",
    customerPhone: "",
  };

  const currentTable: TableInfo = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0] || fallbackTable;
  }, [tables, selectedTableId]);

  // Lookup existing Customer profile
  const matchedCustomer = useMemo(() => {
    if (!customerPhoneInput) return null;
    return customers.find((c) => c.phone.trim() === customerPhoneInput.trim()) || null;
  }, [customers, customerPhoneInput]);

  useEffect(() => {
    if (matchedCustomer) {
      if (!customerNameInput) setCustomerNameInput(matchedCustomer.name);
      if (!customerCompanyInput && matchedCustomer.companyName) setCustomerCompanyInput(matchedCustomer.companyName);
      if (!customerGstInput && matchedCustomer.gstin) setCustomerGstInput(matchedCustomer.gstin);
    }
  }, [matchedCustomer]);

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
          customerGst: customerGstInput || t.customerGst,
          customerCompany: customerCompanyInput || t.customerCompany,
        };
      }
      return t;
    });
    setTables(updated);
    saveToDisk("rms_tables", updated);
  };

  // Park (Hold) & Resume Order
  const handleParkOrder = () => {
    if (currentTable.activeCart.length === 0) return;
    const updated = tables.map((t) => {
      if (t.id === selectedTableId) {
        return {
          ...t,
          heldOrder: t.activeCart,
          activeCart: [],
          status: "AVAILABLE" as const,
        };
      }
      return t;
    });
    setTables(updated);
    saveToDisk("rms_tables", updated);
    alert(`Order for ${currentTable.name} has been Parked / Held.`);
  };

  const handleResumeOrder = () => {
    if (!currentTable.heldOrder || currentTable.heldOrder.length === 0) return;
    const updated = tables.map((t) => {
      if (t.id === selectedTableId) {
        return {
          ...t,
          activeCart: t.heldOrder!,
          heldOrder: undefined,
          status: "OCCUPIED" as const,
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
    const notes = itemCustomNote.trim() || undefined;
    const cartId = `${item.id}-${variantName || "base"}-${notes || "none"}`;

    const existingIndex = currentTable.activeCart.findIndex((ci) => ci.cartId === cartId);
    let updatedCart = [...currentTable.activeCart];

    if (existingIndex > -1) {
      updatedCart[existingIndex].qty += 1;
    } else {
      updatedCart.push({
        cartId,
        itemId: item.id,
        name: item.name,
        station: item.station || "Main Kitchen",
        variantName,
        price,
        qty: 1,
        notes,
      });
    }

    updateCurrentTableCart(updatedCart);
    setItemCustomNote("");
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

  // Calculations with Loyalty Points
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

  const pointsDiscount = useMemo(() => {
    if (!redeemPoints || !matchedCustomer) return 0;
    return Math.min(matchedCustomer.loyaltyPoints, Math.max(0, cartSubtotal - discountAmount));
  }, [redeemPoints, matchedCustomer, cartSubtotal, discountAmount]);

  const taxableAmount = Math.max(0, cartSubtotal - discountAmount - pointsDiscount);
  const halfTaxRate = branding.taxRate / 2;
  const cgstAmount = Number(((taxableAmount * halfTaxRate) / 100).toFixed(2));
  const sgstAmount = Number(((taxableAmount * halfTaxRate) / 100).toFixed(2));
  const finalPayable = Math.round(taxableAmount + cgstAmount + sgstAmount);

  const handleSplitCashChange = (val: string) => {
    setSplitCashAmount(val);
    const parsedCash = parseFloat(val) || 0;
    const remaining = Math.max(0, finalPayable - parsedCash);
    setSplitDigitalAmount(remaining.toString());
  };

  const handleSplitDigitalChange = (val: string) => {
    setSplitDigitalAmount(val);
    const parsedDigital = parseFloat(val) || 0;
    const remaining = Math.max(0, finalPayable - parsedDigital);
    setSplitCashAmount(remaining.toString());
  };

  const getUpiQrUrl = (amount: number) => {
    if (!branding.upiId) return "";
    const cleanUpi = branding.upiId.trim();
    const cleanName = branding.name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const exactAmount = Math.max(1, Math.round(amount));
    const upiPayload = `upi://pay?pa=${cleanUpi}&pn=${encodeURIComponent(cleanName)}&am=${exactAmount}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayload)}`;
  };

  const dispatchKOT = () => {
    if (currentTable.activeCart.length === 0) return;

    const newKOT: KOTTicket = {
      id: `KOT-${Date.now().toString().slice(-6)}`,
      kotNo: kotSequence,
      table: currentTable.name,
      channel: currentTable.orderChannel,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: currentTable.activeCart.map((i) => ({
        name: i.variantName ? `${i.name} (${i.variantName})` : i.name,
        qty: i.qty,
        station: i.station,
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
    setPrintEODSnapshot(null);
    setTimeout(() => window.print(), 150);
  };

  const settleBill = () => {
    if (cartSubtotal === 0) return;

    let finalSplitDetails: SplitPaymentDetail | undefined = undefined;
    if (activePaymentMode === "Split") {
      const c = parseFloat(splitCashAmount) || 0;
      const d = parseFloat(splitDigitalAmount) || 0;
      if (Math.round(c + d) !== finalPayable) {
        alert(`Split total (Cash ₹${c} + ${splitDigitalMethod} ₹${d} = ₹${c + d}) must equal Final Payable ₹${finalPayable}!`);
        return;
      }
      finalSplitDetails = { cash: c, digitalAmount: d, digitalMode: splitDigitalMethod };
    }

    const earnedPoints = Math.floor(finalPayable / 100);

    const invoice: SettledInvoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      invoiceNo: `INV/${new Date().getFullYear()}/${(invoices.length + 1).toString().padStart(4, "0")}`,
      date: new Date().toLocaleString(),
      table: currentTable.name,
      channel: currentTable.orderChannel,
      customerName: customerNameInput || currentTable.customerName || "Walk-in Guest",
      customerPhone: customerPhoneInput || currentTable.customerPhone,
      customerGst: customerGstInput || currentTable.customerGst,
      customerCompany: customerCompanyInput || currentTable.customerCompany,
      items: currentTable.activeCart,
      subtotal: cartSubtotal,
      discount: discountAmount,
      pointsRedeemed: pointsDiscount,
      cgst: cgstAmount,
      sgst: sgstAmount,
      grandTotal: finalPayable,
      paymentMode: activePaymentMode,
      splitDetails: finalSplitDetails,
      cashier: currentUserRole,
    };

    // Auto Deduct Recipe Ingredients
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

    // Update Customer CRM, Loyalty Points & Credit Balance
    if (customerPhoneInput) {
      const existingCust = customers.find((c) => c.phone === customerPhoneInput);
      let updatedCustList = [...customers];
      if (existingCust) {
        existingCust.totalSpent += finalPayable;
        existingCust.visits += 1;
        existingCust.companyName = customerCompanyInput || existingCust.companyName;
        existingCust.gstin = customerGstInput || existingCust.gstin;
        existingCust.loyaltyPoints = Math.max(0, existingCust.loyaltyPoints - pointsDiscount) + earnedPoints;
        if (activePaymentMode === "Credit") existingCust.creditBalance += finalPayable;
      } else {
        updatedCustList.push({
          phone: customerPhoneInput,
          name: customerNameInput || "Guest",
          companyName: customerCompanyInput,
          gstin: customerGstInput,
          totalSpent: finalPayable,
          visits: 1,
          loyaltyPoints: earnedPoints,
          creditBalance: activePaymentMode === "Credit" ? finalPayable : 0,
        });
      }
      setCustomers(updatedCustList);
      saveToDisk("rms_customers", updatedCustList);
    }

    const updatedInvoices = [invoice, ...invoices];
    setInvoices(updatedInvoices);
    saveToDisk("rms_invoices", updatedInvoices);

    // Free the active table
    const updatedTables = tables.map((t) => {
      if (t.id === selectedTableId) {
        return {
          ...t,
          status: "AVAILABLE" as const,
          activeCart: [],
          heldOrder: undefined,
          occupiedSince: undefined,
          customerName: undefined,
          customerPhone: undefined,
          customerGst: undefined,
          customerCompany: undefined,
        };
      }
      return t;
    });
    setTables(updatedTables);
    saveToDisk("rms_tables", updatedTables);

    setPrintInvoiceData(invoice);
    setPrintKOTData(null);
    setPrintEODSnapshot(null);
    setDiscountPercent(0);
    setDiscountFlat(0);
    setRedeemPoints(false);
    setSplitCashAmount("");
    setSplitDigitalAmount("");
    setCustomerNameInput("");
    setCustomerPhoneInput("");
    setCustomerGstInput("");
    setCustomerCompanyInput("");

    setTimeout(() => window.print(), 150);
  };

  // Udhar Payment Recovery
  const handleReceiveCreditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForCredit || !receivedAmountInput) return;

    const amt = parseFloat(receivedAmountInput);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    if (amt > selectedCustForCredit.creditBalance) {
      alert(`Amount cannot exceed outstanding balance of ₹${selectedCustForCredit.creditBalance}`);
      return;
    }

    const updatedCustList = customers.map((c) => {
      if (c.phone === selectedCustForCredit.phone) {
        return {
          ...c,
          creditBalance: Math.max(0, c.creditBalance - amt),
        };
      }
      return c;
    });
    setCustomers(updatedCustList);
    saveToDisk("rms_customers", updatedCustList);

    const collectionRecord: CreditCollection = {
      id: `CR-REC-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString(),
      customerPhone: selectedCustForCredit.phone,
      customerName: selectedCustForCredit.name,
      amount: amt,
      paymentMode: receivedPaymentMode,
      collectedBy: currentUserRole,
    };
    const updatedCollections = [collectionRecord, ...creditCollections];
    setCreditCollections(updatedCollections);
    saveToDisk("rms_credit_collections", updatedCollections);

    alert(`Payment of ₹${amt} received successfully from ${selectedCustForCredit.name}!`);
    setShowReceiveCreditModal(false);
    setSelectedCustForCredit(null);
    setReceivedAmountInput("");
  };

  // Admin Open Bill Edit
  const handleOpenBillEdit = (inv: SettledInvoice) => {
    if (currentUserRole !== "OWNER") {
      alert("Access Denied! Bill modification is strictly reserved for the Restaurant Owner (Admin).");
      return;
    }
    setEditingInvoice(inv);
    setEditCustomerName(inv.customerName || "");
    setEditCustomerPhone(inv.customerPhone || "");
    setEditPaymentMode(inv.paymentMode);
    setEditDiscountAmount(inv.discount);
    if (inv.splitDetails) {
      setEditSplitCash(inv.splitDetails.cash);
      setEditSplitDigital(inv.splitDetails.digitalAmount);
      setEditSplitDigitalMode(inv.splitDetails.digitalMode);
    } else {
      setEditSplitCash(0);
      setEditSplitDigital(0);
      setEditSplitDigitalMode("UPI");
    }
    setShowBillEditModal(true);
  };

  const handleSaveBillEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const newSubtotal = editingInvoice.subtotal;
    const newTaxable = Math.max(0, newSubtotal - editDiscountAmount);
    const halfTaxRate = branding.taxRate / 2;
    const newCgst = Number(((newTaxable * halfTaxRate) / 100).toFixed(2));
    const newSgst = Number(((newTaxable * halfTaxRate) / 100).toFixed(2));
    const newGrandTotal = Math.round(newTaxable + newCgst + newSgst);

    let newSplit: SplitPaymentDetail | undefined = undefined;
    if (editPaymentMode === "Split") {
      if (Math.round(editSplitCash + editSplitDigital) !== newGrandTotal) {
        alert(`Split total (₹${editSplitCash + editSplitDigital}) must equal Grand Total ₹${newGrandTotal}!`);
        return;
      }
      newSplit = { cash: editSplitCash, digitalAmount: editSplitDigital, digitalMode: editSplitDigitalMode };
    }

    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === editingInvoice.id) {
        return {
          ...inv,
          customerName: editCustomerName,
          customerPhone: editCustomerPhone,
          paymentMode: editPaymentMode,
          discount: editDiscountAmount,
          cgst: newCgst,
          sgst: newSgst,
          grandTotal: newGrandTotal,
          splitDetails: newSplit,
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    saveToDisk("rms_invoices", updatedInvoices);
    alert(`Bill ${editingInvoice.invoiceNo} successfully updated by Admin!`);
    setShowBillEditModal(false);
    setEditingInvoice(null);
  };

  // CSV Data Export for Accountant
  const handleExportCSV = () => {
    if (invoices.length === 0) {
      alert("No invoices to export!");
      return;
    }
    const headers = [
      "InvoiceNo",
      "Date",
      "Table",
      "Channel",
      "Customer",
      "Phone",
      "GSTIN",
      "Subtotal",
      "Discount",
      "CGST",
      "SGST",
      "GrandTotal",
      "PaymentMode",
      "Cashier",
    ];
    const rows = invoices.map((i) => [
      i.invoiceNo,
      `"${i.date}"`,
      `"${i.table}"`,
      i.channel,
      `"${i.customerName || "Guest"}"`,
      i.customerPhone || "",
      i.customerGst || "",
      i.subtotal,
      i.discount,
      i.cgst,
      i.sgst,
      i.grandTotal,
      i.paymentMode,
      i.cashier,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GST_Sales_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EOD Drawer Reconciliation Stats
  const eodStats = useMemo(() => {
    const totalCashSales = invoices.filter((i) => i.paymentMode === "Cash").reduce((s, i) => s + i.grandTotal, 0);
    const splitCashPart = invoices.filter((i) => i.paymentMode === "Split").reduce((s, i) => s + (i.splitDetails?.cash || 0), 0);
    const creditRecoveredCash = creditCollections.filter((c) => c.paymentMode === "Cash").reduce((s, c) => s + c.amount, 0);
    const cashExpenses = expenses.filter((e) => e.paymentMode === "Cash").reduce((s, e) => s + e.amount, 0);

    const expectedCashInDrawer = openingFloat + totalCashSales + splitCashPart + creditRecoveredCash - cashExpenses;

    const digitalSales =
      invoices.filter((i) => ["UPI", "Card"].includes(i.paymentMode)).reduce((s, i) => s + i.grandTotal, 0) +
      invoices.filter((i) => i.paymentMode === "Split").reduce((s, i) => s + (i.splitDetails?.digitalAmount || 0), 0) +
      creditCollections.filter((c) => c.paymentMode === "UPI").reduce((s, c) => s + c.amount, 0);

    return {
      openingFloat,
      totalCashInflow: totalCashSales + splitCashPart + creditRecoveredCash,
      cashExpenses,
      expectedCashInDrawer,
      digitalSales,
      totalRevenue: invoices.reduce((s, i) => s + i.grandTotal, 0),
    };
  }, [invoices, creditCollections, expenses, openingFloat]);

  const dashboardStats = useMemo(() => {
    const totalSales = invoices.reduce((s: number, i) => s + i.grandTotal, 0);
    const totalExpense = expenses.reduce((s: number, e) => s + e.amount, 0);

    const creditCollectedCash = creditCollections.filter((c) => c.paymentMode === "Cash").reduce((s: number, c) => s + c.amount, 0);
    const creditCollectedUPI = creditCollections.filter((c) => c.paymentMode === "UPI").reduce((s: number, c) => s + c.amount, 0);

    const pureCash = invoices.filter((i) => i.paymentMode === "Cash").reduce((s: number, i) => s + i.grandTotal, 0);
    const pureUpi = invoices.filter((i) => i.paymentMode === "UPI").reduce((s: number, i) => s + i.grandTotal, 0);
    const pureCard = invoices.filter((i) => i.paymentMode === "Card").reduce((s: number, i) => s + i.grandTotal, 0);

    const splitCashPart = invoices.filter((i) => i.paymentMode === "Split").reduce((s: number, i) => s + (i.splitDetails?.cash || 0), 0);
    const splitUpiPart = invoices.filter((i) => i.paymentMode === "Split" && i.splitDetails?.digitalMode === "UPI").reduce((s: number, i) => s + (i.splitDetails?.digitalAmount || 0), 0);
    const splitCardPart = invoices.filter((i) => i.paymentMode === "Split" && i.splitDetails?.digitalMode === "Card").reduce((s: number, i) => s + (i.splitDetails?.digitalAmount || 0), 0);

    const cashSales = pureCash + splitCashPart + creditCollectedCash;
    const upiSales = pureUpi + splitUpiPart + creditCollectedUPI;
    const cardSales = pureCard + splitCardPart;

    const currentOutstanding = customers.reduce((s: number, c) => s + c.creditBalance, 0);
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
      currentOutstanding,
      occupiedTables,
      tableOccupancyRate: tables.length > 0 ? Math.round((occupiedTables / tables.length) * 100) : 0,
      lowStockCount,
    };
  }, [invoices, expenses, tables, inventory, customers, creditCollections]);

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

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName || !newMenuPrice) return;

    const newItem: MenuItem = {
      id: `m_${Date.now()}`,
      name: newMenuName,
      category: newMenuCategory,
      station: newMenuStation,
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
      orderChannel: newTableChannel,
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
          ROLE PASSWORD / PIN VERIFICATION MODAL
      ========================================================================= */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Security Verification</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter PIN to switch to <span className="font-bold text-slate-800">{targetRole}</span>
              </p>
            </div>

            <form onSubmit={verifyPinAndSwitch} className="space-y-3">
              <input
                type="password"
                maxLength={6}
                required
                autoFocus
                placeholder="Enter PIN"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(false);
                }}
                className="w-full text-center text-lg tracking-widest font-black py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />

              {pinError && (
                <p className="text-[11px] text-red-600 font-bold flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Incorrect PIN. Access Denied.
                </p>
              )}

              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg text-left">
                <span className="font-bold block text-slate-500">Default PINs:</span>
                Owner: 1111 | Manager: 2222<br />Cashier: 3333 | Waiter: 4444<br />Chef: 5555 | Accountant: 6666
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
                >
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN ONLY BILL EDIT MODAL
      ========================================================================= */}
      {showBillEditModal && editingInvoice && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-base text-slate-900">Admin Bill Editor</h3>
              </div>
              <button
                onClick={() => {
                  setShowBillEditModal(false);
                  setEditingInvoice(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
              <p><span className="font-bold text-slate-700">Invoice:</span> {editingInvoice.invoiceNo}</p>
              <p><span className="font-bold text-slate-700">Table:</span> {editingInvoice.table}</p>
              <p><span className="font-bold text-slate-700">Subtotal:</span> {branding.currency} {editingInvoice.subtotal}</p>
            </div>

            <form onSubmit={handleSaveBillEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={editCustomerPhone}
                    onChange={(e) => setEditCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  value={editDiscountAmount}
                  onChange={(e) => setEditDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Payment Method</label>
                <select
                  value={editPaymentMode}
                  onChange={(e) => setEditPaymentMode(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-bold"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Credit">Credit (Udhar)</option>
                  <option value="Split">Split Payment</option>
                </select>
              </div>

              {editPaymentMode === "Split" && (
                <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600">Cash Part (₹)</label>
                      <input
                        type="number"
                        value={editSplitCash}
                        onChange={(e) => setEditSplitCash(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border rounded text-xs bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600">Digital Mode</label>
                      <select
                        value={editSplitDigitalMode}
                        onChange={(e) => setEditSplitDigitalMode(e.target.value as DigitalSplitMethod)}
                        className="w-full px-2 py-1 border rounded text-xs bg-white font-bold"
                      >
                        <option value="UPI">UPI (QR/GPay)</option>
                        <option value="Card">Card Swipe</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600">{editSplitDigitalMode} Part (₹)</label>
                    <input
                      type="number"
                      value={editSplitDigital}
                      onChange={(e) => setEditSplitDigital(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border rounded text-xs bg-white font-bold"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
              >
                Save & Update Invoice Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DIGITAL QR MENU GUEST PREVIEW MODAL
      ========================================================================= */}
      {showQrMenuModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-black uppercase text-slate-500">Guest Self-Ordering QR</span>
              <button onClick={() => setShowQrMenuModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `https://${typeof window !== "undefined" ? window.location.host : "restaurant"}/menu?table=${currentTable.name}`
                )}`}
                alt="Table QR"
                className="w-40 h-40 bg-white p-2 rounded-xl shadow-sm border"
              />
              <h4 className="font-black text-base text-slate-900 mt-3">{currentTable.name} Digital Standee</h4>
              <p className="text-[11px] text-slate-500">Scan to view contactless live menu & order</p>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Table QR Standee
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          RECEIVE CREDIT PAYMENT (UDHAR RECOVERY) MODAL
      ========================================================================= */}
      {showReceiveCreditModal && selectedCustForCredit && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">Receive Credit Payment</h3>
              </div>
              <button
                onClick={() => {
                  setShowReceiveCreditModal(false);
                  setSelectedCustForCredit(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
              <p><span className="font-bold text-slate-700">Customer:</span> {selectedCustForCredit.name}</p>
              <p><span className="font-bold text-slate-700">Phone:</span> {selectedCustForCredit.phone}</p>
              <p className="font-bold text-rose-600 text-sm pt-1">
                Outstanding Udhar: {branding.currency} {selectedCustForCredit.creditBalance}
              </p>
            </div>

            <form onSubmit={handleReceiveCreditPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Amount Receiving (₹)</label>
                <input
                  type="number"
                  required
                  autoFocus
                  max={selectedCustForCredit.creditBalance}
                  placeholder={`Max ₹${selectedCustForCredit.creditBalance}`}
                  value={receivedAmountInput}
                  onChange={(e) => setReceivedAmountInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Received Payment Via</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Cash", "UPI"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setReceivedPaymentMode(mode)}
                      className={`py-2 rounded-xl border font-bold transition flex items-center justify-center gap-1.5 ${
                        receivedPaymentMode === mode
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {mode === "Cash" ? <Banknote className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-md"
              >
                Confirm Payment & Update Balance
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          PRINT ONLY THERMAL SLIP ENGINE (B2B Tax Invoice, KOT, & EOD Z-Report)
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
              <p className="text-[9px] uppercase font-bold mt-1">*** {printInvoiceData.customerGst ? "B2B TAX INVOICE" : "TAX INVOICE"} ***</p>
            </div>

            <div className="flex justify-between text-[10px] pt-1 border-b border-black pb-1">
              <div>
                <p><span className="font-bold">Bill No:</span> {printInvoiceData.invoiceNo}</p>
                <p><span className="font-bold">Channel:</span> {printInvoiceData.channel} ({printInvoiceData.table})</p>
                {printInvoiceData.customerName && <p><span className="font-bold">Guest:</span> {printInvoiceData.customerName}</p>}
                {printInvoiceData.customerCompany && <p><span className="font-bold">B2B:</span> {printInvoiceData.customerCompany}</p>}
                {printInvoiceData.customerGst && <p><span className="font-bold">GST:</span> {printInvoiceData.customerGst}</p>}
              </div>
              <div className="text-right">
                <p>{printInvoiceData.date.split(",")[0]}</p>
                <p>{printInvoiceData.date.split(",")[1]}</p>
                <p className="font-bold">
                  Mode: {printInvoiceData.paymentMode}
                  {printInvoiceData.paymentMode === "Split" && printInvoiceData.splitDetails && (
                    <span className="block text-[8px] font-normal">
                      [Cash ₹{printInvoiceData.splitDetails.cash} + {printInvoiceData.splitDetails.digitalMode} ₹{printInvoiceData.splitDetails.digitalAmount}]
                    </span>
                  )}
                </p>
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
                      {it.notes && <span className="block text-[8px] italic">Note: {it.notes}</span>}
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
              {printInvoiceData.pointsRedeemed && printInvoiceData.pointsRedeemed > 0 ? (
                <div className="flex justify-between font-semibold text-emerald-600">
                  <span>Loyalty Points Redeemed:</span>
                  <span>- {branding.currency} {printInvoiceData.pointsRedeemed}</span>
                </div>
              ) : null}
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
                <p className="text-[9px] font-bold mb-1">
                  Scan to Pay exact {branding.currency} {printInvoiceData.grandTotal} via UPI
                </p>
                <img
                  src={getUpiQrUrl(printInvoiceData.grandTotal)}
                  alt="UPI QR"
                  className="w-24 h-24 mx-auto my-1 border p-0.5"
                />
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
              <p className="text-xs font-black mt-1">ORDER: {printKOTData.channel} - {printKOTData.table}</p>
              <p className="text-[9px]">{printKOTData.timestamp}</p>
            </div>

            <table className="w-full text-left text-xs my-2">
              <thead>
                <tr className="border-b border-black font-black">
                  <th className="py-1">Ordered Item</th>
                  <th className="text-center py-1">Station</th>
                  <th className="text-right py-1">Qty</th>
                </tr>
              </thead>
              <tbody>
                {printKOTData.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-dashed border-slate-400">
                    <td className="py-1.5 font-bold">
                      {it.name}
                      {it.notes && <span className="block text-[9px] font-black text-rose-700 uppercase">★ {it.notes}</span>}
                    </td>
                    <td className="text-center py-1.5 text-[9px]">{it.station}</td>
                    <td className="text-right py-1.5 font-black text-sm">× {it.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-2 border-t border-black text-[10px] font-bold">
              Dispatch to Respective Kitchen Station Immediately
            </div>
          </div>
        )}

        {printEODSnapshot && (
          <div className="space-y-2 text-center">
            <div className="border-b-2 border-black pb-2">
              <h2 className="text-sm font-black uppercase">*** END OF DAY (Z-REPORT) ***</h2>
              <p className="text-[10px]">{branding.name}</p>
              <p className="text-[9px]">{new Date().toLocaleString()}</p>
            </div>

            <div className="text-left text-xs space-y-1.5 py-2">
              <div className="flex justify-between">
                <span>Opening Cash Float:</span>
                <span className="font-bold">₹{printEODSnapshot.openingFloat}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cash Inflow:</span>
                <span className="font-bold">+ ₹{printEODSnapshot.totalCashInflow}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Paid Out Cash Expenses:</span>
                <span className="font-bold">- ₹{printEODSnapshot.cashExpenses}</span>
              </div>
              <div className="flex justify-between border-t border-black pt-1 font-black text-sm">
                <span>EXPECTED DRAWER CASH:</span>
                <span>₹{printEODSnapshot.expectedCashInDrawer}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-400 pt-1">
                <span>Digital / Online UPI Revenue:</span>
                <span className="font-bold">₹{printEODSnapshot.digitalSales}</span>
              </div>
              <div className="flex justify-between font-black">
                <span>TOTAL GROSS TURNOVER:</span>
                <span>₹{printEODSnapshot.totalRevenue}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-black text-[9px] font-bold">
              Verified by: {currentUserRole} Signature: ________________
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALS: MENU / TABLE / INVENTORY FORMS
      ========================================================================= */}
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
                  placeholder="e.g. Masala Dosa, Tandoori Roti, Cold Coffee"
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
                    placeholder="e.g. Main Course, Starters"
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Kitchen Station Routing</label>
                  <select
                    value={newMenuStation}
                    onChange={(e) => setNewMenuStation(e.target.value as KitchenStation)}
                    className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                  >
                    <option value="Main Kitchen">Main Kitchen</option>
                    <option value="Tandoor">Tandoor Section</option>
                    <option value="Bar/Beverages">Bar & Beverages</option>
                    <option value="Bakery/Desserts">Bakery / Desserts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
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

      {showAddTableModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-lg text-slate-900">Add Table / Counter</h3>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Channel Type</label>
                  <select
                    value={newTableChannel}
                    onChange={(e) => setNewTableChannel(e.target.value as OrderChannel)}
                    className="w-full px-2 py-2 border rounded-xl bg-white font-bold"
                  >
                    <option value="Dine-in">Dine-in</option>
                    <option value="Takeaway">Takeaway</option>
                    <option value="Swiggy">Swiggy</option>
                    <option value="Zomato">Zomato</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Guest Capacity</label>
                  <input
                    type="number"
                    required
                    placeholder="4"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
              >
                Create Table / Channel
              </button>
            </form>
          </div>
        </div>
      )}

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
                  <label className="font-bold text-slate-600 block mb-1">Unit</label>
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
                  <label className="font-bold text-slate-600 block mb-1">Low Stock Warning</label>
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
          SCREEN APP VIEW
      ========================================================================= */}
      <div className="min-h-screen bg-slate-100 flex flex-col print:hidden font-sans text-slate-900">
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQrMenuModal(true)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Table Self Ordering Menu"
            >
              <QrCode className="w-3.5 h-3.5" /> Table Standee QR
            </button>

            <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-white/60 px-1 hidden sm:inline flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Role:
              </span>
              <select
                value={currentUserRole}
                onChange={(e) => requestRoleSwitch(e.target.value as UserRole)}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs py-1 px-2 rounded-lg border border-white/20 focus:outline-none cursor-pointer"
              >
                <option value="OWNER" className="text-slate-900">Owner (Admin)</option>
                <option value="MANAGER" className="text-slate-900">Manager</option>
                <option value="CASHIER" className="text-slate-900">Cashier</option>
                <option value="WAITER" className="text-slate-900">Waiter</option>
                <option value="CHEF" className="text-slate-900">Chef (KDS)</option>
                <option value="ACCOUNTANT" className="text-slate-900">Accountant</option>
              </select>
            </div>
          </div>
        </header>

        {/* Global Navigation - STRICT ROLE PERMISSION FILTER */}
        <nav className="bg-white border-b border-slate-200 px-4 md:px-6 flex gap-1 overflow-x-auto text-xs font-bold">
          {[
            { id: "POS", label: "POS Billing", icon: ShoppingBag },
            { id: "MENU_MGMT", label: "Menu Catalog", icon: Edit },
            { id: "TABLES", label: "Tables & Channels", icon: UtensilsCrossed },
            { id: "KDS", label: "Kitchen KDS", icon: ChefHat },
            { id: "INVENTORY", label: "Inventory Stock", icon: Boxes },
            { id: "DASHBOARD", label: "Executive Analytics", icon: LayoutDashboard },
            { id: "EOD", label: "EOD Cash Drawer", icon: Banknote },
            { id: "EXPENSES", label: "Expenses & P&L", icon: Wallet },
            { id: "CUSTOMERS", label: "CRM & Udhar", icon: Users },
            { id: "AUDIT", label: "Invoices Audit", icon: Receipt },
            { id: "SETTINGS", label: "Branding & GST", icon: Settings },
          ]
            .filter((tab) => roleAllowedModules[currentUserRole].includes(tab.id))
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

        {/* MODULE: MENU CATALOG */}
        {activeModule === "MENU_MGMT" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Complete Menu Management</h2>
                <p className="text-xs text-slate-500">Configure kitchen station routing, dietary tags, and portion prices</p>
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
                      <th className="py-2">Station Routing</th>
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.station}
                          </span>
                        </td>
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

        {/* MODULE: POS BILLING */}
        {activeModule === "POS" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              {/* Tables & Order Channels Selector */}
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <UtensilsCrossed className="w-3.5 h-3.5" /> Channel: {currentTable.orderChannel} • {currentTable.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {["OWNER", "MANAGER"].includes(currentUserRole) && (
                      <button
                        onClick={() => setShowAddTableModal(true)}
                        className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Table/Channel
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {tables.map((tbl) => {
                    const isSelected = selectedTableId === tbl.id;
                    const hasItems = tbl.activeCart.length > 0;
                    const isParked = tbl.heldOrder && tbl.heldOrder.length > 0;
                    return (
                      <button
                        key={tbl.id}
                        onClick={() => setSelectedTableId(tbl.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : isParked
                            ? "bg-purple-100 text-purple-900 border-purple-300"
                            : hasItems
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <span>{tbl.name}</span>
                        {hasItems && <span className="text-[10px]">({tbl.activeCart.length})</span>}
                        {isParked && <PauseCircle className="w-3 h-3 text-purple-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cooking Instruction & Search Bar */}
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
                  <input
                    type="text"
                    placeholder="Cooking Note (e.g. Less Spicy, No Onion)"
                    value={itemCustomNote}
                    onChange={(e) => setItemCustomNote(e.target.value)}
                    className="w-56 px-3 py-2 border rounded-xl text-xs bg-amber-50/60 font-semibold text-amber-950 placeholder:text-amber-800/60"
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
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center ${
                              item.isVeg ? "border-green-600" : "border-red-600"
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                          </div>
                          <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {item.station}
                        </span>
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

            {/* Right Terminal: Customer, B2B GST, Loyalty & Settlement */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-base text-slate-900">Order Terminal</h3>
                    <p className="text-[10px] text-slate-500">
                      Channel: {currentTable.orderChannel} • Table: {currentTable.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentTable.heldOrder && (
                      <button
                        onClick={handleResumeOrder}
                        className="text-xs text-purple-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Resume Held
                      </button>
                    )}
                    {currentTable.activeCart.length > 0 && (
                      <>
                        <button
                          onClick={handleParkOrder}
                          className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <PauseCircle className="w-3.5 h-3.5" /> Hold
                        </button>
                        <button
                          onClick={() => updateCurrentTableCart([])}
                          className="text-xs text-red-600 font-bold hover:underline"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Customer CRM & B2B GST Details */}
                <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="tel"
                      placeholder="Mobile Phone (CRM)"
                      value={customerPhoneInput}
                      onChange={(e) => setCustomerPhoneInput(e.target.value)}
                      className="px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Guest / Contact Name"
                      value={customerNameInput}
                      onChange={(e) => setCustomerNameInput(e.target.value)}
                      className="px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Company Name (B2B Tax)"
                      value={customerCompanyInput}
                      onChange={(e) => setCustomerCompanyInput(e.target.value)}
                      className="px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Client GSTIN (15-digit)"
                      value={customerGstInput}
                      onChange={(e) => setCustomerGstInput(e.target.value)}
                      className="px-2.5 py-1.5 border rounded-lg text-xs bg-white font-mono uppercase"
                    />
                  </div>

                  {matchedCustomer && (
                    <div className="flex justify-between items-center pt-1 text-[11px] border-t border-slate-200">
                      <span className="text-slate-600 flex items-center gap-1 font-bold">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> Points: {matchedCustomer.loyaltyPoints}
                      </span>
                      {matchedCustomer.loyaltyPoints > 0 && (
                        <label className="flex items-center gap-1 font-bold text-emerald-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={redeemPoints}
                            onChange={(e) => setRedeemPoints(e.target.checked)}
                          />
                          <span>Redeem Points</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Cart list */}
                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
                  {currentTable.activeCart.length === 0 ? (
                    <p className="text-xs text-slate-400 py-10 text-center">No dishes added to {currentTable.name}.</p>
                  ) : (
                    currentTable.activeCart.map((it) => (
                      <div key={it.cartId} className="py-2 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">
                            {it.name} {it.variantName && <span className="text-[10px] text-slate-500 font-medium">({it.variantName})</span>}
                          </p>
                          {it.notes && (
                            <p className="text-[10px] font-black text-rose-600 uppercase">★ {it.notes}</p>
                          )}
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
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Loyalty Points Redeemed:</span>
                      <span>- {branding.currency} {pointsDiscount}</span>
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
                        onClick={() => {
                          setActivePaymentMode(m);
                          if (m === "Split") {
                            const half = Math.round(finalPayable / 2);
                            setSplitCashAmount(half.toString());
                            setSplitDigitalAmount((finalPayable - half).toString());
                          }
                        }}
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

                {/* Dynamic QR Box */}
                {activePaymentMode === "UPI" && branding.upiId && finalPayable > 0 && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <img
                      src={getUpiQrUrl(finalPayable)}
                      alt="Scan UPI QR"
                      className="w-16 h-16 bg-white p-1 rounded-lg border border-emerald-200 shadow-sm"
                    />
                    <div className="text-[11px]">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black uppercase">
                        Instant Dynamic QR
                      </span>
                      <p className="font-extrabold text-slate-900 mt-1">Scan to Pay Exact Amount</p>
                      <p className="text-emerald-700 font-mono text-[10px]">{branding.upiId}</p>
                      <p className="font-black text-xs text-slate-900 mt-0.5">Payable: {branding.currency} {finalPayable}</p>
                    </div>
                  </div>
                )}

                {/* Split Calculation */}
                {activePaymentMode === "Split" && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>Total Bill: ₹{finalPayable}</span>
                      <span className="text-rose-600 font-black">
                        Difference: ₹{Math.max(0, finalPayable - ((parseFloat(splitCashAmount) || 0) + (parseFloat(splitDigitalAmount) || 0)))}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500">Cash Part (₹)</label>
                        <input
                          type="number"
                          placeholder="Cash ₹"
                          value={splitCashAmount}
                          onChange={(e) => handleSplitCashChange(e.target.value)}
                          className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500">Digital Method</label>
                        <select
                          value={splitDigitalMethod}
                          onChange={(e) => setSplitDigitalMethod(e.target.value as DigitalSplitMethod)}
                          className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white font-bold"
                        >
                          <option value="UPI">UPI (PhonePe/GPay)</option>
                          <option value="Card">Card Swipe</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500">{splitDigitalMethod} Part (₹)</label>
                      <input
                        type="number"
                        placeholder={`${splitDigitalMethod} ₹`}
                        value={splitDigitalAmount}
                        onChange={(e) => handleSplitDigitalChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white font-bold"
                      />
                    </div>
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

        {/* MODULE: MULTI-STATION KITCHEN DISPLAY SCREEN (KDS) */}
        {activeModule === "KDS" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ChefHat className="w-6 h-6 text-rose-600" /> Kitchen Display Screen (KDS)
                </h2>
                <p className="text-xs text-slate-500">Live order tickets with multi-station routing filters</p>
              </div>

              {/* Station Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {["All Stations", "Main Kitchen", "Tandoor", "Bar/Beverages", "Bakery/Desserts"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setKdsStationFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      kdsStationFilter === st ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {activeKOTs.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Pending Kitchen Orders!</h3>
                <p className="text-xs text-slate-400 mt-1">Orders punched from POS will appear here automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeKOTs
                  .filter((k) => {
                    if (kdsStationFilter === "All Stations") return true;
                    return k.items.some((i) => i.station === kdsStationFilter);
                  })
                  .map((k) => (
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
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900">KOT #{k.kotNo}</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-bold">{k.channel}</span>
                            </div>
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
                          {k.items
                            .filter((it) => kdsStationFilter === "All Stations" || it.station === kdsStationFilter)
                            .map((it, idx) => (
                              <div key={idx} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-800">{it.name}</span>
                                  <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-900 font-bold">
                                    × {it.qty}
                                  </span>
                                </div>
                                {it.notes && (
                                  <span className="block text-[10px] font-black text-rose-600 uppercase mt-0.5">
                                    ★ Instruction: {it.notes}
                                  </span>
                                )}
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

        {/* MODULE: EOD CASH DRAWER RECONCILIATION */}
        {activeModule === "EOD" && (
          <main className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Banknote className="w-6 h-6 text-emerald-600" /> End-of-Day (EOD) Cash Drawer Reconciliation
                  </h2>
                  <p className="text-xs text-slate-500">Z-Report shift closing calculations and physical cash match</p>
                </div>
                <button
                  onClick={() => {
                    setPrintEODSnapshot(eodStats);
                    setPrintInvoiceData(null);
                    setPrintKOTData(null);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Z-Report Slip
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Opening Cash Float</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-black">₹</span>
                    <input
                      type="number"
                      value={openingFloat}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setOpeningFloat(val);
                        localStorage.setItem("rms_opening_float", val.toString());
                      }}
                      className="text-xl font-black w-full border rounded-lg px-2 py-0.5 bg-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Cash Inflows (Sales + Udhar)</span>
                  <p className="text-2xl font-black text-emerald-900 mt-1">+ ₹{eodStats.totalCashInflow}</p>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                  <span className="text-[10px] font-bold uppercase text-rose-700">Paid Cash Expenses</span>
                  <p className="text-2xl font-black text-rose-900 mt-1">- ₹{eodStats.cashExpenses}</p>
                </div>
              </div>

              <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <span className="text-xs font-bold text-white/60 uppercase">Expected Physical Cash In Drawer</span>
                  <h3 className="text-3xl font-black mt-1">₹{eodStats.expectedCashInDrawer}</h3>
                  <p className="text-xs text-white/70 mt-1">Opening Float + Cash Sales - Cash Expenses</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white/60 uppercase">Digital Online Collections</span>
                  <h4 className="text-2xl font-black text-emerald-400 mt-0.5">₹{eodStats.digitalSales}</h4>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* MODULE: TABLES FLOOR PLAN */}
        {activeModule === "TABLES" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Floor Tables & Omnichannel Channels</h2>
                <p className="text-xs text-slate-500">Monitor live occupancy, delivery channels, and guest tables</p>
              </div>
              {["OWNER", "MANAGER"].includes(currentUserRole) && (
                <button
                  onClick={() => setShowAddTableModal(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4" /> Add Table / Channel
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tables.map((tbl) => {
                const isOccupied = tbl.status === "OCCUPIED";
                const isHeld = tbl.heldOrder && tbl.heldOrder.length > 0;
                return (
                  <div
                    key={tbl.id}
                    className={`bg-white rounded-2xl p-5 border shadow-sm transition flex flex-col justify-between ${
                      isHeld
                        ? "border-purple-300 ring-2 ring-purple-100"
                        : isOccupied
                        ? "border-amber-300 ring-2 ring-amber-100"
                        : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900">{tbl.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-600">
                            {tbl.orderChannel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isHeld
                                ? "bg-purple-100 text-purple-800"
                                : isOccupied
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isHeld ? "HELD" : tbl.status}
                          </span>
                          {["OWNER", "MANAGER"].includes(currentUserRole) && (
                            <button onClick={() => handleDeleteTable(tbl.id)} className="text-slate-300 hover:text-red-500 p-0.5">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Capacity: {tbl.capacity} Persons</p>
                      {isOccupied && (
                        <div className="mt-3 p-2 bg-slate-50 rounded-xl space-y-1 text-xs">
                          <p className="text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Seated: {tbl.occupiedSince || "Just now"}
                          </p>
                          <p className="font-bold text-slate-800">
                            Active Items: {tbl.activeCart.reduce((s: number, i) => s + i.qty, 0)} dishes
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
                        {isOccupied ? "Manage Order / Bill" : isHeld ? "Resume Parked Order" : "Punch Order"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}

        {/* MODULE: INVENTORY */}
        {activeModule === "INVENTORY" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">Inventory & Raw Materials</h2>
                <p className="text-xs text-slate-500">Auto-deduction on orders and low stock threshold warnings</p>
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

        {/* MODULE: DASHBOARD */}
        {activeModule === "DASHBOARD" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">Executive Performance Dashboard</h2>
                <p className="text-xs text-slate-500">Live consolidated financial reports & floor metrics</p>
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
                <span className="text-[11px] font-bold text-slate-400 uppercase">Current Outstanding Udhar</span>
                <p className="text-2xl font-black text-rose-600 mt-1">{branding.currency} {dashboardStats.currentOutstanding}</p>
                <span className="text-[10px] text-slate-500 font-medium mt-1">Pending customer recovery</span>
              </div>
            </div>

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
                </div>
              </div>

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

        {/* MODULE: EXPENSES */}
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

        {/* MODULE: CUSTOMERS CRM & UDHAR */}
        {activeModule === "CUSTOMERS" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Customer CRM, Loyalty Points & Credit Ledger</h2>
                  <p className="text-xs text-slate-500">Track loyalty rewards, B2B companies, and clear pending credit dues</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase font-bold border-b pb-2">
                      <th className="py-2">Customer Name</th>
                      <th className="py-2">Mobile Phone</th>
                      <th className="py-2">Company / GSTIN</th>
                      <th className="py-2">Loyalty Points</th>
                      <th className="py-2">Lifetime Spent</th>
                      <th className="py-2">Outstanding Udhar</th>
                      <th className="py-2 text-right">Credit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No customers recorded yet. Add customer phone numbers during billing to build CRM.
                        </td>
                      </tr>
                    ) : (
                      customers.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">{cust.name}</td>
                          <td className="py-3 text-slate-600 font-mono">{cust.phone}</td>
                          <td className="py-3 text-slate-600">
                            {cust.companyName || cust.gstin ? `${cust.companyName || ""} (${cust.gstin || ""})` : "Individual"}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                              ★ {cust.loyaltyPoints} pts
                            </span>
                          </td>
                          <td className="py-3 font-bold text-slate-900">{branding.currency} {cust.totalSpent}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-lg font-black ${cust.creditBalance > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                              {branding.currency} {cust.creditBalance}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {cust.creditBalance > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedCustForCredit(cust);
                                  setReceivedAmountInput(cust.creditBalance.toString());
                                  setShowReceiveCreditModal(true);
                                }}
                                className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition flex items-center gap-1 ml-auto"
                              >
                                <HandCoins className="w-3.5 h-3.5" /> Receive Payment
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold">All Dues Cleared</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* MODULE: AUDIT (WITH CSV EXPORT & ADMIN BILL EDIT) */}
        {activeModule === "AUDIT" && (
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-slate-600" /> Settled Invoices Audit
                  </h2>
                  <p className="text-xs text-slate-500">Tax invoices with B2B corporate details and payment breakdowns</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Download CA Sales CSV Report
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase font-bold border-b pb-2">
                      <th className="py-2">Invoice No</th>
                      <th className="py-2">Date & Time</th>
                      <th className="py-2">Channel / Table</th>
                      <th className="py-2">Customer / B2B</th>
                      <th className="py-2">Payment Breakdown</th>
                      <th className="py-2 text-right">CGST</th>
                      <th className="py-2 text-right">SGST</th>
                      <th className="py-2 text-right">Grand Total</th>
                      <th className="py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-3 font-mono font-bold text-slate-900">{inv.invoiceNo}</td>
                        <td className="py-3 text-slate-500">{inv.date}</td>
                        <td className="py-3 font-semibold text-slate-700">
                          {inv.channel} ({inv.table})
                        </td>
                        <td className="py-3 text-slate-600">
                          <span className="font-bold text-slate-900 block">{inv.customerName || "Guest"}</span>
                          {inv.customerCompany && <span className="text-[10px] text-blue-600 block">{inv.customerCompany}</span>}
                          {inv.customerGst && <span className="text-[10px] text-slate-400 font-mono block">GSTIN: {inv.customerGst}</span>}
                        </td>
                        <td className="py-3">
                          {inv.paymentMode === "Split" && inv.splitDetails ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 block w-fit">
                              Cash: ₹{inv.splitDetails.cash} + {inv.splitDetails.digitalMode}: ₹{inv.splitDetails.digitalAmount}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              {inv.paymentMode}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">{branding.currency} {inv.cgst}</td>
                        <td className="py-3 text-right">{branding.currency} {inv.sgst}</td>
                        <td className="py-3 text-right font-black text-slate-900">{branding.currency} {inv.grandTotal}</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setPrintInvoiceData(inv);
                                setPrintKOTData(null);
                                setPrintEODSnapshot(null);
                                setTimeout(() => window.print(), 100);
                              }}
                              className="p-1 hover:text-rose-600 text-slate-600"
                              title="Reprint Bill"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {currentUserRole === "OWNER" && (
                              <button
                                onClick={() => handleOpenBillEdit(inv)}
                                className="p-1 hover:text-blue-600 text-slate-600"
                                title="Edit Bill (Admin)"
                              >
                                <FileEdit className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* MODULE: SETTINGS (ADMIN ONLY) */}
        {activeModule === "SETTINGS" && (
          <main className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
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

            {/* Custom Role PINs Configuration (Owner Only) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-rose-600" /> Employee Role Security PINs
              </h3>
              <p className="text-xs text-slate-500 mb-4">Set security PINs to prevent staff from accessing admin zones</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {(["OWNER", "MANAGER", "CASHIER", "WAITER", "CHEF", "ACCOUNTANT"] as UserRole[]).map((r) => (
                  <div key={r} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="font-bold text-slate-600 uppercase block mb-1 text-[10px]">{r} PIN</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={rolePins[r]}
                      onChange={(e) => {
                        const updated = { ...rolePins, [r]: e.target.value };
                        setRolePins(updated);
                        saveToDisk("rms_role_pins", updated);
                      }}
                      className="w-full px-2 py-1.5 border rounded-lg bg-white font-mono font-bold text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Admin-Only Danger Zone for Software Reset */}
            <div className="bg-red-50 p-6 rounded-2xl border border-red-200 space-y-2">
              <h3 className="text-base font-black text-red-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-600" /> Admin Only: Factory Data Reset
              </h3>
              <p className="text-xs text-red-700">
                This will wipe out all local bills, customers, menu items, and inventory to restore default empty state.
              </p>
              <button
                type="button"
                onClick={handleAdminResetData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                Reset Database & Demo Data
              </button>
            </div>
          </main>
        )}
      </div>
    </>
  );
}
