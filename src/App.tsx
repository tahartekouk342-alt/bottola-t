import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ORGANIZER_BASE } from "@/lib/constants";

// Viewer Pages
import ViewerWelcome from "./pages/ViewerWelcome";
import ViewerAuth from "./pages/ViewerAuth";
import ViewerHome from "./pages/ViewerHome";
import Following from "./pages/Following";
import Notifications from "./pages/Notifications";
import OrganizerTournaments from "./pages/viewer/OrganizerTournaments";
import ViewerTournamentDetails from "./pages/viewer/ViewerTournamentDetails";
import { ViewerLayout } from "./components/viewer/ViewerLayout";

// Organizer Pages
import OrganizerWelcome from "./pages/OrganizerWelcome";
import OrganizerAuth from "./pages/OrganizerAuth";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrganizerSettings from "./pages/OrganizerSettings";
import TournamentDetails from "./pages/TournamentDetails";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="bottola-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<ViewerWelcome />} />
            <Route path="/auth" element={<ViewerAuth />} />

            {/* Viewer with sidebar layout */}
            <Route path="/home" element={<ViewerLayout><ViewerHome /></ViewerLayout>} />
            <Route path="/following" element={<ViewerLayout><Following /></ViewerLayout>} />
            <Route path="/notifications" element={<ViewerLayout><Notifications /></ViewerLayout>} />
            <Route path="/viewer/organizer/:organizerId" element={<ViewerLayout><OrganizerTournaments /></ViewerLayout>} />
            <Route path="/viewer/tournament/:tournamentId" element={<ViewerLayout><ViewerTournamentDetails /></ViewerLayout>} />

            {/* Organizer Routes */}
            <Route path={ORGANIZER_BASE} element={<OrganizerWelcome />} />
            <Route path={`${ORGANIZER_BASE}/auth`} element={<OrganizerAuth />} />
            <Route path={`${ORGANIZER_BASE}/dashboard`} element={<OrganizerDashboard />} />
            <Route path={`${ORGANIZER_BASE}/settings`} element={<OrganizerSettings />} />
            <Route path={`${ORGANIZER_BASE}/tournament/:id`} element={<TournamentDetails />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
