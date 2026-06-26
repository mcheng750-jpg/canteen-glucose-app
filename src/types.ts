export type GlucoseLevel = "low" | "medium" | "high" | "insufficient";

export type Portion = "少量" | "正常" | "加量";

export type FoodRecord = {
  id: string;
  user: string;
  note: string;
  shared: boolean;
  anonymous: boolean;
  before: number;
  after1h: number;
  after2h: number;
  delta: number;
  peakTime?: number;
  portion: Portion;
  extraRice: boolean;
  sugaryDrink: boolean;
  exercised: boolean;
  createdAt: string;
};

export type FoodItem = {
  id: string;
  name: string;
  imageTone: string;
  level: GlucoseLevel;
  before: number;
  after1h: number;
  after2h: number;
  delta: number;
  sampleCount: number;
  note: string;
  records: FoodRecord[];
};

export type Stall = {
  id: string;
  name: string;
  category: string;
  position: [number, number, number];
  size: [number, number, number];
  rotation: number;
  signColor: string;
  foods: FoodItem[];
};

export type NewRecordInput = {
  foodName: string;
  before: number;
  after1h: number;
  after2h: number;
  portion: Portion;
  extraRice: boolean;
  sugaryDrink: boolean;
  exercised: boolean;
  note: string;
  shared: boolean;
};
