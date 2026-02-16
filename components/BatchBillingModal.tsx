import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Room, Tenant, Bill } from '../types';
import { formatCurrency, generateZaloMessage } from '../utils/calculations';

interface BatchBillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    rooms: Room[];
    tenants: Tenant[];
    bills: Bill[];
    onSaveBills: (newBills: Bill[]) => void;
}

interface RoomBillingData {
    roomId: string;
    roomNumber: string;
    roomPrice: number;
    tenantCount: number;
    electricityOld: number;
    electricityNew: number;
    isSelected: boolean;
}

export default function BatchBillingModal({
    isOpen,
    onClose,
    rooms,
    tenants,
    bills,
    onSaveBills,
}: BatchBillingModalProps) {
    const [billingData, setBillingData] = useState<RoomBillingData[]>([]);

    useEffect(() => {
        if (isOpen) {
            const rentedRooms = rooms.filter((r) => r.status === 'rented');
            const data: RoomBillingData[] = rentedRooms.map((room) => {
                // Find latest bill for this room to get old electricity index
                const roomBills = bills
                    .filter((b) => b.roomId === room.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const lastBill = roomBills[0];
                const electricityOld = lastBill ? lastBill.electricityNew : 0;
                const tenantCount = tenants.filter(t => t.roomId === room.id).length;

                return {
                    roomId: room.id,
                    roomNumber: room.roomNumber,
                    roomPrice: room.price,
                    tenantCount,
                    electricityOld,
                    electricityNew: electricityOld, // Default to old value
                    isSelected: true,
                };
            });
            setBillingData(data);
        }
    }, [isOpen, rooms, tenants, bills]);

    const handleElectricityChange = (roomId: string, newValue: number) => {
        setBillingData((prev) =>
            prev.map((item) =>
                item.roomId === roomId ? { ...item, electricityNew: newValue } : item
            )
        );
    };

    const handleToggleSelect = (roomId: string) => {
        setBillingData((prev) =>
            prev.map((item) =>
                item.roomId === roomId ? { ...item, isSelected: !item.isSelected } : item
            )
        );
    };

    const calculateRoomTotal = (item: RoomBillingData) => {
        const electricityUsage = Math.max(0, item.electricityNew - item.electricityOld);
        const electricityCost = electricityUsage * 3500;
        const waterCost = item.tenantCount * 30000;
        const garbageFee = 20000;
        return electricityCost + waterCost + garbageFee + item.roomPrice;
    };

    const handleSave = () => {
        const selectedItems = billingData.filter((item) => item.isSelected);
        const newBills: Bill[] = selectedItems.map((item) => {
            const electricityUsage = Math.max(0, item.electricityNew - item.electricityOld);
            const electricityCost = electricityUsage * 3500;
            const waterCost = item.tenantCount * 30000;
            const garbageFee = 20000;
            const totalAmount = electricityCost + waterCost + garbageFee + item.roomPrice;

            return {
                id: crypto.randomUUID(),
                roomId: item.roomId,
                date: new Date().toISOString(),
                electricityOld: item.electricityOld,
                electricityNew: item.electricityNew,
                waterOld: 0, // Not used
                waterNew: 0, // Not used
                electricityRate: 3500,
                waterRate: 30000, // Per person
                garbageFee: 20000,
                totalAmount,
                isPaid: false,
            };
        });

        onSaveBills(newBills);
        onClose();
    };

    const totalRevenue = billingData
        .filter(item => item.isSelected)
        .reduce((sum, item) => sum + calculateRoomTotal(item), 0);

    const handleSendZalo = async (item: RoomBillingData) => {
        // Calculate details
        const electricityUsage = Math.max(0, item.electricityNew - item.electricityOld);
        const electricityCost = electricityUsage * 3500;
        const waterCost = item.tenantCount * 30000;
        const garbageFee = 20000;
        const totalAmount = electricityCost + waterCost + garbageFee + item.roomPrice;

        // Find tenant phone
        const roomTenants = tenants.filter(t => t.roomId === item.roomId);
        const mainTenant = roomTenants[0]; // Assuming first tenant is contact

        if (!mainTenant) {
            alert(`Phòng ${item.roomNumber} chưa có người thuê hoặc số điện thoại!`);
            return;
        }

        const message = generateZaloMessage(
            item.roomNumber,
            (new Date().getMonth() + 1).toString(),
            item.electricityOld,
            item.electricityNew,
            electricityUsage,
            electricityCost,
            waterCost,
            garbageFee,
            item.roomPrice,
            totalAmount
        );

        try {
            await navigator.clipboard.writeText(message);
            // Open Zalo format: https://zalo.me/<phone>
            // Clean phone number (remove leading 0, add 84) if necessary, usually zalo.me works with 0xxx
            window.open(`https://zalo.me/${mainTenant.phone}`, '_blank');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Không thể copy nội dung hóa đơn.');
        }
    };

    const handleBatchSendZalo = async () => {
        const selectedItems = billingData.filter(i => i.isSelected);
        if (selectedItems.length === 0) return;

        alert('Hệ thống sẽ lần lượt mở tab Zalo cho từng phòng. Vui lòng KHÔNG chặn popup và chờ 2 giây giữa mỗi phòng.');

        for (let i = 0; i < selectedItems.length; i++) {
            const item = selectedItems[i];

            // Wait 2s for all except first
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // We need to visually indicate progress or errors could happen if user switches tabs
            // But main limitation is browser might block popup if not directly triggered by click.
            // We'll try. Ideally prompt user intervention if blocked.
            handleSendZalo(item);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full h-[80vh] overflow-y-auto pr-2">
                                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 sticky top-0 bg-white z-10 pb-2 flex justify-between items-center">
                                            <span>Tính tiền nhanh (Tháng {new Date().getMonth() + 1})</span>
                                            <div className="flex gap-4">
                                                <span className="text-sm font-normal text-gray-500">
                                                    Tổng tiền dự tính: <span className="font-bold text-indigo-600">{formatCurrency(totalRevenue)}</span>
                                                </span>
                                            </div>
                                        </Dialog.Title>

                                        <div className="mt-4">
                                            <table className="min-w-full divide-y divide-gray-300">
                                                <thead className="bg-gray-50 sticky top-10 z-10">
                                                    <tr>
                                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase sm:pl-6 w-10">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                checked={billingData.every(i => i.isSelected)}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setBillingData(prev => prev.map(i => ({ ...i, isSelected: checked })));
                                                                }}
                                                            />
                                                        </th>
                                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase">Phòng</th>
                                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Khách</th>
                                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Điện cũ</th>
                                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase w-32">Điện mới</th>
                                                        <th scope="col" className="px-3 py-3.5 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                                                        <th scope="col" className="px-3 py-3.5 text-center text-xs font-medium text-gray-500 uppercase">Zalo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 bg-white">
                                                    {billingData.map((item) => (
                                                        <tr key={item.roomId} className={item.isSelected ? 'bg-white' : 'bg-gray-50 opacity-50'}>
                                                            <td className="relative whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                                <input
                                                                    type="checkbox"
                                                                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                    checked={item.isSelected}
                                                                    onChange={() => handleToggleSelect(item.roomId)}
                                                                />
                                                            </td>
                                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                                                P.{item.roomNumber}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                                {item.tenantCount}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                                {item.electricityOld}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                                <input
                                                                    type="number"
                                                                    value={item.electricityNew === 0 ? '' : item.electricityNew}
                                                                    onChange={(e) => handleElectricityChange(item.roomId, Number(e.target.value))}
                                                                    placeholder={item.electricityOld.toString()}
                                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-1 text-gray-900"
                                                                    disabled={!item.isSelected}
                                                                />
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-indigo-600">
                                                                {formatCurrency(calculateRoomTotal(item))}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                                                                <button
                                                                    onClick={() => handleSendZalo(item)}
                                                                    disabled={!item.isSelected}
                                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                                                                >
                                                                    Gửi Zalo
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-100">
                                            <button
                                                type="button"
                                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                                                onClick={handleBatchSendZalo}
                                            >
                                                Gửi Hàng Loạt (Zalo)
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                                                onClick={onClose}
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                                                onClick={handleSave}
                                            >
                                                Lưu & Tạo {billingData.filter(i => i.isSelected).length} Hóa Đơn
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
