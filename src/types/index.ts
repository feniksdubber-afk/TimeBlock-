export enum Category {
  Ish = "Ish",
  Sport = "Sport",
  Oqish = "Oqish",
  DamOlish = "DamOlish",
  Ovqat = "Ovqat",
  Oila = "Oila",
  Muhim = "Muhim",
  Shaxsiy = "Shaxsiy",
  Boshqa = "Boshqa",
}

export enum RepeatType {
  HarKuni = "HarKuni",
  HarHafta = "HarHafta",
  IshKunlari = "IshKunlari",
  DamOlishKunlari = "DamOlishKunlari",
  HarOy = "HarOy",
  HarYil = "HarYil",
}

export interface BlockShape {
  cols: number;
  rows: number;
}

export interface Block {
  id: string;
  emoji: string;
  name: string;
  category: Category;
  color: string;
  durationSlots: number;
  startSlot: number;
  shape: BlockShape;
  repeat: RepeatType;
}

export interface TimeSlot {
  index: number;
  hour: number;
  minute: number;
  isOccupied: boolean;
  blockId?: string;
}
