import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import PopOutSection, {
  POPOUT_PIN_VH,
  POPOUT_REVEAL_ID,
  POPOUT_SECTION_VH,
  POPOUT_ZOOM_VH,
} from "./components/PopOutSection";
import ThunderstormChamber from "./components/ThunderstormChamber";
import VarietiesShowcase from "./components/VarietiesShowcase";
import AboutUs from "./components/AboutUs";
import LightningSplit from "./components/ui/lightning-split";
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
  const lastSection = useRef<NavSection>("home");

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

      // Viewport-relative, not offsetTop: these sections live inside positioned,
      // negative-margin wrappers, so offsetTop is not a document coordinate.
      const marker = 200; // a section is "active" once its top passes this line
      const topOf = (id: string) =>
        document.getElementById(id)?.getBoundingClientRect().top ?? Infinity;

      const next: NavSection =
        topOf("about-section") <= marker
          ? "about"
          : topOf("varieties-section") <= marker
            ? "varieties"
            : "home";
      // Only touch state when it actually changes — this runs every frame.
      if (next !== lastSection.current) {
        lastSection.current = next;
        setCurrentSection(next);
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
            {/* Page 1 pins in place; page 2 slides up over it */}
            <Hero onNavigateToVarieties={() => handleNavigation("varieties")} />
            <PopOutSection />

            {/* Everything from page 3 on sits BEHIND page 2, pulled up by page
                2's full height so this block's black is page 2's backdrop. The
                pad drops it to exactly where page 2's zoom begins, and `sticky`
                then holds it against the viewport for the length of that zoom —
                so page 3 appears in place, only fading up (driven by
                PopOutSection), and never slides. The hold is CSS rather than
                JS so it tracks the scroll exactly instead of a frame behind. */}
            <div
              className="relative z-0 bg-black"
              style={{
                marginTop: `-${POPOUT_SECTION_VH}vh`,
                paddingTop: `${POPOUT_PIN_VH - POPOUT_ZOOM_VH}vh`,
              }}
            >
              <div
                id={POPOUT_REVEAL_ID}
                className="sticky top-0 bg-black"
                style={{ opacity: 0, pointerEvents: "none" }}
              >
                {/* Page 3 is pinned while page 4 rises over it behind an
                    electric seam. Net document height is unchanged, so page 2's
                    hand-off and everything below here keep their positions. */}
                <LightningSplit
                  above={<ThunderstormChamber />}
                  below={<VarietiesShowcase onAddToCart={handleAddToCart} />}
                />
                <AboutUs />
              </div>
              {/* The room `sticky` needs below it to hold for — exactly the zoom.
                  At full offset the block above lands on it, so it never shows. */}
              <div aria-hidden="true" style={{ height: `${POPOUT_ZOOM_VH}vh` }} />
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

