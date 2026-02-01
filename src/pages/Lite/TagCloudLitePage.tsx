import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSelector } from "@/components/import/preview/shared";
import apiClient from "@/services/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/components/import/preview/shared/content/MessageContent";

type TagCount = { name: string; count: number };
type EntityCount = { name: string; count: number; category?: string };
type Selected =
  | { kind: "keyword"; value: string }
  | { kind: "ner"; value: string; category?: string }
  | null;

function buildTagCounts(enriched: any[] | null): TagCount[] {
  if (!Array.isArray(enriched)) return [];
  const counts = new Map<string, number>();
  for (const convo of enriched) {
    for (const msg of convo?.messages || []) {
      const tags: string[] = Array.isArray(msg?.tags) ? msg.tags : [];
      for (const t of tags) {
        const tag = String(t || "").trim();
        if (!tag) continue;
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function buildEntityCounts(enriched: any[] | null): EntityCount[] {
  if (!Array.isArray(enriched)) return [];
  const counts = new Map<string, number>();
  const byCat = new Map<string, Record<string, number>>();

  for (const convo of enriched) {
    for (const msg of convo?.messages || []) {
      const ne = msg?.named_entities;
      if (!ne || typeof ne !== "object") continue;
      for (const [cat, items] of Object.entries(ne as Record<string, unknown>)) {
        if (!Array.isArray(items)) continue;
        for (const raw of items) {
          const ent = String(raw || "").trim();
          if (!ent) continue;
          counts.set(ent, (counts.get(ent) || 0) + 1);
          const rec = byCat.get(ent) || {};
          rec[String(cat)] = (rec[String(cat)] || 0) + 1;
          byCat.set(ent, rec);
        }
      }
    }
  }

  const out: EntityCount[] = [];
  for (const [name, count] of counts.entries()) {
    const rec = byCat.get(name) || {};
    const topCat = Object.entries(rec).sort((a, b) => b[1] - a[1])[0]?.[0];
    out.push({ name, count, category: topCat });
  }
  return out.sort((a, b) => b.count - a.count);
}

// Match the main app's tag-cloud scaling (see FacetTagCloudPanel), but smaller so we can fit more.
function scaleFont(freq: number, min = 10, max = 26) {
  const f = Math.log(1 + Math.max(0, freq));
  const norm = Math.min(1, f / Math.log(1 + 100));
  return Math.round(min + (max - min) * norm);
}

function normalizeTimestampMs(ts: any): number | null {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1_000_000_000_000) return Math.round(n * 1000);
  return Math.round(n);
}

function underlineDecorClasses(color?: string): string {
  switch (color) {
    case "emerald":
      return "decoration-emerald-400/80";
    case "sky":
      return "decoration-sky-400/80";
    case "violet":
      return "decoration-violet-400/80";
    case "amber":
      return "decoration-amber-400/80";
    case "indigo":
      return "decoration-indigo-400/80";
    case "rose":
      return "decoration-rose-400/80";
    case "lime":
      return "decoration-lime-400/80";
    case "cyan":
      return "decoration-cyan-400/80";
    case "fuchsia":
      return "decoration-fuchsia-400/80";
    case "yellow":
      return "decoration-yellow-400/80";
    default:
      return "decoration-slate-400/60";
  }
}

function nerTone(category?: string): string {
  switch (category) {
    case "PERSON":
      return "violet";
    case "ORG":
      return "emerald";
    case "GPE":
      return "sky";
    case "DATE":
      return "cyan";
    case "PRODUCT":
      return "indigo";
    case "EVENT":
      return "amber";
    case "MISC":
    default:
      return "slate";
  }
}

function entityChipClasses(category?: string): string {
  switch (category) {
    case "PERSON":
      return "bg-violet-900/30 border-violet-600/60 text-violet-200 hover:bg-violet-900/50";
    case "ORG":
      return "bg-emerald-900/30 border-emerald-600/60 text-emerald-200 hover:bg-emerald-900/50";
    case "GPE":
      return "bg-sky-900/30 border-sky-600/60 text-sky-200 hover:bg-sky-900/50";
    case "DATE":
      return "bg-cyan-900/30 border-cyan-600/60 text-cyan-200 hover:bg-cyan-900/50";
    case "PRODUCT":
      return "bg-indigo-900/30 border-indigo-600/60 text-indigo-200 hover:bg-indigo-900/50";
    case "EVENT":
      return "bg-amber-900/30 border-amber-600/60 text-amber-200 hover:bg-amber-900/50";
    default:
      return "bg-slate-800/40 border-slate-600/60 text-slate-200 hover:bg-slate-800/60";
  }
}

function buildTagColorMap(tags: string[]) {
  const palette = ["rose", "lime", "yellow", "fuchsia", "emerald", "indigo", "sky", "amber", "cyan", "violet"];
  const tagColorMap: Record<string, string> = {};
  for (const t of tags) {
    let hash = 0;
    for (let i = 0; i < t.length; i++) hash = (hash * 31 + t.charCodeAt(i)) >>> 0;
    tagColorMap[t] = palette[(hash + 3) % palette.length];
  }
  return tagColorMap;
}

export default function TagCloudLitePage() {
  const navigate = useNavigate();
  const [selectedEnrichedFile, setSelectedEnrichedFile] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Selected>(null);
  const [openAccordion, setOpenAccordion] = useState<string>("");
  const [matchCursorByConvo, setMatchCursorByConvo] = useState<Record<string, number>>({});
  const [flash, setFlash] = useState<{ convoId: string; msgIndex: number; nonce: number } | null>(null);
  const LITE_LAST_ENRICHED_FILE_KEY = "liaraLite.selectedEnrichedFile";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get("file");
    if (f) {
      setSelectedEnrichedFile(f);
      return;
    }
    try {
      const saved = window.localStorage.getItem(LITE_LAST_ENRICHED_FILE_KEY);
      if (saved) setSelectedEnrichedFile(saved);
    } catch {
      // ignore
    }
  }, []);

  const tagCounts = useMemo(() => buildTagCounts(enriched), [enriched]);
  const entityCounts = useMemo(() => buildEntityCounts(enriched), [enriched]);

  const loadEnriched = async (fileName: string) => {
    setIsLoading(true);
    setSelected(null);
    setOpenAccordion("");
    setMatchCursorByConvo({});
    try {
      const { data } = await apiClient.get("/lite/file-content", {
        params: { fileName, from: "enriched" },
      });
      setEnriched(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load whenever selection changes, and persist selection so it "sticks" across pages.
  useEffect(() => {
    if (!selectedEnrichedFile) return;
    try {
      window.localStorage.setItem(LITE_LAST_ENRICHED_FILE_KEY, selectedEnrichedFile);
    } catch {
      // ignore
    }
    loadEnriched(selectedEnrichedFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnrichedFile]);

  const openInPreview = () => {
    if (!selectedEnrichedFile) return;
    navigate(`/?open=enriched&file=${encodeURIComponent(selectedEnrichedFile)}`);
  };

  const messageRefs = React.useRef<Record<string, Record<number, HTMLDivElement | null>>>({});

  const getMatchMessageIndices = (convo: any): number[] => {
    if (!selected) return [];
    const out: number[] = [];
    const msgs = convo?.messages || [];
    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i];
      if (selected.kind === "keyword") {
        const tags: string[] = Array.isArray(msg?.tags) ? msg.tags : [];
        if (tags.includes(selected.value)) out.push(i);
      } else {
        const ne = msg?.named_entities;
        if (!ne || typeof ne !== "object") continue;
        const cat = selected.category;
        if (cat) {
          const items = (ne as any)?.[cat] as unknown;
          if (Array.isArray(items) && items.map((v) => String(v)).includes(selected.value)) out.push(i);
        } else {
          for (const arr of Object.values(ne as Record<string, unknown>)) {
            if (!Array.isArray(arr)) continue;
            if (arr.map((v) => String(v)).includes(selected.value)) {
              out.push(i);
              break;
            }
          }
        }
      }
    }
    return out;
  };

  const scrollToMessageWithRetry = (convoId: string, msgIndex: number, tries = 0) => {
    const el = messageRefs.current?.[convoId]?.[msgIndex];
    if (el) {
      const container = el.closest(".messages-scroll-container") as HTMLElement | null;
      if (container) {
        const cRect = container.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();
        const absoluteTop = (eRect.top - cRect.top) + container.scrollTop;
        const targetTop = Math.max(0, absoluteTop - container.clientHeight / 2);
        container.scrollTo({ top: targetTop, behavior: "smooth" });
      } else {
        // Fallback: should be rare, but keeps behavior reasonable
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (tries >= 6) return;
    setTimeout(() => scrollToMessageWithRetry(convoId, msgIndex, tries + 1), 80);
  };

  const triggerFlash = (convoId: string, msgIndex: number) => {
    const nonce = Date.now();
    setFlash({ convoId, msgIndex, nonce });
    setTimeout(() => {
      setFlash((prev) => (prev?.nonce === nonce ? null : prev));
    }, 5000);
  };

  const jumpToNextMatchInConversation = (convoId: string, matchIndices: number[]) => {
    if (matchIndices.length === 0) return;
    setMatchCursorByConvo((prev) => {
      const current = prev[convoId] ?? -1;
      const next = (current + 1) % matchIndices.length;
      const msgIndex = matchIndices[next];
      triggerFlash(convoId, msgIndex);
      setTimeout(() => scrollToMessageWithRetry(convoId, msgIndex), 0);
      return { ...prev, [convoId]: next };
    });
  };

  const matchedConversations = useMemo(() => {
    if (!selected || !Array.isArray(enriched)) return [];
    const out: Array<{ convo: any; matches: number }> = [];
    for (const convo of enriched) {
      let matches = 0;
      for (const msg of convo?.messages || []) {
        if (selected.kind === "keyword") {
          const tags: string[] = Array.isArray(msg?.tags) ? msg.tags : [];
          if (tags.includes(selected.value)) matches += 1;
        } else {
          const ne = msg?.named_entities;
          if (!ne || typeof ne !== "object") continue;
          const items = (ne as any)?.[selected.category || ""] as unknown;
          if (Array.isArray(items) && items.map((v) => String(v)).includes(selected.value)) matches += 1;
          if (!selected.category) {
            for (const arr of Object.values(ne as Record<string, unknown>)) {
              if (!Array.isArray(arr)) continue;
              if (arr.map((v) => String(v)).includes(selected.value)) {
                matches += 1;
                break;
              }
            }
          }
        }
      }
      if (matches > 0) out.push({ convo, matches });
    }
    return out.sort((a, b) => b.matches - a.matches);
  }, [enriched, selected]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Tag Cloud</h1>
            <p className="text-slate-400 mt-1">
              Pick an <span className="font-mono text-slate-300">enriched-data-*.json</span>, then click a tag/entity to browse matching conversations.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/">Back to Import</Link>
            </Button>
          </div>
        </header>

        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-slate-100">Select enriched file</CardTitle>
            <CardDescription>Tag Cloud reads tags directly from the enriched JSON (no DB required).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <FileSelector
                selectedFile={selectedEnrichedFile}
                onFileSelect={(filename, type) => {
                  if (type !== "enriched") return;
                  setSelectedEnrichedFile(filename);
                }}
                disabled={isLoading}
                placeholder="Select enriched file..."
                showNewOption={false}
                compact={false}
                allowedTypes={["enriched"]}
              />
            </div>
            <div className="flex gap-2">
              <Button disabled={!selectedEnrichedFile || isLoading}>
                {isLoading ? "Loading..." : "Loaded"}
              </Button>
              <Button onClick={openInPreview} disabled={!selectedEnrichedFile} variant="outline">
                Open in Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Use page space: left = clouds, right = conversations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 order-2 lg:order-2">
            <Card className="border-slate-800 bg-slate-900/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-slate-100">Matching Conversations</CardTitle>
                    <CardDescription>
                      {selected ? (
                        <>
                          Showing conversations for{" "}
                          {selected.kind === "keyword" ? (
                            <span className="font-medium text-sky-300">tag: {selected.value}</span>
                          ) : (
                            <span className="font-medium text-sky-300">
                              entity{selected.category ? ` (${selected.category === "GPE" ? "LOC" : selected.category})` : ""}: {selected.value}
                            </span>
                          )}
                        </>
                      ) : (
                        "Click a tag/entity on the right to populate this list."
                      )}
                    </CardDescription>
                  </div>
                  {selected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelected(null);
                        setOpenAccordion("");
                        setMatchCursorByConvo({});
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selected ? (
                  <div className="text-slate-400 text-sm">
                    Tip: click a keyword in the top cloud, or an entity in the NER cloud below it. The conversation viewer will highlight the selected term.
                  </div>
                ) : matchedConversations.length === 0 ? (
                  <div className="text-slate-400 text-sm">No matches found.</div>
                ) : (
                  <Accordion
                    type="single"
                    collapsible
                    value={openAccordion}
                    onValueChange={setOpenAccordion}
                    className="space-y-3"
                  >
                    {matchedConversations.slice(0, 80).map(({ convo, matches }, idx) => {
                      const convoId = String(convo.id || idx);
                      const tagsForConvo: string[] = Array.from(
                        new Set((convo.messages || []).flatMap((m: any) => m?.tags || []).filter(Boolean))
                      );
                      const tagColorMap = buildTagColorMap(tagsForConvo);
                      const selectedTagColor =
                        selected.kind === "keyword" ? tagColorMap[selected.value] : nerTone(selected.category);
                      const matchIndices = getMatchMessageIndices(convo);
                      const tsMs = normalizeTimestampMs(convo.create_time);

                      return (
                        <AccordionItem
                          key={convoId}
                          value={convoId}
                          className="border border-slate-700/50 rounded-lg overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 md:px-6 hover:no-underline hover:bg-slate-800/50 [&[data-state=open]]:bg-slate-800/50">
                            <div className="flex items-center justify-between w-full min-w-0 gap-3">
                              <div className="min-w-0 text-left">
                                <div className="truncate text-slate-100 font-semibold">
                                  {convo.title || `Conversation ${idx + 1}`}
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                                  <span>{convo.messages?.length || 0} msgs</span>
                                  <span>matches: {matches}</span>
                                  {tsMs && <span>{new Date(tsMs).toLocaleDateString()}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {selected.kind === "keyword" ? (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenAccordion(convoId);
                                      jumpToNextMatchInConversation(convoId, matchIndices);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenAccordion(convoId);
                                        jumpToNextMatchInConversation(convoId, matchIndices);
                                      }
                                    }}
                                    className={cn(
                                      "cursor-pointer select-none text-[12px] px-2.5 py-1 rounded border font-medium transition-colors bg-slate-800/40 border-slate-600/60 text-slate-200 underline underline-offset-4",
                                      underlineDecorClasses(selectedTagColor)
                                    )}
                                    title={matchIndices.length ? `Jump through ${matchIndices.length} matches` : "No matches in this conversation"}
                                  >
                                    {selected.value}
                                  </span>
                                ) : (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenAccordion(convoId);
                                      jumpToNextMatchInConversation(convoId, matchIndices);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenAccordion(convoId);
                                        jumpToNextMatchInConversation(convoId, matchIndices);
                                      }
                                    }}
                                    className={cn(
                                      "cursor-pointer select-none text-[12px] px-2.5 py-1 rounded border font-medium transition-colors",
                                      entityChipClasses(selected.category)
                                    )}
                                    title={matchIndices.length ? `Jump through ${matchIndices.length} matches` : "No matches in this conversation"}
                                  >
                                    {selected.value}
                                  </span>
                                )}
                                <Badge variant="outline" className="border-slate-700 text-slate-200">
                                  {matches}
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-4 md:px-6 pb-5">
                            <div className="messages-scroll-container relative max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                              <div className="space-y-3">
                                {convo.messages?.map((msg: any, msgIndex: number) => {
                                  const isUser = msg.author === "user" || msg.role === "user";
                                  const highlightEntities =
                                    selected.kind === "ner"
                                      ? { [selected.category || "MISC"]: [selected.value] }
                                      : undefined;
                                  const isFlash = flash?.convoId === convoId && flash?.msgIndex === msgIndex;
                                  const flashTag = isFlash && selected.kind === "keyword" ? selected.value : undefined;
                                  const flashEntity =
                                    isFlash && selected.kind === "ner"
                                      ? { category: selected.category || "MISC", value: selected.value }
                                      : undefined;

                                  return (
                                    <div
                                      key={msg.id || msgIndex}
                                      ref={(el) => {
                                        if (!messageRefs.current[convoId]) messageRefs.current[convoId] = {};
                                        messageRefs.current[convoId][msgIndex] = el;
                                      }}
                                      className={cn(
                                        "p-4 my-2 rounded-lg relative border",
                                        isFlash && "liara-flash-target",
                                        isUser ? "bg-blue-950/60 border-blue-800/60" : "bg-cyan-950/60 border-cyan-700/60"
                                      )}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <p className={cn("font-semibold capitalize text-sm", isUser ? "text-blue-300" : "text-cyan-300")}>
                                          {msg.author || msg.role}
                                        </p>
                                      </div>

                                      <div className="absolute top-2 right-2 z-10">
                                        <span className="text-xs font-mono px-2 py-1 rounded border shadow-sm bg-slate-800/60 border-slate-600/70 text-slate-300">
                                          {msg.id || msgIndex}
                                        </span>
                                      </div>

                                      <MessageContent
                                        content={msg.content}
                                        highlightTags={tagsForConvo}
                                        tagColorMap={tagColorMap}
                                        highlightEntities={highlightEntities}
                                        entityColorMap={{
                                          PERSON: "violet",
                                          ORG: "emerald",
                                          GPE: "sky",
                                          DATE: "cyan",
                                          PRODUCT: "indigo",
                                          EVENT: "amber",
                                          MISC: "slate",
                                        }}
                                        flashTag={flashTag}
                                        flashEntity={flashEntity}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-4 order-1 lg:order-1">
            {/* TOP RIGHT: Tag cloud */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sky-300">Tag Cloud</CardTitle>
                <CardDescription>{enriched ? `${tagCounts.length} tags` : "Load an enriched file to see tags."}</CardDescription>
              </CardHeader>
              <CardContent className="h-[240px] p-4 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="text-slate-400 text-sm">Loading…</div>
                ) : tagCounts.length === 0 ? (
                  <div className="text-slate-400 text-sm">No tags yet</div>
                ) : (
                  <div className="flex flex-wrap items-start justify-start gap-x-4 gap-y-3">
                    {tagCounts.slice(0, 140).map(({ name, count }) => {
                      const tagColor = buildTagColorMap([name])[name];
                      const isActive = selected?.kind === "keyword" && selected.value === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setSelected({ kind: "keyword", value: name })}
                          className={cn(
                            "text-left font-semibold text-slate-300 hover:text-sky-300 transition-colors underline underline-offset-4",
                            underlineDecorClasses(tagColor),
                            isActive && "text-sky-200"
                          )}
                          style={{ fontSize: `${scaleFont(count, 9, 22)}px` }}
                          title={`${count} matching messages`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BELOW: NER cloud */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sky-300">NER Cloud</CardTitle>
                <CardDescription>
                  {enriched ? `${entityCounts.length} entities` : "Load an enriched file to see named entities."}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[240px] p-4 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="text-slate-400 text-sm">Loading…</div>
                ) : entityCounts.length === 0 ? (
                  <div className="text-slate-400 text-sm">No entities yet</div>
                ) : (
                  <div className="flex flex-wrap items-start justify-start gap-x-3 gap-y-3">
                    {entityCounts.slice(0, 160).map(({ name, count, category }) => {
                      const isActive = selected?.kind === "ner" && selected.value === name;
                      const tone = nerTone(category);
                      const displayCat = (category || "MISC") === "GPE" ? "LOC" : (category || "MISC");
                      return (
                        <button
                          key={`${category || "MISC"}:${name}`}
                          type="button"
                          onClick={() => setSelected({ kind: "ner", value: name, category })}
                          className={cn(
                            "text-left font-semibold text-slate-200 hover:text-sky-300 transition-colors",
                            isActive && "text-sky-200"
                          )}
                          style={{ fontSize: `${scaleFont(count, 9, 22)}px` }}
                          title={`${category || "MISC"} • ${count} matching messages`}
                        >
                          <span className={cn("underline underline-offset-4", underlineDecorClasses(tone))}>{name}</span>
                          <span
                            className={cn(
                              "ml-1.5 align-top inline-flex items-center px-1.5 py-[1px] rounded border text-[10px] leading-none font-semibold opacity-90",
                              entityChipClasses(category)
                            )}
                            title={`NER: ${displayCat}`}
                          >
                            {displayCat}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

