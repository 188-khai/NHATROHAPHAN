import { Fragment, useState, useEffect, useRef } from 'react';
import { Room, Tenant, Bill, RoomStatus, Asset } from '../types';
import { calculateBill, formatCurrency } from '../utils/calculations';
import { Dialog, Transition } from '@headlessui/react';
import { X, Plus, Trash2, Pencil, CalendarDays, Camera, RefreshCw, Eye, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AssetManagement from './AssetManagement';
import ImageLightboxModal from './ImageLightboxModal';

interface RoomDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room | null;
    tenants: Tenant[];
    bills?: Bill[]; // Add bills prop
    onUpdateRoom: (room: Room) => void;
    onUpdateTenant: (tenant: Tenant) => void;
    onAddTenant: (tenant: Tenant) => void;
    onRemoveTenant: (tenantId: string) => void;
    onSaveBill: (bill: Bill) => void;
    onUpdateBill: (bill: Bill) => void;
    onDeleteBill: (billId: string) => void;
    initialEditingBill?: Bill | null;
    initialActiveTab?: 'info' | 'tenants' | 'bill' | 'assets';
    assets?: Asset[];
    onAddAsset?: (asset: Asset) => void;
    onUpdateAsset?: (asset: Asset) => void;
    onDeleteAsset?: (assetId: string) => void;
}

export default function RoomDetailModal({
    isOpen,
    onClose,
    room,
    tenants,
    bills = [],
    onUpdateRoom,
    onUpdateTenant,
    onAddTenant,
    onRemoveTenant,
    onSaveBill,
    onUpdateBill,
    onDeleteBill,
    initialEditingBill = null,
    initialActiveTab = 'info',
    assets = [],
    onAddAsset = () => { },
    onUpdateAsset = () => { },
    onDeleteAsset = () => { },
}: RoomDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'tenants' | 'bill' | 'assets'>('info');
    const [editedRoom, setEditedRoom] = useState<Room | null>(room);

    // New Tenant Form State
    const [newTenant, setNewTenant] = useState<Partial<Tenant>>({
        name: '',
        phone: '',
        startDate: new Date().toISOString().split('T')[0],
        deposit: 0,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Billing State
    const [electricityOld, setElectricityOld] = useState(0);
    const [electricityNew, setElectricityNew] = useState(0);
    const [waterOld, setWaterOld] = useState(0);
    const [waterNew, setWaterNew] = useState(0);
    const [calculatedBill, setCalculatedBill] = useState<any>(null);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Ref for the hidden bill invoice
    const billRef = useRef<HTMLDivElement>(null);

    // Filter tenants by roomId instead of relying on room.tenantIds for better sync
    const roomTenants = room ? tenants.filter(t => t.roomId === room.id) : [];

    useEffect(() => {
        if (room) {
            // Respect initial props if provided, otherwise default
            if (isOpen) {
                setActiveTab(initialActiveTab);
            }

            // Auto-fill from latest bill if not editing
            const roomBills = bills.filter(b => b.roomId === room.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (initialEditingBill) {
                setEditingBill(initialEditingBill);
                setElectricityOld(initialEditingBill.electricityOld);
                setElectricityNew(initialEditingBill.electricityNew);
                setWaterOld(initialEditingBill.waterOld || 0);
                setWaterNew(initialEditingBill.waterNew || 0);
                setCalculatedBill(null);
            } else {
                if (roomBills.length > 0) {
                    setElectricityOld(roomBills[0].electricityNew);
                    setWaterOld(roomBills[0].waterNew || 0); // Handle potential undefined for old data
                    setElectricityNew(0);
                    setWaterNew(0);
                } else {
                    setElectricityOld(0);
                    setElectricityNew(0);
                    setWaterOld(0);
                    setWaterNew(0);
                }
                setEditingBill(null);
                setCalculatedBill(null);
            }

            setNewTenant({
                name: '',
                phone: '',
                startDate: new Date().toISOString().split('T')[0],
                deposit: 0,
            });
        }
    }, [room, bills, isOpen, initialEditingBill, initialActiveTab]); // Added dependencies

    const handleSaveRoom = () => {
        if (editedRoom) {
            onUpdateRoom(editedRoom);
            onClose();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewTenant(prev => ({ ...prev, identityCardImage: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddTenant = () => {
        if (room && newTenant.name && newTenant.phone) {
            const tenant: Tenant = {
                id: crypto.randomUUID(),
                roomId: room.id,
                name: newTenant.name!,
                phone: newTenant.phone!,
                startDate: newTenant.startDate!,
                deposit: newTenant.deposit || 0,
                identityCardImage: newTenant.identityCardImage
            };
            onAddTenant(tenant);

            // Reset form
            setNewTenant({
                name: '',
                phone: '',
                startDate: new Date().toISOString().split('T')[0],
                deposit: 0,
                identityCardImage: undefined
            });
            if (fileInputRef.current) fileInputRef.current.value = '';

            // Room status update is now handled in parent component (app/page.tsx)
        }
    };

    const handleRemoveTenant = (tenantId: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa khách thuê này?')) {
            onRemoveTenant(tenantId);
        }
    };

    const handleCalculateBill = () => {
        if (!room) return;
        const result = calculateBill(
            electricityOld,
            electricityNew,
            roomTenants.length, // Pass number of tenants
            room.price
        );
        setCalculatedBill(result);
    };

    // Helper to construct bill object
    const getBillPayload = (): Bill => {
        if (editingBill) {
            return {
                ...editingBill,
                electricityOld,
                electricityNew,
                waterOld,
                waterNew,
                totalAmount: calculatedBill.totalAmount,
            };
        } else {
            return {
                id: crypto.randomUUID(),
                roomId: room!.id,
                date: new Date().toISOString(),
                electricityOld,
                electricityNew,
                waterOld,
                waterNew,
                electricityRate: 3500,
                waterRate: 30000,
                garbageFee: 20000,
                totalAmount: calculatedBill.totalAmount,
                isPaid: false
            };
        }
    };

    const handleConfirmBill = () => {
        if (calculatedBill && room) {
            const bill = getBillPayload();
            if (editingBill) {
                onUpdateBill(bill);
                setEditingBill(null);
                alert("Đã cập nhật hóa đơn thành công!");
            } else {
                onSaveBill(bill);
            }
            setCalculatedBill(null);
            onClose();
        }
    }

    const handleEditBill = (bill: Bill) => {
        setEditingBill(bill);
        setElectricityOld(bill.electricityOld);
        setElectricityNew(bill.electricityNew);
        setWaterOld(bill.waterOld || 0);
        setWaterNew(bill.waterNew || 0);
        setCalculatedBill(null); // Reset preview until they hit calculate
        // Scroll to top of billing form
        const formElement = document.getElementById('billing-form');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingBill(null);
        setCalculatedBill(null);
        // Reset to auto-fill defaults
        if (room) {
            const roomBills = bills.filter(b => b.roomId === room.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (roomBills.length > 0) {
                setElectricityOld(roomBills[0].electricityNew);
                setWaterOld(roomBills[0].waterNew || 0);
                setElectricityNew(0);
                setWaterNew(0);
            } else {
                setElectricityOld(0);
                setElectricityNew(0);
                setWaterOld(0);
                setWaterNew(0);
            }
        }
    };

    const handleViewBillFromHistory = (bill: Bill) => {
        // We simulate a calculatedBill state so the invoice template renders it fully
        const simulatedCalculation = {
            electricityUsage: bill.electricityNew - bill.electricityOld,
            electricityCost: (bill.electricityNew - bill.electricityOld) * bill.electricityRate!,
            waterCost: bill.waterRate! * roomTenants.length, // Rough approx if rate changed, but we rely on what is saved
            garbageFee: bill.garbageFee!,
            roomPrice: bill.totalAmount - ((bill.electricityNew - bill.electricityOld) * bill.electricityRate!) - (bill.waterRate! * roomTenants.length) - bill.garbageFee!,
            totalAmount: bill.totalAmount,
        };
        
        // Temporarily set states to show this bill
        setElectricityOld(bill.electricityOld);
        setElectricityNew(bill.electricityNew);
        setWaterOld(bill.waterOld || 0);
        setWaterNew(bill.waterNew || 0);
        setCalculatedBill(simulatedCalculation);
        
        // Scroll to the invoice preview
        const billElement = document.getElementById('bill-preview');
        if (billElement) billElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteBill = (billId: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa hóa đơn này không? Hành động này không thể hoàn tác.')) {
            onDeleteBill(billId);
        }
    };

    const handleExportPDF = async () => {
        if (!calculatedBill || !room || !billRef.current) return;

        // Auto-save if not already saved (or update if editing)
        // We do this silently or with a notification
        const bill = getBillPayload();
        if (editingBill) {
            onUpdateBill(bill);
        } else {
            // Check if this specific calculation is already saved? 
            // Hard to know for sure without ID, but for new bills, we just save it.
            // To prevent duplicates if they click export multiple times, we could check properties,
            // but for now, let's assume "Export" means "Save & Export".
            onSaveBill(bill);
        }

        // We don't close the modal, so user can continue if they want.
        // But we should probably switch to "edit mode" for the newly saved bill to prevent duplicate saves?
        // Actually, let's just save. If they click again, they might create another bill if we don't update state.
        // Ideally, we sets `editingBill` to this new bill.
        if (!editingBill) {
            setEditingBill(bill);
        }

        try {
            const canvas = await html2canvas(billRef.current, {
                scale: 2, // Improved quality
                useCORS: true,
                backgroundColor: '#F9F7F2',
                windowWidth: billRef.current.scrollWidth,
                windowHeight: billRef.current.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`bill_room_${room.roomNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error: any) {
            console.error("Error exporting PDF:", error);
            alert(`Lỗi xuất PDF: ${error.message || error}`);
        }
    };

    const handleSendZalo = async () => {
        if (!calculatedBill || !room || !billRef.current) return;

        // Auto-save logic
        const bill = getBillPayload();
        if (editingBill) {
            onUpdateBill(bill);
        } else {
            onSaveBill(bill);
            if (!editingBill) {
                setEditingBill(bill);
            }
        }

        try {
            const canvas = await html2canvas(billRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#F9F7F2',
                windowWidth: billRef.current.scrollWidth,
                windowHeight: billRef.current.scrollHeight
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    alert('Lỗi tạo ảnh hóa đơn (Blob is null).');
                    return;
                }
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]);

                    const firstTenant = roomTenants.length > 0 ? roomTenants[0] : null;
                    const phone = firstTenant ? firstTenant.phone : '';
                    const zaloUrl = phone ? `https://zalo.me/${phone}` : 'https://zalo.me';

                    window.open(zaloUrl, '_blank');
                    alert('Đã lưu hóa đơn và copy ảnh! Hãy nhấn Ctrl+V vào Zalo để gửi.');

                } catch (err) {
                    console.error('Failed to copy: ', err);
                    alert('Không thể copy ảnh. Vui lòng thử lại hoặc dùng tính năng Xuất PDF.');
                }
            }, 'image/png');

        } catch (error: any) {
            console.error("Error sending Zalo:", error);
            alert(`Lỗi xử lý hình ảnh: ${error.message || error}`);
        }
    };

    if (!room) return null;

    return (
        <Fragment>
            <Transition.Root show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={onClose}>
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full h-[80vh] overflow-y-auto pr-2">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 sticky top-0 bg-white z-10 pb-2">
                                            Phòng {room.roomNumber}
                                        </Dialog.Title>

                                        {/* Tabs */}
                                        <div className="flex border-b border-gray-200 mt-4 sticky top-8 bg-white z-10">
                                            <button
                                                className={`flex-1 py-2 px-2 text-center text-sm ${activeTab === 'info' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
                                                onClick={() => setActiveTab('info')}
                                            >
                                                Thông tin
                                            </button>
                                            <button
                                                className={`flex-1 py-2 px-2 text-center text-sm ${activeTab === 'tenants' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
                                                onClick={() => setActiveTab('tenants')}
                                            >
                                                Khách thuê ({roomTenants.length})
                                            </button>
                                            <button
                                                className={`flex-1 py-2 px-2 text-center text-sm ${activeTab === 'bill' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
                                                onClick={() => setActiveTab('bill')}
                                            >
                                                Tính tiền
                                            </button>
                                            <button
                                                className={`flex-1 py-2 px-2 text-center text-sm ${activeTab === 'assets' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
                                                onClick={() => setActiveTab('assets')}
                                            >
                                                Tài sản
                                            </button>
                                        </div>

                                        <div className="mt-4">
                                            {activeTab === 'info' && editedRoom && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label htmlFor="room-price" className="block text-sm font-medium text-gray-700">Giá phòng</label>
                                                        <input
                                                            id="room-price"
                                                            type="text"
                                                            value={editedRoom.price ? new Intl.NumberFormat('de-DE').format(editedRoom.price) : ''}
                                                            onChange={(e) => {
                                                                const rawValue = e.target.value.replace(/\D/g, '');
                                                                const numValue = rawValue ? parseInt(rawValue, 10) : 0;
                                                                setEditedRoom({ ...editedRoom, price: numValue });
                                                            }}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="room-status" className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                                        <select
                                                            id="room-status"
                                                            title="Trạng thái phòng"
                                                            value={editedRoom.status}
                                                            onChange={(e) => setEditedRoom({ ...editedRoom, status: e.target.value as RoomStatus })}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                                        >
                                                            <option value="available">Trống</option>
                                                            <option value="rented">Đã thuê</option>
                                                            <option value="maintenance">Bảo trì</option>
                                                        </select>
                                                    </div>
                                                    <button
                                                        onClick={handleSaveRoom}
                                                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                                                    >
                                                        Lưu thay đổi
                                                    </button>
                                                </div>
                                            )}

                                            {activeTab === 'tenants' && (
                                                <div className="space-y-6">
                                                    {/* List existing tenants */}
                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-medium text-gray-900">Danh sách khách thuê</h4>
                                                        {roomTenants.length === 0 ? (
                                                            <p className="text-xs text-gray-500 italic">Chưa có khách nào.</p>
                                                        ) : (
                                                            roomTenants.map(t => (
                                                                <div key={t.id} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                                    <div
                                                                        className="flex justify-between items-center cursor-pointer"
                                                                        onClick={() => setExpandedTenantId(expandedTenantId === t.id ? null : t.id)}
                                                                    >
                                                                        <div>
                                                                            <p className="font-bold text-base text-gray-900">{t.name}</p>
                                                                            <p className="text-sm font-medium text-gray-700">{t.phone}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRemoveTenant(t.id);
                                                                                }}
                                                                                className="text-red-500 hover:text-red-700 p-1"
                                                                                title="Xóa khách thuê"
                                                                                aria-label="Xóa khách thuê"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </button>
                                                                            {expandedTenantId === t.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                                                                        </div>
                                                                    </div>
                                                                    {expandedTenantId === t.id && (
                                                                        <div className="mt-4 pt-3 border-t border-gray-200 text-sm animate-in fade-in slide-in-from-top-1">
                                                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                                                <div>
                                                                                    <p className="text-gray-500 text-xs">Ngày bắt đầu:</p>
                                                                                    <p className="font-medium text-gray-900">{t.startDate}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-gray-500 text-xs">Tiền cọc:</p>
                                                                                    <p className="font-medium text-gray-900">{formatCurrency(t.deposit)}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-gray-500 text-xs mb-1">Hình ảnh CCCD:</p>
                                                                                {t.identityCardImage ? (
                                                                                    <img
                                                                                        src={t.identityCardImage}
                                                                                        alt="CCCD"
                                                                                        onClick={() => {
                                                                                            setLightboxImage(t.identityCardImage || null);
                                                                                            setIsLightboxOpen(true);
                                                                                        }}
                                                                                        className="h-24 w-36 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                                                                    />
                                                                                ) : (
                                                                                    <p className="text-xs text-gray-400 italic">Không có ảnh CCCD</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    {/* Add new tenant form */}
                                                    <div className="border-t pt-4">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Thêm khách mới</h4>
                                                        <div className="space-y-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Họ tên"
                                                                title="Họ tên khách mới"
                                                                value={newTenant.name}
                                                                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                                                                className="block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm text-black placeholder:text-gray-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Số điện thoại"
                                                                title="Số điện thoại khách mới"
                                                                value={newTenant.phone}
                                                                onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                                                                className="block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm text-black placeholder:text-gray-500"
                                                            />
                                                            <input
                                                                type="date"
                                                                title="Ngày bắt đầu thuê"
                                                                value={newTenant.startDate}
                                                                onChange={(e) => setNewTenant({ ...newTenant, startDate: e.target.value })}
                                                                className="block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm text-black placeholder:text-gray-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Tiền cọc"
                                                                value={newTenant.deposit ? new Intl.NumberFormat('de-DE').format(newTenant.deposit) : ''}
                                                                onChange={(e) => {
                                                                    // Remove non-numeric characters
                                                                    const rawValue = e.target.value.replace(/\D/g, '');
                                                                    // Parse to number, default to 0 if empty
                                                                    const numValue = rawValue ? parseInt(rawValue, 10) : 0;
                                                                    setNewTenant({ ...newTenant, deposit: numValue });
                                                                }}
                                                                className="block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm text-black placeholder:text-gray-500"
                                                            />

                                                            <div className="flex items-center gap-2">
                                                                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200">
                                                                    <Upload className="h-3 w-3" />
                                                                    Upload CCCD
                                                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                                </label>
                                                                {newTenant.identityCardImage && <span className="text-xs text-green-600">Đã chọn ảnh</span>}
                                                            </div>

                                                            <button
                                                                onClick={handleAddTenant}
                                                                className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                                                            >
                                                                Thêm khách
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'bill' && (
                                                <>
                                                    <div className="space-y-4" id="billing-form">
                                                        {editingBill && (
                                                            <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-200 mb-2">
                                                                Đang sửa hóa đơn ngày {new Date(editingBill.date).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Điện mới</label>
                                                                <input
                                                                    type="number"
                                                                    value={electricityNew === 0 ? '' : electricityNew}
                                                                    placeholder="0"
                                                                    onChange={(e) => setElectricityNew(Number(e.target.value))}
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border p-2 text-black placeholder:text-gray-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Điện cũ</label>
                                                                <input
                                                                    type="number"
                                                                    value={electricityOld === 0 ? '' : electricityOld}
                                                                    placeholder="0"
                                                                    onChange={(e) => setElectricityOld(Number(e.target.value))}
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border p-2 text-black placeholder:text-gray-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Nước mới</label>
                                                                <input
                                                                    type="number"
                                                                    value={waterNew === 0 ? '' : waterNew}
                                                                    placeholder="0"
                                                                    onChange={(e) => setWaterNew(Number(e.target.value))}
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border p-2 text-black placeholder:text-gray-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Nước cũ</label>
                                                                <input
                                                                    type="number"
                                                                    value={waterOld === 0 ? '' : waterOld}
                                                                    placeholder="0"
                                                                    onChange={(e) => setWaterOld(Number(e.target.value))}
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border p-2 text-black placeholder:text-gray-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 italic">* Tiền nước: 30.000đ/người | Tiền rác: 20.000đ/phòng</p>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleCalculateBill}
                                                                className="w-full inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                                            >
                                                                {editingBill ? 'Tính lại' : 'Tính toán'}
                                                            </button>
                                                            {editingBill && (
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            )}
                                                        </div>

                                                        {calculatedBill && (
                                                            <div className="mt-4 bg-gray-50 p-4 rounded-md text-gray-900">
                                                                <p className="flex justify-between text-sm"><span>Tiền điện ({calculatedBill.electricityUsage} số):</span> <span className="font-medium">{formatCurrency(calculatedBill.electricityCost)}</span></p>
                                                                <p className="flex justify-between text-sm"><span>Tiền nước ({roomTenants.length} người):</span> <span className="font-medium">{formatCurrency(calculatedBill.waterCost)}</span></p>
                                                                <p className="flex justify-between text-sm"><span>Tiền rác:</span> <span className="font-medium">{formatCurrency(calculatedBill.garbageFee)}</span></p>
                                                                <p className="flex justify-between text-sm"><span>Tiền phòng:</span> <span className="font-medium">{formatCurrency(room.price)}</span></p>
                                                                <div className="border-t border-gray-200 my-2 pt-2">
                                                                    <p className="flex justify-between text-xl font-extrabold text-indigo-900"><span>Tổng cộng:</span> <span>{formatCurrency(calculatedBill.totalAmount)}</span></p>
                                                                </div>

                                                                <div className="mt-4 border-t pt-4 flex justify-between items-center">
                                                                    <div className="flex-shrink-0">
                                                                        <img src="/qr-only.png" alt="QR Code" className="w-24 h-24 rounded border p-1" />
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-medium text-gray-900">Thông tin thanh toán</p>
                                                                        <p className="text-xs text-gray-500 mt-1">MB Bank - HUA QUANG KHAI</p>
                                                                        <p className="font-bold text-lg text-indigo-700 tracking-wide">666088887979</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 mt-4">
                                                                    <button
                                                                        onClick={handleConfirmBill}
                                                                        className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                                                                    >
                                                                        {editingBill ? 'Cập nhật' : 'Lưu'}
                                                                    </button>
                                                                    <button
                                                                        onClick={handleExportPDF}
                                                                        className="flex-1 inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                                                    >
                                                                        Xuất PDF
                                                                    </button>
                                                                    <button
                                                                        onClick={handleSendZalo}
                                                                        className="flex-1 inline-flex justify-center rounded-md border border-blue-500 bg-blue-50 py-2 px-4 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100"
                                                                    >
                                                                        Gửi Zalo
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Room Bill History */}
                                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-4">Lịch sử thanh toán phòng này</h4>
                                                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                                                            <table className="min-w-full divide-y divide-gray-300">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase sm:pl-6">Ngày</th>
                                                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Điện</th>
                                                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                                                                        <th scope="col" className="px-3 py-3.5 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200 bg-white">
                                                                    {bills.filter(b => b.roomId === room.id).length === 0 ? (
                                                                        <tr>
                                                                            <td colSpan={4} className="py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6 text-center italic">Chưa có lịch sử thanh toán.</td>
                                                                        </tr>
                                                                    ) : (
                                                                        bills
                                                                            .filter(b => b.roomId === room.id)
                                                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                                            .map((bill) => (
                                                                                <tr key={bill.id}>
                                                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                                                        {new Date(bill.date).toLocaleDateString('vi-VN')}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                                                        {bill.electricityNew} - {bill.electricityOld}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap px-3 py-4 text-base text-indigo-700 font-extrabold">
                                                                                        {formatCurrency(bill.totalAmount)}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                                                                                        <div className="flex justify-end gap-2">
                                                                                            <button
                                                                                                onClick={() => handleViewBillFromHistory(bill)}
                                                                                                className="text-gray-500 hover:text-gray-700"
                                                                                                title="Xem hóa đơn"
                                                                                            >
                                                                                                <Eye className="h-4 w-4" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleEditBill(bill)}
                                                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                                                title="Sửa hóa đơn"
                                                                                            >
                                                                                                <Pencil className="h-4 w-4" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleDeleteBill(bill.id)}
                                                                                                className="text-red-500 hover:text-red-700"
                                                                                                title="Xóa hóa đơn"
                                                                                            >
                                                                                                <Trash2 className="h-4 w-4" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {activeTab === 'assets' && room && (
                                                <AssetManagement
                                                    room={room}
                                                    assets={assets}
                                                    onAddAsset={onAddAsset}
                                                    onUpdateAsset={onUpdateAsset}
                                                    onDeleteAsset={onDeleteAsset}
                                                />
                                            )}

                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root >

            {/* Hidden Invoice Template for PDF Generation */}

            {/* Hidden Invoice Template for PDF Generation */}
            {
                calculatedBill && (
                    <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
                        <div ref={billRef} style={{ width: '210mm', minHeight: '297mm', backgroundColor: '#F9F7F2', color: '#124E57', padding: '3rem', fontFamily: 'serif' }} className="box-border">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h1 className="text-[3.75rem] font-bold tracking-wider mb-2 uppercase m-0 leading-none">Hóa đơn</h1>
                                    <p className="text-sm opacity-80 my-1">Mã hóa đơn: #BILL-{room.roomNumber}-{new Date().getTime().toString().slice(-6)}</p>
                                    <p className="text-sm opacity-80 my-1">Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xl mb-1">Phòng: {room.roomNumber}</p>
                                    <p className="text-sm m-0">Khách thuê: {roomTenants.map(t => t.name).join(', ')}</p>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="mb-12">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr style={{ backgroundColor: '#124E57', color: '#ffffff' }}>
                                            <th className="p-4 rounded-tl-lg">Khoản mục</th>
                                            <th className="p-4">Chi tiết</th>
                                            <th className="p-4">Số lượng</th>
                                            <th className="p-4 text-right rounded-tr-lg">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        <tr style={{ borderBottom: '1px solid #2a7f8533' }}>
                                            <td className="p-4 font-bold">Tiền điện</td>
                                            <td className="p-4">{electricityNew} - {electricityOld}</td>
                                            <td className="p-4">{calculatedBill.electricityUsage} số</td>
                                            <td className="p-4 text-right">{formatCurrency(calculatedBill.electricityCost)}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #2a7f8533' }}>
                                            <td className="p-4 font-bold">Tiền nước</td>
                                            <td className="p-4">{roomTenants.length} người</td>
                                            <td className="p-4">{roomTenants.length} suất</td>
                                            <td className="p-4 text-right">{formatCurrency(calculatedBill.waterCost)}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #2a7f8533' }}>
                                            <td className="p-4 font-bold">Tiền rác</td>
                                            <td className="p-4">Cố định</td>
                                            <td className="p-4">1 phòng</td>
                                            <td className="p-4 text-right">{formatCurrency(calculatedBill.garbageFee)}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #2a7f8533' }}>
                                            <td className="p-4 font-bold">Tiền phòng</td>
                                            <td className="p-4">Cố định</td>
                                            <td className="p-4">1 tháng</td>
                                            <td className="p-4 text-right">{formatCurrency(room.price)}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ backgroundColor: '#F9F7F2' }}>
                                            <td colSpan={3} className="p-4 text-right pr-6 font-bold text-xl uppercase text-[#4b5563]">Tổng cộng</td>
                                            <td style={{ color: '#124E57' }} className="p-4 text-right font-bold text-xl">{formatCurrency(calculatedBill.totalAmount)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Amount Due & Payment Info */}
                            <div className="flex justify-between items-start mb-[60px]">
                                {/* Left: QR Code */}
                                <div className="flex-1">
                                    <img src="/qr-only.png" alt="Payment QR" className="w-[120px] h-[120px] rounded" />
                                    <p style={{ color: '#4b5563' }} className="text-xs mt-2">Quét mã để thanh toán</p>
                                </div>

                                {/* Right: Amount & Bank Details */}
                                <div className="text-right flex-[2] pr-4">
                                    <p className="text-lg mb-2">Thành tiền</p>
                                    <p style={{ color: '#124E57' }} className="text-[2.5rem] font-bold font-serif mb-4">{formatCurrency(calculatedBill.totalAmount)}</p>

                                    <div className="text-sm">
                                        <p className="mb-1 uppercase tracking-wider">Ngân hàng MB Bank</p>
                                        <p className="mb-1 font-bold">HUA QUANG KHAI</p>
                                        <p className="m-0 text-lg font-bold tracking-widest">666088887979</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="absolute bottom-12 left-0 w-full text-center opacity-90">
                                <p className="font-serif italic mb-6 px-12 leading-relaxed max-w-3xl mx-auto">
                                    &quot;Cảm ơn bạn đã tin tưởng chọn đây làm nơi dừng chân. Mong rằng căn phòng nhỏ này sẽ là nơi lưu giữ nhiều kỷ niệm đẹp và tiếp thêm động lực cho bạn mỗi ngày.&quot;
                                </p>
                                <div className="border-t border-[#124e5733] w-1/3 mx-auto pt-4">
                                    <p className="font-bold text-lg uppercase tracking-wider">Boarding House Manager</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <ImageLightboxModal
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                imageUrl={lightboxImage}
            />
        </Fragment >
    );
}
