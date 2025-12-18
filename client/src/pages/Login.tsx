import { Header, PageTitle } from "@/components/Header";
import { Link } from "wouter";

export default function LoginLanding() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <PageTitle title="Log In" />

      <main className="flex flex-col md:flex-row min-h-[calc(100vh-130px)]">
        {/* Left Image */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden">
          <img 
            src="/LoginBackground.jpg" 
            alt="Fresh ingredients" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent md:hidden"></div>
        </div>

        {/* Right Content */}
        <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col justify-center bg-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-foreground">Are you a User?</h1>

          <div className="space-y-12">
            {/* Login Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-2xl font-bold text-primary">
                <span className="text-4xl leading-none">•</span>
                <span>User log in:</span>
              </div>
              
              <Link href="/login-input">
                <div className="ml-8 inline-block cursor-pointer hover:opacity-90 transition-opacity transform hover:scale-105 duration-300">
                  <img src="/Loginbutton.jpg" alt="Login Button" className="w-48 rounded-lg shadow-lg" />
                </div>
              </Link>
            </div>

            {/* Join Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-2xl font-bold text-primary">
                <span className="text-4xl leading-none">•</span>
                <span>Not yet a member?</span>
              </div>
              
              <div className="ml-8">
                <Link href="/signup" className="text-3xl font-extrabold text-[#1f3a1c] hover:text-primary hover:underline transition-colors cursor-pointer">
                  Join us now!
                </Link>
              </div>
            </div>

            {/* Guest Section */}
            <div className="space-y-6">
              <Link href="/home">
                <button 
                  data-testid="button-continue-guest"
                  className="ml-8 px-8 py-3 bg-primary text-primary-foreground text-xl font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity transform hover:scale-105 duration-300 cursor-pointer"
                >
                  Continue as Guest
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
