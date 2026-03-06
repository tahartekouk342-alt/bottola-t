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
import ViewerTournamentsFeed from "./pages/ViewerTournamentsFeed";
import Following from "./pages/Following";
import Notifications from "./pages/Notifications";
import ViewerSettings from "./pages/ViewerSettings";
import OrganizerTournaments from "./pages/viewer/OrganizerTournaments";
import ViewerTournamentDetails from "./pages/viewer/ViewerTournamentDetails";
import { ViewerLayout } from "./components/viewer/ViewerLayout";

// Organizer Pages
import OrganizerWelcome from "./pages/OrganizerWelcome";
import OrganizerAuth from "./pages/OrganizerAuth";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrganizerTournamentsList from "./pages/OrganizerTournamentsList";
import OrganizerFollowers from "./pages/OrganizerFollowers";
import OrganizerSettings from "./pages/OrganizerSettings";
import TournamentDetails from "./pages/TournamentDetails";
import { OrganizerLayout } from "./components/organizer/OrganizerLayout";

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
            <Route path="/tournaments-feed" element={<ViewerLayout><ViewerTournamentsFeed /></ViewerLayout>} />
            <Route path="/following" element={<ViewerLayout><Following /></ViewerLayout>} />
            <Route path="/notifications" element={<ViewerLayout><Notifications /></ViewerLayout>} />
            <Route path="/settings" element={<ViewerLayout><ViewerSettings /></ViewerLayout>} />
            <Route path="/viewer/organizer/:organizerId" element={<ViewerLayout><OrganizerTournaments /></ViewerLayout>} />
            <Route path="/viewer/tournament/:tournamentId" element={<ViewerLayout><ViewerTournamentDetails /></ViewerLayout>} />

            {/* Organizer Routes */}
            <Route path={ORGANIZER_BASE} element={<OrganizerWelcome />} />
            <Route path={`${ORGANIZER_BASE}/auth`} element={<OrganizerAuth />} />
            <Route path={`${ORGANIZER_BASE}/dashboard`} element={<OrganizerLayout><OrganizerDashboard /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/tournaments`} element={<OrganizerLayout><OrganizerTournamentsList /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/followers`} element={<OrganizerLayout><OrganizerFollowers /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/settings`} element={<OrganizerLayout><OrganizerSettings /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/tournament/:id`} element={<OrganizerLayout><TournamentDetails /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/notifications`} element={<OrganizerLayout><Notifications /></OrganizerLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
