# Walkthrough - Boarding House Manager

## ✅ Các Tính Năng Đã Sửa Lỗi (Mới Cập Nhật)

### 1. Đồng bộ Trạng thái Phòng & Khách Thuê
- **Tự động chuyển "Đã thuê":** Khi thêm khách vào phòng "Trống".
- **Tự động chuyển "Trống":** Khi xóa hết khách khỏi phòng.
- **Giữ nguyên trạng thái:** Khi thêm khách thứ 2+ hoặc xóa bớt khách nhưng vẫn còn người ở.

### 2. Số Điện Thoại & Form Nhập Liệu
- Cho phép nhập trùng số điện thoại (ví dụ: vợ chồng dùng chung SĐT).
- Form "Thêm khách mới" sẽ tự động xóa trắng sau khi thêm thành công.

### 3. Xuất Hóa Đơn (PDF / Zalo)
- Đã sửa lỗi không xuất được PDF trên điện thoại/máy tính bảng.
- Nút "Gửi Zalo" hoạt động ổn định hơn.

### 4. Sắp Xếp Danh Sách Phòng
- Danh sách phòng trọ sẽ luôn được sắp xếp theo thứ tự số tăng dần (ví dụ: P.1, P.2, ..., P.10, P.11).
- Khi cập nhật thông tin phòng, vị trí của phòng sẽ không bị nhảy xuống cuối danh sách nữa.

### 5. Tự Động Lưu Hóa Đơn Khi Xuất
- Khi bấm **"Xuất PDF"** hoặc **"Gửi Zalo"**, hệ thống sẽ **tự động lưu hóa đơn** vào lịch sử (nếu chưa lưu).
- Giúp đảm bảo không bị mất dữ liệu khi quên bấm nút "Lưu".
- Popup thông báo sẽ xác nhận "Đã lưu hóa đơn và copy ảnh" khi gửi Zalo.

---

## 1. Overview
This application is a comprehensive tool for managing boarding houses, including rooms, tenants, billing, and assets. It allows for calculating electricity and water usage, generating regular bills, and tracking financial metrics. The app is now a PWA, installable on mobile devices.

## 2. Key Features
- **Dashboard**: Quick view of room status (Available, Rented) and revenue.
- **Room Management**: Add, edit, and manage room details using a persistent local storage.
- **Tenant Management**: Track tenant information, including ID photos and deposit details.
- **Billing**:
  - Automatic calculation of electricity and water charges.
  - **Export PDF**: Generate professional invoices.
  - **Send Zalo**: Share bills directly via Zalo.
- **Assets**: Track room assets and maintenance schedules.
- **Mobile PWA**: Installable on iOS and Android for native app-like experience.

## 3. Deployment & Verification (Success!)
The application has been successfully deployed to Vercel and connected to a Supabase cloud database.

**Live URL**: [https://nhatrohaphan.vercel.app/](https://nhatrohaphan.vercel.app/)

### Key Achievements
- **Cloud Database (Supabase)**: Data is now stored securely in the cloud, allowing **sync across multiple devices**.
- **Real-time Sync**: Changes made on one device (e.g., adding a tenant) appear instantly on others.
- **Robust Error Handling**: Added `ErrorBoundary` to catch and display helpful error messages instead of white screens.
- **Sample Data**: Integrated a "Generate Sample Data" button to quickly populate the empty database for new users.

### Verification Results
- **Page Load**: Confirmed "Quản Lý Nhà Trọ" loads successfully after fixing React Hook violations.
- **Authentication**: Users can log in; session persists.
- **Data Persistence**: Data created (or seeded) persists after page reloads and across devices.
- **Calculations**: Tested electricity input (100 -> 150 kWh) resulting in correct 175,000 VND charge.
- **Features**: "Xuất hóa đơn" and "Gửi Zalo" buttons are functional.

## 4. How to Install (PWA)
1.  **Android (Chrome)**: Open the link -> Tap menu (3 dots) -> "Add to Home Screen" (Thêm vào màn hình chính).
2.  **iOS (Safari)**: Open the link -> Tap Share button -> "Add to Home Screen" (Thêm vào màn hình chính).

## 5. Data Storage Limits (Supabase Free Tier)

You are using the generous **Free Tier** of Supabase. Here is what you get:

- **Database Size (500MB)**: This is for storing text data (Rooms, Tenant info, Bills).
    - **Capacity**: Enough for approx. **100,000 records**.
    - **Estimation**: Even with 50 rooms, it would take **20+ years** to fill this up.
- **File Storage (1GB)**: This is for storing images (ID Cards, Asset Photos).
    - **Capacity**: Enough for approx. **500 - 1,000 high-quality images**.
    - **Recommendation**: Avoid uploading very heavy images (e.g. 10MB raw photos). The app automatically optimizes images, so this should last for years.

**Conclusion**: For personal use or managing a few boarding houses, this free limit is virtually unlimited. You do not need to worry about paying fees.
