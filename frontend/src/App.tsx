import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import KohaPage from "./pages/KohaPage";
import LibroHabladoPage from "./pages/LibroHabladoPage";
import FondoEditorialPage from "./pages/FondoEditorialPage";
import { IBIMEAssistant } from "./components/IBIMEAssistant"; // 1. Importación

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/koha" element={<KohaPage />} />
          <Route path="/libro-hablado" element={<LibroHabladoPage />} />
          <Route path="/fondo-editorial" element={<FondoEditorialPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* 2. El asistente se coloca aquí para que flote sobre todas las rutas */}
        <IBIMEAssistant /> 
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
