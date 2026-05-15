
import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Upload } from 'lucide-react';
import { Tenant } from '../types';
import CurrencyInput from './CurrencyInput';

interface TenantEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: Tenant | null;
    onSave: (tenant: Tenant) => void;
}

export default function TenantEditModal({
    isOpen,
    onClose,
    tenant,
    onSave,
}: TenantEditModalProps) {
    const [editedTenant, setEditedTenant] = useState<Tenant | null>(tenant);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editedTenant) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditedTenant({ ...editedTenant, identityCardImage: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (editedTenant && editedTenant.name && editedTenant.phone) {
            onSave(editedTenant);
            onClose();
        }
    };

    if (!editedTenant) return null;

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
                                        Chỉnh sửa thông tin khách thuê
                                    </Dialog.Title>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                                            <input
                                                type="text"
                                                value={editedTenant.name}
                                                onChange={(e) => setEditedTenant({ ...editedTenant, name: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                                            <input
                                                type="text"
                                                value={editedTenant.phone}
                                                onChange={(e) => setEditedTenant({ ...editedTenant, phone: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                                            <input
                                                type="date"
                                                value={editedTenant.startDate}
                                                onChange={(e) => setEditedTenant({ ...editedTenant, startDate: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tiền cọc</label>
                                            <CurrencyInput
                                                value={editedTenant.deposit}
                                                onChangeValue={(val) => setEditedTenant({ ...editedTenant, deposit: val })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-4 mt-2">
                                                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200">
                                                    <Upload className="h-4 w-4" />
                                                    Cập nhật ảnh CCCD
                                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                </label>
                                                {editedTenant.identityCardImage && (
                                                    <img src={editedTenant.identityCardImage} alt="CCCD Preview" className="h-10 w-16 object-cover rounded border" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                                            onClick={handleSave}
                                        >
                                            Lưu thay đổi
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
