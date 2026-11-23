import prisma from "../config/database.js";
export const seedChallenges = async () => {
  console.log('--- Bắt đầu Seeding 4 Thử thách cộng đồng mẫu ---');
  const now = new Date();
  const daysAgo = days => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysLater = days => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const sampleChallenges = [{
    title: 'Chiến dịch 7 ngày năng suất cùng Cáo Fox V2',
    description: 'Hoàn thành ít nhất 7 nhiệm vụ trong tuần để thắp sáng ngọn lửa rực rỡ và nhận quà giá trị từ Cáo!',
    type: 'COMMUNITY',
    targetMetric: 'QUEST_COUNT',
    targetValue: 7,
    rewardXp: 350,
    rewardCoins: 150,
    startAt: daysAgo(2),
    endAt: daysLater(12),
    isActive: true
  }, {
    title: 'Bậc thầy Tập trung (Deep Focus Master)',
    description: 'Hoàn thành 10 phiên làm việc tập trung sâu để rèn luyện sự bền bỉ và bứt phá mục tiêu lớn.',
    type: 'SOLO',
    targetMetric: 'FOCUS_SESSION',
    targetValue: 10,
    rewardXp: 500,
    rewardCoins: 200,
    startAt: daysAgo(1),
    endAt: daysLater(20),
    isActive: true
  }, {
    title: 'Song Kiếm Hợp Bích (Duo Synergy Sprint)',
    description: 'Cùng người bạn đồng hành thân thiết hoàn thành 5 nhiệm vụ đôi để kích hoạt vũ điệu ăn mừng Fox High-Five!',
    type: 'DUO',
    targetMetric: 'DUO_QUEST',
    targetValue: 5,
    rewardXp: 400,
    rewardCoins: 180,
    startAt: daysAgo(3),
    endAt: daysLater(14),
    isActive: true
  }, {
    title: 'Thử thách Bứt phá Tháng: Chinh phục 20 Nhiệm vụ',
    description: 'Dành cho những chiến binh kiên cường nhất của LifeQuest. Hoàn thành 20 nhiệm vụ để khẳng định đẳng cấp!',
    type: 'COMMUNITY',
    targetMetric: 'QUEST_COUNT',
    targetValue: 20,
    rewardXp: 1000,
    rewardCoins: 500,
    startAt: daysAgo(5),
    endAt: daysLater(25),
    isActive: true
  }];
  for (const c of sampleChallenges) {
    const existing = await prisma.challenge.findFirst({
      where: {
        title: c.title
      }
    });
    if (!existing) {
      await prisma.challenge.create({
        data: c
      });
      console.log(`+ Đã tạo thử thách: ${c.title}`);
    } else {
      await prisma.challenge.update({
        where: {
          id: existing.id
        },
        data: c
      });
      console.log(`~ Đã cập nhật thử thách: ${c.title}`);
    }
  }
  console.log('--- Hoàn thành Seeding Thử thách thành công! ---');
};

// Chạy trực tiếp nếu file được thực thi
seedChallenges().catch(err => {
  console.error('Lỗi khi seed challenges:', err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});