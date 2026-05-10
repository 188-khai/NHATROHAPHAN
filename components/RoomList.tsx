import { Room, Tenant } from '../types';
import { formatCurrency } from '../utils/calculations';
import clsx from 'clsx';
import { Pencil } from 'lucide-react';

interface RoomListProps {
    rooms: Room[];
    tenants: Tenant[];
    onRoomClick: (room: Room, initialTab?: 'info' | 'tenants' | 'bill' | 'assets') => void;
}

export default function RoomList({ rooms, tenants, onRoomClick }: RoomListProps) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {rooms.map((room) => {
                const roomTenants = tenants.filter(t => t.roomId === room.id);
                return (
                    <div
                        key={room.id}
                        onClick={() => onRoomClick(room)}
                        className={clsx(
                            'cursor-pointer rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md',
                            room.status === 'available' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-gray-900">
                                P.{room.roomNumber}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRoomClick(room, 'info');
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                    title="Chỉnh sửa tên/giá phòng"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <span
                                    className={clsx(
                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                        room.status === 'available'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                    )}
                                >
                                    {room.status === 'available' ? 'Trống' : 'Đã thuê'}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">
                            Giá: {formatCurrency(room.price)}
                        </p>
                        {room.status === 'rented' && (
                            <p className="text-xs text-gray-400">
                                {roomTenants.length} khách đang ở
                            </p>
                        )}
                        {room.status === 'available' && (
                            <p className="text-xs text-green-600">Sẵn sàng</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
