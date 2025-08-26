import React, { useState } from "react";
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
        className={`block rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-500 ease-in-out ${
          isExpanded ? 'h-auto' : 'h-[70px]'
        }`}
        style={{ 
          backgroundColor: baseColor,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.25), 0 8px 16px -8px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Top bar - siempre visible */}
        <div className="h-[70px] flex items-center justify-between px-6 border-b border-white/10">
          <div
            className={`hamburger-menu group h-full flex flex-col items-center justify-center cursor-pointer gap-[7px] order-2 md:order-none transition-all duration-300 hover:scale-110`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
            style={{ color: menuColor || "#000" }}
          >
            <div
              className={`hamburger-line w-[32px] h-[3px] bg-current transition-all duration-400 ease-out rounded-full [transform-origin:50%_50%] ${
                isExpanded ? "translate-y-[5px] rotate-45" : ""
              } group-hover:opacity-80`}
            />
            <div
              className={`hamburger-line w-[32px] h-[3px] bg-current transition-all duration-400 ease-out rounded-full [transform-origin:50%_50%] ${
                isExpanded ? "-translate-y-[5px] -rotate-45" : ""
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

                 {/* Expandable content */}
         <div
           className={`overflow-hidden transition-all duration-500 ease-in-out ${
             isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
           }`}
         >
           <div className="p-4 flex flex-col items-stretch gap-3 justify-start md:flex-row md:items-stretch md:gap-3">
            {(items || []).slice(0, 5).map((item, idx) => (
                             <div
                 key={`${item.label}-${idx}`}
                                   className="nav-card select-none relative flex flex-col gap-2 p-3 rounded-lg min-w-0 flex-[1_1_auto] h-auto min-h-[100px] md:h-full md:min-h-0 md:flex-[1_1_0%] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
                style={{ 
                  backgroundColor: item.bgColor, 
                  color: item.textColor,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.2)'
                }}
              >
                                 <div className="nav-card-label font-bold tracking-tight text-[12px] md:text-[14px] mb-1 leading-tight">
                   {item.label}
                 </div>
                
                                 {item.controls && (
                   <div className="nav-card-controls flex flex-col gap-1">
                     {item.controls.map((control, i) => (
                       <div key={`${control.label}-${i}`} className="control-item">
                         <div className="flex items-center justify-between mb-1">
                           <span className="text-[10px] font-semibold opacity-90 tracking-wide uppercase">{control.label}</span>
                           <span className="text-[10px] font-bold font-mono opacity-95 bg-white/10 px-1.5 py-0.5 rounded">
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
                           className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer slider transition-all duration-200 hover:bg-white/30"
                          style={{
                            background: `linear-gradient(to right, ${item.textColor} 0%, ${item.textColor} ${((control.value - control.min) / (control.max - control.min)) * 100}%, rgba(255,255,255,0.2) ${((control.value - control.min) / (control.max - control.min)) * 100}%, rgba(255,255,255,0.2) 100%)`
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                                 {item.switches && (
                   <div className="nav-card-switches flex flex-col gap-1">
                     {item.switches.map((switchItem, i) => (
                       <div key={`${switchItem.label}-${i}`} className="switch-item">
                         <div className="flex items-center justify-between p-1.5 bg-white/5 rounded hover:bg-white/10 transition-colors">
                           <span className="text-[10px] font-semibold opacity-90">{switchItem.label}</span>
                                                     <Switch
                             checked={switchItem.checked}
                             onCheckedChange={switchItem.onChange}
                             className="scale-75 data-[state=checked]:bg-current"
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                                 {item.selects && (
                   <div className="nav-card-selects flex flex-col gap-1">
                     {item.selects.map((selectItem, i) => (
                       <div key={`${selectItem.label}-${i}`} className="select-item">
                         <div className="flex items-center justify-between mb-1">
                           <span className="text-[10px] font-semibold opacity-90 tracking-wide uppercase">{selectItem.label}</span>
                         </div>
                         <Select value={selectItem.value} onValueChange={selectItem.onChange}>
                           <SelectTrigger className="h-6 text-[10px] bg-white/10 border-white/20 text-current hover:bg-white/20 transition-colors rounded font-medium">
                            <SelectValue placeholder={selectItem.label} />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900/98 border-slate-600 backdrop-blur-lg rounded z-[999]">
                            {selectItem.options.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-[10px] text-slate-100 hover:bg-slate-700 focus:bg-slate-700 rounded">
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
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
