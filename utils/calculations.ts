export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

export const calculateBill = (
    electricityOld: number,
    electricityNew: number,
    numberOfTenants: number,
    roomPrice: number
) => {
    const electricityRate = 3500;
    const waterRatePerPerson = 30000;
    const garbageFee = 20000;

    const electricityUsage = Math.max(0, electricityNew - electricityOld);

    const electricityCost = electricityUsage * electricityRate;
    const waterCost = numberOfTenants * waterRatePerPerson;
    const totalAmount = electricityCost + waterCost + garbageFee + roomPrice;

    return {
        electricityUsage,
        electricityCost,
        waterCost,
        garbageFee,
        totalAmount,
    };
};

export const generateZaloMessage = (
    roomNumber: string,
    period: string,
    electricityOld: number,
    electricityNew: number,
    electricityUsage: number,
    electricityCost: number,
    services: { name: string, amount: number }[],
    roomPrice: number,
    totalAmount: number
) => {
    const servicesList = services.map((s, idx) => `${idx + 2}. ${s.name}: ${formatCurrency(s.amount)}`).join('\n');
    
    return `
🏠 HÓA ĐƠN TIỀN PHÒNG ${roomNumber} - THÁNG ${period}

1. Tiền điện:
   - Số cũ: ${electricityOld}
   - Số mới: ${electricityNew}
   - Tiêu thụ: ${electricityUsage} kWh
   - Thành tiền: ${formatCurrency(electricityCost)}

${servicesList}

${services.length + 2}. Tiền phòng: ${formatCurrency(roomPrice)}

--------------------------------
💰 TỔNG CỘNG: ${formatCurrency(totalAmount)}
--------------------------------

Vui lòng thanh toán qua:
NH MB Bank (Quân đội)
STK: 666088887979
Chủ TK: HUA QUANG KHAI
Nội dung: P${roomNumber} T${period}

Cảm ơn bạn!
`.trim();
};
