export interface FoodItem {
  description: string;
  brandOwner: string;
  calories?: {
    value: number;
    unit: string;
  };
}

const MOCK_DB: Record<string, FoodItem[]> = {
  apple: [
    { description: "Apple, raw", brandOwner: "USDA", calories: { value: 52, unit: "KCAL" } },
    { description: "Apple juice", brandOwner: "Tropicana", calories: { value: 46, unit: "KCAL" } },
  ],
  banana: [
    { description: "Banana, raw", brandOwner: "USDA", calories: { value: 89, unit: "KCAL" } },
    { description: "Banana chips", brandOwner: "Whole Foods", calories: { value: 519, unit: "KCAL" } },
  ],
  chicken: [
    { description: "Chicken breast, roasted", brandOwner: "USDA", calories: { value: 165, unit: "KCAL" } },
    { description: "Chicken nuggets", brandOwner: "Tyson", calories: { value: 296, unit: "KCAL" } },
  ],
  milk: [
    { description: "Milk, whole", brandOwner: "USDA", calories: { value: 61, unit: "KCAL" } },
    { description: "Almond Milk", brandOwner: "Silk", calories: { value: 13, unit: "KCAL" } },
  ],
};

export async function searchFood(query: string): Promise<FoodItem | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const key = query.toLowerCase();
  const results = Object.keys(MOCK_DB).find(k => key.includes(k));
  
  if (results) {
    return MOCK_DB[results][0];
  }
  
  // Fallback random result if not found but something was typed
  if (query.length > 2) {
    return {
      description: `${query} (Generic)`,
      brandOwner: "USDA Estimate",
      calories: { value: Math.floor(Math.random() * 500), unit: "KCAL" }
    };
  }
  
  return null;
}

export async function searchRecommendations(query: string): Promise<FoodItem[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  const key = query.toLowerCase();
  const results = Object.keys(MOCK_DB).find(k => key.includes(k));
  
  if (results) {
    return MOCK_DB[results];
  }
  
  return [
    { description: "Mixed Salad", brandOwner: "Fresh Express", calories: { value: 20, unit: "KCAL" } },
    { description: "Greek Yogurt", brandOwner: "Chobani", calories: { value: 59, unit: "KCAL" } },
    { description: "Oatmeal", brandOwner: "Quaker", calories: { value: 68, unit: "KCAL" } },
  ];
}
