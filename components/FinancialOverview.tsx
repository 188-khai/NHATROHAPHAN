
import { Bill, Room, Tenant } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from '../utils/calculations';

import { Pencil, Trash2 } from 'lucide-react';

interface FinancialOverviewProps {
    bills: Bill[];
    rooms: Room[];
    tenants: Tenant[];
    onEditBill: (bill: Bill) => void;
    onDeleteBill: (billId: string) => void;
}

export default function FinancialOverview({ bills, rooms, tenants, onEditBill, onDeleteBill }: FinancialOverviewProps) {
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

    // 2. Prepare data for the history table (All bills sorted by date desc)
    const sortedBills = [...bills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getRoomNumber = (roomId: string) => {
        return rooms.find(r => r.id === roomId)?.roomNumber || 'Unknown';
    };

    const handleDeleteClick = (billId: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa hóa đơn này không? Hành động này không thể hoàn tác.')) {
            onDeleteBill(billId);
        }
    };

    return (
        <div className="space-y-8 mt-6">
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
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Lịch sử thu tiền</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Chi tiết các hóa đơn đã lập.</p>
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
