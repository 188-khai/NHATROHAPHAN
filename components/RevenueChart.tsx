"use client";

import { useMemo } from "react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { Bill } from "@/types";

interface RevenueChartProps {
    bills: Bill[];
}

interface ChartData {
    dateObj: Date;
    label: string;
    key: string;
    revenue: number;
}

export default function RevenueChart({ bills }: RevenueChartProps) {
    const chartData = useMemo(() => {
        // 1. Get last 6 months (including current month)
        const today = new Date();
        const months: ChartData[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push({
                dateObj: d,
                label: `Tháng ${d.getMonth() + 1}`,
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                revenue: 0,
            });
        }

        // 2. Sum revenue for each month
        bills.forEach((bill) => {
            if (!bill.date || !bill.totalAmount) return;
            // bill.date is YYYY-MM-DD
            const billMonthKey = bill.date.substring(0, 7); // "2024-05"

            const monthEntry = months.find((m) => m.key === billMonthKey);
            if (monthEntry) {
                monthEntry.revenue += bill.totalAmount;
            }
        });

        return months;
    }, [bills]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Biểu đồ Doanh thu</h3>
                    <p className="text-sm text-gray-500">Thống kê 6 tháng gần nhất</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                    VND
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip
                            formatter={(value: number | string | Array<number | string> | undefined) => [
                                `${Number(value || 0).toLocaleString('vi-VN')} đ`,
                                "Doanh thu"
                            ]}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#4f46e5"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
