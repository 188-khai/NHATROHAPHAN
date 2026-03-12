import { useState } from 'react';
import { TaxSettings } from '@/types';
import TaxSettingsModal from './TaxSettingsModal';
import { Settings, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';

interface TaxDashboardProps {
    taxSettings: TaxSettings | null;
    onSaveSettings: (settings: TaxSettings) => Promise<void>;
}

export default function TaxDashboard({ taxSettings, onSaveSettings }: TaxDashboardProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const grossRevenue = taxSettings ? taxSettings.expectedRoomCount * taxSettings.expectedAvgPrice * 12 : 0;
    const isOverThreshold = grossRevenue > 500000000;

    const vat = isOverThreshold ? grossRevenue * 0.05 : 0;
    const pit = isOverThreshold ? (grossRevenue - 500000000) * 0.05 : 0;
    const totalTax = vat + pit;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Hồ Sơ Thuế Nhà Trọ (Năm {new Date().getFullYear()})</h2>
                    <p className="text-sm text-gray-500 mt-1">Động cơ tính toán thuế kinh doanh lưu trú & tài sản</p>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    <Settings className="h-4 w-4 mr-2" />
                    Cấu Hình Đầu Năm
                </button>
            </div>

            {!taxSettings ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                    <Calculator className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-blue-900 mb-2">Chưa có cấu hình thuế</h3>
                    <p className="text-blue-700 max-w-lg mx-auto mb-6">
                        Vui lòng thiết lập thông số kinh doanh dự kiến để hệ thống AI phân loại mô hình và tính toán nghĩa vụ tài chính tự động cho bạn.
                    </p>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Bắt Đầu Thiết Lập
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Metrics Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Ước Tính Nghĩa Vụ Tài Chính</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Doanh Thu Gộp (Dự kiến/Năm)</p>
                                    <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(grossRevenue)}</p>
                                    <p className="text-xs text-gray-500 mt-1">({taxSettings.expectedRoomCount} phòng x {formatCurrency(taxSettings.expectedAvgPrice)} x 12 tháng)</p>
                                </div>
                                <div className={`p-4 rounded-lg flex items-center justify-between ${isOverThreshold ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Ngưỡng 500 Triệu</p>
                                        <p className={`mt-2 text-lg font-bold ${isOverThreshold ? 'text-red-700' : 'text-green-700'}`}>
                                            {isOverThreshold ? 'Vượt Ngưỡng Có Phải Nộp' : 'Dưới Ngưỡng Miễn Thuế'}
                                        </p>
                                    </div>
                                    {isOverThreshold ? <AlertTriangle className="h-8 w-8 text-red-500" /> : <CheckCircle className="h-8 w-8 text-green-500" />}
                                </div>
                            </div>
                            
                            <div className="mt-6 border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Chi tiết tiền thuế truy thu:</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
                                        <span className="text-sm text-gray-600">Thuế GTGT (5%)</span>
                                        <span className="font-semibold">{formatCurrency(vat)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
                                        <span className="text-sm text-gray-600">Thuế TNCN (5% phần vượt ngưỡng)</span>
                                        <span className="font-semibold">{formatCurrency(pit)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-lg mt-4">
                                        <span className="text-base font-bold text-indigo-900">Tổng Thuế Dự Kiến (Năm)</span>
                                        <span className="text-lg font-bold text-indigo-700">{formatCurrency(totalTax)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-md font-bold text-gray-900 mb-4 border-b pb-2">Thông Số Phân Loại</h3>
                            <ul className="space-y-3">
                                <li className="flex justify-between text-sm">
                                    <span className="text-gray-500">Mô hình AI gán nhãn:</span>
                                    <span className="font-semibold text-indigo-600 text-right">{taxSettings.classification}</span>
                                </li>
                                <li className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tần suất đóng:</span>
                                    <span className="font-medium">
                                        {taxSettings.paymentFrequency === 'monthly' ? 'Từng tháng' :
                                         taxSettings.paymentFrequency === 'quarterly' ? 'Theo quý' : 'Gộp cả năm'}
                                    </span>
                                </li>
                                <li className="flex justify-between text-sm">
                                    <span className="text-gray-500">Lưu trú ngắn hạn:</span>
                                    <span className="font-medium">{taxSettings.isShortTerm ? 'Có' : 'Không'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <TaxSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={onSaveSettings}
                existingSettings={taxSettings}
            />
        </div>
    );
}
