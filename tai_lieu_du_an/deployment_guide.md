# Hướng Dẫn Đưa Web Lên Mạng (Deploy)

Để ứng dụng hoạt động ổn định và truy cập được từ mọi nơi (không phụ thuộc vào máy tính cá nhân), bạn nên đưa nó lên **Vercel** (nền tảng miễn phí tốt nhất cho Next.js).

## Cách 1: Deploy Thủ Công (Dễ nhất cho người mới)

1.  **Đăng ký tài khoản Vercel**: Truy cập [vercel.com](https://vercel.com) và đăng ký (có thể dùng GitHub, Google).
2.  **Cài đặt Vercel CLI** (trên máy tính của bạn):
    Mở terminal và chạy lệnh:
    ```bash
    npm i -g vercel
    ```
3.  **Đăng nhập**:
    Chạy lệnh:
    ```bash
    vercel login
    ```
    (Làm theo hướng dẫn trên màn hình để xác thực).
4.  **Deploy**:
    Tại thư mục dự án `web-app`, chạy lệnh:
    ```bash
    vercel
    ```
    - Nhấn **Enter** cho tất cả các câu hỏi mặc định.
    - Chờ vài phút, Vercel sẽ cung cấp cho bạn một đường link (ví dụ: `boarding-house-manager.vercel.app`).

---

## Cách 2: Deploy qua GitHub (Khuyên dùng)

Cách này giúp web tự động cập nhật mỗi khi bạn lưu code.

1.  **Tạo kho lưu trữ trên GitHub** (Repository).
2.  **Đẩy code lên GitHub**:
    Mở Terminal tại thư mục dự án và chạy:
    ```bash
    git branch -M main
    git remote add origin <link-github-cua-ban>
    git push -u origin main
    ```
    *(Lưu ý: Thay `<link-github-cua-ban>` bằng link kho lưu trữ bạn vừa tạo)*
3.  **Kết nối Vercel với GitHub**:
    - Vào Dashboard Vercel -> **Add New Project**.
    - Chọn **Import Git Repository**.
    - Chọn kho lưu trữ bạn vừa tạo.
    - Nhấn **Deploy**.

Sau khi hoàn tất, bạn sẽ có một đường link chính thức (https://...) để gửi cho mọi người và cài đặt App trên điện thoại mà không lo mạng chập chờn.
