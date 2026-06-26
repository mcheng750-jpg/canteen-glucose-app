import type { FoodItem, FoodRecord, Stall } from "../types";

const now = new Date("2026-06-18T12:30:00+08:00");

function record(id: string, before: number, after1h: number, after2h: number, note: string): FoodRecord {
  return {
    id,
    user: "匿名同事",
    note,
    shared: true,
    anonymous: true,
    before,
    after1h,
    after2h,
    delta: Number((after2h - before).toFixed(1)),
    portion: "正常",
    extraRice: false,
    sugaryDrink: false,
    exercised: id.endsWith("2"),
    createdAt: new Date(now.getTime() - Number(id.replace(/\D/g, "") || 1) * 3600_000).toISOString()
  };
}

function food(id: string, name: string, level: FoodItem["level"], before: number, after1h: number, after2h: number, sampleCount: number, note: string, imageTone: string): FoodItem {
  return {
    id,
    name,
    imageTone,
    level,
    before,
    after1h,
    after2h,
    delta: Number((after2h - before).toFixed(1)),
    sampleCount,
    note,
    records: [
      record(`${id}-r1`, before, after1h, after2h, note),
      record(`${id}-r2`, before + 0.2, after1h - 0.1, after2h - 0.2, "少饭后波动更稳"),
      record(`${id}-r3`, before - 0.1, after1h + 0.3, after2h + 0.1, "饭后散步 15 分钟")
    ]
  };
}

type SuppliedEntry = {
  pre?: number;
  peak: number;
  delta: number;
  peakTime?: number;
};

function classifySuppliedDelta(delta: number): FoodItem["level"] {
  if (delta <= 3.2) return "low";
  if (delta <= 4.9) return "medium";
  return "high";
}

function avg(values: number[]) {
  return Number((values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)).toFixed(1));
}

function suppliedFood(id: string, name: string, entries: SuppliedEntry[], note: string, imageTone: string): FoodItem {
  const records = entries.map((entry, index) => {
    const before = entry.pre ?? Number((entry.peak - entry.delta).toFixed(1));
    return {
      id: `${id}-r${index + 1}`,
      user: "匿名同事",
      note,
      shared: true,
      anonymous: true,
      before,
      after1h: entry.peak,
      after2h: Number((before + entry.delta).toFixed(1)),
      delta: entry.delta,
      peakTime: entry.peakTime,
      portion: "正常" as const,
      extraRice: false,
      sugaryDrink: false,
      exercised: false,
      createdAt: new Date(now.getTime() - (index + 1) * 5400_000).toISOString()
    };
  });
  const delta = avg(records.map((entry) => entry.delta));
  return {
    id,
    name,
    imageTone,
    level: classifySuppliedDelta(delta),
    before: avg(records.map((entry) => entry.before)),
    after1h: avg(records.map((entry) => entry.after1h)),
    after2h: avg(records.map((entry) => entry.after2h)),
    delta,
    sampleCount: records.length,
    note,
    records
  };
}

const restaurantOverrides: Record<string, { foods: FoodItem[] }> = {
  kendeji: {
    foods: [
      suppliedFood("kfc-orleans-burger", "奥尔良鸡腿堡", [
        { pre: 5.7, peak: 7.7, delta: 2.4, peakTime: 76 },
        { pre: 4.6, peak: 8.6, delta: 4.7, peakTime: 115 },
        { pre: 8.0, peak: 7.6, delta: 1.8, peakTime: 62 },
        { pre: 4.6, peak: 7.3, delta: 2.5, peakTime: 41 },
        { pre: 5.9, peak: 8.5, delta: 4.7, peakTime: 67 },
        { pre: 6.3, peak: 7.7, delta: 2.8, peakTime: 111 },
        { pre: 5.5, peak: 6.2, delta: 2.3, peakTime: 122 },
        { pre: 5.4, peak: 8.2, delta: 3.1, peakTime: 79 },
        { pre: 5.5, peak: 8.4, delta: 2.8, peakTime: 65 }
      ], "坂田基地 H 区同食测试", "#d65f46")
    ]
  },
  guangwei: {
    foods: [
      suppliedFood("gw-chicken-noodle", "鸡汤面", [
        { pre: 5.3, peak: 6.8, delta: 2.3 },
        { pre: 5.4, peak: 6.5, delta: 2.1 },
        { pre: 5.4, peak: 8.1, delta: 2.7 },
        { pre: 4.1, peak: 6.1, delta: 2.2 },
        { pre: 4.5, peak: 8.2, delta: 3.0 },
        { pre: 6.1, peak: 8.2, delta: 2.8 },
        { pre: 5.3, peak: 7.6, delta: 3.6 },
        { pre: 5.0, peak: 9.3, delta: 4.5 },
        { pre: 5.9, peak: 10.1, delta: 4.8 }
      ], "原复正公，同食测试", "#c58256")
    ]
  },
  xiaowan: {
    foods: [
      suppliedFood("xw-chicken-rice", "白切鸡+黑椒鸡扒+白米饭", [{ peak: 7.9, delta: 2.5 }], "蒸菜套餐记录", "#e9c66a"),
      suppliedFood("xw-tofu-egg", "豆腐肉末+鸡蛋+豆腐皮", [{ peak: 7.2, delta: 2.2 }], "少油蛋白组合", "#8ec4a1"),
      suppliedFood("xw-guoba", "锅巴肉套餐", [{ peak: 7.8, delta: 1.8 }], "主食波动较稳", "#d29c55")
    ]
  },
  afu: {
    foods: [
      suppliedFood("af-goose-rice", "烧鹅饭", [{ peak: 8.4, delta: 3.1 }], "烧腊饭记录", "#bb7352"),
      suppliedFood("af-duck-rice", "烧鸭饭", [{ peak: 10.8, delta: 5.3 }], "米饭和酱汁影响明显", "#c95548"),
      suppliedFood("af-pork-rice", "烧肉饭", [{ peak: 9.8, delta: 4.5 }], "肥肉配饭中等偏高", "#d58a53")
    ]
  },
  guandong: {
    foods: [
      suppliedFood("gd-beef-cucumber-rice", "牛肉+拍黄瓜+米饭", [{ peak: 10.6, delta: 4.1 }], "加米饭后中等偏高", "#8ea6be"),
      suppliedFood("gd-pork-set", "炒肉套餐", [{ peak: 10.1, delta: 4.9 }], "套餐记录", "#bf8a55"),
      suppliedFood("gd-fried-rice", "炒饭套餐", [{ peak: 10.2, delta: 5.9 }], "炒饭升糖明显", "#c95c4c")
    ]
  },
  dongxu: {
    foods: [
      suppliedFood("dx-fried-chicken", "炸鸡套餐", [{ peak: 10.4, delta: 5.0 }], "套餐主食偏高", "#c95c4c"),
      suppliedFood("dx-home-pork", "家常炒肉套餐", [{ peak: 9.7, delta: 4.6 }], "家常套餐中等偏高", "#d5914f"),
      suppliedFood("dx-pork-set", "炒肉套餐", [{ peak: 9.2, delta: 4.1 }], "米饭量影响明显", "#d99a4d")
    ]
  }
};

const baseStalls: Stall[] = [
  {
    id: "laowanhui",
    name: "老碗会",
    category: "面档",
    position: [-9.4, 0.35, -5.25],
    size: [3.2, 0.7, 1.3],
    rotation: 0,
    signColor: "#f8fafc",
    foods: [
      food("lw-biang", "油泼扯面", "high", 5.7, 9.8, 9.2, 18, "面量大，建议少面多菜", "#f97316"),
      food("lw-saozi", "臊子面", "medium", 5.6, 8.1, 7.5, 14, "汤面升糖中等", "#fb923c"),
      food("lw-cold", "凉皮", "high", 5.4, 9.5, 8.9, 11, "加辣油后饱腹感一般", "#ef4444")
    ]
  },
  {
    id: "hengyang",
    name: "衡阳鱼粉",
    category: "粉档",
    position: [-4.3, 0.35, -5.25],
    size: [3.2, 0.7, 1.3],
    rotation: 0,
    signColor: "#f8fafc",
    foods: [
      food("hy-fish", "原汤鱼粉", "medium", 5.5, 8.0, 7.4, 20, "粉量正常时波动中等", "#38bdf8"),
      food("hy-less", "少粉鱼片粉", "low", 5.6, 7.0, 6.8, 12, "少粉更稳", "#22c55e"),
      food("hy-spicy", "麻辣鱼粉", "medium", 5.8, 8.3, 7.8, 9, "重口味易多喝汤", "#f59e0b")
    ]
  },
  {
    id: "xiangyu",
    name: "湘遇湖南衡东土菜馆子",
    category: "湘菜",
    position: [3.75, 0.35, -5.25],
    size: [5.6, 0.7, 1.3],
    rotation: 0,
    signColor: "#f8fafc",
    foods: [
      food("xy-chicken", "辣椒炒鸡", "low", 5.7, 7.1, 6.7, 16, "不加饭较稳定", "#16a34a"),
      food("xy-pork", "小炒肉盖饭", "high", 5.4, 9.2, 8.8, 22, "盖饭米饭量偏多", "#dc2626"),
      food("xy-eggplant", "茄子豆角", "medium", 5.8, 8.0, 7.7, 10, "油量偏高但升糖中等", "#a855f7")
    ]
  },
  {
    id: "kejia",
    name: "客家腌面",
    category: "面档",
    position: [-11.1, 0.35, -1.85],
    size: [1.75, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("kj-yanmian", "客家腌面", "high", 5.6, 9.6, 9.0, 19, "油面升糖明显", "#f97316"),
      food("kj-soup", "三及第汤", "low", 5.5, 6.5, 6.3, 8, "单点汤较稳", "#22c55e"),
      food("kj-combo", "腌面配汤", "medium", 5.8, 8.5, 7.9, 7, "面量减半更合适", "#facc15")
    ]
  },
  {
    id: "xianxiang",
    name: "鲜湘下饭菜",
    category: "下饭菜",
    position: [-8.55, 0.35, -1.85],
    size: [1.75, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("xx-beef", "小炒黄牛肉", "low", 5.4, 6.9, 6.6, 15, "配半份饭比较稳", "#ef4444"),
      food("xx-tofu", "家常豆腐", "medium", 5.6, 7.8, 7.3, 13, "酱汁偏多", "#f59e0b"),
      food("xx-rice", "下饭菜双拼", "high", 5.5, 9.0, 8.6, 16, "容易加饭", "#dc2626")
    ]
  },
  {
    id: "deyou",
    name: "德优选品",
    category: "轻食/便利",
    position: [-5.95, 0.35, -1.85],
    size: [1.9, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("dy-salad", "鸡胸肉沙拉", "low", 5.6, 6.8, 6.5, 23, "低升糖选择", "#22c55e"),
      food("dy-yogurt", "无糖酸奶杯", "low", 5.5, 6.4, 6.2, 17, "适合加餐", "#38bdf8"),
      food("dy-roll", "全麦卷饼", "medium", 5.7, 7.9, 7.4, 12, "酱料影响波动", "#84cc16")
    ]
  },
  {
    id: "yipin",
    name: "壹品炖",
    category: "炖汤",
    position: [-3.15, 0.35, -1.85],
    size: [1.9, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("yp-soup", "虫草花炖鸡汤", "low", 5.6, 6.7, 6.4, 13, "单汤稳定", "#fbbf24"),
      food("yp-rice", "炖汤套餐", "medium", 5.5, 7.9, 7.4, 11, "米饭量决定波动", "#f59e0b"),
      food("yp-pork", "莲藕排骨汤", "low", 5.7, 6.9, 6.6, 9, "建议少米饭", "#f97316")
    ]
  },
  {
    id: "banfan",
    name: "拌饭屋",
    category: "拌饭",
    position: [-0.55, 0.35, -1.85],
    size: [1.8, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("bf-bibim", "石锅拌饭", "high", 5.6, 9.1, 8.7, 21, "米饭和甜辣酱叠加", "#ef4444"),
      food("bf-less", "少饭牛肉拌饭", "medium", 5.8, 8.0, 7.5, 14, "少饭后改善", "#f59e0b"),
      food("bf-veg", "蔬菜拌饭", "medium", 5.5, 7.7, 7.2, 10, "配菜多更稳", "#22c55e")
    ]
  },
  {
    id: "afu",
    name: "阿福烧腊",
    category: "烧腊",
    position: [2.05, 0.35, -1.85],
    size: [1.8, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("af-duck", "烧鸭饭", "medium", 5.7, 8.0, 7.6, 19, "烧腊汁偏甜", "#b45309"),
      food("af-pork", "叉烧饭", "high", 5.5, 9.2, 8.8, 18, "叉烧酱影响明显", "#dc2626"),
      food("af-chicken", "白切鸡半饭", "low", 5.6, 7.1, 6.8, 12, "半饭更稳", "#f59e0b")
    ]
  },
  {
    id: "sanjisuan1",
    name: "三及第酸汤肥牛",
    category: "酸汤肥牛",
    position: [4.75, 0.35, -1.85],
    size: [1.95, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("sj-beef", "酸汤肥牛", "low", 5.8, 7.0, 6.7, 15, "不喝甜饮较稳", "#fbbf24"),
      food("sj-rice", "肥牛盖饭", "high", 5.6, 9.0, 8.4, 14, "盖饭波动大", "#ef4444"),
      food("sj-noodle", "酸汤肥牛粉", "medium", 5.7, 8.1, 7.6, 10, "粉量正常中等", "#f97316")
    ]
  },
  {
    id: "sanjisuan2",
    name: "三及第酸汤肥牛",
    category: "酸汤肥牛",
    position: [7.25, 0.35, -1.85],
    size: [1.95, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("sj2-beef", "番茄肥牛汤", "low", 5.5, 6.9, 6.6, 7, "样本还少", "#f87171"),
      food("sj2-rice", "肥牛米线", "medium", 5.8, 8.2, 7.8, 6, "需要更多记录", "#facc15"),
      food("sj2-double", "双拼肥牛饭", "high", 5.6, 9.2, 8.9, 5, "米饭偏多", "#ef4444")
    ]
  },
  {
    id: "changlai",
    name: "尝来尝往",
    category: "家常菜",
    position: [9.85, 0.35, -1.85],
    size: [1.85, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("cl-fish", "清蒸鱼套餐", "low", 5.6, 6.9, 6.6, 12, "鱼和青菜较稳", "#38bdf8"),
      food("cl-pork", "红烧肉饭", "high", 5.5, 9.3, 8.9, 15, "甜口酱汁明显", "#ef4444"),
      food("cl-veg", "两荤一素", "medium", 5.8, 8.0, 7.4, 11, "看主食份量", "#22c55e")
    ]
  },
  {
    id: "kendeji",
    name: "肯德基",
    category: "快餐",
    position: [-11.15, 0.35, 2.2],
    size: [1.8, 0.7, 2.1],
    rotation: Math.PI / 2,
    signColor: "#ffffff",
    foods: [
      food("kfc-burger", "香辣鸡腿堡", "medium", 5.5, 8.2, 7.8, 17, "面包带来中等波动", "#ef4444"),
      food("kfc-rice", "鸡腿饭", "high", 5.7, 9.4, 8.9, 13, "米饭和酱汁叠加", "#f59e0b"),
      food("kfc-salad", "玉米沙拉", "medium", 5.4, 7.7, 7.2, 6, "样本偏少", "#fde68a")
    ]
  },
  {
    id: "guandong",
    name: "关东灶",
    category: "热卤",
    position: [-8.25, 0.35, 2.15],
    size: [1.8, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("gd-oden", "关东煮", "low", 5.6, 6.8, 6.5, 19, "少蘸料很稳", "#60a5fa"),
      food("gd-radish", "萝卜魔芋组合", "low", 5.4, 6.2, 6.0, 15, "低碳选择", "#22c55e"),
      food("gd-noodle", "乌冬面", "medium", 5.7, 8.0, 7.5, 8, "主食增加后中等", "#f59e0b")
    ]
  },
  {
    id: "xiaowan",
    name: "小碗蒸鲜",
    category: "蒸菜",
    position: [-5.65, 0.35, 2.15],
    size: [1.85, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("xw-fish", "清蒸鱼块", "low", 5.7, 6.9, 6.6, 15, "蒸菜少油稳定", "#38bdf8"),
      food("xw-egg", "水蒸蛋套餐", "medium", 5.5, 7.8, 7.2, 11, "套餐米饭影响", "#facc15"),
      food("xw-pork", "粉蒸肉", "high", 5.6, 9.0, 8.5, 9, "糯米粉升糖明显", "#ef4444")
    ]
  },
  {
    id: "xianchao",
    name: "鲜炒小碗菜",
    category: "小碗菜",
    position: [-3.05, 0.35, 2.15],
    size: [1.85, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("xc-veg", "西兰花牛肉", "low", 5.6, 6.9, 6.5, 16, "蔬菜比例高", "#22c55e"),
      food("xc-potato", "土豆鸡块", "medium", 5.5, 8.2, 7.7, 18, "土豆影响中等", "#f59e0b"),
      food("xc-rice", "小碗菜双拼饭", "high", 5.7, 9.1, 8.6, 12, "双拼容易配满饭", "#ef4444")
    ]
  },
  {
    id: "gaifan",
    name: "盖浇饭",
    category: "盖饭",
    position: [-0.75, 0.35, 2.15],
    size: [1.2, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("gf-tomato", "番茄鸡蛋盖饭", "high", 5.5, 9.0, 8.6, 20, "米饭份量偏大", "#f97316"),
      food("gf-curry", "咖喱鸡盖饭", "high", 5.6, 9.4, 9.0, 16, "咖喱和米饭叠加", "#facc15"),
      food("gf-less", "半饭盖浇", "medium", 5.8, 8.0, 7.5, 8, "半饭后中等", "#22c55e")
    ]
  },
  {
    id: "haoyi",
    name: "好怡",
    category: "饮品",
    position: [1.25, 0.35, 2.15],
    size: [1.2, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("hy-tea0", "无糖茶", "low", 5.5, 5.9, 5.8, 18, "无糖饮品稳定", "#38bdf8"),
      food("hy-latte", "拿铁少糖", "medium", 5.6, 7.3, 7.0, 10, "奶和糖带来波动", "#a78bfa"),
      food("hy-milk", "甜牛奶", "high", 5.4, 8.7, 8.3, 8, "含糖明显", "#f9a8d4")
    ]
  },
  {
    id: "wanhe",
    name: "万和潮记",
    category: "潮汕",
    position: [3.25, 0.35, 2.15],
    size: [1.25, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("wh-beef", "牛肉丸汤", "low", 5.5, 6.6, 6.3, 14, "汤类较稳", "#38bdf8"),
      food("wh-kway", "牛肉粿条", "medium", 5.6, 8.2, 7.7, 16, "粿条正常中等", "#f59e0b"),
      food("wh-rice", "潮汕卤鹅饭", "high", 5.7, 9.1, 8.7, 9, "卤汁和米饭明显", "#ef4444")
    ]
  },
  {
    id: "japanese",
    name: "日式牛肉盖饭",
    category: "日式盖饭",
    position: [5.55, 0.35, 2.15],
    size: [1.75, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("jp-gyudon", "牛肉盖饭", "high", 5.6, 9.2, 8.8, 21, "甜口汁和米饭明显", "#dc2626"),
      food("jp-half", "半饭牛肉碗", "medium", 5.8, 8.0, 7.6, 15, "半饭后改善", "#f59e0b"),
      food("jp-soup", "味噌汤配温泉蛋", "low", 5.5, 6.4, 6.2, 9, "低升糖小食", "#fbbf24")
    ]
  },
  {
    id: "chongqing",
    name: "重庆小面",
    category: "面档",
    position: [8.0, 0.35, 2.15],
    size: [1.55, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("cq-noodle", "重庆小面", "high", 5.5, 9.4, 8.9, 20, "面量正常偏高", "#ef4444"),
      food("cq-less", "少面多青菜", "medium", 5.7, 7.9, 7.4, 12, "少面后中等", "#22c55e"),
      food("cq-beef", "牛肉小面", "high", 5.6, 9.1, 8.6, 14, "汤面加肉仍偏高", "#f97316")
    ]
  },
  {
    id: "zhiqiu",
    name: "扒知味",
    category: "扒饭",
    position: [10.25, 0.35, 2.15],
    size: [1.55, 0.7, 1.2],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("zq-steak", "黑椒牛扒饭", "high", 5.7, 9.3, 8.8, 17, "黑椒汁偏甜", "#78350f"),
      food("zq-chicken", "香煎鸡扒半饭", "medium", 5.6, 7.9, 7.4, 11, "半饭中等", "#f59e0b"),
      food("zq-veg", "鸡扒沙拉", "low", 5.5, 6.8, 6.5, 6, "样本偏少但表现稳", "#22c55e")
    ]
  },
  {
    id: "dongxu",
    name: "东旭",
    category: "大餐线",
    position: [-4.0, 0.35, 4.85],
    size: [5.7, 0.7, 1.25],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("dx-fish", "清蒸鱼套餐", "low", 5.6, 6.9, 6.5, 12, "蛋白质主菜较稳", "#38bdf8"),
      food("dx-pork", "红烧排骨饭", "high", 5.5, 9.0, 8.6, 14, "米饭和酱汁偏高", "#ef4444"),
      food("dx-veg", "青菜豆腐套餐", "low", 5.7, 6.8, 6.4, 9, "低升糖", "#22c55e")
    ]
  },
  {
    id: "guangwei",
    name: "广味三宝",
    category: "粤式",
    position: [4.85, 0.35, 4.85],
    size: [6.7, 0.7, 1.25],
    rotation: 0,
    signColor: "#ffffff",
    foods: [
      food("gw-three", "三宝饭", "high", 5.6, 9.3, 8.9, 26, "烧腊汁和米饭明显", "#dc2626"),
      food("gw-duck", "烧鸭半饭", "medium", 5.8, 8.0, 7.5, 17, "半饭中等", "#f59e0b"),
      food("gw-veg", "白灼菜心加鸡", "low", 5.5, 6.7, 6.4, 10, "低升糖组合", "#22c55e")
    ]
  }
];

export const initialStalls: Stall[] = baseStalls.map((stall) => {
  const override = restaurantOverrides[stall.id];
  return override ? { ...stall, ...override } : { ...stall, foods: [] };
});
