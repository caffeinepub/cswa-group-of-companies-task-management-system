import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Search, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4 shadow-soft">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 p-2 ring-2 ring-primary/20">
            <img src="/assets/image-2.png" alt="CSWA Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">CSWA Group of Companies</h1>
            <p className="text-sm text-muted-foreground">Task Management System</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-foreground tracking-tight leading-tight">
                Welcome to <span className="text-primary">CSWA</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Streamline your consultancy operations with our comprehensive task management platform.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>Track client tasks and deadlines</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>Manage team assignments efficiently</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>Monitor revenue and payments</span>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="space-y-4">
            <Card className="shadow-soft-lg border-2 bg-card/95 backdrop-blur-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                <CardDescription className="text-base">
                  Access your dashboard using Internet Identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  size="lg"
                  className="w-full text-base font-semibold shadow-soft"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Sign in with Internet Identity
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
                  size="lg"
                  className="w-full text-base font-semibold"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Public Search
                </Button>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground text-center">
              Secure authentication powered by Internet Computer
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card/80 backdrop-blur-sm border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()}. Built with ❤️ using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

