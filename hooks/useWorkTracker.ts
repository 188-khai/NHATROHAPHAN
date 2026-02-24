import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { WorkPerformance } from "@/types";
import { useAuth } from "@/components/AuthProvider";

export const BASE_SALARY = 10000000; // 10,000,000 VNĐ
export const DAILY_SALARY = 333333; // ~10tr / 30
export const TARGET_OT = 40; // 40 hours

export function useWorkTracker() {
    const { user } = useAuth();
    const [performance, setPerformance] = useState<WorkPerformance | null>(null);
    const [loading, setLoading] = useState(true);

    const getCurrentMonthYear = () => {
        const date = new Date();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}-${year}`;
    };

    const fetchPerformance = async () => {
        if (!user || !supabase) return;
        setLoading(true);

        const currentMonthYear = getCurrentMonthYear();

        // 1. Try to fetch current month's record
        const { data, error } = await supabase
            .from("work_performance")
            .select("*")
            .eq("month_year", currentMonthYear)
            .limit(1)
            .single();

        if (data) {
            setPerformance({
                id: data.id,
                monthYear: data.month_year,
                daysWorked: data.days_worked,
                otHours: Number(data.ot_hours),
                currentIncome: Number(data.current_income),
                userId: data.user_id
            });
        } else if (error && error.code === 'PGRST116') {
            // No rows returned - Create one for current month
            const newRecord = {
                month_year: currentMonthYear,
                days_worked: 0,
                ot_hours: 0,
                current_income: 0,
                user_id: user.id
            };

            const { data: insertedData, error: insertError } = await supabase
                .from("work_performance")
                .insert([newRecord])
                .select()
                .single();

            if (insertedData) {
                setPerformance({
                    id: insertedData.id,
                    monthYear: insertedData.month_year,
                    daysWorked: insertedData.days_worked,
                    otHours: Number(insertedData.ot_hours),
                    currentIncome: Number(insertedData.current_income),
                    userId: insertedData.user_id
                });
            } else {
                console.error("Error creating new month record:", insertError);
            }
        } else {
            console.error("Error fetching performance:", error);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchPerformance();
    }, [user]);

    const logWorkDay = async (days: number = 1) => {
        if (!performance || !supabase) return;
        const newDays = performance.daysWorked + days;
        const additionalIncome = days * DAILY_SALARY;
        const newIncome = performance.currentIncome + additionalIncome;

        await supabase
            .from("work_performance")
            .update({
                days_worked: newDays,
                current_income: newIncome,
                updated_at: new Date().toISOString()
            })
            .eq("id", performance.id);

        setPerformance(prev => prev ? { ...prev, daysWorked: newDays, currentIncome: newIncome } : null);
    };

    const logOT = async (hours: number) => {
        if (!performance || !supabase) return;
        const newOT = performance.otHours + hours;

        // OT value is not added to income here based on initial spec, only tracking hours.
        await supabase
            .from("work_performance")
            .update({
                ot_hours: newOT,
                updated_at: new Date().toISOString()
            })
            .eq("id", performance.id);

        setPerformance(prev => prev ? { ...prev, otHours: newOT } : null);
    };

    // Auto-calculate progress and stats
    const otRemaining = Math.max(0, TARGET_OT - (performance?.otHours || 0));
    const otProgress = Math.min(100, ((performance?.otHours || 0) / TARGET_OT) * 100);
    const today = new Date().getDate();
    const cycleProgress = Math.min(100, (today / 30) * 100);

    // Status check
    const isOTOnTrack = (performance?.otHours || 0) >= (TARGET_OT * (today / 30));

    return {
        performance,
        loading,
        logWorkDay,
        logOT,
        stats: {
            otRemaining,
            otProgress,
            cycleProgress,
            isOTOnTrack,
            today
        },
        fetchPerformance // in case of manual refresh
    };
}
