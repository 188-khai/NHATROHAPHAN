import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag, CheckCircle2, Home } from 'lucide-react';
import { ServiceRate, ServiceUnit, Room } from '../types';
import CurrencyInput from './CurrencyInput';
import { formatCurrency } from '../utils/calculations';

interface ServiceManagementProps {
    serviceRates: ServiceRate[];
    roomCount: number;
    rooms: Room[];
    onSaveServiceRate: (rate: ServiceRate) => void;
    onDeleteServiceRate: (id: string) => void;
}

export default function ServiceManagement({
    serviceRates,
    roomCount,
    rooms,
    onSaveServiceRate,
    onDeleteServiceRate,
}: ServiceManagementProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<ServiceRate | null>(null);

    const [formName, setFormName] = useState('');
    const [formAmount, setFormAmount] = useState(0);
    const [formUnit, setFormUnit] = useState<ServiceUnit>('month');
    const [formDescription, setFormDescription] = useState('');
    const [formRoomIds, setFormRoomIds] = useState<string[]>([]); // Empty = All Rooms

    const openModal = (rate?: ServiceRate) => {
        if (rate) {
            setEditingRate(rate);
            setFormName(rate.name);
            setFormAmount(rate.amount);
            setFormUnit(rate.unit);
            setFormDescription(rate.description || '');
            setFormRoomIds(rate.applicableRoomIds || []);
        } else {
            setEditingRate(null);
            setFormName('');
            setFormAmount(0);
            setFormUnit('month');
            setFormDescription('');
            setFormRoomIds([]);
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formName || formAmount <= 0) {
            alert('Vui lòng nhập tên và đơn giá hợp lệ.');
            return;
        }

        const newRate: ServiceRate = {
            id: editingRate?.id || crypto.randomUUID(),
            name: formName,
            amount: formAmount,
            unit: formUnit,
            description: formDescription,
            applicableRoomIds: formRoomIds,
        };

        onSaveServiceRate(newRate);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa dịch vụ này không?')) {
            onDeleteServiceRate(id);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-green-500 rounded-full"></div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">Quản lý dịch vụ</h2>
                        <p className="text-sm text-gray-500 italic">Các dịch vụ khách thuê xài</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (confirm('Bạn có muốn khôi phục về cấu hình dịch vụ mặc định (Điện 1700, Nước 18000, Rác 15000, Wifi 50000) không?')) {
                                const defaults = [
                                    { id: crypto.randomUUID(), name: 'Tiền điện', amount: 1700, unit: 'kwh' as ServiceUnit, description: 'Tính theo số ký điện sử dụng' },
                                    { id: crypto.randomUUID(), name: 'Tiền nước', amount: 18000, unit: 'person' as ServiceUnit, description: 'Tính theo đầu người' },
                                    { id: crypto.randomUUID(), name: 'Tiền rác', amount: 15000, unit: 'month' as ServiceUnit, description: 'Phí cố định hàng tháng' },
                                    { id: crypto.randomUUID(), name: 'Tiền wifi', amount: 50000, unit: 'person' as ServiceUnit, description: 'Phí wifi theo đầu người' }
                                ];
                                defaults.forEach(d => onSaveServiceRate(d));
                            }
                        }}
                        className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Khôi phục mặc định
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg shadow-green-100 transition-all active:scale-95"
                        title="Thêm dịch vụ mới"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceRates.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Chưa có dịch vụ nào được cấu hình.</p>
                        <button 
                            onClick={() => openModal()}
                            className="mt-4 text-green-600 font-medium hover:underline"
                        >
                            Thêm dịch vụ đầu tiên
                        </button>
                    </div>
                ) : (
                    serviceRates.map((rate) => (
                        <div key={rate.id} className="group relative bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md hover:border-green-100">
                            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-green-500 transition-colors">
                                <Tag className="w-6 h-6" />
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg">{rate.name}</h3>
                                <p className="text-gray-600 font-medium">
                                    {formatCurrency(rate.amount)}/{rate.unit === 'kwh' ? 'kWh' : rate.unit === 'person' ? 'Người' : 'Tháng'}
                                </p>
                                <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1 italic">
                                    <CheckCircle2 className="w-3 h-3" /> {rate.applicableRoomIds && rate.applicableRoomIds.length > 0 ? `Đang áp dụng cho ${rate.applicableRoomIds.length} phòng` : `Đang áp dụng cho tất cả (${roomCount} phòng)`}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => openModal(rate)}
                                    className="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors"
                                    title="Sửa"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(rate.id)}
                                    className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                                    title="Xóa"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingRate ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600" title="Đóng">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên dịch vụ</label>
                                <input
                                    type="text"
                                    placeholder="VD: Tiền Wifi (Người)"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-black"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Đơn giá (VNĐ)</label>
                                    <CurrencyInput
                                        placeholder="50000"
                                        value={formAmount}
                                        onChangeValue={setFormAmount}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Đơn vị</label>
                                    <select
                                        value={formUnit}
                                        onChange={(e) => setFormUnit(e.target.value as ServiceUnit)}
                                        title="Đơn vị tính"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-black bg-white"
                                    >
                                        <option value="month">Từng tháng</option>
                                        <option value="person">Người</option>
                                        <option value="kwh">kWh (Điện)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
                                <textarea
                                    placeholder="Mô tả chi tiết..."
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-black h-20 resize-none"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-semibold text-gray-700">Áp dụng cho phòng</label>
                                    <button 
                                        onClick={() => setFormRoomIds(formRoomIds.length === rooms.length ? [] : rooms.map(r => r.id))}
                                        className="text-xs text-indigo-600 font-bold hover:underline"
                                    >
                                        {formRoomIds.length === rooms.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                                    </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-3 grid grid-cols-3 gap-2 bg-gray-50/50">
                                    {rooms.map(room => (
                                        <button
                                            key={room.id}
                                            onClick={() => {
                                                if (formRoomIds.includes(room.id)) {
                                                    setFormRoomIds(formRoomIds.filter(id => id !== room.id));
                                                } else {
                                                    setFormRoomIds([...formRoomIds, room.id]);
                                                }
                                            }}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                formRoomIds.includes(room.id)
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200'
                                            }`}
                                        >
                                            <Home className="w-3 h-3" />
                                            P.{room.roomNumber}
                                        </button>
                                    ))}
                                    {rooms.length === 0 && (
                                        <p className="col-span-3 text-center text-gray-400 py-4 italic">Chưa có phòng nào</p>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 italic">
                                    * Để trống nếu muốn áp dụng cho tất cả các phòng.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                            >
                                {editingRate ? 'Lưu cập nhật' : 'Xác nhận thêm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
