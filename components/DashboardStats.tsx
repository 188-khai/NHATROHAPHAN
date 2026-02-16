import { Room } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Home, Users, CircleDollarSign, CheckCircle } from 'lucide-react';

interface DashboardStatsProps {
    rooms: Room[];
}

export default function DashboardStats({ rooms }: DashboardStatsProps) {
    const totalRooms = rooms?.length || 0;
    // Room is available if status is available
    const availableRooms = rooms?.filter((r) => r.status === 'available')?.length || 0;
    // Room is rented if status is rented
    const rentedRooms = rooms?.filter((r) => r.status === 'rented')?.length || 0;
    const projectedRevenue = rooms
        ?.filter((r) => r.status === 'rented')
        .reduce((sum, r) => sum + (r.price || 0), 0) || 0;

    const stats = [
        {
            name: 'Tổng số phòng',
            value: totalRooms,
            icon: Home,
            color: 'bg-blue-500',
        },
        {
            name: 'Phòng trống',
            value: availableRooms,
            icon: CheckCircle,
            color: 'bg-red-500',
        },
        {
            name: 'Đã cho thuê',
            value: rentedRooms,
            icon: Users,
            color: 'bg-green-500',
        },
        {
            name: 'Doanh thu dự kiến',
            value: formatCurrency(projectedRevenue),
            icon: CircleDollarSign,
            color: 'bg-yellow-500',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
            {stats.map((item) => (
                <div
                    key={item.name}
                    className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:pt-6"
                >
                    <dt>
                        <div className={`absolute rounded-md p-3 ${item.color}`}>
                            <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <p className="ml-16 truncate text-sm font-medium text-gray-500">
                            {item.name}
                        </p>
                    </dt>
                    <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
                        <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                    </dd>
                </div>
            ))}
        </div>
    );
}
