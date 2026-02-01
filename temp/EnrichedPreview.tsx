import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, HelpCircle, Sparkles, Brain, Eye, Zap, MessageSquare, DollarSign, Clock, AlertCircle, Hash, Image as ImageIcon, Code, Mic, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useImport } from '@/contexts/ImportContext';

import { 
  MessageContent,
  TagHighlighting,
  ScrollToFeature,
  useTagHighlight,
  useContentDetection,
  CardWrapper,
  CardHeaderWrapper,
  CardContentWrapper
} from './shared';

export const EnrichedPreview = () => {
  const {
    tagMessageIndex,
    openAccordion,
    setOpenAccordion,
    handleTagClick,
    setMessageRef,
    messageRefs
  } = useTagHighlight();

  const {
    enrichedData,
    handleLoadFromFile,
    isLoading,
    currentStage
  } = useImport();

  const {
    detectContentTypes,
    getMessageTypeIndicators
  } = useContentDetection();

  const conversations = enrichedData;

  if (!conversations || conversations.length === 0) {
    return (
      <CardWrapper>
        <CardHeaderWrapper>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-sm font-bold">3</div>
            <h3 className="text-lg font-semibold text-slate-100">Load to Database</h3>
          </div>
          <p className="text-sm text-slate-300 mt-1">Review enriched data and load to database.</p>
        </CardHeaderWrapper>
        <CardContentWrapper>
          <div className="text-sm text-gray-400 leading-tight">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              No enriched data available
            </div>
          </div>
        </CardContentWrapper>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper>
      <CardHeaderWrapper>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-sm font-bold">3</div>
              <h3 className="text-lg font-semibold text-slate-100">Load to Database</h3>
            </div>
            <p className="text-sm text-slate-300 mt-1">Review enriched data and load to database.</p>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
            <div className="text-sm text-slate-300">
              <span className="font-medium text-emerald-400">{conversations.length}</span> conversations ready
            </div>
            <Button 
              onClick={handleLoadFromFile}
              disabled={isLoading}
              className="h-8 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {isLoading && currentStage === 'loading' ? (
                <>
                  <span className="animate-spin mr-1">⚡</span>
                  Loading...
                </>
              ) : (
                <>
                  <span className="mr-1">⚡</span>
                  Load to Database
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeaderWrapper>

      <CardContentWrapper>
        <Accordion
          type="single"
          collapsible
          value={openAccordion}
          onValueChange={setOpenAccordion}
          className="space-y-3"
        >
          {conversations.map((convo, index) => {
            // Detect content types for this conversation
            const contentTypes = detectContentTypes(convo);

            return (
              <AccordionItem
                key={convo.id}
                value={convo.id}
                className="border border-slate-700/50 rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-6 hover:no-underline hover:bg-slate-800/50 [&[data-state=open]]:bg-slate-800/50">
                  <div 
                    className="flex items-center w-full border-b border-slate-700/50 hover:border-slate-600/70 transition-colors cursor-pointer hover:bg-slate-800/20"
                    data-conversation-id={convo.id}
                    onClick={() => {
                      setOpenAccordion(openAccordion === convo.id ? '' : convo.id);
                    }}
                  >
                    {/* Main content area */}
                    <div className="flex-1 text-left py-4 transition-all duration-200 group w-full min-w-0">
                      <div className="flex flex-1 items-center justify-between w-full min-w-0">
                        <div className="flex flex-col flex-1 pr-6 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-100 text-sm group-hover:text-white transition-colors">
                              {convo.title || `Chat Session ${index + 1}`}
                            </span>
                            
                            {/* Content Type Tags */}
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              {contentTypes.hasVoiceContent && (
                                <Badge 
                                  variant="secondary" 
                                  className="bg-amber-900/60 border-amber-600/70 text-amber-300"
                                  onClick={(e) => handleTagClick('voice', convo.id, e, conversations)}
                                >
                                  <Mic className="h-3 w-3 mr-1" />
                                  Voice
                                </Badge>
                              )}

                              {contentTypes.hasImages && (
                                <Badge 
                                  variant="secondary" 
                                  className="bg-indigo-900/60 border-indigo-600/70 text-indigo-300"
                                  onClick={(e) => handleTagClick('image', convo.id, e, conversations)}
                                >
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  Image
                                </Badge>
                              )}
                              
                              {contentTypes.hasCode && (
                                <Badge 
                                  variant="secondary" 
                                  className="bg-purple-900/60 border-purple-600/70 text-purple-300"
                                  onClick={(e) => handleTagClick('code', convo.id, e, conversations)}
                                >
                                  <Code className="h-3 w-3 mr-1" />
                                  Code
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                            <span>{convo.messages?.length || 0} messages</span>
                            {convo.create_time && (
                              <span>{new Date(convo.create_time).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-6">
                  {/* Conversation Preview - Compact with scroll */}
                  <div className="space-y-4">
                    {/* Tag Highlighting */}
                    {convo.tags && convo.tags.length > 0 && (
                      <TagHighlighting 
                        tags={convo.tags}
                        onTagClick={(tag, event) => handleTagClick(tag, convo.id, event, conversations)}
                        conversationId={convo.id}
                      />
                    )}

                    {/* Messages - Scrollable container */}
                    <div className="messages-scroll-container relative max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="space-y-3">
                        {convo.messages?.map((msg, msgIndex) => {
                          // Get message type indicators
                          const {
                            hasCode,
                            hasImage,
                            hasVoice,
                            hasTranscript
                          } = getMessageTypeIndicators(msg);
                          
                          return (
                            <div 
                              key={msgIndex}
                              ref={(el) => setMessageRef(convo.id, msgIndex, el)}
                              className={cn(
                                "p-4 my-3 rounded-lg relative border transition-all duration-300",
                                msg.author === 'user' || msg.role === 'user' ? 'bg-blue-950/60 border-blue-800/60' : 'bg-cyan-950/60 border-cyan-700/60'
                              )}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "font-semibold capitalize text-sm",
                                    (msg.author === 'user' || msg.role === 'user') ? 'text-blue-300' : 'text-cyan-300'
                                  )}>{msg.author || msg.role}</p>
                                </div>
                              </div>
                              
                              {/* Message ID Badge - Positioned absolutely in the corner */}
                              <div className="absolute top-2 right-2 z-10">
                                <span className={cn(
                                  "text-xs font-mono px-2 py-1 rounded border shadow-sm",
                                  hasVoice && "bg-amber-900/40 border-amber-600/50 text-amber-200",
                                  hasImage && !hasVoice && "bg-indigo-900/40 border-indigo-600/50 text-indigo-200",
                                  hasCode && !hasVoice && !hasImage && "bg-purple-900/60 border-purple-600/70 text-purple-300",
                                  !hasVoice && !hasImage && !hasCode && "bg-slate-800/60 border-slate-600/70 text-slate-300"
                                )}>
                                  {msg.id}
                                </span>
                              </div>
                              
                              <MessageContent 
                                content={msg.content} 
                                isImage={hasImage}
                                isVoice={hasVoice}
                                hasTranscript={hasTranscript}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Scroll to Feature */}
                    <ScrollToFeature 
                      tagMessageIndex={tagMessageIndex}
                      conversationId={convo.id}
                      messageRefs={messageRefs}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContentWrapper>
    </CardWrapper>
  );
}; 