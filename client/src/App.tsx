import { Sparkles } from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";
import AssistantWidget from "./components/AssistantWidget";
import CartDrawer from "./components/CartDrawer";
import Header from "./components/Header";
import { StoreProvider } from "./lib/store";
import Admin from "./pages/Admin";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import ProductPage from "./pages/ProductPage";
import Shop from "./pages/Shop";
import Track from "./pages/Track";

export default function App() {
  return (
    <StoreProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track" element={<Track />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-slate-500">
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-600" /> ShopSense AI — portfolio project by Hanzala Saqib</span>
            <span>Fictional demo store · product photos from Unsplash</span>
          </div>
        </footer>
      </div>
      <CartDrawer />
      <AssistantWidget />
    </StoreProvider>
  );
}
