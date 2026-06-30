# Deep Air Monitoring

Website tĩnh giám sát chất lượng không khí, gồm các trang:

- `index.html`: đăng nhập hệ thống.
- `overview.html`: tổng quan hệ thống.
- `theory.html`: cơ sở lý thuyết.
- `dashboard.html`: dashboard dữ liệu Firebase.
- `option.html`: trang quản trị, tạo tài khoản và quản lý người dùng.
- `weather.html`: trang dự báo thời tiết, cả admin và user đều xem được.

## Tài khoản và phân quyền

- Tài khoản mặc định: `admin`
- Mật khẩu mặc định: `Admin@123`
- Mã khôi phục mặc định: `HCMUTE2026`

### Quyền admin

Admin xem được toàn bộ trang:

- Tổng quan
- Lý thuyết
- Dashboard
- Tùy chọn
- Dự báo thời tiết

Admin có quyền tạo tài khoản mới, chọn quyền `user` hoặc `admin`, đặt mã khôi phục và xóa tài khoản thường.

### Quyền user

User xem được:

- Tổng quan
- Lý thuyết
- Dashboard
- Dự báo thời tiết

User không thấy mục `Tùy chọn`. Nếu user mở thẳng trang này bằng URL, website sẽ tự chuyển về trang `overview.html`.

## Chức năng bảo mật đã thêm

1. Chỉ nhập đúng tài khoản/mật khẩu mới vào được hệ thống.
2. Chặn mở thẳng các trang bên trong nếu chưa đăng nhập.
3. Chặn trang quản trị đối với tài khoản không phải admin.
4. Mật khẩu bắt buộc dài hơn 6 ký tự và có ít nhất 1 ký tự đặc biệt, ví dụ: `@`, `#`, `$`, `!`.
5. Trang đăng nhập có chức năng tạo tài khoản mới với quyền user.
6. Trang Tùy chọn của admin vẫn có chức năng tạo tài khoản và chọn quyền user/admin.
7. Trang đăng nhập có chức năng quên mật khẩu bằng mã khôi phục.
8. Có nút đăng xuất.

## Cập nhật giao diện

- Logo trường nằm bên trái, logo khoa nằm bên phải trên toàn bộ website.
- Header các trang bên trong được căn giữa, thanh chọn trang nằm bên dưới tiêu đề.
- Đồng bộ kích thước logo giữa Dashboard, Tổng quan, Lý thuyết, Tùy chọn và Dự báo thời tiết.
- Đồng bộ hiệu ứng nền động, hiệu ứng kính mờ và hover giữa các trang.
- Trang Tổng quan đã căn lại nội dung và thu nhỏ ảnh sơ đồ phần cứng.

## Lưu ý

Cơ chế tài khoản hiện tại dùng JavaScript và `localStorage`, phù hợp demo/bảo vệ đồ án web tĩnh. Nếu triển khai thật trên Internet, nên dùng Firebase Authentication hoặc backend riêng để bảo mật tốt hơn.


## Phân quyền tài khoản

- Admin: xem Tổng quan, Lý thuyết, Dashboard, Dự báo thời tiết và có thêm trang Tùy chọn để tạo/xóa tài khoản.
- User: xem Tổng quan, Lý thuyết, Dashboard và Dự báo thời tiết. User không thấy và không truy cập được trang Tùy chọn.
