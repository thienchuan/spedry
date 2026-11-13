---
title: Tính năng
description: Những gì bạn có thể làm trong ứng dụng Spendry hiện nay, và những gì chỉ có trong contract.
order: 2
visibility: public
---

# Tính năng

## Trong ứng dụng

| Tính năng | Chức năng |
|-----------|-----------|
| Kết nối ví | Đăng nhập bằng ví trình duyệt. Ứng dụng cảnh báo nếu bạn đang ở sai mạng. |
| Tạo vault | Đặt tên, ví của agent, tổng ngân sách, giới hạn theo ngày, giới hạn mỗi giao dịch và thời hạn. |
| Nạp tiền vào vault | Gửi USDC vào vault. Bất kỳ ai cũng có thể nạp vào bất kỳ vault nào. |
| Tạm dừng và tiếp tục | Chặn hoặc cho phép agent chi từ vault mà không cần chuyển tiền đi. |
| Danh sách vault | Xem mức ngân sách đã dùng, số dư, giới hạn, hạn dùng và trạng thái của từng vault. |
| Dashboard | Tổng ngân sách, tổng đã chi, số dư khả dụng, số vault đang hoạt động, mức sử dụng và các khoản chi gần nhất. |
| Lịch sử chi tiêu | Mọi khoản chi của agent, mới nhất trước, kèm liên kết tới block explorer. |
| Settings | Mạng, địa chỉ contract và đoạn mã tích hợp ngắn cho nhà phát triển agent. |

## Chỉ có trong contract

Các chức năng này hoạt động trên blockchain nhưng chưa có màn hình trong ứng dụng.

| Tính năng | Trạng thái trong ứng dụng |
|-----------|---------------------------|
| Đổi giới hạn sau khi tạo | Chưa có (chưa xác định) |
| Danh sách địa chỉ đích được phép | Chưa có (chưa xác định) |
| Thay ví agent | Chưa có (chưa xác định) |
| Rút số dư chưa chi (việc này cũng tạm dừng vault) | Chưa có (chưa xác định) |
| Tạm dừng toàn bộ contract (chỉ quản trị viên) | Không thuộc ứng dụng |

Bạn có thể gọi trực tiếp các hàm này từ ví hoặc script. Xem [Hướng dẫn cho agent](/docs/vi/agent-guide) để biết cách tìm contract.

## Ngôn ngữ

Tài liệu này có tiếng Việt và English. Bản thân ứng dụng hiện chỉ có tiếng Anh.

Tiếp theo: [Bắt đầu](/docs/vi/getting-started).
