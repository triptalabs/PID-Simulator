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
    if (!navEl) return 260;

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

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    // Filter out null/undefined card references
    const validCards = cardsRef.current.filter(card => card !== null && card !== undefined);

    gsap.set(navEl, { height: 60, overflow: "hidden" });
    gsap.set(validCards, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease,
    });

    if (validCards.length > 0) {
      tl.to(
        validCards,
        { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 },
        "-=0.1",
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
          gsap.set(el, { y: 50, opacity: 0 });
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
      className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[850px] z-[99] top-[1.2em] ${className}`}
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""} block h-[60px] p-0 rounded-xl shadow-md relative overflow-hidden will-change-[height]`}
        style={{ backgroundColor: baseColor }}
      >
        <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-[1.1rem] z-[2]">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? "open" : ""} group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
            style={{ color: menuColor || "#000" }}
          >
            <div
              className={`hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${
                isHamburgerOpen ? "translate-y-[4px] rotate-45" : ""
              } group-hover:opacity-75`}
            />
            <div
              className={`hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${
                isHamburgerOpen ? "-translate-y-[4px] -rotate-45" : ""
              } group-hover:opacity-75`}
            />
          </div>

          <div className="logo-container flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none">
            <img src={logo} alt={logoAlt} className="logo h-[28px]" />
          </div>

          <div className="flex items-center gap-3 order-3 md:order-none">
            <button
              type="button"
              className="card-nav-help-button hidden md:inline-flex border border-current rounded-[calc(0.75rem-0.2rem)] px-4 h-8 font-medium cursor-pointer transition-all duration-300 text-sm hover:bg-white/10"
              style={{ color: menuColor }}
              onClick={onHelpClick}
            >
              Cómo usar
            </button>
            <button
              type="button"
              className="card-nav-docs-button hidden md:inline-flex border border-current rounded-[calc(0.75rem-0.2rem)] px-4 h-8 font-medium cursor-pointer transition-all duration-300 text-sm hover:bg-white/10"
              style={{ color: menuColor }}
              onClick={onDocsClick}
            >
              Docs
            </button>
            <button
              type="button"
              className="card-nav-cta-button hidden md:inline-flex border-0 rounded-[calc(0.75rem-0.2rem)] px-6 h-8 font-medium cursor-pointer transition-all duration-300 text-sm hover:opacity-90"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            >
              Iniciar Simulación
            </button>
          </div>
        </div>

        <div
          className={`card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${
            isExpanded
              ? "visible pointer-events-auto"
              : "invisible pointer-events-none"
          } md:flex-row md:items-end md:gap-[12px]`}
          aria-hidden={!isExpanded}
          style={{
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateY(0)' : 'translateY(50px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease'
          }}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card select-none relative flex flex-col gap-3 p-[16px] rounded-[calc(0.75rem-0.2rem)] min-w-0 flex-[1_1_auto] h-auto min-h-[80px] md:h-full md:min-h-0 md:flex-[1_1_0%]"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label font-semibold tracking-[-0.5px] text-[16px] md:text-[18px]">
                {item.label}
              </div>
              
              {item.controls && (
                <div className="nav-card-controls flex flex-col gap-2">
                  {item.controls.map((control, i) => (
                    <div key={`${control.label}-${i}`} className="control-item">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium opacity-90">{control.label}</span>
                        <span className="text-xs font-mono opacity-75">
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
                        className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, ${item.textColor} 0%, ${item.textColor} ${((control.value - control.min) / (control.max - control.min)) * 100}%, rgba(255,255,255,0.2) ${((control.value - control.min) / (control.max - control.min)) * 100}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {item.switches && (
                <div className="nav-card-switches flex flex-col gap-2">
                  {item.switches.map((switchItem, i) => (
                    <div key={`${switchItem.label}-${i}`} className="switch-item">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium opacity-90">{switchItem.label}</span>
                        <Switch
                          checked={switchItem.checked}
                          onCheckedChange={switchItem.onChange}
                          className="scale-75"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {item.selects && (
                <div className="nav-card-selects flex flex-col gap-2">
                  {item.selects.map((selectItem, i) => (
                    <div key={`${selectItem.label}-${i}`} className="select-item">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium opacity-90">{selectItem.label}</span>
                      </div>
                      <Select value={selectItem.value} onValueChange={selectItem.onChange}>
                        <SelectTrigger className="h-6 text-xs bg-white/10 border-white/20 text-current">
                          <SelectValue placeholder={selectItem.label} />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border-slate-600">
                          {selectItem.options.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-xs text-slate-100 hover:bg-slate-700">
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
                <div className="nav-card-links mt-auto flex flex-col gap-[2px]">
                  {item.links.map((lnk, i) => (
                    <a
                      key={`${lnk.label}-${i}`}
                      className="nav-card-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-opacity duration-300 hover:opacity-75 text-[13px] md:text-[14px]"
                      href={lnk.href}
                      aria-label={lnk.ariaLabel}
                    >
                      <GoArrowUpRight
                        className="nav-card-link-icon shrink-0"
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
