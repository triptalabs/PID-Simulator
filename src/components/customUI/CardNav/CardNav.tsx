
import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
// use your own icon import if react-icons is not available
import { GoArrowUpRight } from "react-icons/go";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CardNavControl = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
};

type CardNavSwitch = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

type CardNavSelect = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  controls?: CardNavControl[];
  switches?: CardNavSwitch[];
  selects?: CardNavSelect[];
  links?: CardNavLink[];
};

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

export interface CardNavProps {
  logo: string;
  logoAlt?: string;
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  onHelpClick?: () => void;
  onDocsClick?: () => void;
  simulatorState?: any;
  onStateChange?: (updates: any) => void;
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = "Logo",
  items,
  className = "",
  ease = "power3.out",
  baseColor = "#fff",
  menuColor,
  buttonBgColor,
  buttonTextColor,
  onHelpClick,
  onDocsClick,
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 360;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector(".card-nav-content") as HTMLElement;
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = "visible";
        contentEl.style.pointerEvents = "auto";
        contentEl.style.position = "static";
        contentEl.style.height = "auto";

        contentEl.offsetHeight;

        const topBar = 70;
        const padding = 24;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 360;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    // Filter out null/undefined card references
    const validCards = cardsRef.current.filter(card => card !== null && card !== undefined);

    gsap.set(navEl, { height: 70, overflow: "hidden" });
    gsap.set(validCards, { y: 60, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.5,
      ease,
    });

    if (validCards.length > 0) {
      tl.to(
        validCards,
        { y: 0, opacity: 1, duration: 0.5, ease, stagger: 0.1 },
        "-=0.2",
      );
    }

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [ease]); // Removed items dependency to prevent re-creation on state changes

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) {
      cardsRef.current[i] = el;
      // Update GSAP references if timeline exists and component is mounted
      if (tlRef.current) {
        if (isExpanded) {
          gsap.set(el, { y: 0, opacity: 1 });
        } else {
          gsap.set(el, { y: 60, opacity: 0 });
        }
      }
    } else {
      // Clean up reference if element is null
      cardsRef.current[i] = null as any;
    }
  };

  // Handle state changes without affecting animations
  useEffect(() => {
    if (isExpanded && tlRef.current) {
      // Ensure cards are visible when expanded and state changes
      cardsRef.current.forEach(card => {
        if (card) {
          gsap.set(card, { y: 0, opacity: 1 });
        }
      });
    }
  }, [isExpanded]); // Only depend on isExpanded, not on items or state changes

  // Force update cards visibility when expanded
  const forceUpdateCards = () => {
    if (isExpanded) {
      setTimeout(() => {
        cardsRef.current.forEach(card => {
          if (card) {
            gsap.set(card, { y: 0, opacity: 1 });
          }
        });
      }, 50);
    }
  };

  // Listen for control changes and force update
  useEffect(() => {
    if (isExpanded) {
      forceUpdateCards();
    }
  }); // Run on every render when expanded

  // Clean up card references when component unmounts
  useEffect(() => {
    return () => {
      cardsRef.current = [];
    };
  }, []);

  return (
    <div
      className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[95%] max-w-[1200px] z-[99] top-[1rem] ${className}`}
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""} block h-[70px] p-0 rounded-2xl shadow-2xl relative overflow-hidden will-change-[height] backdrop-blur-xl`}
        style={{ 
          backgroundColor: baseColor,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.25), 0 8px 16px -8px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="card-nav-top absolute inset-x-0 top-0 h-[70px] flex items-center justify-between px-6 z-[2]">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? "open" : ""} group h-full flex flex-col items-center justify-center cursor-pointer gap-[7px] order-2 md:order-none transition-all duration-300 hover:scale-110`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
            style={{ color: menuColor || "#000" }}
          >
            <div
              className={`hamburger-line w-[32px] h-[3px] bg-current transition-all duration-400 ease-out rounded-full [transform-origin:50%_50%] ${
                isHamburgerOpen ? "translate-y-[5px] rotate-45" : ""
              } group-hover:opacity-80`}
            />
            <div
              className={`hamburger-line w-[32px] h-[3px] bg-current transition-all duration-400 ease-out rounded-full [transform-origin:50%_50%] ${
                isHamburgerOpen ? "-translate-y-[5px] -rotate-45" : ""
              } group-hover:opacity-80`}
            />
          </div>

          <div className="logo-container flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none">
            <img src={logo} alt={logoAlt} className="logo h-[32px] transition-transform duration-300 hover:scale-105" />
          </div>

          <div className="flex items-center gap-4 order-3 md:order-none">
            <button
              type="button"
              className="card-nav-help-button hidden md:inline-flex border-2 border-current rounded-xl px-5 py-2 h-10 font-semibold cursor-pointer transition-all duration-300 text-sm hover:bg-white/15 hover:scale-105 backdrop-blur-sm"
              style={{ color: menuColor }}
              onClick={onHelpClick}
            >
              Cómo usar
            </button>
            <button
              type="button"
              className="card-nav-docs-button hidden md:inline-flex border-2 border-current rounded-xl px-5 py-2 h-10 font-semibold cursor-pointer transition-all duration-300 text-sm hover:bg-white/15 hover:scale-105 backdrop-blur-sm"
              style={{ color: menuColor }}
              onClick={onDocsClick}
            >
              Docs
            </button>
            <button
              type="button"
              className="card-nav-cta-button hidden md:inline-flex border-0 rounded-xl px-6 py-2 h-10 font-bold cursor-pointer transition-all duration-300 text-sm hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            >
              Iniciar Simulación
            </button>
          </div>
        </div>

        <div
          className={`card-nav-content absolute left-0 right-0 top-[70px] bottom-0 p-6 flex flex-col items-stretch gap-4 justify-start z-[1] ${
            isExpanded
              ? "visible pointer-events-auto"
              : "invisible pointer-events-none"
          } md:flex-row md:items-stretch md:gap-4`}
          aria-hidden={!isExpanded}
          style={{
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateY(0)' : 'translateY(60px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease'
          }}
        >
          {(items || []).slice(0, 5).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card select-none relative flex flex-col gap-4 p-6 rounded-2xl min-w-0 flex-[1_1_auto] h-auto min-h-[120px] md:h-full md:min-h-0 md:flex-[1_1_0%] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              ref={setCardRef(idx)}
              style={{ 
                backgroundColor: item.bgColor, 
                color: item.textColor,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="nav-card-label font-bold tracking-tight text-[17px] md:text-[19px] mb-2 leading-tight">
                {item.label}
              </div>
              
              {item.controls && (
                <div className="nav-card-controls flex flex-col gap-3">
                  {item.controls.map((control, i) => (
                    <div key={`${control.label}-${i}`} className="control-item">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold opacity-90 tracking-wide uppercase">{control.label}</span>
                        <span className="text-sm font-bold font-mono opacity-95 bg-white/10 px-2 py-1 rounded-md">
                          {control.value.toFixed(control.step < 0.01 ? 3 : control.step < 0.1 ? 2 : 1)}{control.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={control.value}
                        onChange={(e) => control.onChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider transition-all duration-200 hover:bg-white/30"
                        style={{
                          background: `linear-gradient(to right, ${item.textColor} 0%, ${item.textColor} ${((control.value - control.min) / (control.max - control.min)) * 100}%, rgba(255,255,255,0.2) ${((control.value - control.min) / (control.max - control.min)) * 100}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {item.switches && (
                <div className="nav-card-switches flex flex-col gap-3">
                  {item.switches.map((switchItem, i) => (
                    <div key={`${switchItem.label}-${i}`} className="switch-item">
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <span className="text-sm font-semibold opacity-90">{switchItem.label}</span>
                        <Switch
                          checked={switchItem.checked}
                          onCheckedChange={switchItem.onChange}
                          className="scale-90 data-[state=checked]:bg-current"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {item.selects && (
                <div className="nav-card-selects flex flex-col gap-3">
                  {item.selects.map((selectItem, i) => (
                    <div key={`${selectItem.label}-${i}`} className="select-item">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold opacity-90 tracking-wide uppercase">{selectItem.label}</span>
                      </div>
                      <Select value={selectItem.value} onValueChange={selectItem.onChange}>
                        <SelectTrigger className="h-8 text-sm bg-white/10 border-white/20 text-current hover:bg-white/20 transition-colors rounded-lg font-medium">
                          <SelectValue placeholder={selectItem.label} />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900/98 border-slate-600 backdrop-blur-lg rounded-lg">
                          {selectItem.options.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-sm text-slate-100 hover:bg-slate-700 focus:bg-slate-700 rounded-md">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
              
              {item.links && (
                <div className="nav-card-links mt-auto flex flex-col gap-1">
                  {item.links.map((lnk, i) => (
                    <a
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link inline-flex items-center gap-2 no-underline cursor-pointer transition-all duration-300 hover:opacity-80 hover:translate-x-1 text-sm font-medium"
                      href={lnk.href}
                      aria-label={lnk.ariaLabel}
                    >
                      <GoArrowUpRight
                        className="nav-card-link-icon shrink-0 text-base"
                        aria-hidden="true"
                      />
                      {lnk.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
