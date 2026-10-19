# Business Rules

## Goal

-   Goal phải thuộc đúng một user.
-   Deadline không được trước ngày tạo nếu nghiệp vụ không cho phép.
-   Goal completed khi điều kiện completion được thỏa mãn.
-   User chỉ sửa/xóa goal của chính mình.

## Quest

-   Quest phải thuộc user thông qua goal/habit context.
-   Quest chỉ được complete một lần.
-   Complete quest phải idempotent.
-   XP không được cộng trực tiếp từ frontend.

## Habit

-   Một habit thuộc một user.
-   Check-in phải theo rule frequency.
-   Streak phải được tính từ dữ liệu check-in hợp lệ.

## Social

-   FRIENDS post chỉ hiển thị cho accepted friends.
-   User có thể xóa post của chính mình.
-   Reaction của một user trên một post chỉ có một reaction hiện hành.

## Gamification

-   XP/coin chỉ phát sinh từ business event hợp lệ.
-   Không expose endpoint kiểu `POST /xp/add` cho client.
-   Reward phải có transaction record.

## Security

-   Resource owner phải được kiểm tra ở backend.
-   ADMIN role không mặc nhiên được đọc dữ liệu private nếu policy không
    cho phép.

## Event

-   Consumer phải idempotent.
-   Event có `eventId`, dùng để chống xử lý trùng.
