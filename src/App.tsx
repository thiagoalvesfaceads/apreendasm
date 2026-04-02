import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing.tsx";
import Auth from "./pages/Auth.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import Index from "./pages/Index.tsx";
import Library from "./pages/Library.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import ContentEngine from "./pages/ContentEngine.tsx";
import CanvaCallback from "./pages/CanvaCallback.tsx";
import CardGenerator from "./pages/CardGenerator.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/content-engine"
            element={
              <ProtectedRoute>
                <ContentEngine />
              </ProtectedRoute>
            }
          />
          <Route
            path="/card-generator"
            element={
              <ProtectedRoute>
                <CardGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/canva-callback"
            element={
              <ProtectedRoute>
                <CanvaCallback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
