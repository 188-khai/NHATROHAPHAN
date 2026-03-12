import { Room, TaxSettings, Bill } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Home, Users, CircleDollarSign, CheckCircle, AlertOctagon, Info } from 'lucide-react';

interface DashboardStatsProps {
    rooms: Room[];
    taxSettings?: TaxSettings | null;
    bills?: Bill[];
}

export default function DashboardStats({ rooms, taxSettings, bills }: DashboardStatsProps) {
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

    const getTaxAlert = () => {
        if (!taxSettings) return null;
        const now = new Date();
        
        if (taxSettings.paymentFrequency === 'monthly') {
            const deadlineYear = taxSettings.year + 1;
            const deadlineDate = new Date(deadlineYear, 0, 31); // Jan 31
            const warningDate = new Date(deadlineYear, 0, 15); // Jan 15
            
            // To make it testable/visible, if year is current year, we highlight the rule
            if (now >= warningDate && now <= deadlineDate) {
                const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                return {
                    type: 'danger',
                    title: 'CẢNH BÁO HẠN CHÓT NỘP THUẾ',
                    message: `Sắp đến hạn nộp tờ khai mẫu 01/TTS cho năm ${taxSettings.year}. Hạn chót là: 31/01/${deadlineYear}.`,
                    countdown: `Chỉ còn ${daysLeft} ngày!`
                };
            }
        } else {
            // Quarterly / Yearly logic
            const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const recentPayments = bills?.filter(b => b.isPaid && b.date === currentMonthStr) || [];
            
            if (recentPayments.length > 0) {
                return {
                    type: 'warning',
                    title: 'CẦN KHAI THUẾ THEO KỲ THANH TOÁN',
                    message: `Bạn vừa nhận được thanh toán "cục" trong tháng ${currentMonthStr}. Theo cấu hình khai theo kỳ, bạn phải nộp tờ khai chậm nhất vào ngày thứ 10 kể từ ngày phát sinh doanh thu.`,
                    countdown: `Hết hạn nộp vào ngày 10 tới!`
                };
            }
        }
        return null; // No alerts
    };

    const taxAlert = getTaxAlert();

    return (
        <div className="mb-6">
            {taxAlert && (
                <div className={`mb-6 p-4 rounded-xl border flex items-start shadow-sm ${
                    taxAlert.type === 'danger' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                }`}>
                    <div className="flex-shrink-0 mt-0.5">
                        <AlertOctagon className={`h-6 w-6 ${taxAlert.type === 'danger' ? 'text-red-500' : 'text-orange-500'}`} />
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className={`text-sm font-bold ${taxAlert.type === 'danger' ? 'text-red-800' : 'text-orange-800'}`}>
                            {taxAlert.title}
                        </h3>
                        <p className={`mt-1 text-sm ${taxAlert.type === 'danger' ? 'text-red-700' : 'text-orange-700'}`}>
                            {taxAlert.message}
                        </p>
                    </div>
                    {taxAlert.countdown && (
                        <div className={`ml-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                            taxAlert.type === 'danger' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-600 text-white'
                        }`}>
                            {taxAlert.countdown}
                        </div>
                    )}
                </div>
            )}
            
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
            </dl>
        </div>
    );
}
