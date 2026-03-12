import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Room, Tenant, Bill, Asset, TaxSettings } from "@/types";
import { useAuth } from "@/components/AuthProvider";

// Mappers to convert DB (snake_case) <-> App (camelCase)

const mapRoomFromDB = (data: any): Room => ({
    id: data.id,
    roomNumber: data.room_number,
    price: data.price,
    status: data.status,
    tenantIds: data.tenant_ids || [],
});

const mapRoomToDB = (room: Room) => ({
    id: room.id,
    room_number: room.roomNumber,
    price: room.price,
    status: room.status,
    tenant_ids: room.tenantIds,
});

const mapTenantFromDB = (data: any): Tenant => ({
    id: data.id,
    name: data.name,
    phone: data.phone,
    startDate: data.start_date,
    deposit: data.deposit,
    roomId: data.room_id,
    identityCardImage: data.identity_card_image,
});

const mapTenantToDB = (tenant: Tenant) => ({
    id: tenant.id,
    name: tenant.name,
    phone: tenant.phone,
    start_date: tenant.startDate,
    deposit: tenant.deposit,
    room_id: tenant.roomId,
    identity_card_image: tenant.identityCardImage,
});

const mapBillFromDB = (data: any): Bill => ({
    id: data.id,
    roomId: data.room_id,
    date: data.date,
    electricityOld: data.electricity_old,
    electricityNew: data.electricity_new,
    electricityRate: data.electricity_rate,
    waterRate: data.water_rate,
    garbageFee: data.garbage_fee,
    totalAmount: data.total_amount,
    isPaid: data.is_paid,
    waterOld: data.water_old,
    waterNew: data.water_new
});

const mapBillToDB = (bill: Bill) => ({
    id: bill.id,
    room_id: bill.roomId,
    date: bill.date,
    electricity_old: bill.electricityOld,
    electricity_new: bill.electricityNew,
    electricity_rate: bill.electricityRate,
    water_rate: bill.waterRate,
    garbage_fee: bill.garbageFee,
    total_amount: bill.totalAmount,
    is_paid: bill.isPaid,
    water_old: bill.waterOld,
    water_new: bill.waterNew
});

const mapAssetFromDB = (data: any): Asset => ({
    id: data.id,
    roomId: data.room_id,
    name: data.name,
    type: data.type,
    installDate: data.install_date,
    lastMaintenanceDate: data.last_maintenance_date,
    status: data.status,
    cost: data.cost,
    maintenanceIntervalMonths: data.maintenance_interval_months,
    specifications: data.specifications,
    history: data.history,
    image: data.image,
});

const mapAssetToDB = (asset: Asset) => ({
    id: asset.id,
    room_id: asset.roomId,
    name: asset.name,
    type: asset.type,
    install_date: asset.installDate,
    last_maintenance_date: asset.lastMaintenanceDate,
    status: asset.status,
    cost: asset.cost,
    maintenance_interval_months: asset.maintenanceIntervalMonths,
    specifications: asset.specifications,
    history: asset.history,
    image: asset.image,
});

const mapTaxSettingsFromDB = (data: any): TaxSettings => ({
    id: data.id,
    userId: data.user_id,
    year: data.year,
    expectedRoomCount: data.expected_room_count,
    expectedAvgPrice: data.expected_avg_price,
    paymentFrequency: data.payment_frequency,
    servicesIncluded: data.services_included || [],
    isShortTerm: data.is_short_term,
    classification: data.classification,
    createdAt: data.created_at,
    updatedAt: data.updated_at
});

const mapTaxSettingsToDB = (settings: TaxSettings) => ({
    id: settings.id,
    user_id: settings.userId,
    year: settings.year,
    expected_room_count: settings.expectedRoomCount,
    expected_avg_price: settings.expectedAvgPrice,
    payment_frequency: settings.paymentFrequency,
    services_included: settings.servicesIncluded,
    is_short_term: settings.isShortTerm,
    classification: settings.classification,
    created_at: settings.createdAt,
    updated_at: settings.updatedAt
});

export function useSupabaseData() {
    const { user } = useAuth();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to sort rooms numerically (e.g. "P.10" < "P.2")
    const sortRooms = (roomsToSort: Room[]) => {
        return [...roomsToSort].sort((a, b) => {
            // Extract numbers from string "P.101" -> 101
            const aNum = parseInt(a.roomNumber.replace(/\D/g, '')) || 0;
            const bNum = parseInt(b.roomNumber.replace(/\D/g, '')) || 0;
            if (aNum !== bNum) return aNum - bNum;
            return a.roomNumber.localeCompare(b.roomNumber);
        });
    };

    // Initial Fetch
    useEffect(() => {
        if (!user || !supabase) return;

        const fetchData = async (isInitial = false) => {
            if (isInitial) setLoading(true);
            try {
                if (!supabase) return;
                const [roomsRes, tenantsRes, billsRes, assetsRes, taxRes] = await Promise.all([
                    supabase.from("rooms").select("*").order('room_number', { ascending: true }),
                    supabase.from("tenants").select("*"),
                    supabase.from("bills").select("*"),
                    supabase.from("assets").select("*"),
                    supabase.from("tax_settings").select("*").order("year", { ascending: false }).limit(1),
                ]);

                if (roomsRes.data) {
                    const mappedRooms = roomsRes.data.map(mapRoomFromDB);
                    setRooms(sortRooms(mappedRooms));
                }
                if (tenantsRes.data) setTenants(tenantsRes.data.map(mapTenantFromDB));
                if (billsRes.data) setBills(billsRes.data.map(mapBillFromDB));
                if (assetsRes.data) setAssets(assetsRes.data.map(mapAssetFromDB));
                if (taxRes.data && taxRes.data.length > 0) setTaxSettings(mapTaxSettingsFromDB(taxRes.data[0]));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                if (isInitial) setLoading(false);
            }
        };

        fetchData(true);

        // Realtime Subscription
        if (!supabase) return;
        const channel = supabase
            .channel("db_changes")
            .on("postgres_changes", { event: "*", schema: "public" }, () => {
                fetchData(false);
            })
            .subscribe();

        return () => {
            if (supabase) supabase.removeChannel(channel);
        };
    }, [user]);

    // CRUD Helpers

    // --- Rooms ---
    const saveRoom = async (room: Room) => {
        if (!supabase) return;
        // Check if exists
        const exists = rooms.some(r => r.id === room.id);
        if (exists) {
            await supabase.from("rooms").update(mapRoomToDB(room)).eq("id", room.id);
            // Optimistic update
            setRooms(prev => sortRooms(prev.map(r => r.id === room.id ? room : r)));
        } else {
            await supabase.from("rooms").insert(mapRoomToDB(room));
            setRooms(prev => sortRooms([...prev, room]));
        }
    };

    const deleteRoom = async (id: string) => {
        if (!supabase) return;
        await supabase.from("rooms").delete().eq("id", id);
        setRooms(prev => prev.filter(r => r.id !== id));
    };

    // --- Tenants ---
    const saveTenant = async (tenant: Tenant) => {
        if (!supabase) return;
        const exists = tenants.some(t => t.id === tenant.id);
        if (exists) {
            await supabase.from("tenants").update(mapTenantToDB(tenant)).eq("id", tenant.id);
            setTenants(prev => prev.map(t => t.id === tenant.id ? tenant : t));
        } else {
            await supabase.from("tenants").insert(mapTenantToDB(tenant));
            setTenants(prev => [...prev, tenant]);
        }
    };

    const deleteTenant = async (id: string) => {
        if (!supabase) return;
        await supabase.from("tenants").delete().eq("id", id);
        setTenants(prev => prev.filter(t => t.id !== id));
    };

    // --- Bills ---
    const saveBill = async (bill: Bill) => {
        if (!supabase) return;
        const exists = bills.some(b => b.id === bill.id);
        if (exists) {
            await supabase.from("bills").update(mapBillToDB(bill)).eq("id", bill.id);
            setBills(prev => prev.map(b => b.id === bill.id ? bill : b));
        } else {
            await supabase.from("bills").insert(mapBillToDB(bill));
            setBills(prev => [...prev, bill]);
        }
    };

    const saveBills = async (newBills: Bill[]) => {
        if (!supabase) return;
        if (newBills.length === 0) return;
        const dbBills = newBills.map(mapBillToDB);
        await supabase.from("bills").insert(dbBills);
        // Fetches fresh to ensure sync
        const { data } = await supabase.from("bills").select("*");
        if (data) setBills(data.map(mapBillFromDB));
    };

    const deleteBill = async (id: string) => {
        if (!supabase) return;
        await supabase.from("bills").delete().eq("id", id);
        setBills(prev => prev.filter(b => b.id !== id));
    };

    // --- Assets ---
    const saveAsset = async (asset: Asset) => {
        if (!supabase) return;
        const exists = assets.some(a => a.id === asset.id);
        if (exists) {
            await supabase.from("assets").update(mapAssetToDB(asset)).eq("id", asset.id);
            setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
        } else {
            await supabase.from("assets").insert(mapAssetToDB(asset));
            setAssets(prev => [...prev, asset]);
        }
    };

    const deleteAsset = async (id: string) => {
        if (!supabase) return;
        await supabase.from("assets").delete().eq("id", id);
        setAssets(prev => prev.filter(a => a.id !== id));
    };

    // --- Tax Settings ---
    const saveTaxSettings = async (settings: TaxSettings) => {
        if (!supabase) return;
        const exists = taxSettings && taxSettings.id === settings.id;
        if (exists) {
            await supabase.from("tax_settings").update(mapTaxSettingsToDB(settings)).eq("id", settings.id);
            setTaxSettings(settings);
        } else {
            await supabase.from("tax_settings").insert(mapTaxSettingsToDB(settings));
            setTaxSettings(settings);
        }
    };


    return {
        rooms,
        tenants,
        bills,
        assets,
        taxSettings,
        loading,
        saveRoom,
        deleteRoom,
        saveTenant,
        deleteTenant,
        saveBill,
        saveBills,
        deleteBill,
        saveAsset,
        deleteAsset,
        saveTaxSettings
    };
}
