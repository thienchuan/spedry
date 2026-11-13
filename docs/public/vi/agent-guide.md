---
title: Hướng dẫn cho agent
description: Cách ví agent chi tiêu từ vault, lệnh cần gọi và các lỗi cần xử lý.
order: 5
visibility: public
---

# Hướng dẫn cho agent

Trang này dành cho nhà phát triển kết nối AI agent với một vault.

## Bạn cần có

- **Địa chỉ contract** (hiển thị trong ứng dụng ở mục **Settings**).
- **Số vault** trên thẻ vault (ví dụ `#2` là vault `2`).
- Một ví có địa chỉ là **ví agent** của vault. Chỉ ví đó mới được chi tiêu.
- ABI của contract. Tệp ABI công bố cho bên tích hợp: Chưa xác định.

## Lệnh gọi

Agent gọi `spend` trên contract:

```
spend(vaultId, destination, amount, purposeHash)
```

| Tham số | Ý nghĩa |
|---------|---------|
| `vaultId` | Số vault. |
| `destination` | Địa chỉ cần thanh toán. |
| `amount` | USDC theo đơn vị nhỏ nhất (6 chữ số thập phân): `1 USDC = 1000000`. |
| `purposeHash` | Mã băm của một đoạn văn bản ngắn mô tả lý do. Chỉ mã băm được lưu trên chuỗi; bạn tự giữ đoạn văn bản. |

## Ví dụ (viem)

```
const purposeHash = keccak256(toHex("Search: quarterly report"))
await walletClient.writeContract({
  address: AGENT_VAULT_ADDRESS,
  abi: AGENT_VAULT_ABI,
  functionName: "spend",
  args: [vaultId, destinationAddress, amount, purposeHash],
})
```

## Các lỗi cần xử lý

Nếu bất kỳ quy tắc nào không đạt, lệnh gọi bị revert với một trong các lỗi sau. Xem [Quy tắc chi tiêu](/docs/vi/policies).

| Lỗi | Ý nghĩa | Cách xử lý gợi ý |
|-----|---------|------------------|
| `BudgetExhausted` | Tổng ngân sách còn lại không đủ. | Dừng; nhờ chủ sở hữu tăng ngân sách. |
| `DailyLimitExceeded` | Vượt giới hạn theo ngày. | Thử lại sau khi cửa sổ 24 giờ được đặt lại. |
| `PerTxLimitExceeded` | Một lần chi quá lớn. | Chia thành các khoản nhỏ hơn. |
| `DestinationNotAllowed` | Địa chỉ đích không nằm trong danh sách. | Không thử lại; hỏi chủ sở hữu. |
| `PolicyExpired` | Vault đã hết hạn. | Dừng; hỏi chủ sở hữu. |
| `VaultInactive` | Vault đang bị tạm dừng. | Chờ chủ sở hữu tiếp tục vault. |
| `InsufficientVaultBalance` | Vault không còn đủ USDC. | Nhờ chủ sở hữu nạp thêm. |
| `NotAgent` | Người gọi không phải ví agent của vault. | Kiểm tra ví nào đang ký. |

## Sau khi chi

Khoản chi thành công sẽ hiện trong **Spend History** của ứng dụng. Agent cũng có thể đọc trạng thái vault từ contract bất cứ lúc nào.

Không bao giờ chia sẻ khóa riêng của ví agent với bất kỳ ai và không dán vào ứng dụng. Spendry không bao giờ yêu cầu khóa này.

Tiếp theo: [Câu hỏi thường gặp](/docs/vi/faq).
