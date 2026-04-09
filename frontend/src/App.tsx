import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
// Student
import SignupStudentPage from "./pages/student/SignupStudentPage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import TasksPage from "./pages/student/TasksPage";
import RecommendationsPage from "./pages/student/RecommendationsPage";
import StudentProjectsPage from "./pages/student/StudentProjectsPage";
import StudentEventsPage from "./pages/student/StudentEventsPage";
import StudentNotificationsPage from "./pages/student/StudentNotificationsPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
// Organisation
import SignupOrgPage from "./pages/org/SignupOrgPage";
import OrgDashboardPage from "./pages/org/OrgDashboardPage";
import CreateProjectPage from "./pages/org/CreateProjectPage";
import CreateEventPage from "./pages/org/CreateEventPage";
import MembersPage from "./pages/org/MembersPage";
import OrgProjectsPage from "./pages/org/OrgProjectsPage";
import OrgEventsPage from "./pages/org/OrgEventsPage";
import OrgStatisticsPage from "./pages/org/OrgStatisticsPage";
import OrgNotificationsPage from "./pages/org/OrgNotificationsPage";
import OrgProfilePage from "./pages/org/OrgProfilePage";
// Admin
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminOrganizationsPage from "./pages/admin/AdminOrganizationsPage";
// Shared
import DashboardPage from "./pages/shared/DashboardPage";
import ProjectsListPage from "./pages/shared/ProjectsListPage";
import ProjectDetailsPage from "./pages/shared/ProjectDetailsPage";
import EventsPage from "./pages/shared/EventsPage";
import StatisticsPage from "./pages/shared/StatisticsPage";
import NotificationsPage from "./pages/shared/NotificationsPage";
import ProfilePage from "./pages/shared/ProfilePage";
import EditProfilePage from "./pages/shared/EditProfilePage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup/student" element={<SignupStudentPage />} />
      <Route path="/signup/organization" element={<SignupOrgPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/student" element={<ProtectedRoute><StudentDashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/organization" element={<ProtectedRoute><OrgDashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
      <Route path="/projects/create" element={<ProtectedRoute><CreateProjectPage /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailsPage /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
      <Route path="/events/create" element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
      <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute><AdminStudentsPage /></ProtectedRoute>} />
      <Route path="/admin/organizations" element={<ProtectedRoute><AdminOrganizationsPage /></ProtectedRoute>} />
      {/* Student-specific routes */}
      <Route path="/student/projects" element={<ProtectedRoute><StudentProjectsPage /></ProtectedRoute>} />
      <Route path="/student/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/student/events" element={<ProtectedRoute><StudentEventsPage /></ProtectedRoute>} />
      <Route path="/student/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
      <Route path="/student/notifications" element={<ProtectedRoute><StudentNotificationsPage /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
      {/* Org-specific routes */}
      <Route path="/org/projects" element={<ProtectedRoute><OrgProjectsPage /></ProtectedRoute>} />
      <Route path="/org/events" element={<ProtectedRoute><OrgEventsPage /></ProtectedRoute>} />
      <Route path="/org/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
      <Route path="/org/statistics" element={<ProtectedRoute><OrgStatisticsPage /></ProtectedRoute>} />
      <Route path="/org/notifications" element={<ProtectedRoute><OrgNotificationsPage /></ProtectedRoute>} />
      <Route path="/org/profile" element={<ProtectedRoute><OrgProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
