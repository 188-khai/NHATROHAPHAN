import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Room } from '../types';
import CurrencyInput from './CurrencyInput';

interface AddRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (room: Partial<Room>) => Promise<void>;
}

export default function AddRoomModal({ isOpen, onClose, onSave }: AddRoomModalProps) {
    const [roomNumber, setRoomNumber] = useState('');
    const [price, setPrice] = useState(1500000); // Default price suggestion
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomNumber.trim()) {
            alert('Vui lòng nhập tên/số phòng');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                roomNumber: roomNumber.trim(),
                price: price,
                status: 'available', // Mặc định phòng mới là trống
            });
            onClose();
            setRoomNumber(''); // Reset for next time
            setPrice(1500000);
        } catch (error) {
            console.error('Error saving room:', error);
            alert('Có lỗi xảy ra khi thêm phòng. Vui lòng thử lại.');
        } finally {
            setIsSaving(false);
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
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
                                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                                                Thêm Phòng Mới
                                            </Dialog.Title>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700">
                                                        Tên / Số Phòng
                                                    </label>
                                                    <div className="mt-1">
                                                        <input
                                                            type="text"
                                                            id="roomNumber"
                                                            value={roomNumber}
                                                            onChange={(e) => setRoomNumber(e.target.value)}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                                            placeholder="VD: 101, 102, Tầng 1..."
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                                        Giá Phòng (VNĐ/tháng)
                                                    </label>
                                                    <div className="mt-1">
                                                        <CurrencyInput
                                                            id="price"
                                                            value={price}
                                                            onChangeValue={setPrice}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                        >
                                            {isSaving ? 'Đang lưu...' : 'Thêm Phòng'}
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
