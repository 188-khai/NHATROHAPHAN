import { createClient } from '@supabase/supabase-js';

// Kiểm tra biến môi trường
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Nếu thiếu key (khi chạy local chưa cấu hình), sẽ trả về client null hoặc báo lỗi
// Để tránh crash app khi chưa config, ta có thể check trước
export const supabase = (() => {
    try {
        if (!supabaseUrl || !supabaseAnonKey) return null;
        return createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error("Supabase Init Error (Check ENV vars):", error);
        return null;
    }
})();
