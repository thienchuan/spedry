---
title: Tổng quan
description: Spendry là gì và cách nó giữ khoản chi USDC của AI agent trong giới hạn bạn đặt ra.
order: 1
visibility: public
---

# Tổng quan về Spendry

Spendry cho phép bạn cấp cho một AI agent một khoản USDC để chi tiêu, kèm các giới hạn mà agent không thể vượt qua. Bạn tạo một **vault**, đặt quy tắc và nạp tiền vào đó. Agent chi tiêu từ vault thông qua một smart contract, và contract kiểm tra mọi quy tắc trước khi bất kỳ USDC nào được chuyển đi.

## Dành cho ai

Các nhóm và nhà phát triển đang vận hành AI agent cần thanh toán cho dịch vụ, và muốn đặt giới hạn cứng cho số tiền agent được chi.

## Cách hoạt động

1. **Tạo vault.** Đặt tên, địa chỉ ví của agent, tổng ngân sách và các giới hạn tùy chọn.
2. **Nạp tiền vào vault.** Gửi USDC vào vault. Bất kỳ ai cũng có thể nạp thêm vào một vault.
3. **Agent chi tiêu.** Ví của agent yêu cầu contract thanh toán cho một địa chỉ đích. Contract chỉ cho phép khi mọi quy tắc đều đạt.
4. **Bạn theo dõi.** Dashboard và lịch sử chi tiêu hiển thị ngân sách, số dư và từng khoản chi.
5. **Bạn luôn kiểm soát.** Tạm dừng vault bất cứ lúc nào để agent không thể chi tiêu.

## Contract bắt buộc những gì

- Tổng ngân sách mà agent không bao giờ vượt quá.
- Giới hạn theo ngày và giới hạn cho mỗi giao dịch.
- Ngày hết hạn tùy chọn.
- Danh sách địa chỉ đích được phép (tùy chọn).
- Chỉ ví agent mà bạn đã đặt mới được chi từ vault.

Các quy tắc này chạy trên blockchain, không phải trong ứng dụng. Xem chi tiết tại [Quy tắc chi tiêu](/docs/vi/policies).

## Mạng

Spendry hiện chạy trên **Arc Testnet** với USDC thử nghiệm. Đừng dùng tiền thật. Trên Arc, USDC cũng là token dùng để trả phí giao dịch.

## Trạng thái

| Nội dung | Tình trạng |
|----------|------------|
| Mạng | Chỉ Arc Testnet |
| Mainnet | Chưa xác định |
| Kiểm toán bảo mật độc lập | Chưa xác định |

Tiếp theo: [Tính năng](/docs/vi/features) hoặc [Bắt đầu](/docs/vi/getting-started).
