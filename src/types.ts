export interface Ingredient {
  name: string;
  description: string;
  chineseName?: string;
  layerIndex: number; // 0 is bottom (finished dish), higher is further up
}

export interface DeconstructionResult {
  dishName: string;
  dishDescription: string;
  ingredients: Ingredient[];
  generatedImageUrl?: string;
}
