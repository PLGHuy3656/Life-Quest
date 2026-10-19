# Service Boundaries

  Service        Responsibility
  -------------- ---------------------------------------------------
  Identity       User, authentication, profile
  Goal-Quest     Goal, milestone, quest, proof, focus
  Habit          Habit, check-in, streak
  Social         Friends, posts, reactions, comments
  Challenge      Challenge, participation, duo/group
  Gamification   XP, level, coin, achievements, inventory, mascot
  Analytics      Statistics, behavior
  AI             Goal planning, behavior analysis, recommendations

## Không làm

-   Không tạo `XP Service` riêng chỉ vì có XP.
-   Không tạo `Post Service` riêng nếu Social đã sở hữu social domain.
-   Không cho frontend biết tên database/service nội bộ.
