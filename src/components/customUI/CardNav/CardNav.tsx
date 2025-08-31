import React, { useState } from "react";
import { GoArrowUpRight } from "react-icons/go";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GradientText from "../GradientText/GradientText";

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
  logo?: string;
  logoAlt?: string;
  logoText?: string;
  items: CardNavItem[];
  className?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  ease?: string;
  onHelpClick?: () => void;
  onDocsClick?: () => void;
  simulatorState?: any;
  onStateChange?: (updates: any) => void;
  onExpansionChange?: (expanded: boolean) => void;
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = "Logo",
  logoText,
  items,
  className = "",
  baseColor = "#fff",
  menuColor,
  buttonBgColor,
  buttonTextColor,
  ease,
  onHelpClick,
  onDocsClick,
  onExpansionChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMenu = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    onExpansionChange?.(newExpandedState);
  };

  return (
    <div className={`w-full max-w-[1200px] mx-auto p-2 ${className}`}>
      <nav
        className={`block rounded-lg shadow-sm transition-all duration-300 ease-in-out relative z-40 overflow-hidden ${
          isExpanded ? 'h-auto' : 'h-[80px]'
        }`}
        style={{ 
          backgroundColor: 'hsl(var(--notion-surface))',
          border: '1px solid hsl(var(--notion-border))',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Top bar - siempre visible */}
        <div className="h-[80px] grid grid-cols-3 items-center px-8">
          <div className="flex justify-start">
            <div
              className={`hamburger-menu group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] transition-all duration-300 hover:scale-105`}
              onClick={toggleMenu}
              role="button"
              aria-label={isExpanded ? "Close menu" : "Open menu"}
              tabIndex={0}
              style={{ color: menuColor || "hsl(var(--notion-text))" }}
            >
              <div
                className={`hamburger-line w-[24px] h-[2px] bg-current transition-all duration-300 ease-out rounded-full [transform-origin:50%_50%] ${
                  isExpanded ? "translate-y-[3px] rotate-45" : ""
                } group-hover:opacity-80`}
                style={{
                  background: isExpanded ? 'hsl(var(--notion-blue))' : 'currentColor'
                }}
              />
              <div
                className={`hamburger-line w-[24px] h-[2px] bg-current transition-all duration-300 ease-out rounded-full [transform-origin:50%_50%] ${
                  isExpanded ? "-translate-y-[3px] -rotate-45" : ""
                } group-hover:opacity-80`}
                style={{
                  background: isExpanded ? 'hsl(var(--notion-blue))' : 'currentColor'
                }}
              />
            </div>
          </div>

          <div className="flex justify-center items-center">
            {logoText ? (
                          <span className="text-[28px] font-bold font-sans whitespace-nowrap select-none text-[hsl(var(--notion-text))]">
              {logoText}
            </span>
            ) : logo ? (
              <img src={logo} alt={logoAlt} className="logo h-[36px] transition-transform duration-300 hover:scale-105" />
            ) : null}
          </div>

          <div className="flex justify-end items-center gap-4">
            <button
              type="button"
              className="notion-button hidden md:inline-flex px-4 py-2 h-9 font-medium cursor-pointer transition-all duration-200 text-sm hover:scale-105"
              style={{ 
                color: menuColor || "hsl(var(--notion-text))"
              }}
              onClick={onHelpClick}
            >
              Cómo usar
            </button>
            <button
              type="button"
              className="notion-button hidden md:inline-flex px-4 py-2 h-9 font-medium cursor-pointer transition-all duration-200 text-sm hover:scale-105"
              style={{ 
                color: menuColor || "hsl(var(--notion-text))"
              }}
              onClick={onDocsClick}
            >
              Docs
            </button>
          </div>
        </div>

        {/* Expandable content */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-4 flex flex-col items-stretch gap-3 justify-start md:flex-row md:items-stretch md:gap-3">
            {(items || []).slice(0, 5).map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="notion-card select-none relative flex flex-col gap-2 p-3 min-w-0 flex-[1_1_auto] h-auto min-h-[100px] md:h-full md:min-h-0 md:flex-[1_1_0%] transition-all duration-200 hover:scale-[1.01] overflow-hidden z-30 group"
              >
                <div className="font-semibold tracking-tight text-[13px] md:text-[14px] mb-1 leading-tight text-[hsl(var(--notion-text))]">
                  {item.label}
                </div>
                
                {item.controls && (
                  <div className="nav-card-controls flex flex-col gap-2">
                    {item.controls.map((control, i) => (
                      <div key={`${control.label}-${i}`} className="control-item">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium tracking-wide uppercase text-[hsl(var(--notion-text-secondary))]">{control.label}</span>
                          <span className="text-[11px] font-mono font-semibold notion-badge">
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
                          className="w-full h-1.5 notion-slider appearance-none cursor-pointer transition-all duration-200"
                          style={{
                            background: `linear-gradient(to right, hsl(var(--notion-blue)) 0%, hsl(var(--notion-blue)) ${((control.value - control.min) / (control.max - control.min)) * 100}%, hsl(var(--notion-accent)) ${((control.value - control.min) / (control.max - control.min)) * 100}%, hsl(var(--notion-accent)) 100%)`
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
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-xl hover:from-slate-600/40 hover:to-slate-500/40 transition-all duration-300 border border-slate-600/30">
                          <span className="text-[11px] font-semibold opacity-90 text-slate-300">{switchItem.label}</span>
                          <Switch
                            checked={switchItem.checked}
                            onCheckedChange={switchItem.onChange}
                            className="scale-75 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-400 data-[state=checked]:to-purple-400"
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
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold opacity-90 tracking-wide uppercase text-slate-300">{selectItem.label}</span>
                        </div>
                        <Select value={selectItem.value} onValueChange={selectItem.onChange}>
                          <SelectTrigger className="h-8 text-[11px] bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-slate-600/40 text-current hover:from-slate-600/60 hover:to-slate-500/60 transition-all duration-300 rounded-xl font-medium backdrop-blur-sm">
                            <SelectValue placeholder={selectItem.label} />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900/98 border-slate-600 backdrop-blur-lg rounded-xl z-[999]">
                            {selectItem.options.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-[11px] text-slate-100 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 focus:bg-gradient-to-r focus:from-slate-700 focus:to-slate-600 rounded-lg">
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
                  <div className="nav-card-links mt-auto flex flex-col gap-2">
                    {item.links.map((lnk, i) => (
                      <a
                        key={`${lnk.label}-${i}`}
                        className="nav-card-link inline-flex items-center gap-2 no-underline cursor-pointer transition-all duration-300 hover:opacity-80 hover:translate-x-1 text-sm font-medium text-cyan-400 hover:text-purple-400"
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
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
