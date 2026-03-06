import { useState } from 'react';
import { Tenant, Room } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Pencil, Trash2, Download } from 'lucide-react';
import TenantEditModal from './TenantEditModal';
import ImageLightboxModal from './ImageLightboxModal';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface TenantListProps {
    tenants: Tenant[];
    rooms: Room[];
    onUpdateTenant: (tenant: Tenant) => void;
    onRemoveTenant: (tenantId: string) => void;
}

export default function TenantList({ tenants, rooms, onUpdateTenant, onRemoveTenant }: TenantListProps) {
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('KhachThue');

        // Set columns
        worksheet.columns = [
            { header: 'Họ tên', key: 'name', width: 25 },
            { header: 'Phòng', key: 'roomNumber', width: 10 },
            { header: 'Số điện thoại', key: 'phone', width: 15 },
            { header: 'Ngày bắt đầu', key: 'startDate', width: 15 },
            { header: 'Tiền cọc', key: 'deposit', width: 15 },
            { header: 'CCCD', key: 'identityCardImage', width: 25 }
        ];

        // Style headers
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        for (let i = 0; i < tenants.length; i++) {
            const t = tenants[i];
            const rowNumber = i + 2; // Since row 1 is header
            const row = worksheet.getRow(rowNumber);

            row.values = {
                name: t.name,
                roomNumber: getRoomNumber(t.roomId),
                phone: t.phone,
                startDate: t.startDate,
                deposit: t.deposit,
            };

            if (t.identityCardImage) {
                row.height = 70;

                try {
                    let base64Image = t.identityCardImage;
                    let extension = 'png';

                    if (base64Image.includes('data:image/jpeg')) extension = 'jpeg';
                    else if (base64Image.includes('data:image/jpg')) extension = 'jpeg';

                    const base64Data = base64Image.split(',')[1] || base64Image;

                    const imageId = workbook.addImage({
                        base64: base64Data,
                        extension: extension as any,
                    });

                    // Căn chỉnh ảnh vào ô (tl = top-left corner index)
                    // Cột index từ 0 (cột CCCD là 5)
                    worksheet.addImage(imageId, {
                        tl: { col: 5, row: rowNumber - 1 },
                        ext: { width: 140, height: 80 },
                        editAs: 'oneCell'
                    });
                } catch (e) {
                    console.error("Error adding image to excel", e);
                }
            } else {
                row.height = 30; // default height cho dòng ko ảnh
            }

            // Alignments
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.alignment = { vertical: 'middle', horizontal: colNumber === 6 ? 'center' : 'left' };
                if (colNumber === 5) { // Cột tiền cọc
                    cell.numFmt = '#,##0';
                }
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'DanhSachKhachThue.xlsx');
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
                                        onClick={() => {
                                            setLightboxImage(tenant.identityCardImage || null);
                                            setIsLightboxOpen(true);
                                        }}
                                        className="h-10 w-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
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

            <ImageLightboxModal
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                imageUrl={lightboxImage}
            />
        </div>
    );
}
