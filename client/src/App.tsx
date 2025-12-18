import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import LoginLanding from "@/pages/Login";
import LoginInput from "@/pages/LoginInput";
import Signup from "@/pages/Signup";
import About from "@/pages/About";
import Help from "@/pages/Help";
import Recommend from "@/pages/Recommend";
import History from "@/pages/History";
import Calculator from "@/pages/Calculator";
import Admin from "@/pages/Admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginLanding} />
      <Route path="/home" component={Home} />
      <Route path="/login-input" component={LoginInput} />
      <Route path="/signup" component={Signup} />
      <Route path="/about" component={About} />
      <Route path="/help" component={Help} />
      <Route path="/recommend" component={Recommend} />
      <Route path="/history" component={History} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
