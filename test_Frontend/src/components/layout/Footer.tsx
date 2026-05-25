import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-primary tracking-tight">Savion</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Premium student living made easy. Find, book, and thrive in your next home.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider">Company</h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary">About Us</Link></li>
            <li><Link href="/careers" className="text-sm text-muted-foreground hover:text-primary">Careers</Link></li>
            <li><Link href="/press" className="text-sm text-muted-foreground hover:text-primary">Press</Link></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider">Support</h4>
          <ul className="space-y-2">
            <li><Link href="/help-center" className="text-sm text-muted-foreground hover:text-primary">Help Center</Link></li>
            <li><Link href="/safety" className="text-sm text-muted-foreground hover:text-primary">Safety</Link></li>
            <li><Link href="/cancellation-options" className="text-sm text-muted-foreground hover:text-primary">Cancellation Options</Link></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2">
            <li><Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link></li>
            <li><Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
            <li><Link href="/cookie-policy" className="text-sm text-muted-foreground hover:text-primary">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-6 mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Savion. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="#" className="text-muted-foreground hover:text-primary">Facebook</Link>
          <Link href="#" className="text-muted-foreground hover:text-primary">Twitter</Link>
          <Link href="#" className="text-muted-foreground hover:text-primary">Instagram</Link>
        </div>
      </div>
    </footer>
  );
}
