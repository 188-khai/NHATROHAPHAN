import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Asset, AssetType, SofaMaterial, AssetStatus } from '../types';

interface AssetEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (asset: Asset) => void;
    existingAsset?: Asset | null;
    roomId: string;
}

export default function AssetEditModal({ isOpen, onClose, onSave, existingAsset, roomId }: AssetEditModalProps) {
    const defaultAsset: Asset = {
        id: '',
        roomId: roomId,
        name: '',
        type: 'general',
        installDate: new Date().toISOString().split('T')[0],
        status: 'new',
        maintenanceIntervalMonths: 6,
        cost: 0,
        specifications: {
            material: 'fabric',
            color: '',
            technicalNotes: ''
        },
        history: []
    };

    const [asset, setAsset] = useState<Asset>(defaultAsset);

    useEffect(() => {
        if (existingAsset) {
            setAsset(existingAsset);
        } else {
            setAsset({ ...defaultAsset, roomId, id: `asset-${Date.now()}` });
        }
    }, [existingAsset, isOpen, roomId]);

    const handleSave = () => {
        if (!asset.name) return alert('Vui lòng nhập tên tài sản');
        onSave(asset);
        onClose();
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 mb-4">
                                        {existingAsset ? 'Chỉnh sửa tài sản' : 'Thêm tài sản mới'}
                                    </Dialog.Title>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900">Tên tài sản</label>
                                            <input
                                                type="text"
                                                title="Tên tài sản"
                                                value={asset.name}
                                                onChange={(e) => setAsset({ ...asset, name: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 border p-2"
                                                placeholder="Ví dụ: Máy lạnh Panasonic"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900">Loại</label>
                                                <select
                                                    value={asset.type}
                                                    title="Loại tài sản"
                                                    onChange={(e) => setAsset({ ...asset, type: e.target.value as AssetType })}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 border p-2"
                                                >
                                                    <option value="general">Mặc định</option>
                                                    <option value="ac">Máy lạnh</option>
                                                    <option value="sofa">Sofa</option>
                                                    <option value="cupboard">Tủ</option>
                                                    <option value="bed">Giường</option>
                                                    <option value="mattress">Nệm</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900">Tình trạng</label>
                                                <select
                                                    value={asset.status}
                                                    title="Tình trạng"
                                                    onChange={(e) => setAsset({ ...asset, status: e.target.value as AssetStatus })}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 border p-2"
                                                >
                                                    <option value="new">Mới</option>
                                                    <option value="good">Tốt</option>
                                                    <option value="maintenance">Cần bảo trì</option>
                                                    <option value="broken">Hỏng</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900">Ngày lắp đặt</label>
                                                <input
                                                    type="date"
                                                    title="Ngày lắp đặt"
                                                    value={asset.installDate}
                                                    onChange={(e) => setAsset({ ...asset, installDate: e.target.value })}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 border p-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-900">Bảo trì định kỳ (tháng)</label>
                                                <input
                                                    type="number"
                                                    title="Bảo trì định kỳ (tháng)"
                                                    value={asset.maintenanceIntervalMonths}
                                                    onChange={(e) => setAsset({ ...asset, maintenanceIntervalMonths: parseInt(e.target.value) || 0 })}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 border p-2"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-900">Giá trị (VNĐ)</label>
                                            <input
                                                type="number"
                                                title="Giá trị (VNĐ)"
                                                value={asset.cost}
                                                onChange={(e) => setAsset({ ...asset, cost: parseInt(e.target.value) || 0 })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 border p-2"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-900">Hình ảnh</label>
                                            <div className="mt-2 flex items-center gap-4">
                                                <div className="flex-shrink-0 h-20 w-20 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    {asset.image ? (
                                                        <img src={asset.image} alt="Asset" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">No Image</span>
                                                    )}
                                                </div>
                                                <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                                    <span>Chụp ảnh / Tải ảnh</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        capture="environment"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setAsset({ ...asset, image: reader.result as string });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                {asset.image && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAsset({ ...asset, image: undefined })}
                                                        className="text-sm text-red-600 hover:text-red-800"
                                                    >
                                                        Xóa ảnh
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {asset.type === 'sofa' && (
                                            <div className="bg-purple-50 p-3 rounded-md space-y-3">
                                                <h4 className="text-sm font-medium text-purple-900">Thông tin Sofa</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-purple-900">Chất liệu</label>
                                                        <select
                                                            value={asset.specifications?.material}
                                                            title="Chất liệu"
                                                            onChange={(e) => setAsset({ ...asset, specifications: { ...asset.specifications, material: e.target.value as SofaMaterial } })}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs text-gray-900 border p-1"
                                                        >
                                                            <option value="fabric">Vải</option>
                                                            <option value="leather">Da</option>
                                                            <option value="velvet">Nhung</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-purple-900">Màu sắc</label>
                                                        <input
                                                            type="text"
                                                            title="Màu sắc"
                                                            value={asset.specifications?.color}
                                                            onChange={(e) => setAsset({ ...asset, specifications: { ...asset.specifications, color: e.target.value } })}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs text-gray-900 border p-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-purple-900">Ghi chú kỹ thuật</label>
                                                    <input
                                                        type="text"
                                                        title="Ghi chú kỹ thuật"
                                                        value={asset.specifications?.technicalNotes}
                                                        onChange={(e) => setAsset({ ...asset, specifications: { ...asset.specifications, technicalNotes: e.target.value } })}
                                                        placeholder="Vd: Nhung tuyết xuôi chiều..."
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs text-gray-900 border p-1"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                                            onClick={handleSave}
                                        >
                                            {existingAsset ? 'Lưu thay đổi' : 'Thêm tài sản'}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                                            onClick={onClose}
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
