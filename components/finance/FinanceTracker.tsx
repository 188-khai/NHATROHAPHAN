"use client";

import React, { useState } from 'react';
import { useFinanceTracker, TOTAL_WORK_DAYS, TARGET_OT_HOURS } from '@/hooks/useFinanceTracker';
import { ExpenseCategory } from '@/types';
import { TrendingUp, CheckCircle, AlertTriangle, Plus, Minus, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations';

export default function FinanceTracker() {
    const { performance, transactions, loading, logWorkDay, logOT, logExpense, logKPI, stats, fetchFinanceData } = useFinanceTracker();

    const [kpiAmount, setKpiAmount] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Ăn uống');
    const [expenseNote, setExpenseNote] = useState('');

    const [otHours, setOtHours] = useState('');
    const [otType, setOtType] = useState<'normal' | 'sunday'>('normal');

    const handleLogExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseAmount || isNaN(Number(expenseAmount.replace(/\D/g, '')))) return;

        await logExpense(Number(expenseAmount.replace(/\D/g, '')), expenseCategory, expenseNote);
        setExpenseAmount('');
        setExpenseNote('');
    };

    const handleLogKPI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kpiAmount || isNaN(Number(kpiAmount.replace(/\D/g, '')))) return;

        await logKPI(Number(kpiAmount.replace(/\D/g, '')));
        setKpiAmount('');
    };

    const handleLogOT = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otHours || isNaN(Number(otHours))) return;

        await logOT(Number(otHours), otType);
        setOtHours('');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
    }

    const progressDays = ((performance?.daysWorked || 0) / TOTAL_WORK_DAYS) * 100;
    const progressOT = (stats.totalOTHours / TARGET_OT_HOURS) * 100;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Kiểm Soát Tài Chính & Hiệu Suất</h2>

            {/* AI ALERT BOX */}
            {stats.advice && (
                <div className={`p-4 rounded-xl border-l-4 shadow-sm ${stats.advice.type === 'danger' ? 'bg-red-50 border-red-500 text-red-800' :
                    stats.advice.type === 'warning' ? 'bg-orange-50 border-orange-500 text-orange-800' :
                        'bg-green-50 border-green-500 text-green-800'
                    }`}>
                    <div className="flex items-start">
                        <AlertTriangle className="mt-1 mr-3 flex-shrink-0" size={20} />
                        <div>
                            <h3 className="font-bold">{stats.advice.title}</h3>
                            <p className="text-sm mt-1">{stats.advice.message}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* DASHBOARD STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Tiến độ làm việc */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium mb-4 flex items-center">
                        <CheckCircle className="mr-2" /> Tiến Độ Công Việc
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">Ngày công chuẩn</span>
                                <span className="text-teal-600 font-bold">{performance?.daysWorked || 0} / {TOTAL_WORK_DAYS}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.min(100, progressDays)}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">Tăng ca (OT)</span>
                                <span className="text-orange-500 font-bold">{stats.totalOTHours} / {TARGET_OT_HOURS}h</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${Math.min(100, progressOT)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Dòng tiền Tích lũy */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <h3 className="text-gray-500 text-sm font-medium flex items-center">
                        <TrendingUp className="mr-2" /> Tổng Thu Nhập (Lương + OT)
                    </h3>
                    <div className="text-3xl font-black text-teal-600 my-4">
                        {formatCurrency(performance?.totalIncome || 0)}
                    </div>
                    <p className="text-xs text-gray-400">
                        * Tự động tính dựa trên ngày công & giờ OT.
                    </p>
                </div>

                {/* 3. Chi Tiêu & Số Dư */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium flex justify-between">
                            <span className="flex items-center"><Minus className="mr-2 text-red-400" /> Tổng Chi Tiêu</span>
                            <span className="text-red-500 font-bold">{formatCurrency(performance?.totalExpense || 0)}</span>
                        </h3>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50">
                        <h3 className="text-gray-500 text-sm font-medium flex justify-between mb-1">
                            <span className="flex items-center"><DollarSign className="mr-2 text-blue-500" /> Số Dư Khả Dụng</span>
                        </h3>
                        <div className={`text-2xl font-black ${stats.currentBalance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(stats.currentBalance)}
                        </div>
                    </div>
                </div>
            </div>

            {/* INPUT FORMS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Ghi nhận Hiệu Suất */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Ghi nhận Hiệu Suất (Cày tiền)</h3>

                    <div className="space-y-6">
                        {/* Add Day Button */}
                        <div className="bg-teal-50 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-teal-800">Hoàn thành Ngày Công</h4>
                                <p className="text-sm text-teal-600">+384.615 VNĐ / ngày</p>
                            </div>
                            <button
                                onClick={() => logWorkDay(1)}
                                disabled={(performance?.daysWorked || 0) >= TOTAL_WORK_DAYS}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition disabled:opacity-50"
                            >
                                <Plus className="inline mr-1" /> Thêm 1 Ngày
                            </button>
                        </div>

                        {/* Log OT Form */}
                        <form onSubmit={handleLogOT} className="bg-orange-50 p-4 rounded-xl flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-orange-800 mb-1">Ghi nhận Tăng ca (Giờ)</label>
                                <input
                                    type="number" step="0.5" min="0.5" required
                                    value={otHours}
                                    onChange={(e) => setOtHours(e.target.value)}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none text-black font-bold"
                                    placeholder="VD: 2"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-orange-800 mb-1">Loại OT</label>
                                <select
                                    title="Loại OT"
                                    value={otType}
                                    onChange={(e) => setOtType(e.target.value as 'normal' | 'sunday')}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white"
                                >
                                    <option value="normal">Ngày Thường (x1.5)</option>
                                    <option value="sunday">Chủ Nhật (x2.0)</option>
                                </select>
                            </div>
                            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition">
                                Lưu OT
                            </button>
                        </form>

                        {/* Log KPI Form */}
                        <form onSubmit={handleLogKPI} className="bg-blue-50 p-4 rounded-xl flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-blue-800 mb-1">Thưởng KPI tháng (VNĐ)</label>
                                <input
                                    type="text" required
                                    value={kpiAmount ? Number(kpiAmount.replace(/\D/g, '')).toLocaleString() : ''}
                                    onChange={(e) => setKpiAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none text-black font-bold"
                                    placeholder="Ví dụ: 3,000,000"
                                />
                            </div>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition">
                                Lưu KPI
                            </button>
                        </form>
                    </div>
                </div>

                {/* Ghi nhận Chi Tiêu */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-red-600 mb-4 border-b pb-2">Ghi nhận Chi Tiêu (Trừ tiền)</h3>

                    <form onSubmit={handleLogExpense} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Số tiền (VNĐ)</label>
                            <input
                                type="text" required
                                value={expenseAmount ? Number(expenseAmount.replace(/\D/g, '')).toLocaleString() : ''}
                                onChange={(e) => setExpenseAmount(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-xl text-black font-bold"
                                placeholder="50,000"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Rổ chi tiêu</label>
                                <select
                                    title="Rổ chi tiêu"
                                    value={expenseCategory}
                                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                >
                                    <option value="Ăn uống">Ăn uống</option>
                                    <option value="Di chuyển">Di chuyển</option>
                                    <option value="Mua sắm">Mua sắm</option>
                                    <option value="Giải trí">Giải trí</option>
                                    <option value="Sinh hoạt">Sinh hoạt</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú (Tùy chọn)</label>
                                <input
                                    type="text"
                                    value={expenseNote}
                                    onChange={(e) => setExpenseNote(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Đổ xăng xe máy..."
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-md transition outline-none mt-2">
                            Ghi nhận Khoản Chi
                        </button>
                    </form>
                </div>

            </div>

            {/* BẢNG LỊCH SỬ GIAO DỊCH */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Lịch sử Chi Tiêu Tháng Này</h3>

                {transactions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 italic">Chưa có giao dịch chi tiêu nào. Giữ phong độ nhé!</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(tx.transactionDate).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{tx.note || '-'}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-red-500 text-right">
                                            - {formatCurrency(tx.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
