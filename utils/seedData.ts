import { Room } from '../types';

export const initialRooms: Room[] = Array.from({ length: 20 }, (_, i) => ({
    id: `room-${101 + i}`,
    roomNumber: `${101 + i}`,
    price: 1600000, // Default price 1.6 million VND
    status: 'available',
    tenantIds: [],
}));

export const initialAssets: import('../types').Asset[] = [
    // Seed some assets for the first few rooms
    {
        id: 'asset-101-ac',
        roomId: 'room-101',
        name: 'Máy lạnh Panasonic 1HP',
        type: 'ac',
        installDate: '2023-01-15',
        lastMaintenanceDate: '2023-06-15',
        status: 'good',
        maintenanceIntervalMonths: 6,
        cost: 8500000,
        history: []
    },
    {
        id: 'asset-101-sofa',
        roomId: 'room-101',
        name: 'Sofa Băng 1m6',
        type: 'sofa',
        installDate: '2023-02-01',
        status: 'new',
        maintenanceIntervalMonths: 12,
        cost: 3500000,
        specifications: {
            material: 'velvet',
            color: 'Hồng Ruốc',
            technicalNotes: 'Lưu ý: Vải nhung hướng tuyết xuôi chiều'
        },
        history: []
    },
    {
        id: 'asset-102-ac',
        roomId: 'room-102',
        name: 'Máy lạnh Daikin',
        type: 'ac',
        installDate: '2023-01-20',
        lastMaintenanceDate: '2023-01-20', // Overdue for maintenance (assuming current date is later)
        status: 'maintenance',
        maintenanceIntervalMonths: 6,
        cost: 9000000,
        history: []
    }
];
