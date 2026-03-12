import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Info } from 'lucide-react';
import { TaxSettings, TaxPaymentFrequency, TaxClassificationAction } from '@/types';

interface TaxSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: TaxSettings) => Promise<void>;
    existingSettings: TaxSettings | null;
}

const AVAILABLE_SERVICES = [
    'Dọn phòng',
    'Lễ tân',
    'Giặt ủi',
    'Internet/Wifi',
    'Giữ xe',
    'Bảo vệ 24/7'
];

export default function TaxSettingsModal({ isOpen, onClose, onSave, existingSettings }: TaxSettingsModalProps) {
    const currentYear = new Date().getFullYear();
    
    const [year, setYear] = useState(currentYear);
    const [expectedRoomCount, setExpectedRoomCount] = useState(0);
    const [expectedAvgPrice, setExpectedAvgPrice] = useState(0);
    const [paymentFrequency, setPaymentFrequency] = useState<TaxPaymentFrequency>('monthly');
    const [servicesIncluded, setServicesIncluded] = useState<string[]>([]);
    const [isShortTerm, setIsShortTerm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (existingSettings) {
            setYear(existingSettings.year);
            setExpectedRoomCount(existingSettings.expectedRoomCount);
            setExpectedAvgPrice(existingSettings.expectedAvgPrice);
            setPaymentFrequency(existingSettings.paymentFrequency);
            setServicesIncluded(existingSettings.servicesIncluded);
            setIsShortTerm(existingSettings.isShortTerm);
        } else {
            setYear(currentYear);
            setExpectedRoomCount(0);
            setExpectedAvgPrice(1500000);
            setPaymentFrequency('monthly');
            setServicesIncluded([]);
            setIsShortTerm(false);
        }
    }, [existingSettings, isOpen, currentYear]);

    const toggleService = (service: string) => {
        setServicesIncluded(prev => 
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        );
    };

    // AI Classification Logic Simulation
    const determineClassification = (): TaxClassificationAction => {
        const hasServicesLikeHotel = servicesIncluded.includes('Dọn phòng') || servicesIncluded.includes('Lễ tân');
        if (isShortTerm || hasServicesLikeHotel) {
            return 'Dịch Vụ Lưu Trú';
        }
        return 'Cho Thuê Tài Sản';
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const classification = determineClassification();
            
            const settingsData: TaxSettings = {
                id: existingSettings?.id || crypto.randomUUID(),
                year,
                expectedRoomCount,
                expectedAvgPrice,
                paymentFrequency,
                servicesIncluded,
                isShortTerm,
                classification,
                createdAt: existingSettings?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await onSave(settingsData);
            onClose();
        } catch (error) {
            console.error('Error saving tax settings:', error);
            alert('Có lỗi xảy ra khi lưu cấu hình.');
        } finally {
            setIsSaving(false);
        }
    };

    const classificationPreview = determineClassification();

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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                                <form onSubmit={handleSave}>
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
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-6 pb-2 border-b">
                                                Cấu Hình Thuế & Kinh Doanh Đầu Năm
                                            </Dialog.Title>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Left Column - Basics */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Năm Kê Khai</label>
                                                        <input
                                                            type="number"
                                                            title="Năm Kê Khai"
                                                            placeholder="Năm Kê Khai"
                                                            value={year}
                                                            onChange={(e) => setYear(Number(e.target.value))}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black bg-gray-50"
                                                            readOnly
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Số phòng kinh doanh dự kiến</label>
                                                        <input
                                                            type="number"
                                                            title="Số phòng kinh doanh dự kiến"
                                                            placeholder="VD: 10"
                                                            value={expectedRoomCount}
                                                            min={1}
                                                            onChange={(e) => setExpectedRoomCount(Number(e.target.value))}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Giá thuê trung bình (VNĐ/tháng)</label>
                                                        <input
                                                            type="number"
                                                            title="Giá thuê trung bình"
                                                            placeholder="VD: 1500000"
                                                            value={expectedAvgPrice}
                                                            onChange={(e) => setExpectedAvgPrice(Number(e.target.value))}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Loại khách lưu trú</label>
                                                        <div className="mt-2 space-y-2">
                                                            <div className="flex items-center">
                                                                <input
                                                                    id="long-term"
                                                                    name="guest-type"
                                                                    type="radio"
                                                                    checked={!isShortTerm}
                                                                    onChange={() => setIsShortTerm(false)}
                                                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                                <label htmlFor="long-term" className="ml-3 block text-sm font-medium text-gray-700">
                                                                    Cố định / Dài hạn
                                                                </label>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <input
                                                                    id="short-term"
                                                                    name="guest-type"
                                                                    type="radio"
                                                                    checked={isShortTerm}
                                                                    onChange={() => setIsShortTerm(true)}
                                                                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                                <label htmlFor="short-term" className="ml-3 block text-sm font-medium text-gray-700">
                                                                    Lưu trú ngắn hạn / Theo ngày (Homestay)
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Phương thức thu tiền</label>
                                                        <select
                                                            value={paymentFrequency}
                                                            onChange={(e) => setPaymentFrequency(e.target.value as TaxPaymentFrequency)}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                                        >
                                                            <option value="monthly">Thu từng tháng</option>
                                                            <option value="quarterly">Thu "cục" theo quý (3 tháng/lần)</option>
                                                            <option value="yearly">Thu "cục" theo năm (6-12 tháng/lần)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Right Column - Services & AI Result */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Dịch vụ cung cấp đi kèm</label>
                                                        <div className="bg-gray-50 border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                                                            {AVAILABLE_SERVICES.map(service => (
                                                                <div key={service} className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`service-${service}`}
                                                                        checked={servicesIncluded.includes(service)}
                                                                        onChange={() => toggleService(service)}
                                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <label htmlFor={`service-${service}`} className="ml-3 block text-sm text-gray-700">
                                                                        {service}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className={`mt-6 p-4 rounded-md border ${classificationPreview === 'Dịch Vụ Lưu Trú' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                                                        <div className="flex">
                                                            <div className="flex-shrink-0">
                                                                <Info className={`h-5 w-5 ${classificationPreview === 'Dịch Vụ Lưu Trú' ? 'text-orange-400' : 'text-blue-400'}`} />
                                                            </div>
                                                            <div className="ml-3">
                                                                <h3 className={`text-sm font-medium ${classificationPreview === 'Dịch Vụ Lưu Trú' ? 'text-orange-800' : 'text-blue-800'}`}>
                                                                    AI Phân Loại Mô Hình: {classificationPreview}
                                                                </h3>
                                                                <div className={`mt-2 text-sm ${classificationPreview === 'Dịch Vụ Lưu Trú' ? 'text-orange-700' : 'text-blue-700'}`}>
                                                                    <p>
                                                                        {classificationPreview === 'Dịch Vụ Lưu Trú' 
                                                                            ? 'Do có cung cấp dịch vụ (dọn phòng/lễ tân) hoặc cho thuê ngắn hạn, mô hình của bạn áp dụng mức thuế Lưu trú.'
                                                                            : 'Chỉ cung cấp không gian ở dài hạn thuần túy. Sẽ áp dụng biểu thuế Cho Thuê Tài Sản.'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                        >
                                            {isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                            onClick={onClose}
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
