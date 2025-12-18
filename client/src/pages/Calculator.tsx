import { useState, useEffect } from "react";
import { Header, PageTitle } from "@/components/Header";
import { Loader2, Plus, Trash2, Calculator as CalculatorIcon, X } from "lucide-react";
import { useLocation } from "wouter";

// Interface for individual nutrient data from USDA API
interface FoodNutrient {
  nutrientName: string;
  value: number;
}

// Interface for USDA API food response
interface USDAFood {
  description: string;
  brandName?: string;
  foodNutrients?: FoodNutrient[];
}

// Interface for meal items entered by user
interface MealItem {
  id: number;
  foodName: string;
  amountGrams: string;
}

// Interface for all 6 core nutrients we track
// These are the key nutritional values extracted from USDA API
interface NutrientValues {
  calories: number;      // Energy (kcal)
  protein: number;       // Protein (g)
  fat: number;           // Total lipid/fat (g)
  carbs: number;         // Carbohydrate, by difference (g)
  sugar: number;         // Total Sugars (g)
  fiber: number;         // Fiber, total dietary (g)
}

// Interface for calculated food item with all nutrients
interface CalculatedItem {
  foodName: string;
  amountGrams: number;
  // Nutrient values per 100g from USDA API
  nutrientsPer100g: NutrientValues;
  // Computed nutrient values based on user-entered grams
  // Formula: nutrientForItem = nutrientPer100g * (amountInGrams / 100)
  computedNutrients: NutrientValues;
}

// Interface for calculator history entries stored in localStorage
// Updated to include all nutrients for each item
interface CalculatorHistoryItem {
  items: {
    foodName: string;
    grams: number;
    nutrients: NutrientValues;
  }[];
  totalNutrients: NutrientValues;
  timestamp: string;
}

// Helper function to extract a specific nutrient value from USDA food data
// The USDA API returns nutrients in a foodNutrients array with nutrientName and value
// This function searches that array for the specified nutrient name
function getNutrient(food: USDAFood, name: string): number | null {
  if (!food.foodNutrients) return null;
  const n = food.foodNutrients.find(item => item.nutrientName === name);
  return n ? n.value : null;
}

// NutrientPill component - Displays a single nutrient value in pill style
// This matches the styling used on the Home page for consistency
function NutrientPill({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div
      style={{
        minWidth: '110px',
        padding: '6px 10px',
        borderRadius: '999px',
        background: '#F5F5F5',
        fontSize: '13px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ marginLeft: '6px' }}>{value != null ? `${value} ${unit}` : 'N/A'}</span>
    </div>
  );
}

export default function Calculator() {
  const [, setLocation] = useLocation();
  
  // Meal calculator state
  const [mealItems, setMealItems] = useState<MealItem[]>([{ id: 1, foodName: "", amountGrams: "" }]);
  const [calculatedResults, setCalculatedResults] = useState<CalculatedItem[]>([]);
  // Total nutrients accumulated across all food items
  const [totalNutrients, setTotalNutrients] = useState<NutrientValues | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check login state with localStorage on page load
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  // Close the login modal without redirecting
  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  // Redirect to login page (called from modal's Log In button)
  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    setLocation("/");
  };

  // Add another meal item row
  const addMealItem = () => {
    const newId = Math.max(...mealItems.map(item => item.id)) + 1;
    setMealItems([...mealItems, { id: newId, foodName: "", amountGrams: "" }]);
  };

  // Remove a meal item row
  const removeMealItem = (id: number) => {
    if (mealItems.length > 1) {
      setMealItems(mealItems.filter(item => item.id !== id));
    }
  };

  // Update a meal item
  const updateMealItem = (id: number, field: "foodName" | "amountGrams", value: string) => {
    setMealItems(mealItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Save calculation to localStorage (only if logged in)
  // This function saves the calculation history with all nutrients to localStorage
  const saveCalculationToHistory = (results: CalculatedItem[], totals: NutrientValues) => {
    // Login check before saving to history
    // Only save if user is logged in
    if (!isLoggedIn) return;

    // Format the timestamp as YYYY/MM/DD HH:mm:ss
    const now = new Date();
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Create the history entry with items, all nutrients, and timestamp
    const historyEntry: CalculatorHistoryItem = {
      items: results.map(item => ({
        foodName: item.foodName,
        grams: item.amountGrams,
        nutrients: item.computedNutrients,
      })),
      totalNutrients: totals,
      timestamp,
    };

    // Load existing history from localStorage
    const existingHistory = localStorage.getItem("calculatorHistory");
    let history: CalculatorHistoryItem[] = [];

    if (existingHistory) {
      try {
        history = JSON.parse(existingHistory);
      } catch (e) {
        console.error("Error parsing calculator history:", e);
      }
    }

    // Add new entry at the beginning (newest first)
    history.unshift(historyEntry);

    // Keep only last 20 entries
    history = history.slice(0, 20);

    // Save updated history back to localStorage
    localStorage.setItem("calculatorHistory", JSON.stringify(history));
  };

  // Calculate all nutrients for the meal - requires login
  const handleCalculateNutrients = async () => {
    // Login check with localStorage
    // Check if user is logged in before calculating
    if (!isLoggedIn) {
      // Show login modal instead of redirecting immediately
      setShowLoginModal(true);
      return;
    }

    // Validate inputs
    const validItems = mealItems.filter(item => 
      item.foodName.trim() && item.amountGrams.trim() && !isNaN(parseFloat(item.amountGrams))
    );

    if (validItems.length === 0) {
      alert("Please enter at least one food item with a valid amount in grams.");
      return;
    }

    setCalculating(true);
    setCalculatedResults([]);
    setTotalNutrients(null);

    try {
      const results: CalculatedItem[] = [];
      
      // Accumulator for total nutrients across all items
      // Initialize all nutrient totals to zero
      const nutrientTotals: NutrientValues = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        sugar: 0,
        fiber: 0,
      };
      
      // Process each food item - uses backend API to keep USDA key secure
      for (const item of validItems) {
        const url = `/api/foods/search?q=${encodeURIComponent(item.foodName)}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        let foods: USDAFood[] = data.foods || [];
        
        // Filter to get most relevant result
        const lowerQ = item.foodName.toLowerCase();
        const filtered = foods.filter((f: USDAFood) =>
          f.description && f.description.toLowerCase().includes(lowerQ)
        );
        
        const food = filtered.length > 0 ? filtered[0] : (foods.length > 0 ? foods[0] : null);
        
        if (food) {
          // ========================================
          // NUTRIENT EXTRACTION FROM USDA API
          // Each nutrient is retrieved using its exact USDA API name
          // ========================================
          
          // Extract "Energy" value (kcal) per 100g - this is the calorie content
          const caloriesPer100g = getNutrient(food, "Energy") || 0;
          
          // Extract "Protein" value (g) per 100g
          const proteinPer100g = getNutrient(food, "Protein") || 0;
          
          // Extract "Total lipid (fat)" value (g) per 100g - this is the fat content
          const fatPer100g = getNutrient(food, "Total lipid (fat)") || 0;
          
          // Extract "Carbohydrate, by difference" value (g) per 100g
          const carbsPer100g = getNutrient(food, "Carbohydrate, by difference") || 0;
          
          // Extract "Total Sugars" value (g) per 100g
          const sugarPer100g = getNutrient(food, "Total Sugars") || 0;
          
          // Extract "Fiber, total dietary" value (g) per 100g
          const fiberPer100g = getNutrient(food, "Fiber, total dietary") || 0;

          // Store all nutrient values per 100g
          const nutrientsPer100g: NutrientValues = {
            calories: caloriesPer100g,
            protein: proteinPer100g,
            fat: fatPer100g,
            carbs: carbsPer100g,
            sugar: sugarPer100g,
            fiber: fiberPer100g,
          };

          // ========================================
          // PER-ITEM NUTRIENT CONVERSION
          // Convert nutrients from per-100g to user's entered amount
          // Formula: nutrientForItem = nutrientPer100g * (amountInGrams / 100)
          // ========================================
          const amountGrams = parseFloat(item.amountGrams);
          const conversionFactor = amountGrams / 100;

          const computedNutrients: NutrientValues = {
            calories: Math.round(caloriesPer100g * conversionFactor * 10) / 10,
            protein: Math.round(proteinPer100g * conversionFactor * 10) / 10,
            fat: Math.round(fatPer100g * conversionFactor * 10) / 10,
            carbs: Math.round(carbsPer100g * conversionFactor * 10) / 10,
            sugar: Math.round(sugarPer100g * conversionFactor * 10) / 10,
            fiber: Math.round(fiberPer100g * conversionFactor * 10) / 10,
          };

          // ========================================
          // ACCUMULATE TOTALS
          // Add this item's computed nutrients to the running totals
          // ========================================
          nutrientTotals.calories += computedNutrients.calories;
          nutrientTotals.protein += computedNutrients.protein;
          nutrientTotals.fat += computedNutrients.fat;
          nutrientTotals.carbs += computedNutrients.carbs;
          nutrientTotals.sugar += computedNutrients.sugar;
          nutrientTotals.fiber += computedNutrients.fiber;
          
          results.push({
            foodName: food.description || item.foodName,
            amountGrams,
            nutrientsPer100g,
            computedNutrients,
          });
        } else {
          // Food not found - add with zero nutrients
          const zeroNutrients: NutrientValues = {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
            sugar: 0,
            fiber: 0,
          };
          
          results.push({
            foodName: item.foodName + " (not found)",
            amountGrams: parseFloat(item.amountGrams),
            nutrientsPer100g: zeroNutrients,
            computedNutrients: zeroNutrients,
          });
        }
      }
      
      // ========================================
      // FINALIZE TOTALS
      // Round all accumulated totals to 1 decimal place
      // ========================================
      const roundedTotals: NutrientValues = {
        calories: Math.round(nutrientTotals.calories * 10) / 10,
        protein: Math.round(nutrientTotals.protein * 10) / 10,
        fat: Math.round(nutrientTotals.fat * 10) / 10,
        carbs: Math.round(nutrientTotals.carbs * 10) / 10,
        sugar: Math.round(nutrientTotals.sugar * 10) / 10,
        fiber: Math.round(nutrientTotals.fiber * 10) / 10,
      };
      
      setCalculatedResults(results);
      setTotalNutrients(roundedTotals);

      // Save calculation to history in localStorage (only if logged in)
      // This saves the completed calculation with all nutrients for viewing on the History page
      saveCalculationToHistory(results, roundedTotals);
    } catch (err) {
      console.error("Calculation Error:", err);
      alert("Error calculating nutrients. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F5' }}>
      <Header />
      <PageTitle title="FUNCTION / Calculator" />

      {/* Login Required Modal */}
      {showLoginModal && (
        <div
          data-testid="modal-login-required"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLoginModal();
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <button
              data-testid="button-modal-close"
              onClick={closeLoginModal}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: '#666',
              }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#333' }}>
              More features available!
            </h2>
            
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '28px', lineHeight: 1.5 }}>
              To use this feature, please Log In first.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                data-testid="button-modal-cancel"
                onClick={closeLoginModal}
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              >
                Cancel
              </button>
              
              <button
                data-testid="button-modal-login"
                onClick={handleLoginRedirect}
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#F46A27',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ff7a3a')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#F46A27')}
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <div style={{ maxWidth: '1024px', margin: '30px auto', padding: '0 16px 60px 16px' }}>
          <div
            data-testid="section-meal-calculator"
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CalculatorIcon size={28} />
              Meal Nutrition Calculator
            </h2>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '15px' }}>
              Add foods and their amounts to calculate total nutrition for your meal.
              {!isLoggedIn && <span style={{ color: '#F46A27', fontWeight: 600 }}> (Login Required to Calculate)</span>}
            </p>

            {/* Meal Items Table */}
            <div style={{ marginBottom: '20px' }}>
              {mealItems.map((item, index) => (
                <div
                  key={item.id}
                  data-testid={`meal-item-row-${index}`}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <input
                    data-testid={`input-meal-food-${index}`}
                    type="text"
                    placeholder="Food name (e.g. banana)"
                    value={item.foodName}
                    onChange={(e) => updateMealItem(item.id, "foodName", e.target.value)}
                    style={{
                      flex: '0 1 60%',
                      minWidth: '180px',
                      padding: '12px 14px',
                      backgroundColor: '#F5F5F5',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '15px',
                    }}
                  />
                  <input
                    data-testid={`input-meal-amount-${index}`}
                    type="number"
                    placeholder="Amount (grams)"
                    value={item.amountGrams}
                    onChange={(e) => updateMealItem(item.id, "amountGrams", e.target.value)}
                    style={{
                      flex: '0 1 35%',
                      minWidth: '160px',
                      padding: '12px 14px',
                      backgroundColor: '#F5F5F5',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '15px',
                    }}
                  />
                  {mealItems.length > 1 && (
                    <button
                      data-testid={`button-remove-meal-item-${index}`}
                      onClick={() => removeMealItem(item.id)}
                      style={{
                        padding: '10px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button
                data-testid="button-add-meal-item"
                onClick={addMealItem}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#78A892',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#6a9a84')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#78A892')}
              >
                <Plus size={18} />
                Add another item
              </button>
              
              <button
                data-testid="button-calculate-nutrients"
                onClick={handleCalculateNutrients}
                disabled={calculating}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#F46A27',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ff7a3a')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#F46A27')}
              >
                {calculating ? <Loader2 className="animate-spin" size={18} /> : <CalculatorIcon size={18} />}
                Calculate Nutrition
              </button>
            </div>

            {/* Calculation Results */}
            {calculating && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <Loader2 className="animate-spin inline-block" size={24} />
                <p style={{ marginTop: '10px' }}>Calculating nutrition...</p>
              </div>
            )}

            {/* ========================================
                ITEMIZED RESULTS SECTION
                Display each food item with its computed nutrients
                using the NutrientPill component for consistent styling
                ======================================== */}
            {!calculating && totalNutrients !== null && (
              <div
                data-testid="section-calculation-results"
                style={{
                  background: '#f0fdf4',
                  borderRadius: '10px',
                  padding: '20px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#166534' }}>
                  Nutrition Results
                </h4>
                
                {/* Itemized list of food items with nutrients */}
                <div style={{ marginBottom: '20px' }}>
                  {calculatedResults.map((item, index) => (
                    <div
                      key={index}
                      data-testid={`result-item-${index}`}
                      style={{
                        padding: '16px',
                        marginBottom: index < calculatedResults.length - 1 ? '12px' : '0',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #dcfce7',
                      }}
                    >
                      {/* Food name and amount header */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'baseline',
                        marginBottom: '12px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}>
                        <span style={{ fontWeight: 600, fontSize: '16px', color: '#333' }}>
                          {item.foodName}
                        </span>
                        <span style={{ color: '#666', fontSize: '14px' }}>
                          {item.amountGrams}g
                        </span>
                      </div>
                      
                      {/* Nutrient pills row - displays all 6 nutrients with computed values */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <NutrientPill label="Calories" value={item.computedNutrients.calories} unit="kcal" />
                        <NutrientPill label="Protein" value={item.computedNutrients.protein} unit="g" />
                        <NutrientPill label="Fat" value={item.computedNutrients.fat} unit="g" />
                        <NutrientPill label="Carbs" value={item.computedNutrients.carbs} unit="g" />
                        <NutrientPill label="Sugar" value={item.computedNutrients.sugar} unit="g" />
                        <NutrientPill label="Fiber" value={item.computedNutrients.fiber} unit="g" />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* ========================================
                    TOTAL NUTRITION SUMMARY
                    Shows summed nutrients across all food items
                    Displayed with emphasis styling to stand out
                    ======================================== */}
                <div
                  data-testid="section-total-nutrition"
                  style={{
                    padding: '20px',
                    backgroundColor: '#dcfce7',
                    borderRadius: '8px',
                  }}
                >
                  <h5 style={{ 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    marginBottom: '16px', 
                    color: '#166534',
                    textAlign: 'center',
                  }}>
                    Total Nutrition Summary
                  </h5>
                  
                  {/* Total nutrient pills - accumulated values from all items */}
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '10px',
                    justifyContent: 'center',
                  }}>
                    {/* Total Calories - highlighted with orange background */}
                    <div
                      data-testid="text-total-calories"
                      style={{
                        minWidth: '130px',
                        padding: '10px 14px',
                        borderRadius: '999px',
                        background: '#F46A27',
                        color: '#ffffff',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 600,
                      }}
                    >
                      <span>Calories</span>
                      <span style={{ marginLeft: '8px' }}>{totalNutrients.calories} kcal</span>
                    </div>
                    
                    {/* Other total nutrients with green theme */}
                    <div
                      data-testid="text-total-protein"
                      style={{
                        minWidth: '120px',
                        padding: '10px 14px',
                        borderRadius: '999px',
                        background: '#166534',
                        color: '#ffffff',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 600,
                      }}
                    >
                      <span>Protein</span>
                      <span style={{ marginLeft: '8px' }}>{totalNutrients.protein} g</span>
                    </div>
                    
                    <div
                      data-testid="text-total-fat"
                      style={{
                        minWidth: '110px',
                        padding: '10px 14px',
                        borderRadius: '999px',
                        background: '#166534',
                        color: '#ffffff',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 600,
                      }}
                    >
                      <span>Fat</span>
                      <span style={{ marginLeft: '8px' }}>{totalNutrients.fat} g</span>
                    </div>
                    
                    <div
                      data-testid="text-total-carbs"
                      style={{
                        minWidth: '110px',
                        padding: '10px 14px',
                        borderRadius: '999px',
                        background: '#166534',
                        color: '#ffffff',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 600,
                      }}
                    >
                      <span>Carbs</span>
                      <span style={{ marginLeft: '8px' }}>{totalNutrients.carbs} g</span>
                    </div>
                    
                    <div
                      data-testid="text-total-sugar"
                      style={{
                        minWidth: '110px',
                        padding: '10px 14px',
                        borderRadius: '999px',
                        background: '#166534',
                        color: '#ffffff',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 600,
                      }}
                    >
                      <span>Sugar</span>
                      <span style={{ marginLeft: '8px' }}>{totalNutrients.sugar} g</span>
                    </div>
                    
                    <div
                      data-testid="text-total-fiber"
                      style={{
                        minWidth: '110px',
                        padding: '10px 14px',
                        borderRadius: '999px',
                        background: '#166534',
                        color: '#ffffff',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 600,
                      }}
                    >
                      <span>Fiber</span>
                      <span style={{ marginLeft: '8px' }}>{totalNutrients.fiber} g</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CSS for modal animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
