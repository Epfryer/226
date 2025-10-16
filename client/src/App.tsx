import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhiteHeader } from "@/components/layout/WhiteHeader";
import { WhiteFooter } from "@/components/layout/WhiteFooter";
import { ProjectProvider } from "@/context/ProjectContext";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Publications from "@/pages/Publications";
import Diagnostics from "@/pages/Diagnostics";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/publications" component={Publications} />
      <Route path="/diagnostics" component={Diagnostics} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAboutPage = location === "/about";

  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        <div className="min-h-screen flex flex-col">
          {isAboutPage ? <WhiteHeader /> : <Header />}
          <main className="flex-1">
            <Router />
          </main>
          {isAboutPage ? <WhiteFooter /> : <Footer />}
        </div>
        <Toaster />
      </ProjectProvider>
    </QueryClientProvider>
  );
}

export default App;