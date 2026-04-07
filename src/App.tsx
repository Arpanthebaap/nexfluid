import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import '@/lib/i18n';
import { AuthProvider } from "@/hooks/useAuth";

import PublicLayout from "./components/layout/PublicLayout";
import Index from "./pages/Index";

// Lazy-loaded public pages
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Categories = lazy(() => import("./pages/Categories"));
const ProductListing = lazy(() => import("./pages/ProductListing"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const BrandPage = lazy(() => import("./pages/BrandPage"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy-loaded admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const ProtectedRoute = lazy(() => import("./components/admin/ProtectedRoute"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Products = lazy(() => import("./pages/admin/Products"));
const ProductForm = lazy(() => import("./pages/admin/ProductForm"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const QuoteRequests = lazy(() => import("./pages/admin/QuoteRequests"));
const ProductImport = lazy(() => import("./pages/admin/ProductImport"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/:slug" element={<Categories />} />
                <Route path="/products/listing/:slug" element={<ProductListing />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/brands/:brandName" element={<BrandPage />} />
                <Route path="/brands/:brandName/:slug" element={<BrandPage />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
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
                  <Route path="/admin/import" element={<ProductImport />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
