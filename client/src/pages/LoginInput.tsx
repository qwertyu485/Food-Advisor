import { useState } from "react";
import { Header, PageTitle } from "@/components/Header";
import { useLocation } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function LoginInput() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarning("");
    setLoading(true);

    if (!email || !password) {
      setWarning("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setWarning(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem("loggedInEmail", data.user.email);
      if (data.user.favoriteFood) {
        localStorage.setItem("favoriteFood", data.user.favoriteFood);
      } else {
        localStorage.removeItem("favoriteFood");
      }
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userId", data.user.id);
      setLoading(false);
      setLocation("/home");
    } catch (error) {
      setWarning("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <PageTitle title="User Log In" />

      <main className="flex flex-col md:flex-row min-h-[calc(100vh-130px)]">
        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
          <img src="/LoginBackground.jpg" alt="Background" className="w-full h-full object-cover" />
        </div>

        <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col justify-center bg-white">
          <form onSubmit={handleSubmit} className="max-w-md w-full mx-auto space-y-8">
            
            <div className="space-y-2">
              <label className="block text-xl font-bold text-foreground" htmlFor="email">
                Enter Your Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-muted border-none rounded-md focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xl font-bold text-foreground" htmlFor="password">
                Enter Your Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 bg-muted border-none rounded-md focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 w-full sm:w-auto px-10 py-3 bg-[#F46A27] hover:bg-[#e05a1d] text-white font-bold text-lg rounded shadow-md transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>

            {warning && (
              <div 
                data-testid="login-warning"
                className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md"
              >
                <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                <p className="text-amber-700 font-medium">{warning}</p>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
