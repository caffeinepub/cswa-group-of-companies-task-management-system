import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Search, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handlePublicSearch = () => {
    navigate({ to: '/search' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/8 via-background to-accent/12 dark:from-primary/4 dark:via-background dark:to-accent/6 flex flex-col relative overflow-hidden">
      {/* Decorative background elements - reduced opacity in dark mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/8 dark:to-primary/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-accent/15 to-accent/5 dark:from-accent/8 dark:to-accent/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-secondary/8 to-transparent dark:from-secondary/4 dark:to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-accent/10 to-transparent dark:from-accent/5 dark:to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative bg-card/70 dark:bg-card/85 backdrop-blur-md border-b border-border/50 px-6 py-4 shadow-soft z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/25 dark:from-primary/20 dark:to-accent/20 p-2.5 ring-2 ring-primary/40 dark:ring-primary/30 shadow-soft">
            <img src="/assets/image-2.png" alt="CSWA Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-tight">CSWA Group of Companies</h1>
            <p className="text-sm text-muted-foreground">Task Management System</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 dark:from-primary/12 dark:to-accent/12 border border-primary/30 dark:border-primary/25 text-primary text-sm font-medium shadow-soft">
                <Sparkles className="h-4 w-4" />
                Professional Task Management
              </div>
              <h2 className="text-5xl font-bold leading-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Streamline Your Workflow
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Manage clients, tasks, and team members efficiently with our comprehensive task management system.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 group">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/15 dark:to-primary/8 flex items-center justify-center ring-2 ring-primary/30 dark:ring-primary/25 group-hover:scale-110 transition-transform">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Client Management</h3>
                  <p className="text-sm text-muted-foreground">Track and organize all your clients in one place</p>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 dark:from-secondary/15 dark:to-secondary/8 flex items-center justify-center ring-2 ring-secondary/30 dark:ring-secondary/25 group-hover:scale-110 transition-transform">
                  <div className="h-2 w-2 rounded-full bg-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Task Tracking</h3>
                  <p className="text-sm text-muted-foreground">Monitor progress and deadlines with ease</p>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 dark:from-accent/15 dark:to-accent/8 flex items-center justify-center ring-2 ring-accent/30 dark:ring-accent/25 group-hover:scale-110 transition-transform">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Team Collaboration</h3>
                  <p className="text-sm text-muted-foreground">Assign tasks and coordinate with your team</p>
                </div>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <Card className="shadow-colorful backdrop-blur-sm bg-card/95 dark:bg-card/98 border-border/50">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your dashboard and manage your tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-soft hover:shadow-colorful transition-all"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Login with Internet Identity
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                onClick={handlePublicSearch}
                variant="outline"
                className="w-full border-border hover:bg-accent/20 dark:hover:bg-accent/15 hover:border-primary/30 dark:hover:border-primary/25 transition-all"
                size="lg"
              >
                <Search className="mr-2 h-5 w-5" />
                Public Search
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By logging in, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-card/70 dark:bg-card/85 backdrop-blur-md border-t border-border/50 px-6 py-4 text-center text-sm text-muted-foreground z-10">
        © {new Date().getFullYear()}. Built with ❤️ using{' '}
        <a 
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
