-- Bảng theo dõi tiến độ công việc và thu nhập hàng tháng
CREATE TABLE IF NOT EXISTS work_performance_v2 (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    month_year TEXT NOT NULL UNIQUE,  -- Định dạng 'MM-YYYY', ví dụ: '02-2026'
    days_worked INTEGER DEFAULT 0,    -- Số ngày công đã làm
    ot_normal_hours NUMERIC DEFAULT 0, -- Số giờ OT ngày thường
    ot_sunday_hours NUMERIC DEFAULT 0, -- Số giờ OT Chủ nhật
    total_income NUMERIC DEFAULT 0,   -- Tổng thu nhập tích lũy
    total_expense NUMERIC DEFAULT 0,  -- Tổng chi tiêu trong tháng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- ID người dùng Supabase
);

-- Bảng lưu trữ chi tiết từng giao dịch chi tiêu để vẽ biểu đồ và phân tích
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    performance_id UUID REFERENCES work_performance_v2(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,          -- Số tiền chi
    category TEXT NOT NULL,           -- Danh mục chi tiêu (VD: ăn_uống, di_chuyển, mua_sắm, giải_trí, sinh_hoạt, khác)
    note TEXT,                        -- Ghi chú cụ thể
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Bật RLS cho bảo mật
ALTER TABLE work_performance_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

-- Các chính sách (Policies) để người dùng chỉ thấy dữ liệu của họ
CREATE POLICY "Cho phép user thao tác trên work_performance_v2"
    ON work_performance_v2 FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Cho phép user thao tác trên finance_transactions"
    ON finance_transactions FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Cập nhật bảng thêm trường kpi_income
ALTER TABLE work_performance_v2 ADD COLUMN IF NOT EXISTS kpi_income NUMERIC DEFAULT 0;
ALTER POLICY "Cho phép user thao tác trên finance_transactions" ON finance_transactions USING (true) WITH CHECK (true);
