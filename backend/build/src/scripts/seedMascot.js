import prisma from "../config/database.js";
export const seedMascot = async () => {
  console.log('--- Bắt đầu Seeding Mascot Model, Dialogues, Actions & Cosmetics ---');
  const foxModel = await prisma.mascotModel.upsert({
    where: {
      code: 'FOX_V2'
    },
    update: {
      name: 'LifeQuest Fox V2',
      assetPath: '06_EXPORTS/glb/fox_v2_anim_e2.glb',
      requiredTier: 'FREE',
      sleepStartHour: 22,
      sleepEndHour: 6
    },
    create: {
      code: 'FOX_V2',
      name: 'LifeQuest Fox V2',
      assetPath: '06_EXPORTS/glb/fox_v2_anim_e2.glb',
      requiredTier: 'FREE',
      sleepStartHour: 22,
      sleepEndHour: 6
    }
  });
  console.log(`Đã upsert model: ${foxModel.name} (Code: ${foxModel.code})`);

  // ==========================================
  // 1. DIALOGUES (Xóa cũ để idempotent)
  // ==========================================
  await prisma.mascotDialogue.deleteMany({
    where: {
      mascotModelId: foxModel.id
    }
  });
  const dialoguesData = [
  // --- DASHBOARD (20 câu FREE + 3 câu PREMIUM) ---
  // IDLE_2MIN (5 FREE + 1 PREMIUM)
  {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'IDLE_2MIN',
    requiredTier: 'FREE',
    content: 'Này bạn ơi! Đứng ngắm tui hoài vậy, làm quest tiếp đi chứ!',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'IDLE_2MIN',
    requiredTier: 'FREE',
    content: 'Hơn 2 phút rồi đó nha, đừng nói là lại lướt mạng xã hội đấy!',
    clipName: null,
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'IDLE_2MIN',
    requiredTier: 'FREE',
    content: 'Hú le! Cáo V2 nhắc nhở: Mục tiêu lớn đang chờ bạn kìa!',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'IDLE_2MIN',
    requiredTier: 'FREE',
    content: 'Ngồi thở một chút rồi chuẩn bị làm tiếp quest nào chiến hữu!',
    clipName: null,
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'IDLE_2MIN',
    requiredTier: 'FREE',
    content: 'Ngủ gật trên bàn phím là tui cắn đuôi đánh thức ráng chịu nha!',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'IDLE_2MIN',
    requiredTier: 'PREMIUM',
    content: 'Chào mừng thành viên VIP! Cáo đang chuẩn bị phần thưởng đặc biệt cho bạn nè!',
    clipName: 'wave',
    activity: 'idle',
    mood: 'happy'
  },
  // TAP_HEAD (4 FREE + 1 PREMIUM)
  {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Xoa đầu thích ghê á! Ước gì làm xong nhiệm vụ cũng sướng vầy!',
    clipName: 'head_pet',
    activity: null,
    mood: 'happy'
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Hehe! Vuốt ve thế này là tui buff cho 100% may mắn luôn!',
    clipName: 'head_pet',
    activity: null,
    mood: 'happy'
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Được khen ngợi sướng rơn cả người, cảm ơn sen nha!',
    clipName: 'head_pet',
    activity: null,
    mood: 'happy'
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Xoa đầu tui xong rồi thì xắn tay áo vào cày quest đi nào!',
    clipName: 'head_pet',
    activity: null,
    mood: 'happy'
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_HEAD',
    requiredTier: 'PREMIUM',
    content: 'Người dùng Premium xoa đầu có khác, cảm giác aura lấp lánh ghê!',
    clipName: 'head_pet',
    activity: null,
    mood: 'proud'
  },
  // TAP_TAIL (3 FREE + 1 PREMIUM)
  {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_TAIL',
    requiredTier: 'FREE',
    content: 'Gừ gừ! Đừng có sờ vào cái đuôi bồng bềnh của tui!',
    clipName: 'tail_touch',
    activity: null,
    mood: 'surprised'
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_TAIL',
    requiredTier: 'FREE',
    content: 'Ái chà! Đuôi cáo nhạy cảm lắm, giật cả mình!',
    clipName: 'tail_touch',
    activity: null,
    mood: 'surprised'
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_TAIL',
    requiredTier: 'FREE',
    content: 'Chạm đâu không chạm, toàn me cái đuôi vậy trời?!',
    clipName: 'tail_touch',
    activity: null,
    mood: 'surprised'
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_TAIL',
    requiredTier: 'PREMIUM',
    content: 'Chỉ có VIP mới được chạm nhẹ vào chiếc đuôi hoàng kim này thôi đó nha!',
    clipName: 'tail_touch',
    activity: null,
    mood: 'happy'
  },
  // TAP_SPAM (2 câu)
  {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_SPAM',
    requiredTier: 'FREE',
    content: 'Chọc hoài nha! Coi chừng cáo con biến hình dọa cắn đó!',
    clipName: 'tail_touch',
    activity: null,
    mood: 'sad'
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'TAP_SPAM',
    requiredTier: 'FREE',
    content: 'Tha cho tui đi mà! Spam hoài đau hết cả người rồi nè!',
    clipName: 'tail_touch',
    activity: null,
    mood: 'sad'
  },
  // SLEEP (2 câu)
  {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'SLEEP',
    requiredTier: 'FREE',
    content: 'zzzzzz...',
    clipName: null,
    activity: 'resting',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'SLEEP',
    requiredTier: 'FREE',
    content: 'gừ... để yên ngủ đi zzz',
    clipName: null,
    activity: 'resting',
    mood: null
  },
  // QUEST_COMPLETED (2 câu)
  {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'QUEST_COMPLETED',
    requiredTier: 'FREE',
    content: 'Quá đỉnh luôn! Nhận XP với Vàng đầy túi rồi nè!',
    clipName: 'quest_complete',
    activity: null,
    mood: 'happy'
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'QUEST_COMPLETED',
    requiredTier: 'FREE',
    content: 'Hoan hô! Thêm một nhiệm vụ bị hạ gục ngon ơ!',
    clipName: 'quest_complete',
    activity: null,
    mood: 'happy'
  },
  // STREAK_LOST (2 câu)
  {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'STREAK_LOST',
    requiredTier: 'FREE',
    content: 'Huhu mất chuỗi streak rồi... Nhưng không sao, làm lại từ đầu nào bạn ơi!',
    clipName: 'streak_lost',
    activity: null,
    mood: 'sad'
  }, {
    mascotModelId: foxModel.id,
    placement: 'DASHBOARD',
    triggerType: 'STREAK_LOST',
    requiredTier: 'FREE',
    content: 'Tiếc chuỗi streak ghê á, hôm nay đừng bỏ cuộc nữa nha!',
    clipName: 'streak_lost',
    activity: null,
    mood: 'sad'
  },
  // --- AUTH (3 câu) ---
  {
    mascotModelId: foxModel.id,
    placement: 'AUTH',
    triggerType: 'ON_ENTER',
    requiredTier: 'FREE',
    content: 'Đăng ký LifeQuest cùng Cáo đi, đảm bảo hết lười!',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'AUTH',
    triggerType: 'ON_ENTER',
    requiredTier: 'FREE',
    content: 'Chào mừng quay lại! Hôm nay chiến tiếp nhé?',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'AUTH',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Chạm nhẹ lấy hên, đăng nhập rồi vào khám phá nhiệm vụ thôi nào!',
    clipName: 'head_pet',
    activity: null,
    mood: 'happy'
  },
  // --- PROFILE (6 câu) ---
  {
    mascotModelId: foxModel.id,
    placement: 'PROFILE',
    triggerType: 'ON_ENTER',
    requiredTier: 'FREE',
    content: 'Đang chỉnh profile hả? Chọn cái ảnh nào ngầu ngầu nha!',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'PROFILE',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Hồ sơ chiến tích của bạn trông ấn tượng phết đấy!',
    clipName: 'head_pet',
    activity: null,
    mood: 'happy'
  }, {
    mascotModelId: foxModel.id,
    placement: 'PROFILE',
    triggerType: 'ON_ENTER',
    requiredTier: 'FREE',
    content: 'Level và streak ở đây nhìn rõ mồn một luôn nè!',
    clipName: null,
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'PROFILE',
    triggerType: 'ON_ENTER',
    requiredTier: 'FREE',
    content: 'Đang ngắm lại thành tích hả? Cố gắng lên Top 1 bảng xếp hạng nào!',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'PROFILE',
    triggerType: 'TAP_TAIL',
    requiredTier: 'FREE',
    content: 'Sờ đuôi làm gì, cập nhật bio cho hoành tráng đi!',
    clipName: 'tail_touch',
    activity: null,
    mood: 'surprised'
  }, {
    mascotModelId: foxModel.id,
    placement: 'PROFILE',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Chỉnh thông tin xong nhớ lưu lại nha, Cáo không nhớ giùm đâu á!',
    clipName: 'head_pet',
    activity: null,
    mood: null
  },
  // --- SOCIAL (5 câu) ---
  {
    mascotModelId: foxModel.id,
    placement: 'SOCIAL',
    triggerType: 'ON_ENTER',
    requiredTier: 'FREE',
    content: 'Lướt xem bạn bè hôm nay ai cày cuốc chăm chỉ nhất nào!',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'SOCIAL',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Thấy bài đăng hay thì thả tim, thả lửa cho bạn bè nha!',
    clipName: 'head_pet',
    activity: null,
    mood: 'happy'
  }, {
    mascotModelId: foxModel.id,
    placement: 'SOCIAL',
    triggerType: 'EMPTY_STATE',
    requiredTier: 'FREE',
    actionType: 'OPEN_POKE_MODAL',
    content: 'Bảng tin vắng vẻ quá, gửi một cú chọc để bạn bè thức dậy nào!',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'SOCIAL',
    triggerType: 'ON_ENTER',
    requiredTier: 'FREE',
    content: 'Cùng bạn bè làm Quest thì tiến độ nhân đôi luôn đó!',
    clipName: null,
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'SOCIAL',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Hôm nay đã tương tác với bạn bè chưa đó nha?',
    clipName: 'head_pet',
    activity: null,
    mood: null
  },
  // --- FOCUS (5 câu) ---
  {
    mascotModelId: foxModel.id,
    placement: 'FOCUS',
    triggerType: 'ON_ENTER',
    requiredTier: 'FREE',
    content: 'Bắt đầu phiên tập trung! Tắt hết thông báo, tập trung tối đa nào!',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'FOCUS',
    triggerType: 'FOCUS_INTERRUPTED',
    requiredTier: 'FREE',
    content: 'Ối! Sao lại dừng giữa chừng thế? Kỷ luật là sức mạnh mà!',
    clipName: 'quest_failed',
    activity: null,
    mood: 'sad'
  }, {
    mascotModelId: foxModel.id,
    placement: 'FOCUS',
    triggerType: 'FOCUS_INTERRUPTED',
    requiredTier: 'FREE',
    content: 'Tập trung lại nào bạn ơi, đừng để cám dỗ đánh bại!',
    clipName: 'quest_failed',
    activity: null,
    mood: 'sad'
  }, {
    mascotModelId: foxModel.id,
    placement: 'FOCUS',
    triggerType: 'QUEST_COMPLETED',
    requiredTier: 'FREE',
    content: 'Hoàn thành phiên tập trung xuất sắc! Não bộ đã được nâng cấp!',
    clipName: 'quest_complete',
    activity: null,
    mood: 'happy'
  }, {
    mascotModelId: foxModel.id,
    placement: 'FOCUS',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Suỵt! Cáo đang cùng bạn tập trung, không nói chuyện đâu nè!',
    clipName: 'head_pet',
    activity: null,
    mood: null
  },
  // --- SHOP (4 câu) ---
  {
    mascotModelId: foxModel.id,
    placement: 'SHOP',
    triggerType: 'ON_ENTER',
    requiredTier: 'FREE',
    content: 'Chào mừng đến LifeQuest Shop! Sắm đồ mới cho Cáo diện đi nào!',
    clipName: 'wave',
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'SHOP',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Mũ len hay kính râm nhìn hợp với Cáo hơn ta?',
    clipName: 'head_pet',
    activity: null,
    mood: 'happy'
  }, {
    mascotModelId: foxModel.id,
    placement: 'SHOP',
    triggerType: 'ON_ENTER',
    requiredTier: 'FREE',
    content: 'Tích lũy coin từ Quest để đổi lấy những món trang sức độc lạ nha!',
    clipName: null,
    activity: 'idle',
    mood: null
  }, {
    mascotModelId: foxModel.id,
    placement: 'SHOP',
    triggerType: 'TAP_HEAD',
    requiredTier: 'FREE',
    content: 'Khoác lên mình bộ trang phục xịn sò là làm Quest tự tin hẳn!',
    clipName: 'head_pet',
    activity: null,
    mood: null
  }];
  for (const dialogue of dialoguesData) {
    await prisma.mascotDialogue.create({
      data: dialogue
    });
  }
  console.log(`Đã nạp thành công ${dialoguesData.length} câu thoại cho FOX_V2`);

  // ==========================================
  // 2. MASCOT ACTIONS (6 hành động)
  // ==========================================
  await prisma.mascotAction.deleteMany({
    where: {
      mascotModelId: foxModel.id
    }
  });
  const actionsData = [{
    mascotModelId: foxModel.id,
    code: 'WAVE_HELLO',
    name: 'Vẫy tay chào',
    description: 'Cáo vẫy tay chào thân thiện',
    clipName: 'wave',
    mood: null,
    requiredTier: 'FREE',
    cooldownSeconds: 3
  }, {
    mascotModelId: foxModel.id,
    code: 'PET_HEAD',
    name: 'Xoa đầu vuốt ve',
    description: 'Được xoa đầu vuốt ve thích thú',
    clipName: 'head_pet',
    mood: 'happy',
    requiredTier: 'FREE',
    cooldownSeconds: 3
  }, {
    mascotModelId: foxModel.id,
    code: 'TOUCH_TAIL',
    name: 'Chạm đuôi bông',
    description: 'Chạm nhẹ vào chiếc đuôi bông bềnh',
    clipName: 'tail_touch',
    mood: 'surprised',
    requiredTier: 'FREE',
    cooldownSeconds: 3
  }, {
    mascotModelId: foxModel.id,
    code: 'HAPPY_HOP',
    name: 'Nhảy múa vui vẻ',
    description: 'Nhảy cẫng lên ăn mừng tràn đầy năng lượng',
    clipName: 'happy',
    mood: 'happy',
    requiredTier: 'FREE',
    cooldownSeconds: 4
  }, {
    mascotModelId: foxModel.id,
    code: 'FLAME_CHEER',
    name: 'Cổ vũ lửa bùng cháy',
    description: 'Cổ vũ ngọn lửa nhiệt huyết thắp sáng chuỗi streak',
    clipName: 'streak_cheer',
    mood: 'happy',
    requiredTier: 'PREMIUM',
    cooldownSeconds: 5
  }, {
    mascotModelId: foxModel.id,
    code: 'SPIN_CELEBRATE',
    name: 'Xoay vòng ăn mừng Level Up',
    description: 'Xoay vòng kiêu hãnh ăn mừng thăng cấp vinh quang',
    clipName: 'level_up',
    mood: 'proud',
    requiredTier: 'PREMIUM',
    cooldownSeconds: 5
  }];
  for (const action of actionsData) {
    await prisma.mascotAction.create({
      data: action
    });
  }
  console.log(`Đã nạp thành công ${actionsData.length} actions cho FOX_V2`);

  // ==========================================
  // 3. MASCOT COSMETICS (6 trang sức)
  // ==========================================
  // Xóa user cosmetics liên quan trước nếu có
  await prisma.userMascotCosmetic.deleteMany({
    where: {
      cosmetic: {
        mascotModelId: foxModel.id
      }
    }
  });
  await prisma.mascotCosmetic.deleteMany({
    where: {
      mascotModelId: foxModel.id
    }
  });
  const cosmeticsData = [{
    mascotModelId: foxModel.id,
    code: 'SCARF_RED_BASIC',
    name: 'Khăn quàng đỏ cơ bản',
    slot: 'ATT_SCARF',
    assetKey: 'cosmetics/scarf_red.glb',
    coinPrice: 50,
    requiredTier: 'FREE',
    isActive: true
  }, {
    mascotModelId: foxModel.id,
    code: 'HAT_BEANIE_COZY',
    name: 'Mũ len ấm áp',
    slot: 'ATT_HAT',
    assetKey: 'cosmetics/hat_beanie.glb',
    coinPrice: 100,
    requiredTier: 'FREE',
    isActive: true
  }, {
    mascotModelId: foxModel.id,
    code: 'GLASSES_NERD',
    name: 'Kính cận tri thức',
    slot: 'ATT_GLASSES',
    assetKey: 'cosmetics/glasses_nerd.glb',
    coinPrice: 120,
    requiredTier: 'FREE',
    isActive: true
  }, {
    mascotModelId: foxModel.id,
    code: 'HAT_GOLDEN_CROWN',
    name: 'Vương miện hoàng gia',
    slot: 'ATT_HAT',
    assetKey: 'cosmetics/hat_crown.glb',
    coinPrice: 0,
    requiredTier: 'PREMIUM',
    isActive: true
  }, {
    mascotModelId: foxModel.id,
    code: 'GLASSES_CYBER_VISOR',
    name: 'Kính thực tế ảo Cyber',
    slot: 'ATT_GLASSES',
    assetKey: 'cosmetics/glasses_cyber.glb',
    coinPrice: 0,
    requiredTier: 'PREMIUM',
    isActive: true
  }, {
    mascotModelId: foxModel.id,
    code: 'BACKPACK_JETPACK',
    name: 'Balo phản lực Jetpack',
    slot: 'ATT_BACKPACK',
    assetKey: 'cosmetics/backpack_jetpack.glb',
    coinPrice: 0,
    requiredTier: 'PREMIUM',
    isActive: true
  }];
  for (const cosmetic of cosmeticsData) {
    await prisma.mascotCosmetic.create({
      data: cosmetic
    });
  }
  console.log(`Đã nạp thành công ${cosmeticsData.length} cosmetics cho FOX_V2`);
  console.log('--- Hoàn thành Seeding Mascot thành công ---');
};

// Chạy trực tiếp nếu file được execute
seedMascot().catch(e => {
  console.error('Lỗi khi seed mascot:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});