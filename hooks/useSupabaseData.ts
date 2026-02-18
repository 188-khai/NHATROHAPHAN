import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Room, Tenant, Bill, Asset } from "@/types";
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

export function useSupabaseData() {
    const { user } = useAuth();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        if (!user || !supabase) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                if (!supabase) return;
                const [roomsRes, tenantsRes, billsRes, assetsRes] = await Promise.all([
                    supabase.from("rooms").select("*"),
                    supabase.from("tenants").select("*"),
                    supabase.from("bills").select("*"),
                    supabase.from("assets").select("*"),
                ]);

                if (roomsRes.data) setRooms(roomsRes.data.map(mapRoomFromDB));
                if (tenantsRes.data) setTenants(tenantsRes.data.map(mapTenantFromDB));
                if (billsRes.data) setBills(billsRes.data.map(mapBillFromDB));
                if (assetsRes.data) setAssets(assetsRes.data.map(mapAssetFromDB));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Realtime Subscription
        if (!supabase) return;
        const channel = supabase
            .channel("db_changes")
            .on("postgres_changes", { event: "*", schema: "public" }, () => {
                fetchData();
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
            setRooms(prev => prev.map(r => r.id === room.id ? room : r));
        } else {
            await supabase.from("rooms").insert(mapRoomToDB(room));
            setRooms(prev => [...prev, room]);
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


    return {
        rooms,
        tenants,
        bills,
        assets,
        loading,
        saveRoom,
        deleteRoom,
        saveTenant,
        deleteTenant,
        saveBill,
        saveBills,
        deleteBill,
        saveAsset,
        deleteAsset
    };
}
