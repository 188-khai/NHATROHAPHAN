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
    waterCost: number,
    garbageFee: number,
    roomPrice: number,
    totalAmount: number
) => {
    return `
🏠 HÓA ĐƠN TIỀN PHÒNG ${roomNumber} - THÁNG ${period}

1. Tiền điện:
   - Số cũ: ${electricityOld}
   - Số mới: ${electricityNew}
   - Tiêu thụ: ${electricityUsage} kWh
   - Thành tiền: ${formatCurrency(electricityCost)}

2. Tiền nước: ${formatCurrency(waterCost)}

3. Rác & Dịch vụ: ${formatCurrency(garbageFee)}

4. Tiền phòng: ${formatCurrency(roomPrice)}

--------------------------------
💰 TỔNG CỘNG: ${formatCurrency(totalAmount)}
--------------------------------

Vui lòng thanh toán qua:
NH MP Bank (Quân đội)
STK: 0352231267
Chủ TK: HUA CONG KHAI
Nội dung: P${roomNumber} T${period}

Cảm ơn bạn!
`.trim();
};
