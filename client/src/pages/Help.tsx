import { useState } from "react";
import { Header, PageTitle } from "@/components/Header";

export default function Help() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/help-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send message");
        return;
      }

      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <PageTitle title="Help Page" />

      <main className="flex-1 container mx-auto px-6 py-12 max-w-4xl">
        
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">How to use FoodAdvisor</h2>
          <ul className="list-disc pl-6 space-y-3 text-lg text-muted-foreground">
            <li><strong className="text-foreground">Go to the Home page</strong> and find the search bar to begin.</li>
            <li><strong className="text-foreground">Enter a food name</strong> such as apple, rice, milk, chicken, banana.</li>
            <li><strong className="text-foreground">Click "Search"</strong> to fetch nutrition data from the USDA API.</li>
            <li><strong className="text-foreground">View nutrition results</strong> including calories, protein, carbs, vitamins, and more.</li>
            <li><strong className="text-foreground">Check dietary advice</strong> shown below your nutrition results.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-2">Contact us</h2>
          <p className="text-muted-foreground italic mb-8">Have a question? Fill out the form below.</p>

          <form onSubmit={handleSend} className="bg-card p-8 rounded-xl shadow-sm border border-border">
            {error && (
              <div 
                data-testid="help-form-error"
                className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg"
              >
                {error}
              </div>
            )}

            {sent && (
              <div 
                data-testid="help-form-success"
                className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg"
              >
                Message sent successfully! We'll get back to you soon.
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <input 
                data-testid="input-help-name"
                type="text" 
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-muted border border-transparent focus:border-primary rounded outline-none transition-colors"
              />
              <input 
                data-testid="input-help-email"
                type="email" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-muted border border-transparent focus:border-primary rounded outline-none transition-colors"
              />
            </div>
            
            <textarea 
              data-testid="input-help-message"
              placeholder="Message" 
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 bg-muted border border-transparent focus:border-primary rounded outline-none transition-colors mb-6 resize-none"
            ></textarea>

            <div className="flex justify-end">
              <button 
                data-testid="button-help-submit"
                type="submit"
                disabled={sending}
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : sent ? "Sent!" : "Send"}
              </button>
            </div>
          </form>
        </section>

      </main>
    </div>
  );
}
