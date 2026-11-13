---
title: Bắt đầu
description: Kết nối ví, tạo và nạp tiền cho vault đầu tiên, rồi theo dõi agent chi tiêu.
order: 3
visibility: public
---

# Bắt đầu

## Trước khi bắt đầu

- Một ví trình duyệt như MetaMask.
- USDC thử nghiệm trên **Arc Testnet**. Nhận từ [Circle faucet](https://faucet.circle.com). Arc dùng USDC để trả phí, nên cùng một số dư vừa dùng để nạp vault vừa trả phí.
- Địa chỉ ví mà agent của bạn sẽ dùng.

## 1. Kết nối và kiểm tra mạng

Mở ứng dụng và nhấn **Connect Wallet** ở thanh trên cùng. Nếu ví đang ở mạng khác, một biểu ngữ cảnh báo sẽ hiện ra và ứng dụng sẽ yêu cầu chuyển sang Arc Testnet khi bạn thực hiện thao tác.

## 2. Tạo vault

Mở **Agent Vaults** và nhấn **New Vault**. Điền các trường:

| Trường | Ý nghĩa |
|--------|---------|
| Vault Name | Tên để bạn dễ nhận biết, ví dụ "Research agent". |
| Agent Wallet Address | Ví sẽ được phép chi tiêu. |
| Total Budget (USDC) | Số tiền tối đa agent được chi từ vault này trong suốt vòng đời. |
| Daily Limit | Mức tối đa mỗi 24 giờ. `0` nghĩa là không giới hạn theo ngày. |
| Per-Tx Limit | Mức tối đa cho mỗi lần chi. `0` nghĩa là không giới hạn. |
| Duration (days) | Vault cho phép chi tiêu trong bao lâu. `0` nghĩa là không hết hạn. |

Tạo vault chỉ đặt ra quy tắc, không chuyển USDC nào. Ứng dụng có thể yêu cầu bạn phê duyệt (approve) USDC trước. Hãy xác nhận từng yêu cầu của ví.

## 3. Nạp tiền vào vault

Trên thẻ vault, nhấn **Fund**, nhập số tiền (hoặc nhấn **Max**) rồi xác nhận. Bạn có thể cần approve USDC trước, sau đó mới deposit.

## 4. Kết nối agent

Gửi cho nhà phát triển agent số vault (hiển thị dạng `#0`, `#1`, ...) và địa chỉ contract trong **Settings**. Xem [Hướng dẫn cho agent](/docs/vi/agent-guide).

## 5. Theo dõi

- **Dashboard** hiển thị tổng quan và các khoản chi gần nhất.
- **Spend History** liệt kê mọi khoản chi kèm liên kết tới explorer.
- Dữ liệu vault tự làm mới khoảng 30 giây một lần. Nhấn **Refresh** để cập nhật ngay.

## 6. Tạm dừng khi cần

Nhấn **Pause** trên vault để chặn mọi khoản chi. Nhấn **Resume** để cho phép lại. Tiền vẫn nằm trong vault.

## Xử lý sự cố

| Sự cố | Cách xử lý |
|-------|------------|
| Biểu ngữ "Wrong network" | Chuyển ví sang Arc Testnet. |
| Lịch sử chi tiêu báo không tải được | Block explorer giới hạn số yêu cầu. Chờ vài phút rồi nhấn **Refresh**. |
| Lịch sử chi tiêu trống | Chưa có agent nào chi tiêu. |
| Ví báo lỗi mà ứng dụng không hiện thông báo | Ứng dụng chưa hiển thị lỗi giao dịch. Kiểm tra ví rồi thử lại. |

Tiếp theo: [Quy tắc chi tiêu](/docs/vi/policies).
