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
import LightningSplit, {
  LIGHTNING_SPLIT_PIN_VH,
} from "./components/ui/lightning-split";
import ScrollExpandMedia from "./components/ui/scroll-expansion-hero";
import imgBeastBg from "./assets/images/monster_dense_lightning_bg_1784486497734.jpg";
import videoPromo from "./assets/video/monster_promo.mp4";
import CartDrawer from "./components/CartDrawer";
import { CartItem, NavSection } from "./types";

function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>("home");
  const [isCartOpen, setIsCartOpen] = useState(false);

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

    isProgrammaticScroll.current = true;

    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (sectionId === "varieties") {
      // Not scrollIntoView: page 4's box begins at the START of the lightning
      // wipe, so landing on its top edge would show page 3 with the wipe barely
      // begun. Scroll past the pin so page 4 is actually the thing on screen.
      const el = document.getElementById("varieties-section");
      if (el) {
        const past = (LIGHTNING_SPLIT_PIN_VH / 100) * window.innerHeight;
        window.scrollBy({
          top: el.getBoundingClientRect().top + past,
          behavior: "smooth",
        });
      }
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
        topOf("varieties-section") <= marker ? "varieties" : "home";
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
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="relative z-10 w-full">
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
                  below={
                    // Page 4. Its growth is driven by the split's hold phase
                    // through the `--expand` variable, so it owns no scroll
                    // logic of its own. Keeps the id the nav and scroll-spy use.
                    <div id="varieties-section">
                      <ScrollExpandMedia
                        mediaType="video"
                        mediaSrc={videoPromo}
                        bgImageSrc={imgBeastBg}
                        title="UNLEASH THE BEAST"
                        date="Monster Energy"
                        scrollToExpand="Keep scrolling to expand"
                      />
                    </div>
                  }
                />
              </div>
            </div>
        </>
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

    </div>
  );
}

export default App;

