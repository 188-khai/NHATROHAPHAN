import { useState } from 'react';
import { FileDown, Search, Inbox, Smartphone } from 'lucide-react';
import { Bill, Room, ServiceRate } from '../types';
import { formatCurrency } from '../utils/calculations';
import * as ExcelJS from 'exceljs';

interface UsageReportProps {
    bills: Bill[];
    rooms: Room[];
    serviceRates: ServiceRate[];
}

export default function UsageReport({ bills, rooms, serviceRates }: UsageReportProps) {
    const defaultMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

    // Filter bills for selected month
    const monthlyBills = bills.filter(b => b.date.startsWith(selectedMonth));

    const getRoomNumber = (roomId: string) => {
        return rooms.find(r => r.id === roomId)?.roomNumber || 'Unknown';
    };

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Báo cáo ${selectedMonth}`);

        // Columns setup
        worksheet.columns = [
            { header: 'Tên phòng', key: 'room', width: 15 },
            { header: 'Điện sử dụng (kWh)', key: 'elecUsage', width: 20 },
            { header: 'Điện thành tiền', key: 'elecCost', width: 20 },
            { header: 'Nước thành tiền', key: 'waterCost', width: 20 },
            { header: 'Rác thành tiền', key: 'garbageCost', width: 20 },
            { header: 'Wifi thành tiền', key: 'wifiCost', width: 20 },
            { header: 'Khác', key: 'otherCost', width: 20 },
            { header: 'Tổng cộng', key: 'total', width: 20 },
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data
        monthlyBills.forEach(bill => {
            const elecUsage = bill.electricityNew - bill.electricityOld;
            const otherTotal = bill.otherServices?.reduce((sum, s) => sum + s.amount, 0) || 0;
            
            worksheet.addRow({
                room: `P.${getRoomNumber(bill.roomId)}`,
                elecUsage: elecUsage,
                elecCost: elecUsage * bill.electricityRate,
                waterCost: bill.waterRate, // This is total water cost in our current Bill type
                garbageCost: bill.garbageFee,
                wifiCost: bill.wifiFee || 0,
                otherCost: otherTotal,
                total: bill.totalAmount
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `Bao_cao_su_dung_${selectedMonth}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">Báo cáo khách sử dụng</h2>
                        <p className="text-sm text-gray-500 italic">Thống kê mỗi tháng khách thuê xài</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <label htmlFor="month-select" className="sr-only">Tháng lập phiếu</label>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            id="month-select"
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        />
                    </div>
                    <button
                        onClick={handleExportExcel}
                        disabled={monthlyBills.length === 0}
                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        Xuất excel
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r">Tên phòng</th>
                            <th colSpan={2} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r bg-blue-50/50">Tiền điện ({selectedMonth})</th>
                            <th colSpan={2} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r">Tiền nước ({selectedMonth})</th>
                            <th colSpan={2} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r bg-gray-50">Tiền rác ({selectedMonth})</th>
                            <th colSpan={2} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r">Tiền wifi (người) (Người)</th>
                            <th rowSpan={2} className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng cộng</th>
                        </tr>
                        <tr className="bg-gray-50 text-[10px]">
                            <th className="px-4 py-2 text-left text-gray-400 border-r">Sử dụng</th>
                            <th className="px-4 py-2 text-right text-gray-400 border-r">Thành tiền</th>
                            <th className="px-4 py-2 text-left text-gray-400 border-r">Sử dụng</th>
                            <th className="px-4 py-2 text-right text-gray-400 border-r">Thành tiền</th>
                            <th className="px-4 py-2 text-left text-gray-400 border-r">Sử dụng</th>
                            <th className="px-4 py-2 text-right text-gray-400 border-r">Thành tiền</th>
                            <th className="px-4 py-2 text-left text-gray-400 border-r">Sử dụng</th>
                            <th className="px-4 py-2 text-right text-gray-400 border-r">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {monthlyBills.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <Inbox className="w-16 h-16 text-gray-200" />
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">Không tìm thấy dữ liệu!</p>
                                        <p className="text-sm text-gray-500">Chưa có hóa đơn nào được lập cho tháng {selectedMonth.split('-').reverse().join('/')}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            monthlyBills.map((bill) => {
                                const elecUsage = bill.electricityNew - bill.electricityOld;
                                // For water/garbage/wifi, we assume usage count is based on tenant count or flat
                                // Our current Bill type doesn't store usage, just totalAmount per service.
                                // We might need to deduce it or just show total.
                                
                                return (
                                    <tr key={bill.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r bg-yellow-50/20">
                                            P.{getRoomNumber(bill.roomId)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 border-r text-center">
                                            {elecUsage}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r text-right">
                                            {formatCurrency(elecUsage * bill.electricityRate)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 border-r text-center">
                                            -
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r text-right">
                                            {formatCurrency(bill.waterRate)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 border-r text-center">
                                            -
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r text-right">
                                            {formatCurrency(bill.garbageFee)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 border-r text-center">
                                            -
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r text-right">
                                            {formatCurrency(bill.wifiFee || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-indigo-600 text-right">
                                            {formatCurrency(bill.totalAmount)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 italic text-sm text-gray-500">
                * Báo cáo này thống kê dựa trên các hóa đơn ĐÃ LẬU trong tháng. Vui lòng kiểm tra kỹ trước khi xuất Excel.
            </div>
        </div>
    );
}
