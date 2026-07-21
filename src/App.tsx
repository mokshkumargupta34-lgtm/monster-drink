import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import PopOutSection from "./components/PopOutSection";
import ThunderstormChamber from "./components/ThunderstormChamber";
import VarietiesShowcase from "./components/VarietiesShowcase";
import AboutUs from "./components/AboutUs";
import LoginModal from "./components/LoginModal";
import CartDrawer from "./components/CartDrawer";
import { CartItem, NavSection } from "./types";
import { ExtendedDrinkVariety } from "./data/drinks";

function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>("home");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Lock flag to prevent scroll listener from overriding deliberate nav clicks
  const isProgrammaticScroll = useRef(false);

  // Initialize cart state safely from local storage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("monster_cart_items");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync cart state back to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem("monster_cart_items", JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to sync cart to storage:", e);
    }
  }, [cartItems]);

  // Sync user credentials on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("monster_user_name");
      if (storedUser) {
        setIsLoggedIn(true);
        setUsername(storedUser);
      }
    } catch (e) {
      console.error("Failed to read user session:", e);
    }
  }, []);

  const handleLoginSuccess = (name: string) => {
    setIsLoggedIn(true);
    setUsername(name);
    try {
      localStorage.setItem("monster_user_name", name);
    } catch (e) {
      console.error("Failed to save user session:", e);
    }
    setCurrentSection("home");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername(null);
    try {
      localStorage.removeItem("monster_user_name");
    } catch (e) {
      console.error("Failed to clear user session:", e);
    }
    setCurrentSection("home");
  };

  const handleAddToCart = (
    variety: ExtendedDrinkVariety,
    packSize: number,
    quantity: number,
  ) => {
    setCartItems((prevItems) => {
      const itemId = `${variety.id}-${packSize}`;
      const existing = prevItems.find((item) => item.id === itemId);

      if (existing) {
        return prevItems.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prevItems, { id: itemId, variety, quantity, packSize }];
    });
  };

  const handleUpdateCartQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleNavigation = (sectionId: NavSection) => {
    setCurrentSection(sectionId);

    if (sectionId === "login") return;

    isProgrammaticScroll.current = true;

    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (sectionId === "varieties") {
      document
        .getElementById("varieties-section")
        ?.scrollIntoView({ behavior: "smooth" });
    } else if (sectionId === "about") {
      document
        .getElementById("about-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }

    // Release scroll lock after smooth animation completes
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 1000);
  };

  // Dynamically update active navbar position during manual scrolling
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      if (isProgrammaticScroll.current) return;

      const scrollPos = window.scrollY + 200;
      const varietiesElem = document.getElementById("varieties-section");
      const aboutElem = document.getElementById("about-section");

      if (aboutElem && scrollPos >= aboutElem.offsetTop) {
        setCurrentSection("about");
      } else if (varietiesElem && scrollPos >= varietiesElem.offsetTop) {
        setCurrentSection("varieties");
      } else {
        setCurrentSection("home");
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const totalCartCount = cartItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  return (
    <div className="relative min-h-screen text-white bg-black font-sans selection:bg-emerald-500 selection:text-black">
      <Header
        currentSection={currentSection}
        onNavigate={handleNavigation}
        cartCount={totalCartCount}
        isLoggedIn={isLoggedIn}
        username={username}
        onLogout={handleLogout}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="relative z-10 w-full">
        {currentSection === "login" ? (
          <div className="animate-fade-in">
            <LoginModal onLoginSuccess={handleLoginSuccess} />
          </div>
        ) : (
          <>
            {/* Page 1 pins in place; the sections below slide up over it */}
            <Hero onNavigateToVarieties={() => handleNavigation("varieties")} />
            <div className="relative z-10 bg-black">
              <PopOutSection />
              <ThunderstormChamber />
              <VarietiesShowcase onAddToCart={handleAddToCart} />
              <AboutUs />
            </div>
          </>
        )}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        isLoggedIn={isLoggedIn}
      />

      <footer className="relative z-20 border-t border-zinc-900 bg-black py-8 px-6 text-center text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© 2026 MONSTER ENERGY CO. ALL SYSTEM BUZZ ACTIVE.</span>
          <div className="flex gap-4">
            <span className="hover:text-emerald-400 cursor-pointer">
              Privacy Policy
            </span>
            <span>//</span>
            <span className="hover:text-emerald-400 cursor-pointer">
              Security Portal
            </span>
            <span>//</span>
            <span className="hover:text-emerald-400 cursor-pointer">
              Terms of Unleash
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

