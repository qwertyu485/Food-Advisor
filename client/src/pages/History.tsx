import { useState, useEffect } from "react";
import { Header, PageTitle } from "@/components/Header";
import { History as HistoryIcon, Calculator, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

// Interface for search history items stored in localStorage
interface SearchHistoryItem {
  foodName: string;
  timestamp: string;
}

// Interface for all 6 core nutrients tracked by the calculator
// Matches the NutrientValues interface in Calculator.tsx
interface NutrientValues {
  calories: number;      // Energy (kcal)
  protein: number;       // Protein (g)
  fat: number;           // Total lipid/fat (g)
  carbs: number;         // Carbohydrate, by difference (g)
  sugar: number;         // Total Sugars (g)
  fiber: number;         // Fiber, total dietary (g)
}

// Interface for calculator history entries stored in localStorage
// Updated to include all nutrients for each item
interface CalculatorHistoryItem {
  items: { 
    foodName: string; 
    grams: number; 
    // Legacy support: calories field for backward compatibility
    calories?: number;
    // New format: full nutrients object
    nutrients?: NutrientValues;
  }[];
  // Legacy support: totalCalories for backward compatibility
  totalCalories?: number;
  // New format: full nutrients totals
  totalNutrients?: NutrientValues;
  timestamp: string;
}

// Interface for USDA API nutrient data
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

// Interface for inline result data displayed under history items
interface InlineResultData {
  foodName: string;
  description: string;
  brandName?: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  sugar: number | null;
  fiber: number | null;
  loading?: boolean;
  error?: string;
}

// NutrientPill component - Displays a single nutrient value in pill style
// This matches the styling used on the Home page and Calculator page for consistency
function NutrientPill({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div
      style={{
        minWidth: '100px',
        padding: '5px 8px',
        borderRadius: '999px',
        background: '#F5F5F5',
        fontSize: '12px',
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

// ========================================
// HELPER FUNCTION: Extract nutrient value from USDA food data
// The USDA API returns nutrients in a foodNutrients array
// This function searches for a specific nutrient by name
// ========================================
function getNutrient(food: USDAFood, name: string): number | null {
  if (!food.foodNutrients) return null;
  const n = food.foodNutrients.find(item => item.nutrientName === name);
  return n ? n.value : null;
}

export default function History() {
  const [, setLocation] = useLocation();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [calculatorHistory, setCalculatorHistory] = useState<CalculatorHistoryItem[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ========================================
  // STATE FOR ACCORDION FUNCTIONALITY
  // expandedItems: Set of indices of currently expanded history items
  // cachedResults: Map of food names to their fetched results (to avoid re-fetching)
  // loadingItems: Set of indices currently being loaded
  // ========================================
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [cachedResults, setCachedResults] = useState<Map<string, InlineResultData>>(new Map());
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Check login state with localStorage
    // This determines if the user can view the search history and calculator history
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
      // Show login modal if user is not logged in
      setShowLoginModal(true);
    } else {
      // Load search history from localStorage
      // Data is rendered from localStorage when user is logged in
      const savedSearchHistory = localStorage.getItem("searchHistory");
      if (savedSearchHistory) {
        try {
          setSearchHistory(JSON.parse(savedSearchHistory));
        } catch (e) {
          console.error("Error parsing search history:", e);
        }
      }

      // Load calculator history from localStorage
      // Data is rendered from localStorage when user is logged in
      const savedCalculatorHistory = localStorage.getItem("calculatorHistory");
      if (savedCalculatorHistory) {
        try {
          setCalculatorHistory(JSON.parse(savedCalculatorHistory));
        } catch (e) {
          console.error("Error parsing calculator history:", e);
        }
      }
    }
  }, []);

  // Close the login modal without redirecting
  // Simply hides the modal and keeps user on the history page
  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  // Redirect to login page (called from modal's Log In button)
  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    setLocation("/");
  };

  // ========================================
  // CLICK HANDLER FOR HISTORY ITEMS (ACCORDION BEHAVIOR)
  // This handler is called when a user clicks on a search history item.
  // Instead of redirecting to Home, it toggles the inline result card.
  // - First click: fetch data (if not cached) and expand
  // - Subsequent clicks: toggle visibility without re-fetching
  // NOTE: This does NOT add to search history - it's just viewing past searches
  // ========================================
  const handleHistoryItemClick = async (foodName: string, index: number) => {
    // Check if this item is already expanded
    const isCurrentlyExpanded = expandedItems.has(index);

    if (isCurrentlyExpanded) {
      // If expanded, collapse it (toggle off)
      const newExpanded = new Set(expandedItems);
      newExpanded.delete(index);
      setExpandedItems(newExpanded);
      return;
    }

    // If not expanded, we need to expand it
    // First, check if we already have cached results for this food
    if (cachedResults.has(foodName)) {
      // Use cached data - just expand the item
      const newExpanded = new Set(expandedItems);
      newExpanded.add(index);
      setExpandedItems(newExpanded);
      return;
    }

    // No cached data - need to fetch from USDA API
    // Mark this item as loading
    const newLoading = new Set(loadingItems);
    newLoading.add(index);
    setLoadingItems(newLoading);

    // Expand the item to show loading state
    const newExpanded = new Set(expandedItems);
    newExpanded.add(index);
    setExpandedItems(newExpanded);

    // ========================================
    // USDA API CALL
    // Uses the same backend API endpoint as the Home page
    // This keeps the USDA API key secure on the server
    // ========================================
    try {
      const url = `/api/foods/search?q=${encodeURIComponent(foodName)}`;
      const res = await fetch(url);
      const data = await res.json();

      let foods: USDAFood[] = data.foods || [];

      // Filter to get most relevant result (matching the search term)
      const lowerQ = foodName.toLowerCase();
      const filtered = foods.filter((f: USDAFood) =>
        f.description && f.description.toLowerCase().includes(lowerQ)
      );

      // Take the first relevant result, or first result if no matches
      const food = filtered.length > 0 ? filtered[0] : (foods.length > 0 ? foods[0] : null);

      // ========================================
      // BUILD INLINE RESULT DATA
      // Extract all 6 core nutrients from the USDA response
      // These are the same nutrients displayed on Home page
      // ========================================
      let resultData: InlineResultData;

      if (food) {
        resultData = {
          foodName: foodName,
          description: food.description || foodName,
          brandName: food.brandName,
          // Extract each nutrient using the USDA nutrient names
          calories: getNutrient(food, "Energy"),           // kcal
          protein: getNutrient(food, "Protein"),           // g
          fat: getNutrient(food, "Total lipid (fat)"),     // g
          carbs: getNutrient(food, "Carbohydrate, by difference"), // g
          sugar: getNutrient(food, "Total Sugars"),        // g
          fiber: getNutrient(food, "Fiber, total dietary"), // g
        };
      } else {
        // No results found
        resultData = {
          foodName: foodName,
          description: foodName,
          calories: null,
          protein: null,
          fat: null,
          carbs: null,
          sugar: null,
          fiber: null,
          error: "No results found for this food item.",
        };
      }

      // Cache the result for future use
      const newCache = new Map(cachedResults);
      newCache.set(foodName, resultData);
      setCachedResults(newCache);

    } catch (err) {
      console.error("Error fetching food data:", err);
      
      // Cache the error state
      const newCache = new Map(cachedResults);
      newCache.set(foodName, {
        foodName: foodName,
        description: foodName,
        calories: null,
        protein: null,
        fat: null,
        carbs: null,
        sugar: null,
        fiber: null,
        error: "Failed to fetch food data. Please try again.",
      });
      setCachedResults(newCache);
    } finally {
      // Remove loading state
      const newLoading = new Set(loadingItems);
      newLoading.delete(index);
      setLoadingItems(newLoading);
    }
  };

  // Helper function to get calories from history item (supports both old and new format)
  const getItemCalories = (food: { calories?: number; nutrients?: NutrientValues }): number => {
    if (food.nutrients) {
      return food.nutrients.calories;
    }
    return food.calories || 0;
  };

  // Helper function to get total calories (supports both old and new format)
  const getTotalCalories = (entry: CalculatorHistoryItem): number => {
    if (entry.totalNutrients) {
      return entry.totalNutrients.calories;
    }
    return entry.totalCalories || 0;
  };

  // ========================================
  // INLINE RESULT CARD COMPONENT
  // Renders the nutrition details under an expanded history item
  // Uses the same NutrientPill styling as Home page for consistency
  // Shows loading state when data is being fetched
  // ========================================
  const renderInlineResultCard = (foodName: string, index: number) => {
    const isExpanded = expandedItems.has(index);
    const isLoading = loadingItems.has(index);
    const resultData = cachedResults.get(foodName);

    // Don't render if not expanded
    if (!isExpanded) return null;

    // Determine if we should show loading state:
    // - Either loadingItems contains this index
    // - Or we're expanded but don't have cached data yet (first render before state updates)
    const showLoading = isLoading || !resultData;

    return (
      <div
        data-testid={`history-result-details-${index}`}
        className="history-result-details"
        style={{
          marginLeft: '20px',
          marginRight: '20px',
          marginBottom: '12px',
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          animation: 'slideDown 0.2s ease-out',
        }}
      >
        {showLoading ? (
          // Loading state - shown when fetching data or no cached result yet
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666' }}>
            <Loader2 className="animate-spin" size={20} />
            <span>Loading nutrition information...</span>
          </div>
        ) : resultData?.error ? (
          // Error state
          <div style={{ color: '#dc2626', fontSize: '14px' }}>
            {resultData.error}
          </div>
        ) : resultData ? (
          // ========================================
          // RENDER INLINE RESULT CARD WITH NUTRIENTS
          // Shows the food description and all 6 nutrient pills
          // Styled consistently with Home page search results
          // ========================================
          <>
            {/* Food name/description header */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
                {resultData.description}
              </div>
              {resultData.brandName && (
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  {resultData.brandName}
                </div>
              )}
            </div>

            {/* Nutrient pills row - displays all 6 nutrients in pill style */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <NutrientPill label="Calories" value={resultData.calories} unit="kcal" />
              <NutrientPill label="Protein" value={resultData.protein} unit="g" />
              <NutrientPill label="Fat" value={resultData.fat} unit="g" />
              <NutrientPill label="Carbs" value={resultData.carbs} unit="g" />
              <NutrientPill label="Sugar" value={resultData.sugar} unit="g" />
              <NutrientPill label="Fiber" value={resultData.fiber} unit="g" />
            </div>
          </>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F5' }}>
      <Header />
      <PageTitle title="FUNCTION / Search History" />

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
          {/* Login check before showing content */}
          {/* Both history sections are only displayed when user is logged in */}
          {isLoggedIn ? (
            <>
              {/* Search History Section */}
              <div
                data-testid="section-search-history"
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '24px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  marginBottom: '24px',
                }}
              >
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <HistoryIcon size={28} />
                  Your Search History
                </h2>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                  Click on any item to view its nutrition information
                </p>
                
                {searchHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                    <HistoryIcon size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <p style={{ fontSize: '18px', fontWeight: 500 }}>No search history yet.</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>Start searching for foods on the Home page!</p>
                  </div>
                ) : (
                  // ========================================
                  // SEARCH HISTORY LIST WITH ACCORDION BEHAVIOR
                  // Each item is clickable to expand/collapse inline results
                  // Clicking does NOT redirect to Home or add to history
                  // ========================================
                  <div style={{ margin: 0 }}>
                    {searchHistory.map((item, index) => {
                      const isExpanded = expandedItems.has(index);
                      const isLoading = loadingItems.has(index);

                      return (
                        <div key={index}>
                          {/* ========================================
                              HISTORY ITEM ROW (CLICKABLE)
                              Click handler toggles the inline result card
                              Shows chevron icon to indicate expand/collapse state
                              ======================================== */}
                          <div
                            data-testid={`history-item-${index}`}
                            onClick={() => handleHistoryItemClick(item.foodName, index)}
                            style={{
                              padding: '16px 20px',
                              borderBottom: !isExpanded && index < searchHistory.length - 1 ? '1px solid #eee' : 'none',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: isExpanded ? '#f0f7ff' : (index % 2 === 0 ? '#fafafa' : '#ffffff'),
                              borderRadius: index === 0 ? '8px 8px 0 0' : 
                                           (index === searchHistory.length - 1 && !isExpanded) ? '0 0 8px 8px' : '0',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease',
                            }}
                            onMouseOver={(e) => {
                              if (!isExpanded) {
                                e.currentTarget.style.backgroundColor = '#e8f4ff';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!isExpanded) {
                                e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fafafa' : '#ffffff';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {/* Expand/collapse indicator */}
                              {isLoading ? (
                                <Loader2 className="animate-spin" size={18} style={{ color: '#666' }} />
                              ) : isExpanded ? (
                                <ChevronUp size={18} style={{ color: '#666' }} />
                              ) : (
                                <ChevronDown size={18} style={{ color: '#666' }} />
                              )}
                              <span style={{ fontWeight: 600, color: '#F46A27', fontSize: '16px' }}>
                                {item.foodName}
                              </span>
                            </div>
                            <span style={{ fontSize: '13px', color: '#888' }}>{item.timestamp}</span>
                          </div>

                          {/* ========================================
                              INLINE RESULT CARD (ACCORDION CONTENT)
                              Rendered directly under the clicked row
                              Shows food description and nutrient pills
                              ======================================== */}
                          {renderInlineResultCard(item.foodName, index)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Meal Calculator History Section */}
              <div
                data-testid="section-calculator-history"
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '24px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
              >
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calculator size={28} />
                  Meal Calculator History
                </h2>
                
                {calculatorHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                    <Calculator size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <p style={{ fontSize: '18px', fontWeight: 500 }}>No meal calculations yet.</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>Use the Calculator to calculate meal nutrition!</p>
                  </div>
                ) : (
                  // Data is rendered from localStorage - calculator history items
                  // Items are displayed in reverse chronological order (newest first)
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {calculatorHistory.map((entry, index) => (
                      <li
                        key={index}
                        data-testid={`calculator-history-item-${index}`}
                        style={{
                          padding: '20px',
                          borderBottom: index < calculatorHistory.length - 1 ? '1px solid #eee' : 'none',
                          backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff',
                          borderRadius: index === 0 ? '8px 8px 0 0' : index === calculatorHistory.length - 1 ? '0 0 8px 8px' : '0',
                        }}
                      >
                        {/* Header row with timestamp */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '12px',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}>
                          <span style={{ 
                            fontWeight: 700, 
                            color: '#333', 
                            fontSize: '16px',
                          }}>
                            Meal Calculation
                          </span>
                          <span style={{ 
                            fontSize: '13px', 
                            color: '#888',
                          }}>
                            {entry.timestamp}
                          </span>
                        </div>
                        
                        {/* Food items list with nutrients */}
                        <div style={{ marginBottom: '16px' }}>
                          {entry.items.map((food, foodIndex) => (
                            <div
                              key={foodIndex}
                              data-testid={`calculator-history-food-${index}-${foodIndex}`}
                              style={{
                                padding: '12px',
                                marginBottom: '8px',
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid #eee',
                              }}
                            >
                              {/* Food name and amount */}
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'baseline',
                                marginBottom: '8px',
                                flexWrap: 'wrap',
                                gap: '8px',
                              }}>
                                <span style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>
                                  {food.foodName}
                                </span>
                                <span style={{ fontSize: '13px', color: '#666' }}>
                                  {food.grams}g
                                </span>
                              </div>
                              
                              {/* Nutrient pills - display all nutrients if available, otherwise just calories */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {food.nutrients ? (
                                  // New format with full nutrients
                                  <>
                                    <NutrientPill label="Cal" value={food.nutrients.calories} unit="kcal" />
                                    <NutrientPill label="Protein" value={food.nutrients.protein} unit="g" />
                                    <NutrientPill label="Fat" value={food.nutrients.fat} unit="g" />
                                    <NutrientPill label="Carbs" value={food.nutrients.carbs} unit="g" />
                                    <NutrientPill label="Sugar" value={food.nutrients.sugar} unit="g" />
                                    <NutrientPill label="Fiber" value={food.nutrients.fiber} unit="g" />
                                  </>
                                ) : (
                                  // Legacy format with only calories
                                  <NutrientPill label="Calories" value={getItemCalories(food)} unit="kcal" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Total nutrition summary */}
                        <div
                          data-testid={`calculator-history-total-${index}`}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: '#f0fdf4',
                            borderRadius: '8px',
                            border: '1px solid #bbf7d0',
                          }}
                        >
                          <div style={{ 
                            fontWeight: 700, 
                            color: '#166534', 
                            marginBottom: '10px',
                            fontSize: '14px',
                          }}>
                            Total Nutrition
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {entry.totalNutrients ? (
                              // New format with full nutrients
                              <>
                                <div
                                  style={{
                                    minWidth: '110px',
                                    padding: '6px 10px',
                                    borderRadius: '999px',
                                    background: '#F46A27',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontWeight: 600,
                                  }}
                                >
                                  <span>Calories</span>
                                  <span style={{ marginLeft: '6px' }}>{entry.totalNutrients.calories} kcal</span>
                                </div>
                                <div
                                  style={{
                                    minWidth: '100px',
                                    padding: '6px 10px',
                                    borderRadius: '999px',
                                    background: '#166534',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontWeight: 600,
                                  }}
                                >
                                  <span>Protein</span>
                                  <span style={{ marginLeft: '6px' }}>{entry.totalNutrients.protein} g</span>
                                </div>
                                <div
                                  style={{
                                    minWidth: '90px',
                                    padding: '6px 10px',
                                    borderRadius: '999px',
                                    background: '#166534',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontWeight: 600,
                                  }}
                                >
                                  <span>Fat</span>
                                  <span style={{ marginLeft: '6px' }}>{entry.totalNutrients.fat} g</span>
                                </div>
                                <div
                                  style={{
                                    minWidth: '90px',
                                    padding: '6px 10px',
                                    borderRadius: '999px',
                                    background: '#166534',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontWeight: 600,
                                  }}
                                >
                                  <span>Carbs</span>
                                  <span style={{ marginLeft: '6px' }}>{entry.totalNutrients.carbs} g</span>
                                </div>
                                <div
                                  style={{
                                    minWidth: '90px',
                                    padding: '6px 10px',
                                    borderRadius: '999px',
                                    background: '#166534',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontWeight: 600,
                                  }}
                                >
                                  <span>Sugar</span>
                                  <span style={{ marginLeft: '6px' }}>{entry.totalNutrients.sugar} g</span>
                                </div>
                                <div
                                  style={{
                                    minWidth: '90px',
                                    padding: '6px 10px',
                                    borderRadius: '999px',
                                    background: '#166534',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontWeight: 600,
                                  }}
                                >
                                  <span>Fiber</span>
                                  <span style={{ marginLeft: '6px' }}>{entry.totalNutrients.fiber} g</span>
                                </div>
                              </>
                            ) : (
                              // Legacy format with only calories
                              <div
                                style={{
                                  minWidth: '130px',
                                  padding: '8px 12px',
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
                                <span>Total Calories</span>
                                <span style={{ marginLeft: '8px' }}>{getTotalCalories(entry)} kcal</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
              <p>Please log in to view your history.</p>
            </div>
          )}
        </div>
      </main>

      {/* CSS for modal and accordion animations */}
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
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
