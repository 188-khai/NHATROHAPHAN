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

    const getRoomData = (roomId: string) => {
        const room = rooms.find(r => r.id === roomId);
        return {
            number: room?.roomNumber || 'Unknown',
            tenantCount: room?.tenantIds?.length || 0
        };
    };

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Báo cáo ${selectedMonth}`);

        // Columns setup
        worksheet.columns = [
            { header: 'Tên phòng', key: 'room', width: 12 },
            { header: 'Số khách', key: 'tenantCount', width: 10 },
            { header: 'Điện sử dụng (kWh)', key: 'elecUsage', width: 18 },
            { header: 'Điện thành tiền', key: 'elecCost', width: 18 },
            { header: 'Nước thành tiền', key: 'waterCost', width: 18 },
            { header: 'Rác thành tiền', key: 'garbageCost', width: 15 },
            { header: 'Wifi thành tiền', key: 'wifiCost', width: 15 },
            { header: 'Khác', key: 'otherCost', width: 15 },
            { header: 'Tổng cộng', key: 'total', width: 18 },
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Initialize totals
        let totalTenants = 0;
        let totalElecUsage = 0;
        let totalElecCost = 0;
        let totalWaterCost = 0;
        let totalGarbageCost = 0;
        let totalWifiCost = 0;
        let totalOtherCost = 0;
        let totalOverall = 0;

        // Add data
        monthlyBills.forEach(bill => {
            const roomData = getRoomData(bill.roomId);
            const elecUsage = bill.electricityNew - bill.electricityOld;
            const otherTotal = bill.otherServices?.reduce((sum, s) => sum + s.amount, 0) || 0;
            const elecCost = elecUsage * bill.electricityRate;
            const waterCost = bill.waterRate;
            const garbageCost = bill.garbageFee;
            const wifiCost = bill.wifiFee || 0;
            
            totalTenants += roomData.tenantCount;
            totalElecUsage += elecUsage;
            totalElecCost += elecCost;
            totalWaterCost += waterCost;
            totalGarbageCost += garbageCost;
            totalWifiCost += wifiCost;
            totalOtherCost += otherTotal;
            totalOverall += bill.totalAmount;

            worksheet.addRow({
                room: `P.${roomData.number}`,
                tenantCount: roomData.tenantCount,
                elecUsage: elecUsage,
                elecCost: elecCost,
                waterCost: waterCost,
                garbageCost: garbageCost,
                wifiCost: wifiCost,
                otherCost: otherTotal,
                total: bill.totalAmount
            });
        });

        // Add Totals row to Excel
        const totalRow = worksheet.addRow({
            room: 'TỔNG CỘNG',
            tenantCount: totalTenants,
            elecUsage: totalElecUsage,
            elecCost: totalElecCost,
            waterCost: totalWaterCost,
            garbageCost: totalGarbageCost,
            wifiCost: totalWifiCost,
            otherCost: totalOtherCost,
            total: totalOverall
        });
        totalRow.font = { bold: true };
        totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' } // Yellow
        };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `Bao_cao_su_dung_${selectedMonth}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    // Calculate totals for UI
    const totals = monthlyBills.reduce((acc, bill) => {
        const roomData = getRoomData(bill.roomId);
        const elecUsage = bill.electricityNew - bill.electricityOld;
        const otherTotal = bill.otherServices?.reduce((sum, s) => sum + s.amount, 0) || 0;
        
        return {
            tenants: acc.tenants + roomData.tenantCount,
            elecUsage: acc.elecUsage + elecUsage,
            elecCost: acc.elecCost + (elecUsage * bill.electricityRate),
            waterCost: acc.waterCost + bill.waterRate,
            garbageCost: acc.garbageCost + bill.garbageFee,
            wifiCost: acc.wifiCost + (bill.wifiFee || 0),
            otherCost: acc.otherCost + otherTotal,
            total: acc.total + bill.totalAmount
        };
    }, { tenants: 0, elecUsage: 0, elecCost: 0, waterCost: 0, garbageCost: 0, wifiCost: 0, otherCost: 0, total: 0 });

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
                            <th rowSpan={2} className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r">Số khách</th>
                            <th colSpan={2} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r bg-blue-50/50">Tiền điện ({selectedMonth})</th>
                            <th colSpan={1} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r">Tiền nước</th>
                            <th colSpan={1} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r bg-gray-50">Tiền rác</th>
                            <th colSpan={1} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r">Wifi</th>
                            <th colSpan={1} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r bg-gray-50">Dịch vụ khác</th>
                            <th rowSpan={2} className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng cộng</th>
                        </tr>
                        <tr className="bg-gray-50 text-[10px]">
                            <th className="px-4 py-2 text-left text-gray-400 border-r">Sử dụng</th>
                            <th className="px-4 py-2 text-right text-gray-400 border-r">Thành tiền</th>
                            <th className="px-4 py-2 text-right text-gray-400 border-r">Thành tiền</th>
                            <th className="px-4 py-2 text-right text-gray-400 border-r">Thành tiền</th>
                            <th className="px-4 py-2 text-right text-gray-400 border-r">Thành tiền</th>
                            <th className="px-4 py-2 text-right text-gray-400 border-r">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {monthlyBills.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="px-6 py-20 text-center">
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
                            <>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r text-right">
                                                <div className="flex flex-col">
                                                    <span>{formatCurrency(bill.waterRate)}</span>
                                                    {roomData.tenantCount > 1 && (
                                                        <span className="text-[10px] text-gray-400 font-normal italic">
                                                            ({formatCurrency(uniqueRates.find(r => r.name.toLowerCase().includes('nước'))?.amount || 30000)} x {roomData.tenantCount})
                                                        </span>
                                                    )}
                                                    {bill.waterRate !== ((uniqueRates.find(r => r.name.toLowerCase().includes('nước'))?.amount || 30000) * roomData.tenantCount) && (
                                                        <span className="text-[8px] text-red-500 font-bold uppercase mt-1">Cần tính lại</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r text-right bg-gray-50/30">
                                                {formatCurrency(bill.garbageFee)}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r text-right">
                                                {formatCurrency(bill.wifiFee || 0)}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r text-right bg-gray-50/30">
                                                {formatCurrency(otherTotal)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-indigo-600 text-right">
                                                {formatCurrency(bill.totalAmount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-yellow-50 font-bold border-t-2 border-gray-300">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                                        TỔNG CỘNG
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black border-r text-center">
                                        {totals.tenants}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black border-r text-center">
                                        {totals.elecUsage}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black border-r text-right">
                                        {formatCurrency(totals.elecCost)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black border-r text-right">
                                        {formatCurrency(totals.waterCost)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black border-r text-right">
                                        {formatCurrency(totals.garbageCost)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black border-r text-right">
                                        {formatCurrency(totals.wifiCost)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black border-r text-right">
                                        {formatCurrency(totals.otherCost)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-indigo-700 text-right">
                                        {formatCurrency(totals.total)}
                                    </td>
                                </tr>
                            </>
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
