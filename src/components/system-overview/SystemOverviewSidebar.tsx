import React from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import * as Icons from 'lucide-react';
import { navItems } from '@/config/system-overview-nav';
import { Button } from '@/components/ui/button';
import { SystemIcon } from './SystemIcon';

const Icon = ({ name, className = "h-5 w-5" }) => {
    const LucideIcon = Icons[name];
    return LucideIcon ? <LucideIcon className={className} /> : <Icons.FileCode className={className} />;
};

type NavLinkProps = React.ComponentProps<typeof NavLink>;

const NavLinkWithRef = React.forwardRef<HTMLAnchorElement, NavLinkProps>((props, ref) => <NavLink ref={ref} {...props} />);

export const SystemOverviewSidebar: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
    const { '*': docPath = 'index' } = useParams();

    const activeParent = React.useMemo(() => {
        for (const item of navItems) {
            if (item.path === docPath || item.items?.some(sub => sub.path === docPath)) {
                return item.name;
            }
        }
        return null;
    }, [docPath]);

    const [openItems, setOpenItems] = React.useState<string[]>(() => {
        const storedItems = sessionStorage.getItem('sidebarOpenItems');
        const initialItems = storedItems ? JSON.parse(storedItems) : [];
        if (activeParent && !initialItems.includes(activeParent)) {
            initialItems.push(activeParent);
        }
        return initialItems;
    });

    React.useEffect(() => {
        if (activeParent && !openItems.includes(activeParent)) {
            setOpenItems(prev => [...prev, activeParent]);
        }
    }, [activeParent, openItems]);

    React.useEffect(() => {
        sessionStorage.setItem('sidebarOpenItems', JSON.stringify(openItems));
    }, [openItems]);

    const navigate = useNavigate();

    if (isCollapsed) {
        return (
             <div className="space-y-1 p-1">
                {navItems.map(item => {
                    const hasChildren = item.items && item.items.length > 0;
                    const isActive = activeParent === item.name;

                    if (hasChildren) {
                        return (
                            <div key={item.name} className="flex items-center rounded-md bg-transparent" >
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             <NavLink to={`/app/system-overview/${item.path}`} className={cn(
                                                "flex items-center justify-center h-9 w-9 rounded-l-md transition-colors",
                                                isActive ? "bg-slate-700 text-sky-300" : "text-slate-400 hover:bg-slate-800"
                                            )}>
                                                <Icon name={item.icon} />
                                            </NavLink>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p>{item.name} Overview</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                               <Popover>
                                    <PopoverTrigger asChild>
                                        <button className={cn(
                                            "flex items-center justify-center h-9 w-5 rounded-r-md transition-colors",
                                            isActive ? "bg-slate-700 text-sky-300" : "text-slate-400 hover:bg-slate-800"
                                        )}>
                                            <Icons.ChevronRight className="h-4 w-4" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent side="right" align="start" className="p-1 w-52 bg-slate-800/95 backdrop-blur-sm border-slate-700">
                                        <div className="text-base font-bold text-slate-200 p-2">{item.name}</div>
                                        <div className="space-y-1 mt-1 border-t border-slate-700 pt-1">
                                            {item.items?.map(subItem => (
                                                <NavLink
                                                    key={subItem.path}
                                                    to={`/app/system-overview/${subItem.path}`}
                                                    className={({ isActive: isSubActive }) => cn(
                                                        "flex items-center w-full text-left px-2 py-1.5 text-sm rounded-sm",
                                                        isSubActive ? "bg-slate-700 text-sky-300" : "text-slate-400 hover:bg-slate-700/50"
                                                    )}
                                                >
                                                    {subItem.name}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )
                    }
                    
                    return (
                        <TooltipProvider key={item.name}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <NavLink to={`/app/system-overview/${item.path}`} className={cn(
                                        "flex items-center justify-center h-9 w-9 rounded-md transition-colors",
                                        docPath === item.path ? "bg-slate-700 text-sky-300" : "text-slate-400 hover:bg-slate-800"
                                    )}>
                                        <Icon name={item.icon} />
                                    </NavLink>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>{item.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="space-y-2 h-full flex flex-col">
            <div className="px-4 py-3 border-b border-sidebar-border flex justify-between items-center">
                <h2 className={cn("font-bold text-lg text-sidebar-foreground", isCollapsed && "hidden")}>
                    System Docs
                </h2>
                <div className={cn("flex space-x-1", isCollapsed && "hidden")}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-200" onClick={() => setOpenItems(navItems.filter(item => item.items && item.items.length > 0).map(item => item.name))}>
                                    <Icons.Maximize className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Expand All</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-200" onClick={() => setOpenItems([])}>
                                    <Icons.Minimize className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Collapse All</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                <Accordion 
                    type="multiple" 
                    value={openItems} 
                    onValueChange={setOpenItems} 
                    className="w-full"
                >
                    {navItems.map((item) => (
                        <AccordionItem value={item.name} key={item.path} className="border-b-0">
                            {item.items && item.items.length > 0 ? (
                                <>
                                    <div className="flex w-full items-center justify-between px-2.5 py-1.5 text-base rounded-md group">
                                        <div 
                                            onClick={() => {
                                                navigate(`/app/system-overview/${item.path}`);
                                                if (!openItems.includes(item.name)) {
                                                    setOpenItems(prev => [...prev, item.name]);
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center hover:no-underline p-1.5 rounded-md flex-1 nav-link-area cursor-pointer",
                                                activeParent === item.name && item.items?.every(sub => sub.path !== docPath) ? "text-sky-300 bg-slate-700/50" : "text-slate-400 group-hover:text-slate-100"
                                            )}
                                        >
                                            <Icon name={item.icon} className="mr-3 shrink-0" />
                                            <span className="flex-1 text-left">{item.name}</span>
                                        </div>
                                        <AccordionTrigger className="p-1 rounded-md hover:bg-slate-800 [&>svg]:hover:text-slate-100" />
                                    </div>
                                    <AccordionContent className="pb-1 pl-6">
                                        <div className="flex flex-col space-y-1 mt-1 border-l border-slate-700">
                                            {item.items.map((subItem) => (
                                                <NavLink
                                                    key={subItem.path}
                                                    to={`/app/system-overview/${subItem.path}`}
                                                    className={({ isActive }) => cn(
                                                        "flex items-center pl-3 pr-2 py-1.5 text-base font-normal rounded-md transition-colors relative",
                                                        "before:absolute before:left-[1px] before:top-[18px] before:h-[1px] before:w-3 before:bg-slate-700",
                                                        isActive ? "text-sky-300" : "text-slate-400 hover:text-slate-200"
                                                    )}
                                                >
                                                    {subItem.name}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </>
                            ) : (
                                <NavLink
                                    to={`/app/system-overview/${item.path}`}
                                    className={({ isActive }) => cn(
                                        "flex w-full items-center px-4 py-2 text-base font-medium rounded-md transition-colors",
                                        isActive ? "bg-slate-700/50 text-sky-300" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                    )}
                                >
                                    <Icon name={item.icon} className="mr-3 shrink-0" />
                                    {item.name}
                                </NavLink>
                            )}
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}; 