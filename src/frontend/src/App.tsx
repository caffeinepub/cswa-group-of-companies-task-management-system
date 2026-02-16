import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import LoginPage from './pages/LoginPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import MainLayout from './components/MainLayout';
import PublicSearchPage from './pages/PublicSearchPage';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  // Check if we're on the public search route
  const isPublicSearchRoute = window.location.pathname === '/search' || window.location.hash === '#/search';

  // Show public search page without authentication
  if (isPublicSearchRoute) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
        <PublicSearchPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
        <LoginPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show profile setup if user is authenticated but has no profile
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      {showProfileSetup && <ProfileSetupModal />}
      <MainLayout />
      <Toaster />
    </ThemeProvider>
  );
}
