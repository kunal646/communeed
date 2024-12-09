import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full p-4 flex justify-between items-center border-b">
        <h1 className="text-2xl font-bold">InsightMinds</h1>
      </nav>

      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Connect. Heal. Grow.
          </h1>

          <p className="text-xl text-muted-foreground">
            A secure platform bridging therapists and clients through AI-enhanced communication.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Create Account
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">
            <div>
              <h3 className="font-semibold mb-2">Secure Communication (WIP, not implemented)</h3>
              <p className="text-sm text-muted-foreground">End-to-end encrypted messaging between therapists and clients</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">AI-Enhanced Support</h3>
              <p className="text-sm text-muted-foreground">Intelligent assistance to support therapeutic communication</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Easy to Use</h3>
              <p className="text-sm text-muted-foreground">Simple, intuitive interface for seamless interaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
