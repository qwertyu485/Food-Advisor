import { useEffect, useState } from "react";
import { Header, PageTitle } from "@/components/Header";
import { searchRecommendations, type FoodItem } from "@/lib/mockApi";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Recommend() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<string | null>(null);
  const [fav, setFav] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("loggedInEmail");
    const favorite = localStorage.getItem("favoriteFood") || "apple";
    
    setUser(email);
    setFav(favorite);

    if (email) {
      searchRecommendations(favorite).then(data => {
        setItems(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <PageTitle title="Access Denied" />
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">You need to be logged in.</h2>
          <Link href="/" className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity cursor-pointer inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <PageTitle title="Your Food Recommendations" />

      <main className="flex-1 container mx-auto px-6 py-12 max-w-5xl">
        <div className="mb-10">
          <h2 className="text-2xl text-foreground">
            Hi <span className="font-bold text-primary">{user}</span>, here are some items related to your favorite food: <span className="italic font-semibold">"{fav}"</span>
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading recommendations...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-bold mb-2 text-foreground">{item.description}</h3>
                <div className="text-sm text-muted-foreground mb-4">Brand: {item.brandOwner || "N/A"}</div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {item.calories ? `${item.calories.value} ${item.calories.unit}` : "N/A"}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="text-center text-muted-foreground">No recommendations found.</div>
        )}
      </main>
    </div>
  );
}
