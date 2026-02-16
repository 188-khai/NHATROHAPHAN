'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialRooms, initialAssets } from '@/utils/seedData';
import { Room, Tenant, Bill, Asset } from '@/types';
import DashboardStats from '@/components/DashboardStats';
import RoomList from '@/components/RoomList';
import TenantList from '@/components/TenantList';
import RoomDetailModal from '@/components/RoomDetailModal';
import FinancialOverview from '@/components/FinancialOverview';
import BatchBillingModal from '@/components/BatchBillingModal';
import ElectricityReconciliationModal from '@/components/ElectricityReconciliationModal';

export default function Home() {
  const [rooms, setRooms] = useLocalStorage<Room[]>('rooms', initialRooms);
  const [tenants, setTenants] = useLocalStorage<Tenant[]>('tenants', []);
  const [bills, setBills] = useLocalStorage<Bill[]>('bills', []);
  const [assets, setAssets] = useLocalStorage<Asset[]>('assets', initialAssets);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchBillingOpen, setIsBatchBillingOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'rooms' | 'tenants'>('rooms');

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleUpdateRoom = (updatedRoom: Room) => {
    setRooms(rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
    setSelectedRoom(updatedRoom);
  };

  const handleUpdateTenant = (updatedTenant: Tenant) => {
    // In new logic, we mostly just modify the tenant in the list
    setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
  };

  const handleAddTenant = (newTenant: Tenant) => {
    setTenants([...tenants, newTenant]);
    // Update room to include this tenant
    const room = rooms.find(r => r.id === newTenant.roomId);
    if (room) {
      const currentTenantIds = room.tenantIds || []; // Defensive
      const updatedTenantIds = [...currentTenantIds, newTenant.id];
      handleUpdateRoom({ ...room, tenantIds: updatedTenantIds });
    }
  };

  const handleRemoveTenant = (tenantId: string) => {
    setTenants(tenants.filter(t => t.id !== tenantId));
    // Remove from room
    const room = rooms.find(r => r.tenantIds.includes(tenantId));
    if (room) {
      const updatedTenantIds = room.tenantIds.filter(id => id !== tenantId);
      handleUpdateRoom({ ...room, tenantIds: updatedTenantIds });
    }
  };

  const handleSaveBill = (newBill: Bill) => {
    setBills([...bills, newBill]);
  };

  const handleBatchSaveBills = (newBills: Bill[]) => {
    setBills([...bills, ...newBills]);
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    setBills(bills.map((b) => (b.id === updatedBill.id ? updatedBill : b)));
  };

  const [targetBillToEdit, setTargetBillToEdit] = useState<Bill | null>(null);

  const handleDeleteBill = (billId: string) => {
    setBills(bills.filter((b) => b.id !== billId));
  };

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
    setTargetBillToEdit(null); // Reset target bill when closing
  };

  // Asset Handlers
  const handleAddAsset = (newAsset: Asset) => {
    setAssets([...assets, newAsset]);
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    setAssets(assets.map(a => a.id === updatedAsset.id ? updatedAsset : a));
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets(assets.filter(a => a.id !== assetId));
  };

  return (
    <main
      className="min-h-screen p-2 sm:p-6 lg:p-8 bg-cover bg-center bg-fixed bg-no-repeat pb-20 sm:pb-6" // Reduced padding on mobile, added bottom padding for scrolling
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              Quản Lý Nhà Trọ
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Hệ thống quản lý phòng trọ đơn giản & hiệu quả
            </p>
          </div>

        </header>

        <DashboardStats rooms={rooms} />

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

        <div className="flex gap-3 mb-8">
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
            </nav>
          </div>

          {activeView === 'rooms' ? (
            <RoomList rooms={rooms} tenants={tenants} onRoomClick={handleRoomClick} />
          ) : (
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
      </div>
    </main>
  );
}
