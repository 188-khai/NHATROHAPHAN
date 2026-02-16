import { useState } from 'react';
import { Tenant, Room } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Pencil, Trash2, Download } from 'lucide-react';
import TenantEditModal from './TenantEditModal';
import * as XLSX from 'xlsx';

interface TenantListProps {
    tenants: Tenant[];
    rooms: Room[];
    onUpdateTenant: (tenant: Tenant) => void;
    onRemoveTenant: (tenantId: string) => void;
}

export default function TenantList({ tenants, rooms, onUpdateTenant, onRemoveTenant }: TenantListProps) {
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const getRoomNumber = (roomId: string) => {
        return rooms.find((r) => r.id === roomId)?.roomNumber || 'Unknown';
    };

    const handleEditClick = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (tenantId: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa khách thuê này? Hành động này không thể hoàn tác.')) {
            onRemoveTenant(tenantId);
        }
    };

    const handleSaveTenant = (updatedTenant: Tenant) => {
        onUpdateTenant(updatedTenant);
    };

    const handleExportExcel = () => {
        const data = tenants.map(t => ({
            'Họ tên': t.name,
            'Phòng': getRoomNumber(t.roomId),
            'Số điện thoại': t.phone,
            'Ngày bắt đầu': t.startDate,
            'Tiền cọc': t.deposit
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "KhachThue");
        XLSX.writeFile(workbook, "DanhSachKhachThue.xlsx");
    };

    return (
        <div className="overflow-x-auto">
            <div className="flex justify-end mb-4 px-6 pt-4">
                <button
                    onClick={handleExportExcel}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Xuất Excel
                </button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Khách thuê
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phòng
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Liên hệ
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày bắt đầu
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tiền cọc
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            CCCD
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hành động
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {tenants.map((tenant) => (
                        <tr key={tenant.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">P.{getRoomNumber(tenant.roomId)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{tenant.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{tenant.startDate}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatCurrency(tenant.deposit)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {tenant.identityCardImage ? (
                                    <img
                                        src={tenant.identityCardImage}
                                        alt="CCCD"
                                        className="h-10 w-16 object-cover rounded border border-gray-200 cursor-pointer hover:scale-150 transition-transform origin-left"
                                    />
                                ) : (
                                    <span className="text-gray-400 text-xs">Không có ảnh</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => handleEditClick(tenant)}
                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    title="Chỉnh sửa"
                                >
                                    <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(tenant.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Xóa"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {tenants.length === 0 && (
                <div className="text-center py-10 text-gray-500">Chưa có khách thuê nào.</div>
            )}

            <TenantEditModal
                key={selectedTenant?.id || 'no-tenant'}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                tenant={selectedTenant}
                onSave={handleSaveTenant}
            />
        </div>
    );
}
