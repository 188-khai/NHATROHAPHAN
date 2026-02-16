import { useState, useMemo, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Download, Image as ImageIcon } from 'lucide-react';
import { Room, Bill } from '../types';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface ElectricityReconciliationModalProps {
    isOpen: boolean;
    onClose: () => void;
    bills: Bill[];
    rooms: Room[];
}

export default function ElectricityReconciliationModal({
    isOpen,
    onClose,
    bills,
    rooms,
}: ElectricityReconciliationModalProps) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [evnBillAmount, setEvnBillAmount] = useState<number>(0);
    const tableRef = useRef<HTMLDivElement>(null);

    // Filter bills for the selected month
    const reconciliationData = useMemo(() => {
        return rooms.map(room => {
            const bill = bills.find(b => b.roomId === room.id && b.date.startsWith(selectedMonth));
            const usage = bill ? bill.electricityNew - bill.electricityOld : 0;
            const revenue = usage * 3500; // Fixed rate 3,500 VND/kWh

            return {
                roomNumber: room.roomNumber,
                old: bill ? bill.electricityOld : '-',
                new: bill ? bill.electricityNew : '-',
                usage: usage,
                revenue: revenue,
                hasBill: !!bill
            };
        });
    }, [rooms, bills, selectedMonth]);

    const totalUsage = reconciliationData.reduce((sum, item) => sum + item.usage, 0);
    const totalRevenue = reconciliationData.reduce((sum, item) => sum + item.revenue, 0);
    const profit = totalRevenue - evnBillAmount;

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const data = reconciliationData.map(item => ({
            'Phòng': item.roomNumber,
            'Chỉ số cũ': item.old,
            'Chỉ số mới': item.new,
            'Tiêu thụ (kWh)': item.usage,
            'Thành tiền (3.500đ/kWh)': item.revenue
        }));

        // Add summary row
        data.push({
            'Phòng': 'TỔNG CỘNG',
            'Chỉ số cũ': '',
            'Chỉ số mới': '',
            'Tiêu thụ (kWh)': totalUsage,
            'Thành tiền (3.500đ/kWh)': totalRevenue
        });

        // Add reconciliation rows
        data.push({} as any); // Empty row
        data.push({ 'Phòng': 'Tiền điện EVN', 'Thành tiền (3.500đ/kWh)': evnBillAmount } as any);
        data.push({ 'Phòng': 'CHÊNH LỆCH', 'Thành tiền (3.500đ/kWh)': profit } as any);

        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "DoiSoatDien");
        XLSX.writeFile(wb, `DoiSoatDien_${selectedMonth}.xlsx`);
    };

    const exportToImage = async () => {
        if (tableRef.current) {
            const canvas = await html2canvas(tableRef.current);
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `DoiSoatDien_${selectedMonth}.png`;
            link.click();
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto w-full max-w-4xl rounded bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-xl font-bold">Đối soát điện năng</Dialog.Title>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700" title="Đóng" aria-label="Đóng">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tháng</label>
                            <input
                                type="month"
                                title="Chọn tháng"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Số tiền thực tế trên hóa đơn EVN</label>
                            <input
                                type="number"
                                value={evnBillAmount}
                                onChange={(e) => setEvnBillAmount(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                                placeholder="Nhập số tiền..."
                            />
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Tổng tiêu thụ</p>
                            <p className="text-2xl font-bold text-blue-900">{totalUsage.toLocaleString()} kWh</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Tổng thu từ khách</p>
                            <p className="text-2xl font-bold text-green-900">{totalRevenue.toLocaleString()} đ</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <p className="text-sm text-orange-600 font-medium">Tiền trả EVN</p>
                            <p className="text-2xl font-bold text-orange-900">{evnBillAmount.toLocaleString()} đ</p>
                        </div>
                        <div className={`p-4 rounded-lg ${profit >= 0 ? 'bg-indigo-50' : 'bg-red-50'}`}>
                            <p className={`text-sm font-medium ${profit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                                {profit >= 0 ? 'Lợi nhuận' : 'Lỗ (Hao hụt)'}
                            </p>
                            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-indigo-900' : 'text-red-900'}`}>
                                {profit > 0 ? '+' : ''}{profit.toLocaleString()} đ
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div ref={tableRef} className="bg-white p-2 rounded">
                        <h4 className="text-lg font-bold mb-2 text-center">BẢNG ĐỐI SOÁT ĐIỆN NĂNG - THÁNG {selectedMonth}</h4>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Phòng</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Chỉ số cũ</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Chỉ số mới</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Tiêu thụ (kWh)</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền (3.500đ)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reconciliationData.map((item, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">P.{item.roomNumber}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right border-r">{item.old}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right border-r">{item.new}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-medium border-r">{item.usage > 0 ? item.usage : '-'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{item.revenue > 0 ? item.revenue.toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold">
                                        <td colSpan={3} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right border-r">TỔNG CỘNG</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700 text-right border-r">{totalUsage.toLocaleString()}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700 text-right">{totalRevenue.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 text-right">
                            * Công thức: Tiêu thụ = Mới - Cũ. Thành tiền = Tiêu thụ x 3.500đ.
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={exportToExcel}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <Download className="-ml-1 mr-2 h-5 w-5" />
                            Xuất Excel
                        </button>
                        <button
                            onClick={exportToImage}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <ImageIcon className="-ml-1 mr-2 h-5 w-5" />
                            Xuất Ảnh
                        </button>
                        <button
                            onClick={onClose}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Đóng
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
