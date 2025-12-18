import { useState, useEffect, useRef } from "react";
import { Header, PageTitle } from "@/components/Header";
import { Loader2, History, Calculator, X, ArrowRight } from "lucide-react";
import { useLocation, useSearch } from "wouter";

interface FoodNutrient {
  nutrientName: string;
  value: number;
}

interface USDAFood {
  description: string;
  brandName?: string;
  householdServingFullText?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: FoodNutrient[];
}

interface SearchHistoryItem {
  foodName: string;
  timestamp: string;
}

function getNutrient(food: USDAFood, name: string): number | null {
  if (!food.foodNutrients) return null;
  const n = food.foodNutrients.find(item => item.nutrientName === name);
  return n ? n.value : null;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<USDAFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Track if we've already processed URL query to prevent duplicate searches
  const hasProcessedUrlQuery = useRef(false);

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check if user is logged in using localStorage
  // This function checks the 'isLoggedIn' key in localStorage to determine login state
  const checkLoginState = (): boolean => {
    return localStorage.getItem("isLoggedIn") === "true";
  };

  // Show login modal for non-logged-in users
  const showLoginRequiredModal = () => {
    setShowLoginModal(true);
  };

  // Close the login modal without redirecting
  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  // Redirect to login page (called from modal's Log In button)
  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    setLocation("/");
  };

  // Save search to history in localStorage
  const saveToHistory = (foodName: string) => {
    const newItem: SearchHistoryItem = {
      foodName,
      timestamp: new Date().toLocaleString(),
    };
    
    const currentHistory = localStorage.getItem("searchHistory");
    let history: SearchHistoryItem[] = [];
    
    if (currentHistory) {
      try {
        history = JSON.parse(currentHistory);
      } catch (e) {
        console.error("Error parsing history:", e);
      }
    }
    
    // Add new item at the beginning (newest first)
    history.unshift(newItem);
    
    // Keep only last 20 items
    history = history.slice(0, 20);
    
    localStorage.setItem("searchHistory", JSON.stringify(history));
  };

  // Perform the actual search with a given search term
  // This function is used by both the SEARCH button and URL auto-search
  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return;
    }

    setLoading(true);
    setSearched(true);
    setResults([]);

    // Use backend API to keep USDA API key secure
    const url = `/api/foods/search?q=${encodeURIComponent(searchTerm)}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      
      let foods: USDAFood[] = data.foods || [];
      
      const lowerQ = searchTerm.toLowerCase();
      foods = foods.filter((f: USDAFood) =>
        f.description && f.description.toLowerCase().includes(lowerQ)
      );

      if (foods.length === 0) {
        foods = (data.foods || []).slice(0, 5);
      } else {
        foods = foods.slice(0, 5);
      }

      setResults(foods);
      
      // Save successful search to history
      if (foods.length > 0) {
        saveToHistory(searchTerm);
      }
    } catch (err) {
      console.error("API Error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search button click - uses the current query state
  const handleSearch = () => {
    if (!query.trim()) {
      alert("Please enter a food item!");
      return;
    }
    performSearch(query);
  };

  // Handle View History button click - requires login
  // Check login state and redirect to history page or show login modal
  const handleViewHistory = () => {
    // Login check with localStorage
    if (checkLoginState()) {
      // Redirect to history.html (history page) if logged in
      setLocation("/history");
    } else {
      // Show login modal if not logged in
      showLoginRequiredModal();
    }
  };

  // Handle Go to Calculator button click - requires login
  // Check login state and redirect to calculator page or show login modal
  const handleGoToCalculator = () => {
    // Login check with localStorage
    if (checkLoginState()) {
      // Redirect to calculator.html (calculator page) if logged in
      setLocation("/calculator");
    } else {
      // Show login modal if not logged in
      showLoginRequiredModal();
    }
  };

  // Read query parameter from URL on page load
  // If a query parameter exists (e.g., from clicking a history item),
  // auto-fill the search input and trigger the search
  useEffect(() => {
    // Read the query parameter from the URL using URLSearchParams
    const params = new URLSearchParams(searchString);
    const urlQuery = params.get("query");

    // If a query exists in URL and we haven't processed it yet
    if (urlQuery && !hasProcessedUrlQuery.current) {
      hasProcessedUrlQuery.current = true;
      
      // Fill the search input with the query value
      setQuery(urlQuery);
      
      // Automatically trigger the search function
      // We need to call the search with the URL query directly
      // since the state update is async
      performSearch(urlQuery);
    }
  }, [searchString]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F5' }}>
      <Header />
      <PageTitle title="HOME" />

      {/* Login Required Modal - shown when non-logged-in user tries to access login-required features */}
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
        <div style={{ maxWidth: '1024px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          <section 
            className="relative flex items-center justify-center"
            style={{
              backgroundImage: 'url("/background.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '560px',
            }}
          >
            <div className="relative z-10 w-11/12 text-center" style={{ color: '#EFFFFF' }}>
              <h2 style={{ fontSize: '42px', fontWeight: 700, marginBottom: '12px' }}>Food Advisor</h2>
              <p style={{ fontSize: '22px', fontWeight: 500, marginBottom: '56px' }}>Find nutrition information instantly</p>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', marginBottom: '40px', fontSize: '20px', fontWeight: 700 }}>
                <span>ENTER FOOD ITEM</span>
                <input
                  data-testid="input-food-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. banana"
                  style={{
                    width: '360px',
                    padding: '14px 16px',
                    backgroundColor: '#E3E3E3',
                    border: 'none',
                    fontSize: '16px',
                    color: '#333',
                  }}
                />
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  data-testid="button-search"
                  onClick={handleSearch}
                  disabled={loading}
                  style={{
                    padding: '14px 40px',
                    backgroundColor: '#F46A27',
                    color: '#ffffff',
                    border: '3px solid #FF9A5A',
                    borderRadius: '4px',
                    fontSize: '20px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ff7a3a')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#F46A27')}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'SEARCH'}
                </button>
                
                <button
                  data-testid="button-view-history"
                  onClick={handleViewHistory}
                  style={{
                    padding: '14px 30px',
                    backgroundColor: '#78A892',
                    color: '#ffffff',
                    border: '3px solid #9BC4B4',
                    borderRadius: '4px',
                    fontSize: '18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#6a9a84')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#78A892')}
                >
                  <History size={20} />
                  View History
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Search Results Section */}
        <div style={{ maxWidth: '1024px', margin: '30px auto 0 auto', padding: '0 16px 40px 16px' }}>
          {searched && (
            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>
              Search Results
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Loading...
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No results found.
            </div>
          )}

          {!loading && results.map((food, index) => {
            const name = food.description || "Unknown item";
            const brand = food.brandName || "";
            const servingText =
              food.householdServingFullText ||
              (food.servingSize && food.servingSizeUnit
                ? `${food.servingSize} ${food.servingSizeUnit}`
                : "Serving size: N/A");

            const calories = getNutrient(food, "Energy");
            const protein = getNutrient(food, "Protein");
            const fat = getNutrient(food, "Total lipid (fat)");
            const carbs = getNutrient(food, "Carbohydrate, by difference");
            const sugar = getNutrient(food, "Total Sugars");
            const fiber = getNutrient(food, "Fiber, total dietary");

            return (
              <div
                key={index}
                data-testid={`card-food-${index}`}
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  marginBottom: '12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{name}</div>
                  {brand && <div style={{ fontSize: '13px', color: '#666' }}>{brand}</div>}
                </div>
                <div style={{ fontSize: '14px', color: '#444', marginBottom: '10px' }}>{servingText}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <NutrientPill label="Calories" value={calories} unit="kcal" />
                  <NutrientPill label="Protein" value={protein} unit="g" />
                  <NutrientPill label="Fat" value={fat} unit="g" />
                  <NutrientPill label="Carbs" value={carbs} unit="g" />
                  <NutrientPill label="Sugar" value={sugar} unit="g" />
                  <NutrientPill label="Fiber" value={fiber} unit="g" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Meal Calorie Calculator Section - Redirects to Calculator Page */}
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 16px 60px 16px' }}>
          <div
            data-testid="section-meal-calculator-promo"
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calculator size={24} />
              Meal Calorie Calculator
            </h3>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '15px', lineHeight: 1.6 }}>
              Plan your meals by calculating the total calories. Add multiple food items with their amounts 
              and get an accurate calorie count for your entire meal.
            </p>
            
            <button
              data-testid="button-go-to-calculator"
              onClick={handleGoToCalculator}
              style={{
                padding: '14px 28px',
                backgroundColor: '#F46A27',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ff7a3a')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#F46A27')}
            >
              Go to Calculator
              <ArrowRight size={18} />
            </button>
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
