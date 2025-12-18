import { useState } from "react";
import { Header, PageTitle } from "@/components/Header";
import { useLocation } from "wouter";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "warning"; text: string } | null>(null);
  const [, setLocation] = useLocation();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setMessage({ type: "warning", text: data.error || "Signup failed. Please try again." });
        setLoading(false);
        return;
      }
      
      setLoading(false);
      setMessage({ type: "success", text: "Account created successfully! Redirecting to login..." });
      setTimeout(() => {
        setLocation("/login-input");
      }, 1500);
    } catch (error) {
      setMessage({ type: "warning", text: "Network error. Please try again." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <PageTitle title="JOIN US" />

      <main className="flex flex-col md:flex-row min-h-[calc(100vh-130px)]">
        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
          <img src="/LoginBackground.jpg" alt="Background" className="w-full h-full object-cover" />
        </div>

        <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col justify-center bg-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-10 text-foreground">Create Your Account</h1>

          <form onSubmit={handleSignup} className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-2">
              <label className="block text-xl font-bold text-foreground" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-muted border-none rounded-md focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xl font-bold text-foreground" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 bg-muted border-none rounded-md focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Enter password"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-lg shadow-md transition-all transform active:scale-95 disabled:opacity-70"
            >
              {loading ? "Creating Account..." : "Join Now"}
            </button>

            {message && (
              <div 
                data-testid="signup-message"
                className={`flex items-center gap-2 p-3 rounded-md ${
                  message.type === "success" 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-amber-50 border border-amber-200"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                )}
                <p className={`font-medium ${
                  message.type === "success" ? "text-green-700" : "text-amber-700"
                }`}>{message.text}</p>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
