import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import '@/lib/i18n';

import PublicLayout from "./components/layout/PublicLayout";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Categories from "./pages/Categories";
import ProductListing from "./pages/ProductListing";
import ProductDetail from "./pages/ProductDetail";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import AdminCategories from "./pages/admin/Categories";
import QuoteRequests from "./pages/admin/QuoteRequests";
import ProductImport from "./pages/admin/ProductImport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:slug" element={<Categories />} />
            <Route path="/products/listing/:slug" element={<ProductListing />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/search" element={<SearchResults />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/products/:id" element={<ProductForm />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/quotes" element={<QuoteRequests />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
