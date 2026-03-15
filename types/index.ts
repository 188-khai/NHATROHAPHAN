export type RoomStatus = 'available' | 'rented' | 'maintenance';

export interface Room {
    id: string; // e.g., '101'
    roomNumber: string;
    price: number;
    status: RoomStatus;
    tenantIds: string[]; // Linked tenants
}

export interface Tenant {
    id: string;
    name: string;
    phone: string;
    startDate: string; // ISO date string
    deposit: number;
    roomId: string; // Keep referencing room for reverse lookup if needed
    identityCardImage?: string; // Base64 string
}

export interface Bill {
    id: string;
    roomId: string;
    date: string; // ISO date string for billing period
    electricityOld: number;
    electricityNew: number;
    waterOld?: number; // Not used for cost now
    waterNew?: number; // Not used for cost now
    electricityRate: number; // 3500
    waterRate: number; // 30000 per person
    garbageFee: number; // 20000
    wifiFee?: number; // 50000
    otherServices?: { name: string; amount: number }[];
    totalAmount: number;
    isPaid: boolean;
}

export type ServiceUnit = 'kwh' | 'person' | 'month' | 'room';

export interface ServiceRate {
    id: string;
    name: string;
    amount: number;
    unit: ServiceUnit;
    description?: string;
}

export type AssetStatus = 'new' | 'good' | 'maintenance' | 'broken';
export type AssetType = 'sofa' | 'ac' | 'cupboard' | 'bed' | 'mattress' | 'general';
export type SofaMaterial = 'leather' | 'velvet' | 'fabric';

export interface Asset {
    id: string;
    roomId: string;
    name: string;
    type: AssetType;
    installDate: string;
    lastMaintenanceDate?: string;
    status: AssetStatus;
    cost?: number;
    specifications?: {
        material?: SofaMaterial;
        color?: string;
        technicalNotes?: string;
    };
    maintenanceIntervalMonths?: number;
    image?: string; // Base64 string for asset image
    history?: {
        date: string;
        action: 'check-in' | 'check-out' | 'maintenance' | 'issue';
        note?: string;
    }[];
}

export interface WorkPerformanceV2 {
    id: string; // uuid
    monthYear: string; // format "MM-YYYY"
    daysWorked: number;
    otNormalHours: number;
    otSundayHours: number;
    kpiIncome: number;
    totalIncome: number;
    totalExpense: number;
    userId?: string;
}

export type ExpenseCategory = 'Ăn uống' | 'Di chuyển' | 'Mua sắm' | 'Giải trí' | 'Sinh hoạt' | 'Khác';

export interface FinanceTransaction {
    id: string; // uuid
    performanceId: string;
    amount: number;
    category: ExpenseCategory;
    note: string;
    transactionDate: string; // ISO format
    userId?: string;
}

export interface WorkPerformance {
    id: string; // uuid
    monthYear: string; // format "MM-YYYY"
    daysWorked: number;
    otHours: number;
    currentIncome: number;
    userId?: string;
}

export type TaxPaymentFrequency = 'monthly' | 'quarterly' | 'yearly';
export type TaxClassificationAction = 'Dịch Vụ Lưu Trú' | 'Cho Thuê Tài Sản';

export interface TaxSettings {
    id: string; // uuid
    userId?: string;
    year: number; // e.g., 2026
    expectedRoomCount: number;
    expectedAvgPrice: number;
    paymentFrequency: TaxPaymentFrequency;
    servicesIncluded: string[]; // e.g., ['Dọn phòng', 'Lễ tân']
    isShortTerm: boolean;
    classification: TaxClassificationAction;
    createdAt: string;
    updatedAt: string;
}
