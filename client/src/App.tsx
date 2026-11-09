import { lazy, Suspense } from "react";
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhiteHeader } from "@/components/layout/WhiteHeader";
import { WhiteFooter } from "@/components/layout/WhiteFooter";
import { RouteEntrance } from "@/components/layout/RouteEntrance";
import { ProjectProvider } from "@/context/ProjectContext";
import { PageMetadata } from "@/components/PageMetadata";

const About = lazy(() => import("@/pages/About"));
const Publications = lazy(() => import("@/pages/Publications"));
const Projects = lazy(() => import("@/pages/Projects"));
const Project = lazy(() => import("@/pages/Project"));
const Studio = lazy(() => import("@/pages/Studio"));
const Diagnostics = lazy(() => import("@/pages/Diagnostics"));
const NotFound = lazy(() => import("@/pages/not-found"));
const LoginPage = lazy(() => import("@/pages/Account").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("@/pages/Account").then((module) => ({ default: module.RegisterPage })));
const AccountPage = lazy(() => import("@/pages/Account").then((module) => ({ default: module.AccountPage })));

function Router() {
  return (
    <Switch>
      <Route path="/"><Redirect to={`/projects${window.location.search}${window.location.hash}`} replace /></Route>
      <Route path="/about" component={About} />
      <Route path="/projects" component={Projects} />
      <Route path="/project/:id" component={Project} />
      <Route path="/publications" component={Publications} />
      <Route path="/studio/:productId?" component={Studio} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/diagnostics" component={Diagnostics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAboutPage = location === "/about";
  const isStudioPage = location === "/studio" || location.startsWith("/studio/");

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
      <PageMetadata />
      <QueryClientProvider client={queryClient}>
        <ProjectProvider>
        <div className={`min-h-screen flex flex-col ${isStudioPage ? "" : "portfolio-shell"} ${isAboutPage ? "portfolio-shell--about" : ""}`}>
          {!isStudioPage && (isAboutPage ? <WhiteHeader /> : <Header />)}
          <RouteEntrance />
          <main className={`flex-1 ${isStudioPage ? "" : "portfolio-main"}`}>
            <Suspense fallback={
              <div role="status" aria-live="polite" className={`px-6 py-32 ${isAboutPage ? "text-white" : ""}`}>
                <span className="sr-only">Loading page…</span>
                <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
                  <div className="h-10 w-2/3 bg-current opacity-10" />
                  <div className="h-4 w-1/2 bg-current opacity-10" />
                  <div className="h-48 w-full bg-current opacity-10" />
                </div>
              </div>
            }>
              <Router />
            </Suspense>
          </main>
          {!isStudioPage && (isAboutPage ? <WhiteFooter /> : <Footer />)}
        </div>
        <Toaster />
        </ProjectProvider>
      </QueryClientProvider>
      </LazyMotion>
    </MotionConfig>
  );
}

export default App;