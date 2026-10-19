# Use Cases

## UC-01 Register

**Actor:** USER\
**Precondition:** email chưa tồn tại.\
**Main flow:** 1. User nhập username, email, password. 2. Backend
validate. 3. Kiểm tra email/username. 4. Hash password. 5. Tạo user. 6.
Phát event `UserRegistered`. 7. Trả account result.

**Postcondition:** user tồn tại và có thể login.

## UC-02 Login

1.  User gửi email/password.
2.  Backend tìm user.
3.  Verify password.
4.  Tạo access token + refresh token.
5.  Trả token.

## UC-03 Create Goal

1.  User nhập goal.
2.  Validate title/deadline/priority.
3.  Tạo goal thuộc user.
4.  Phát `GoalCreated`.

## UC-04 Complete Quest

1.  User yêu cầu complete quest.
2.  Kiểm tra quest tồn tại.
3.  Kiểm tra user sở hữu hoặc có quyền.
4.  Kiểm tra quest chưa completed.
5.  Đánh dấu completed.
6.  Phát `QuestCompleted`.
7.  Gamification nhận event và cộng XP/coin.
8.  Analytics nhận event để cập nhật thống kê.

## UC-05 Habit Check-in

1.  User chọn habit.
2.  Gửi ngày + value.
3.  Validate habit thuộc user.
4.  Không cho duplicate check-in cùng ngày nếu rule yêu cầu unique.
5.  Lưu check-in.
6.  Tính streak.
7.  Phát `HabitCompleted` và `StreakUpdated`.

## UC-06 Create Post

1.  User tạo post.
2.  Chọn visibility.
3.  Backend kiểm tra proof nếu có.
4.  Lưu post.
5.  Phát `PostCreated`.

## UC-07 Join Challenge

1.  User chọn challenge.
2.  Kiểm tra challenge đang mở.
3.  Kiểm tra chưa tham gia.
4.  Tạo participation.
5.  Phát `ChallengeJoined`.

## UC-08 AI Goal Planning

1.  User gửi goal, deadline, available time.
2.  AI phân tích.
3.  Sinh milestones/quests/habits đề xuất.
4.  Trả plan.
5.  User có quyền review trước khi tạo dữ liệu thật.
