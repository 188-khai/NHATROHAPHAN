'use client';

import { useState } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { initialRooms, initialAssets } from '@/utils/seedData';
import { Room, Tenant, Bill, Asset } from '@/types';
import DashboardStats from '@/components/DashboardStats';
import RoomList from '@/components/RoomList';
import TenantList from '@/components/TenantList';
import RoomDetailModal from '@/components/RoomDetailModal';
import FinancialOverview from '@/components/FinancialOverview';
import BatchBillingModal from '@/components/BatchBillingModal';
import ElectricityReconciliationModal from '@/components/ElectricityReconciliationModal';
import DataMigrationModal from '@/components/DataMigrationModal';
import RevenueChart from '@/components/RevenueChart';
import AddRoomModal from '@/components/AddRoomModal';

import FinanceTracker from '@/components/finance/FinanceTracker';

export default function Home() {
  const {
    rooms, tenants, bills, assets, loading,
    saveRoom, saveTenant, deleteTenant,
    saveBill, saveBills, deleteBill,
    saveAsset, deleteAsset
  } = useSupabaseData(); // Use Supabase Hook

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchBillingOpen, setIsBatchBillingOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'rooms' | 'tenants' | 'finance'>('rooms');

  // Show loading state


  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleUpdateRoom = async (updatedRoom: Room) => {
    await saveRoom(updatedRoom);
    setSelectedRoom(updatedRoom);
  };

  const handleUpdateTenant = async (updatedTenant: Tenant) => {
    await saveTenant(updatedTenant);
  };

  const handleAddTenant = async (newTenant: Tenant) => {
    await saveTenant(newTenant);
    // Update room to include this tenant
    const room = rooms.find(r => r.id === newTenant.roomId);
    if (room) {
      const currentTenantIds = room.tenantIds || [];
      const updatedTenantIds = [...currentTenantIds, newTenant.id];
      // Auto-update status to 'rented' if it was 'available'
      const newStatus = room.status === 'available' ? 'rented' : room.status;
      await saveRoom({ ...room, tenantIds: updatedTenantIds, status: newStatus });
    }
  };

  const handleRemoveTenant = async (tenantId: string) => {
    await deleteTenant(tenantId);
    // Remove from room
    const room = rooms.find(r => r.tenantIds.includes(tenantId));
    if (room) {
      const updatedTenantIds = room.tenantIds.filter(id => id !== tenantId);
      // Auto-update status to 'available' if no tenants left
      const newStatus = updatedTenantIds.length === 0 ? 'available' : room.status;
      await saveRoom({ ...room, tenantIds: updatedTenantIds, status: newStatus });
    }
  };

  const handleSaveBill = async (newBill: Bill) => {
    await saveBill(newBill);
  };

  const handleBatchSaveBills = async (newBills: Bill[]) => {
    await saveBills(newBills);
  };

  const handleUpdateBill = async (updatedBill: Bill) => {
    await saveBill(updatedBill);
  };

  const handleDeleteBill = async (billId: string) => {
    await deleteBill(billId);
  };

  // State for Editing Bill
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [targetBillToEdit, setTargetBillToEdit] = useState<Bill | null>(null);

  const handleEditBillFromHistory = (bill: Bill) => {
    const room = rooms.find(r => r.id === bill.roomId);
    if (room) {
      setSelectedRoom(room);
      setTargetBillToEdit(bill);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTargetBillToEdit(null);
  };

  // Asset Handlers
  const handleAddAsset = async (newAsset: Asset) => {
    await saveAsset(newAsset);
  };

  const handleUpdateAsset = async (updatedAsset: Asset) => {
    await saveAsset(updatedAsset);
  };

  const handleDeleteAsset = async (assetId: string) => {
    await deleteAsset(assetId);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Đang đồng bộ dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen p-2 sm:p-6 lg:p-8 bg-cover bg-center bg-fixed bg-no-repeat pb-20 sm:pb-6"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              Quản Lý Nhà Trọ
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Hệ thống quản lý phòng trọ đơn giản & hiệu quả
            </p>
          </div>
          {/* Logout Button (Ideally handled in a header component) */}
        </header>

        {rooms.length === 0 && !loading && (
          <div className="bg-white rounded-xl p-8 mb-8 text-center shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Chưa có dữ liệu phòng trọ</h2>
            <p className="text-gray-500 mb-6">
              Bạn đang sử dụng phiên bản mới trên đám mây. Dữ liệu cũ ở máy tính (localhost) không tự chuyển sang đây được.
              <br />
              Hãy bấm nút dưới đây để tạo nhanh dữ liệu mẫu (20 phòng) để dùng thử ngay.
            </p>
            <button
              onClick={async () => {
                const confirm = window.confirm("Bạn có chắc chắn muốn tạo dữ liệu mẫu không?");
                if (!confirm) return;

                // Batch insert rooms
                for (const room of initialRooms) {
                  await saveRoom(room);
                }
                // Batch insert assets
                for (const asset of initialAssets) {
                  await saveAsset(asset);
                }
                window.location.reload();
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105"
            >
              🚀 Tạo Dữ Liệu Mẫu (20 Phòng)
            </button>
          </div>
        )}

        <DashboardStats rooms={rooms} />

        {/* Revenue Chart */}
        <RevenueChart bills={bills} />

        {/* Maintenance Alert Widget */}
        {assets.some(a => {
          if (!a.lastMaintenanceDate || !a.maintenanceIntervalMonths) return false;
          const lastDate = new Date(a.lastMaintenanceDate);
          const dueDate = new Date(new Date(lastDate).setMonth(lastDate.getMonth() + a.maintenanceIntervalMonths));
          const today = new Date();
          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 30; // Show if due within 30 days
        }) && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">🔧 Nhắc nhở bảo trì sắp tới</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {assets
                  .filter(a => {
                    if (!a.lastMaintenanceDate || !a.maintenanceIntervalMonths) return false;
                    const lastDate = new Date(a.lastMaintenanceDate);
                    const dueDate = new Date(new Date(lastDate).setMonth(lastDate.getMonth() + a.maintenanceIntervalMonths));
                    const today = new Date();
                    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays <= 30;
                  })
                  .map(asset => {
                    const room = rooms.find(r => r.id === asset.roomId);
                    const lastDate = new Date(asset.lastMaintenanceDate!);
                    const dueDate = new Date(new Date(lastDate).setMonth(lastDate.getMonth() + asset.maintenanceIntervalMonths!));
                    const today = new Date();
                    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div key={asset.id} className="bg-white p-3 rounded border border-yellow-100 shadow-sm flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{asset.name} <span className="text-gray-500 text-xs">(P.{room?.roomNumber})</span></p>
                          <p className={`text-xs ${diffDays < 0 ? 'text-red-600 font-bold' : 'text-yellow-600'}`}>
                            {diffDays < 0 ? `Đã quá hạn ${Math.abs(diffDays)} ngày` : `Còn ${diffDays} ngày nữa`}
                          </p>
                        </div>
                        <button
                          onClick={() => room && handleRoomClick(room)}
                          className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200"
                        >
                          Xem
                        </button>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setIsAddRoomModalOpen(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            + Thêm phòng mới
          </button>
          <button
            onClick={() => setIsBatchBillingOpen(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Tính tiền nhanh
          </button>
          <button
            onClick={() => setIsReconciliationModalOpen(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Đối soát điện
          </button>
        </div>

        <div className="mt-8">
          <div className="mb-4 border-b border-gray-200 bg-white/90 backdrop-blur-sm rounded-t-xl px-4 pt-2">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveView('rooms')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeView === 'rooms'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Danh sách phòng
              </button>
              <button
                onClick={() => setActiveView('tenants')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeView === 'tenants'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Tất cả khách thuê
              </button>
              <button
                onClick={() => setActiveView('finance')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeView === 'finance'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Cá Nhân (Lương & OT)
              </button>
            </nav>
          </div>

          {activeView === 'rooms' ? (
            <RoomList rooms={rooms} tenants={tenants} onRoomClick={handleRoomClick} />
          ) : activeView === 'tenants' ? (
            <div>
              <FinancialOverview
                bills={bills}
                rooms={rooms}
                tenants={tenants}
                onEditBill={handleEditBillFromHistory}
                onDeleteBill={handleDeleteBill}
              />
              <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
                <TenantList
                  tenants={tenants}
                  rooms={rooms}
                  onUpdateTenant={handleUpdateTenant}
                  onRemoveTenant={handleRemoveTenant}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <FinanceTracker />
            </div>
          )}
        </div>

        {selectedRoom && (
          <RoomDetailModal
            key={selectedRoom.id}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            room={selectedRoom}
            initialEditingBill={targetBillToEdit}
            initialActiveTab={targetBillToEdit ? 'bill' : 'info'}
            tenants={tenants}
            bills={bills}
            assets={assets}
            onUpdateRoom={handleUpdateRoom}
            onUpdateTenant={handleUpdateTenant}
            onAddTenant={handleAddTenant}
            onRemoveTenant={handleRemoveTenant}
            onSaveBill={handleSaveBill}
            onUpdateBill={handleUpdateBill}
            onDeleteBill={handleDeleteBill}
            onAddAsset={handleAddAsset}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
          />
        )}

        <BatchBillingModal
          isOpen={isBatchBillingOpen}
          onClose={() => setIsBatchBillingOpen(false)}
          rooms={rooms}
          tenants={tenants}
          bills={bills}
          onSaveBills={handleBatchSaveBills}
        />

        <ElectricityReconciliationModal
          isOpen={isReconciliationModalOpen}
          onClose={() => setIsReconciliationModalOpen(false)}
          bills={bills}
          rooms={rooms}
        />

        <AddRoomModal
          isOpen={isAddRoomModalOpen}
          onClose={() => setIsAddRoomModalOpen(false)}
          onSave={async (roomData) => {
            const newRoom: Room = {
              id: crypto.randomUUID(),
              roomNumber: roomData.roomNumber!,
              price: roomData.price!,
              status: roomData.status as any,
              tenantIds: []
            };
            await saveRoom(newRoom);
          }}
        />

        <DataMigrationModal />
      </div>
    </main>
  );
}
