import { UserProfile, ActivityLog } from "@/types";
import { User, Home, Bell, Clock, Info } from "lucide-react";

interface SidebarProps {
    profile: UserProfile | null;
    logs: ActivityLog[];
}

export default function Sidebar({ profile, logs }: SidebarProps) {
    return (
        <aside className="w-80 h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
            {/* User Profile */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-white">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                        <User className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 leading-tight">
                            {profile?.fullName || "Chủ nhà"}
                        </h2>
                        <p className="text-xs text-gray-500 truncate w-40">
                            {profile?.email}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-100/50 p-2 rounded-lg border border-indigo-100">
                    <Home className="w-4 h-4" />
                    <span className="font-semibold truncate">
                        {profile?.boardingHouseName || "Chưa đặt tên"}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* System Notifications */}
                <div>
                    <div className="flex items-center gap-2 text-gray-900 font-bold mb-3 px-2">
                        <Bell className="w-4 h-4 text-orange-500" />
                        <h3>Thông báo hệ thống</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 flex gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>Đừng quên chốt số điện nước vào cuối tháng để xuất bill chính xác nhé!</p>
                        </div>
                        <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800 flex gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>Hãy cập nhật ảnh CCCD của khách thuê để dễ dàng quản lý thông tin.</p>
                        </div>
                    </div>
                </div>

                {/* Activity History */}
                <div>
                    <div className="flex items-center gap-2 text-gray-900 font-bold mb-3 px-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <h3>Lịch sử hoạt động</h3>
                    </div>
                    <div className="relative space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                        {logs.length === 0 ? (
                            <p className="text-sm text-gray-400 italic px-8">Chưa có hoạt động nào</p>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="relative pl-8">
                                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center z-10">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-700 leading-snug">
                                            {log.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {new Date(log.createdAt).toLocaleString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                day: '2-digit',
                                                month: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}
