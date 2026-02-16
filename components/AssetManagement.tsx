import { useState, useMemo } from 'react';
import { Asset, AssetType, Room } from '../types';
import { Plus, Wrench, Snowflake, Armchair, Box, ClipboardList, Pencil, Trash2, Bed, Layers, Archive } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import AssetEditModal from './AssetEditModal';

interface AssetManagementProps {
    room: Room;
    assets: Asset[];
    onAddAsset: (asset: Asset) => void;
    onUpdateAsset: (asset: Asset) => void;
    onDeleteAsset: (assetId: string) => void;
}

export default function AssetManagement({ room, assets, onAddAsset, onUpdateAsset, onDeleteAsset }: AssetManagementProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [isChecklistMode, setIsChecklistMode] = useState(false);

    // Filter assets for this room
    const roomAssets = useMemo(() => assets.filter(a => a.roomId === room.id), [assets, room.id]);

    const handleAddClick = () => {
        setSelectedAsset(null);
        setIsEditModalOpen(true);
    };

    const handleEditClick = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsEditModalOpen(true);
    };

    const handleSaveAsset = (asset: Asset) => {
        if (selectedAsset) {
            onUpdateAsset(asset);
        } else {
            onAddAsset(asset);
        }
        setIsEditModalOpen(false);
        setSelectedAsset(null);
    };

    const getIcon = (type: AssetType) => {
        switch (type) {
            case 'ac': return <Snowflake className="h-5 w-5 text-blue-500" />;
            case 'sofa': return <Armchair className="h-5 w-5 text-purple-500" />;
            case 'bed': return <Bed className="h-5 w-5 text-indigo-500" />;
            case 'mattress': return <Layers className="h-5 w-5 text-orange-500" />;
            case 'cupboard': return <Archive className="h-5 w-5 text-amber-700" />;
            default: return <Box className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: Asset['status']) => {
        switch (status) {
            case 'new': return 'bg-green-100 text-green-800';
            case 'good': return 'bg-blue-100 text-blue-800';
            case 'maintenance': return 'bg-yellow-100 text-yellow-800';
            case 'broken': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getMaintenanceDue = (asset: Asset) => {
        if (!asset.lastMaintenanceDate || !asset.maintenanceIntervalMonths) return null;
        const lastDate = new Date(asset.lastMaintenanceDate);
        const dueDate = new Date(lastDate.setMonth(lastDate.getMonth() + asset.maintenanceIntervalMonths));
        const today = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
            dueDate,
            isOverdue: diffDays < 0,
            daysRemaining: diffDays
        };
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Danh sách tài sản - P.{room.roomNumber}</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsChecklistMode(!isChecklistMode)}
                        className={`inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isChecklistMode ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        {isChecklistMode ? 'Tắt Checklist' : 'Checklist Bàn giao'}
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm tài sản
                    </button>
                </div>
            </div>

            {/* Asset List */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {roomAssets.map((asset) => {
                    const maintenanceInfo = getMaintenanceDue(asset);

                    return (
                        <div key={asset.id} className="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        {getIcon(asset.type)}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">{asset.name}</h4>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(asset.status)}`}>
                                            {asset.status === 'new' ? 'Mới' : asset.status === 'good' ? 'Tốt' : asset.status === 'maintenance' ? 'Cần bảo trì' : 'Hỏng'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    <button onClick={() => handleEditClick(asset)} className="text-gray-400 hover:text-indigo-600" title="Chỉnh sửa tài sản">
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => confirm('Xóa tài sản này?') && onDeleteAsset(asset.id)} className="text-gray-400 hover:text-red-600" title="Xóa tài sản">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex-1 space-y-2 text-sm text-gray-500">
                                {asset.image && (
                                    <div className="mb-2 h-32 w-full rounded-md overflow-hidden bg-gray-100 border">
                                        <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <p><span className="font-medium">Ngày lắp:</span> {new Date(asset.installDate).toLocaleDateString('vi-VN')}</p>

                                {asset.type === 'sofa' && asset.specifications && (
                                    <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
                                        <p><span className="font-medium">Chất liệu:</span> {asset.specifications.material}</p>
                                        <p><span className="font-medium">Màu:</span> {asset.specifications.color}</p>
                                        {asset.specifications.technicalNotes && (
                                            <p className="text-amber-600"><span className="font-medium">Lưu ý:</span> {asset.specifications.technicalNotes}</p>
                                        )}
                                    </div>
                                )}

                                {maintenanceInfo && (
                                    <div className={`flex items-center text-xs ${maintenanceInfo.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                        <Wrench className="mr-1 h-3 w-3" />
                                        {maintenanceInfo.isOverdue ? `Đã quá hạn bảo trì ${Math.abs(maintenanceInfo.daysRemaining)} ngày` : `Bảo trì sau ${maintenanceInfo.daysRemaining} ngày`}
                                    </div>
                                )}
                            </div>

                            {isChecklistMode && (
                                <div className="mt-4 border-t pt-2">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    if (window.confirm(`Xác nhận đã kiểm tra "${asset.name}"? Ngày bảo trì sẽ được cập nhật là hôm nay.`)) {
                                                        onUpdateAsset({
                                                            ...asset,
                                                            lastMaintenanceDate: new Date().toISOString().split('T')[0],
                                                            status: 'good'
                                                        });
                                                    } else {
                                                        e.target.checked = false;
                                                    }
                                                }
                                            }}
                                        />
                                        <span className="text-sm text-gray-700">Đã kiểm tra</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ghi chú tình trạng..."
                                        className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs text-gray-900"
                                        onBlur={(e) => {
                                            if (e.target.value) {
                                                // Optional: Save note to history or somewhere?
                                                // For now, just logging or we could update the asset if we had a notes field.
                                                // Creating a history entry would be ideal but might be too complex for this quick fix.
                                                // Let's just update the technical notes or add to history if possible.
                                                // keeping it simple as requested: just fixing the maintenance warning.
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
                {roomAssets.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500 border-2 border-dashed rounded-lg">
                        Chưa có tài sản nào trong phòng này.
                    </div>
                )}
            </div>

            <AssetEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveAsset}
                existingAsset={selectedAsset}
                roomId={room.id}
            />
        </div>
    );
}
