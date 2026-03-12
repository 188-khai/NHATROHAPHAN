import { Fragment, useState } from 'react';
import { Bill, Room, Tenant, TaxSettings } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from '../utils/calculations';

import { Pencil, Trash2, FileText, Smartphone, CheckCircle } from 'lucide-react';

interface FinancialOverviewProps {
    bills: Bill[];
    rooms: Room[];
    tenants: Tenant[];
    taxSettings?: TaxSettings | null;
    onEditBill: (bill: Bill) => void;
    onDeleteBill: (billId: string) => void;
}

export default function FinancialOverview({ bills, rooms, tenants, taxSettings, onEditBill, onDeleteBill }: FinancialOverviewProps) {
    // 1. Prepare data for the chart (Last 12 months revenue)
    const getLast12MonthsData = () => {
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d.toISOString().slice(0, 7)); // YYYY-MM
        }

        return months.map(month => {
            const monthlyBills = bills.filter(b => b.date.startsWith(month));
            const totalRevenue = monthlyBills.reduce((sum, b) => sum + b.totalAmount, 0);
            return {
                name: month,
                revenue: totalRevenue,
                bills: monthlyBills.length
            };
        });
    };

    const chartData = getLast12MonthsData();

    // 2. Prepare data for the history table
    // Default to current month if no filter is selected. Let users choose 'all' or specific month.
    const [selectedMonth, setSelectedMonth] = useState<string>(''); // YYYY-MM
    
    const filteredBills = bills.filter(bill => {
        if (!selectedMonth) return true; // show all by default
        return bill.date.startsWith(selectedMonth);
    });

    const sortedBills = [...filteredBills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getRoomNumber = (roomId: string) => {
        return rooms.find(r => r.id === roomId)?.roomNumber || 'Unknown';
    };

    const handleDeleteClick = (billId: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa hóa đơn này không? Hành động này không thể hoàn tác.')) {
            onDeleteBill(billId);
        }
    };

    // 3. Tax & NOI Calculations
    let monthlyTaxProvision = 0;
    if (taxSettings) {
        const grossRevenue = taxSettings.expectedRoomCount * taxSettings.expectedAvgPrice * 12;
        if (grossRevenue > 500000000) {
            const vat = grossRevenue * 0.05;
            const pit = (grossRevenue - 500000000) * 0.05;
            monthlyTaxProvision = (vat + pit) / 12;
        }
    }

    const currentPeriodRevenue = filteredBills.reduce((sum, b) => sum + b.totalAmount, 0);
    const noi = currentPeriodRevenue - monthlyTaxProvision;

    return (
        <div className="space-y-8 mt-6">
            {/* NOI Summary & eTax Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <h3 className="text-lg font-medium opacity-90 mb-4">
                        Lãi Ròng (NOI) {selectedMonth ? `Tháng ${selectedMonth}` : 'Kì Vừa Trích Lọc'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-sm opacity-80 mb-1">Thực Thu Hóa Đơn</p>
                            <p className="text-xl font-bold">{formatCurrency(currentPeriodRevenue)}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-sm opacity-80 mb-1">Dự Phòng Thuế</p>
                            <p className="text-xl font-bold text-red-100">-{formatCurrency(monthlyTaxProvision)}</p>
                            {taxSettings ? (
                                <p className="text-xs opacity-75 mt-1">Trích lập tự động 1/12</p>
                            ) : (
                                <p className="text-xs opacity-75 mt-1">Chưa có cấu hình</p>
                            )}
                        </div>
                        <div className="bg-white/20 rounded-lg p-4 border border-white/30">
                            <p className="text-sm opacity-80 mb-1">Lãi Ròng (NOI)</p>
                            <p className="text-2xl font-extrabold">{formatCurrency(noi)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-xl shadow-sm p-5">
                    <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 mb-3 border-b pb-2">
                        <Smartphone className="w-5 h-5 text-indigo-600" /> Hướng dẫn khai eTax Mobile
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-2 mb-4">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Bước 1: Tải eTax Mobile & Đăng nhập bằng VNeID</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Bước 2: Chọn "Nộp thuế điện tử" {'>'} "Khác"</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Bước 3: Lập tờ khai Mẫu số 01/TTS</span>
                        </li>
                    </ul>
                    <a href="https://canhan.gdt.gov.vn" target="_blank" rel="noopener noreferrer" className="inline-flex w-full justify-center items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 hover:bg-indigo-50">
                        <FileText className="w-4 h-4 mr-2" />
                        Tải Mẫu 01-1/BK-TTS
                    </a>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Biểu đồ dòng tiền (12 tháng qua)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value)} />
                            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                            <Legend />
                            <Bar dataKey="revenue" name="Doanh thu" fill="#4F46E5" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* History Table Section */}
            <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center sm:flex-row flex-col">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Lịch sử thu tiền</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Chi tiết các hóa đơn đã lập.</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center gap-2">
                        <label htmlFor="month-filter" className="text-sm font-medium text-gray-700">Lọc theo tháng:</label>
                        <input
                            type="month"
                            id="month-filter"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                        {selectedMonth && (
                            <button 
                                onClick={() => setSelectedMonth('')}
                                className="text-sm text-indigo-600 hover:text-indigo-900"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phòng
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Điện (Cũ - Mới)
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nước
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tổng tiền
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedBills.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                        Chưa có lịch sử hóa đơn nào.
                                    </td>
                                </tr>
                            ) : (
                                sortedBills.map((bill) => (
                                    <tr key={bill.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(bill.date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            P.{getRoomNumber(bill.roomId)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {bill.electricityOld} - {bill.electricityNew}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {/* If we strictly track meters, show them. If generic, maybe just show new */}
                                            {bill.waterOld !== undefined ? `${bill.waterOld} - ` : ''}{bill.waterNew ?? 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                            {formatCurrency(bill.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => onEditBill(bill)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                title="Sửa hóa đơn"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(bill.id)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Xóa hóa đơn"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
