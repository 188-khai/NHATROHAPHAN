import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { WorkPerformanceV2, FinanceTransaction, ExpenseCategory } from "@/types";
import { useAuth } from "@/components/AuthProvider";

// --- CẤU HÌNH THÔNG SỐ TÀI CHÍNH TỪ USER ---
export const BASE_SALARY = 7000000;         // Lương cơ bản: 7tr
export const TOTAL_WORK_DAYS = 26;          // Chuẩn 26 ngày công
export const DAILY_WAGE = Math.round(BASE_SALARY / TOTAL_WORK_DAYS); // ~ 269,231 đ

export const HOURLY_WAGE_BASE = 33654;      // Lương cơ bản theo giờ (7tr / 26 / 8)
export const OT_NORMAL_RATE = 50481;        // OT Ngày thường (x1.5 của HOURLY_WAGE_BASE)
export const OT_SUNDAY_RATE = 67308;        // OT Chủ nhật (x2.0 của HOURLY_WAGE_BASE)
export const TARGET_OT_HOURS = 40;          // Chỉ tiêu 40h OT/tháng

export const SAVING_TARGET_PERCENT = 0.20;  // Mục tiêu tiết kiệm 20% tổng thu nhập

export function useFinanceTracker() {
    const { user } = useAuth();
    const [performance, setPerformance] = useState<WorkPerformanceV2 | null>(null);
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const getCurrentMonthYear = () => {
        const date = new Date();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}-${year}`; // Ví dụ: '02-2026'
    };

    const fetchFinanceData = async () => {
        if (!user || !supabase) return;
        setLoading(true);

        const currentMonthYear = getCurrentMonthYear();

        // 1. Fetch Performance Record cho tháng hiện tại
        const { data: perfData, error: perfError } = await supabase
            .from("work_performance_v2")
            .select("*")
            .eq("month_year", currentMonthYear)
            .limit(1)
            .single();

        let currentPerfId = null;

        if (perfData) {
            currentPerfId = perfData.id;
            setPerformance({
                id: perfData.id,
                monthYear: perfData.month_year,
                daysWorked: perfData.days_worked,
                otNormalHours: Number(perfData.ot_normal_hours),
                otSundayHours: Number(perfData.ot_sunday_hours),
                kpiIncome: Number(perfData.kpi_income || 0),
                totalIncome: Number(perfData.total_income),
                totalExpense: Number(perfData.total_expense),
                userId: perfData.user_id
            });
        } else if (perfError && perfError.code === 'PGRST116') {
            // Chưa có data tháng này -> Khởi tạo mới từ 0
            const newRecord = {
                month_year: currentMonthYear,
                days_worked: 0,
                ot_normal_hours: 0,
                ot_sunday_hours: 0,
                kpi_income: 0,
                total_income: 0,
                total_expense: 0,
                user_id: user.id
            };

            const { data: insertedData, error: insertError } = await supabase
                .from("work_performance_v2")
                .insert([newRecord])
                .select()
                .single();

            if (insertedData) {
                currentPerfId = insertedData.id;
                setPerformance({
                    id: insertedData.id,
                    monthYear: insertedData.month_year,
                    daysWorked: insertedData.days_worked,
                    otNormalHours: Number(insertedData.ot_normal_hours),
                    otSundayHours: Number(insertedData.ot_sunday_hours),
                    kpiIncome: Number(insertedData.kpi_income || 0),
                    totalIncome: Number(insertedData.total_income),
                    totalExpense: Number(insertedData.total_expense),
                    userId: insertedData.user_id
                });
            } else {
                console.error("Lỗi khi tạo bảng performance mới:", insertError);
            }
        }

        // 2. Fetch danh sách giao dịch (chi tiêu) của tháng này nếu có Perf ID
        if (currentPerfId) {
            const { data: txData, error: txError } = await supabase
                .from("finance_transactions")
                .select("*")
                .eq("performance_id", currentPerfId)
                .order("transaction_date", { ascending: false });

            if (txData) {
                setTransactions(txData.map(tx => ({
                    id: tx.id,
                    performanceId: tx.performance_id,
                    amount: Number(tx.amount),
                    category: tx.category,
                    note: tx.note,
                    transactionDate: tx.transaction_date,
                    userId: tx.user_id
                })));
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchFinanceData();
    }, [user]);

    // --- CÁC HÀM GHI NHẬN (LOGGING) ---

    // 1. Cập nhật ngày công
    const logWorkDay = async (days: number = 1) => {
        if (!performance || !supabase) return;

        const newDaysWorked = performance.daysWorked + days;
        const additionalIncome = days * DAILY_WAGE; // 384,615 đ / ngày
        const newIncome = performance.totalIncome + additionalIncome;

        await supabase
            .from("work_performance_v2")
            .update({
                days_worked: newDaysWorked,
                total_income: newIncome,
                updated_at: new Date().toISOString()
            })
            .eq("id", performance.id);

        setPerformance(prev => prev ? {
            ...prev,
            daysWorked: newDaysWorked,
            totalIncome: newIncome
        } : null);
    };

    // 2. Cập nhật OT
    const logOT = async (hours: number, type: 'normal' | 'sunday') => {
        if (!performance || !supabase) return;

        let otIncome = 0;
        let updatePayload: any = { updated_at: new Date().toISOString() };

        if (type === 'normal') {
            otIncome = hours * OT_NORMAL_RATE; // 50,481 đ / h
            updatePayload.ot_normal_hours = performance.otNormalHours + hours;
            updatePayload.total_income = performance.totalIncome + otIncome;
        } else {
            otIncome = hours * OT_SUNDAY_RATE; // 67,308 đ / h
            updatePayload.ot_sunday_hours = performance.otSundayHours + hours;
            updatePayload.total_income = performance.totalIncome + otIncome;
        }

        await supabase
            .from("work_performance_v2")
            .update(updatePayload)
            .eq("id", performance.id);

        setPerformance(prev => prev ? {
            ...prev,
            otNormalHours: updatePayload.ot_normal_hours ?? prev.otNormalHours,
            otSundayHours: updatePayload.ot_sunday_hours ?? prev.otSundayHours,
            totalIncome: updatePayload.total_income
        } : null);
    };

    // 3. Ghi nhận Chi Tiêu
    const logExpense = async (amount: number, category: ExpenseCategory, note: string) => {
        if (!performance || !user || !supabase) return;

        // Lưu log giao dịch
        const newTransaction = {
            performance_id: performance.id,
            amount: amount,
            category: category,
            note: note,
            transaction_date: new Date().toISOString(),
            user_id: user.id
        };

        const { data: insertedTx } = await supabase
            .from("finance_transactions")
            .insert([newTransaction])
            .select()
            .single();

        // Trừ tiền tổng chi tiêu trong bảng performance
        const newTotalExpense = performance.totalExpense + amount;

        await supabase
            .from("work_performance_v2")
            .update({
                total_expense: newTotalExpense,
                updated_at: new Date().toISOString()
            })
            .eq("id", performance.id);

        // Cập nhật State Frontend
        if (insertedTx) {
            const frontendTx: FinanceTransaction = {
                id: insertedTx.id,
                performanceId: insertedTx.performance_id,
                amount: Number(insertedTx.amount),
                category: insertedTx.category as ExpenseCategory,
                note: insertedTx.note,
                transactionDate: insertedTx.transaction_date,
                userId: insertedTx.user_id
            };
            setTransactions(prev => [frontendTx, ...prev]);
        }

        setPerformance(prev => prev ? {
            ...prev,
            totalExpense: newTotalExpense
        } : null);
    };

    // 4. Ghi nhận KPI (Nhập tay)
    const logKPI = async (amount: number) => {
        if (!performance || !supabase) return;

        const newKpiIncome = (performance.kpiIncome || 0) + amount;
        const newTotalIncome = performance.totalIncome + amount;

        await supabase
            .from("work_performance_v2")
            .update({
                kpi_income: newKpiIncome,
                total_income: newTotalIncome,
                updated_at: new Date().toISOString()
            })
            .eq("id", performance.id);

        setPerformance(prev => prev ? {
            ...prev,
            kpiIncome: newKpiIncome,
            totalIncome: newTotalIncome
        } : null);
    };

    // 5. Hard Reset Database cho tháng hiện tại
    const resetFinanceData = async () => {
        if (!performance || !supabase) return;

        // Reset dữ liệu performance
        await supabase
            .from("work_performance_v2")
            .update({
                days_worked: 0,
                ot_normal_hours: 0,
                ot_sunday_hours: 0,
                kpi_income: 0,
                total_income: 0,
                total_expense: 0,
                updated_at: new Date().toISOString()
            })
            .eq("id", performance.id);

        // Xóa toàn bộ giao dịch của tháng hiện tại
        await supabase
            .from("finance_transactions")
            .delete()
            .eq("performance_id", performance.id);

        // Cập nhật State Frontend ngay lập tức
        setPerformance(prev => prev ? {
            ...prev,
            daysWorked: 0,
            otNormalHours: 0,
            otSundayHours: 0,
            kpiIncome: 0,
            totalIncome: 0,
            totalExpense: 0,
        } : null);
        setTransactions([]);

        // Refresh lại bằng fetchFinanceData để đảm bảo đồng bộ
        await fetchFinanceData();
    };

    // --- HỆ THỐNG CẢNH BÁO TIẾT KIỆM (AI/LOGIC ENGINE) ---
    const getFinancialAdvice = () => {
        if (!performance) return null;

        const currentBalance = performance.totalIncome - performance.totalExpense;
        const totalOTHours = performance.otNormalHours + performance.otSundayHours;
        const daysRemaining = Math.max(0, TOTAL_WORK_DAYS - performance.daysWorked);

        // Luật 1: Số dư cạn kiệt so với số ngày còn lại (Bình quân 200k/ngày để sống sót)
        const survivalFundAmount = daysRemaining * 200000;
        if (currentBalance < survivalFundAmount && currentBalance > 0) {
            return {
                type: 'danger',
                title: '🆘 Báo động đỏ ví cạn!',
                message: `Bạn chỉ còn ${currentBalance.toLocaleString()}đ trong khi còn ${daysRemaining} ngày làm việc. Ví dưới mức an toàn (cần >${survivalFundAmount.toLocaleString()}đ để sống sót qua ngày). Vui lòng cắt giảm 100% chi phí không cần thiết!`
            };
        }

        if (currentBalance <= 0 && performance.totalExpense > 0) {
            return {
                type: 'danger',
                title: '💸 Đã âm tiền/Hết sạch tiền!',
                message: 'Thu nhập đang bị âm hoặc bằng 0 so với chi tiêu. Bạn cần Cày OT khẩn cấp để bù đắp thâm hụt!'
            };
        }

        // Luật 2: Cảnh báo chi tiêu mà OT chưa đủ
        if (performance.totalExpense > 0 && totalOTHours < TARGET_OT_HOURS) {
            const missingOT = TARGET_OT_HOURS - totalOTHours;
            return {
                type: 'warning',
                title: '⏳ Nhắc nhở cày OT',
                message: `Bạn đã tiêu tiền nhưng KPI Tăng ca vẫn thiếu ${missingOT} tiếng. Hãy tập trung cày bù OT để kéo lại dòng tiền cuối tháng nhé.`
            };
        }

        // Luật 3: Cảnh báo trạng thái tiết kiệm (Ngưỡng an toàn hiện tại là để ra 20%)
        const savingTargetCurrent = performance.totalIncome * SAVING_TARGET_PERCENT;
        if (currentBalance < savingTargetCurrent && performance.totalIncome > 0) {
            return {
                type: 'warning',
                title: '⚠️ Cảnh báo mục tiêu tiết kiệm',
                message: `Theo mục tiêu, bạn cần giữ lại 20% thu nhập (khoảng ${savingTargetCurrent.toLocaleString()}đ). Số dư hiện tại đang bị đe dọa, hãy phanh lại các khoản mua sắm và ăn uống!`
            };
        }

        // Tốt
        return {
            type: 'success',
            title: '✅ Quản lý tốt',
            message: 'Tuyệt vời. Bạn đang đi đúng tiến độ kỷ luật tài chính. Cứ giữ phong độ thế này tháng này làm giàu!'
        };
    };

    // Các biến phân tích
    const currentBalance = (performance?.totalIncome || 0) - (performance?.totalExpense || 0);
    const totalOTHours = (performance?.otNormalHours || 0) + (performance?.otSundayHours || 0);
    const advice = getFinancialAdvice();

    return {
        performance,
        transactions,
        loading,
        logWorkDay,
        logOT,
        logExpense,
        logKPI,
        resetFinanceData,
        stats: {
            currentBalance,
            totalOTHours,
            daysRemaining: Math.max(0, TOTAL_WORK_DAYS - (performance?.daysWorked || 0)),
            otRemaining: Math.max(0, TARGET_OT_HOURS - totalOTHours),
            advice
        },
        fetchFinanceData
    };
}
