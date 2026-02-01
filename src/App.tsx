import React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SettingsProvider } from "@/contexts/SettingsContext";
import ImportPage from "@/pages/ImportPage";
import TagCloudLitePage from "@/pages/Lite/TagCloudLitePage";
import { ImportProvider } from "@/contexts/ImportContext";

// Liara Lite branch: keep app surface minimal, but reuse the full Import UI.
const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <SettingsProvider>
          <Router>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<ImportPage />} />
              <Route
                path="/tag-cloud"
                element={
                  <ImportProvider>
                    <TagCloudLitePage />
                  </ImportProvider>
                }
              />
              <Route path="*" element={<ImportPage />} />
            </Routes>
          </Router>
        </SettingsProvider>
      </TooltipProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
