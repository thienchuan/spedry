---
title: Quy tắc chi tiêu
description: Mọi quy tắc contract kiểm tra trước khi agent được chi, và ý nghĩa của từng lỗi.
order: 4
visibility: public
---

# Quy tắc chi tiêu

Khi agent yêu cầu chi tiêu, contract kiểm tra các quy tắc dưới đây theo đúng thứ tự. Quy tắc nào không đạt trước sẽ dừng giao dịch và không có USDC nào được chuyển đi.

| # | Quy tắc | Lỗi nếu không đạt |
|---|---------|-------------------|
| 1 | Số tiền lớn hơn 0 và địa chỉ đích hợp lệ. | `ZeroAmount`, `ZeroAddress` |
| 2 | Người gọi là ví agent đã đặt cho vault. | `NotAgent` |
| 3 | Vault đang hoạt động (không bị tạm dừng). | `VaultInactive` |
| 4 | Vault chưa hết hạn. | `PolicyExpired` |
| 5 | Nếu bạn đặt danh sách địa chỉ được phép, địa chỉ đích phải nằm trong đó. | `DestinationNotAllowed` |
| 6 | Số tiền nằm trong giới hạn mỗi giao dịch, nếu có đặt. | `PerTxLimitExceeded` |
| 7 | Số tiền nằm trong phần ngân sách còn lại. | `BudgetExhausted` |
| 8 | Số tiền nằm trong giới hạn theo ngày, nếu có đặt. | `DailyLimitExceeded` |
| 9 | Vault còn đủ USDC. | `InsufficientVaultBalance` |

## Tổng ngân sách

Trần chi tiêu suốt vòng đời của vault. Số đã chi chỉ tăng lên, nên ngân sách còn lại chỉ giảm đi. Bạn không thể hạ ngân sách xuống thấp hơn số đã chi.

## Giới hạn theo ngày

Giới hạn cho mỗi cửa sổ 24 giờ. Đây là cửa sổ cố định, không phải cửa sổ trượt: bộ đếm theo ngày được đặt lại sau khi đã qua 24 giờ kể từ lúc cửa sổ bắt đầu. `0` nghĩa là không giới hạn theo ngày.

## Giới hạn mỗi giao dịch

Mức chi lớn nhất cho một lần. `0` nghĩa là không giới hạn.

## Hết hạn

Sau thời điểm hết hạn, agent không thể chi tiêu nữa. `0` nghĩa là vault không bao giờ hết hạn.

## Địa chỉ đích được phép

Nếu danh sách trống, agent có thể thanh toán cho bất kỳ địa chỉ nào. Ngay khi thêm một địa chỉ, agent chỉ có thể thanh toán cho các địa chỉ trong danh sách. Việc quản lý danh sách này có trong contract; ứng dụng chưa có màn hình cho việc đó (chưa xác định).

## Tạm dừng

- **Tạm dừng vault:** chủ sở hữu có thể tạm dừng một vault. Agent không thể chi cho đến khi vault được tiếp tục.
- **Tạm dừng toàn cục:** quản trị viên contract có thể tạm dừng toàn bộ contract, việc này cũng chặn tạo và nạp tiền vào vault.

## Ai làm được gì

| Thao tác | Ai |
|----------|----|
| Tạo vault | Bất kỳ ai (người tạo trở thành chủ sở hữu) |
| Nạp tiền vào vault | Bất kỳ ai |
| Tạm dừng, tiếp tục, đổi cài đặt, rút tiền | Chủ sở hữu vault |
| Chi tiêu | Chỉ ví agent của vault |

Tiếp theo: [Hướng dẫn cho agent](/docs/vi/agent-guide).
