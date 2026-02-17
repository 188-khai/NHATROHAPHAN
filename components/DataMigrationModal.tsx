"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { CloudUpload, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Room, Tenant, Bill, Asset } from "@/types";

export default function DataMigrationModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [localDataCount, setLocalDataCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [synced, setSynced] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    const { saveRoom, saveTenant, saveBills, saveAsset } = useSupabaseData();

    useEffect(() => {
        // Check local storage for legacy data
        if (typeof window === "undefined") return;
        if (hasChecked) return;

        const checkLocalData = () => {
            const localRooms = JSON.parse(window.localStorage.getItem("rooms") || "[]");
            const localTenants = JSON.parse(window.localStorage.getItem("tenants") || "[]");
            const localBills = JSON.parse(window.localStorage.getItem("bills") || "[]");
            const localAssets = JSON.parse(window.localStorage.getItem("assets") || "[]");

            const totalItems = localRooms.length + localTenants.length + localBills.length + localAssets.length;

            const hasMigrated = window.localStorage.getItem("has_migrated_to_supabase");

            if (totalItems > 0 && !hasMigrated) {
                setLocalDataCount(totalItems);
                setIsOpen(true);
            }
            setHasChecked(true);
        };

        const timer = setTimeout(checkLocalData, 1500); // Wait for app to settle
        return () => clearTimeout(timer);
    }, [hasChecked]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const localRooms = JSON.parse(window.localStorage.getItem("rooms") || "[]");
            const localTenants = JSON.parse(window.localStorage.getItem("tenants") || "[]");
            const localBills = JSON.parse(window.localStorage.getItem("bills") || "[]");
            const localAssets = JSON.parse(window.localStorage.getItem("assets") || "[]");

            // Push Rooms
            for (const room of localRooms) {
                await saveRoom(room);
            }
            // Push Tenants
            for (const tenant of localTenants) {
                await saveTenant(tenant);
            }
            // Push Assets
            for (const asset of localAssets) {
                await saveAsset(asset);
            }
            // Push Bills
            if (localBills.length > 0) {
                await saveBills(localBills);
            }

            setSynced(true);
            window.localStorage.setItem("has_migrated_to_supabase", "true");
            // Optional: Clear legacy keys to prevent confusion? 
            // window.localStorage.removeItem("rooms"); ...
            // Keeping them as backup is safer for now.

        } catch (error) {
            console.error("Migration failed:", error);
            alert("Lỗi đồng bộ. Vui lòng thử lại.");
        } finally {
            setSyncing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onClose={() => { }} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100 transform transition-all">
                    <div className="text-center">
                        {synced ? (
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4 animate-bounce">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        ) : (
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-4">
                                <CloudUpload className="h-8 w-8 text-indigo-600" />
                            </div>
                        )}

                        <DialogTitle className="text-xl font-bold text-gray-900">
                            {synced ? "Đồng bộ thành công!" : "Phát hiện dữ liệu cũ"}
                        </DialogTitle>

                        <p className="mt-2 text-sm text-gray-500">
                            {synced
                                ? "Dữ liệu của bạn đã an toàn trên đám mây."
                                : `Tìm thấy ${localDataCount} mục dữ liệu cũ. Bạn có muốn đồng bộ lên tài khoản mới không?`
                            }
                        </p>

                        <div className="mt-6 flex gap-3">
                            {synced ? (
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500"
                                >
                                    Bắt đầu
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 rounded-xl px-4 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300"
                                    >
                                        Để sau
                                    </button>
                                    <button
                                        onClick={handleSync}
                                        disabled={syncing}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500 disabled:opacity-70"
                                    >
                                        {syncing && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {syncing ? "Đang xử lý..." : "Đồng bộ ngay"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
