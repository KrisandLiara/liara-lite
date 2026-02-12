import React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronsUpDown, Eye, EyeOff } from 'lucide-react';
import Mermaid from './Mermaid';

interface DiagramSpoilerProps {
  chart?: string;
  children?: React.ReactNode;
  title?: string;
  caption?: string;
}

export const DiagramSpoiler: React.FC<DiagramSpoilerProps> = ({ chart, children, title = "Visual Diagram", caption }) => {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full space-y-2 my-4"
        >
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800/80 transition-colors">
                    <h4 className="text-sm font-semibold text-slate-300">
                        {title}
                    </h4>
                    <div className="flex items-center text-sm text-slate-400">
                        {isOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <ChevronsUpDown className="h-4 w-4 ml-2" />
                    </div>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 p-4 border border-slate-800 rounded-lg">
                {chart ? <Mermaid chart={chart} caption={caption} /> : children}
            </CollapsibleContent>
        </Collapsible>
    )
} 