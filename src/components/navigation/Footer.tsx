import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from '@/components/ui/icons';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  ];

  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/#training-programs' },
    { label: 'Blog', href: '/blog' },
    { label: 'Events', href: '/#events' },
    { label: 'Reviews', href: '/#reviews' },
    { label: 'About', href: '/#about' },
  ];

  const resources = [
    { label: 'FAQ', href: '#', isModal: true },
    { label: 'Terms & Conditions', href: '#', isModal: true },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Contact Us', href: '/#contact' },
    { label: 'Support', href: '/support' },
  ];

  const programs = [
    { label: 'AI Fundamentals', href: '/#training-programs' },
    { label: 'Machine Learning', href: '/#training-programs' },
    { label: 'Data Science', href: '/#training-programs' },
    { label: 'Deep Learning', href: '/#training-programs' },
    { label: 'NLP & Computer Vision', href: '/#training-programs' },
  ];

  return (
    <footer className="bg-gradient-to-b from-muted/30 via-background to-background border-t border-border/50">
      {/* Newsletter Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/10 to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary rounded-full">
              Newsletter
            </span>
            <h3 className="text-section-heading mb-4">Stay Updated with AI Insights</h3>
            <p className="text-body-lg mb-8 max-w-xl mx-auto">
              Subscribe to our newsletter for the latest AI education news, course updates, and
              exclusive resources.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 rounded-xl border-2 border-border bg-background/80 backdrop-blur-sm
                         focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
                         transition-all duration-200 text-sm placeholder:text-muted-foreground/60"
              />
              <Button type="submit" variant="hero" size="lg" className="whitespace-nowrap">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              Join 10,000+ learners. No spam, unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <picture>
                <source srcSet="/logo.webp" type="image/webp" />
                <img src="/logo.jpeg" alt="Aiborg" className="h-12 w-auto object-contain" />
              </picture>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Empowering the future with AI education. Learn, grow, and innovate with Aiborg's
              comprehensive training programs.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@aiborg.ai" className="hover:text-foreground transition-colors">
                  info@aiborg.ai
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+1234567890" className="hover:text-foreground transition-colors">
                  +1 (234) 567-890
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>123 AI Street, Tech City, TC 12345</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-5 text-foreground">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-all duration-200 text-sm inline-flex items-center gap-1.5 hover:translate-x-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-display font-semibold mb-5 text-foreground">Our Programs</h4>
            <ul className="space-y-3">
              {programs.map(program => (
                <li key={program.label}>
                  <Link
                    to={program.href}
                    className="text-muted-foreground hover:text-primary transition-all duration-200 text-sm inline-flex items-center gap-1.5 hover:translate-x-1"
                  >
                    {program.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold mb-5 text-foreground">Resources</h4>
            <ul className="space-y-3">
              {resources.map(resource => (
                <li key={resource.label}>
                  {resource.isModal ? (
                    <button className="text-muted-foreground hover:text-primary transition-all duration-200 text-sm text-left inline-flex items-center gap-1.5 hover:translate-x-1">
                      {resource.label}
                    </button>
                  ) : (
                    <Link
                      to={resource.href}
                      className="text-muted-foreground hover:text-primary transition-all duration-200 text-sm inline-flex items-center gap-1.5 hover:translate-x-1"
                    >
                      {resource.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-border/50" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            © {currentYear} <span className="font-semibold text-foreground">Aiborg™</span>. All
            rights reserved.
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {socialLinks.map(social => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  aria-label={social.label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
