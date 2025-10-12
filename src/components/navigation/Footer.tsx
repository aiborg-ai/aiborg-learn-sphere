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
} from 'lucide-react';

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
    <footer className="bg-gradient-to-b from-secondary/20 to-background border-t">
      {/* Newsletter Section */}
      <div className="bg-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated with AI Insights</h3>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter for the latest AI education news, course updates, and
              exclusive resources
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-md border border-input bg-background"
              />
              <Button type="submit" className="btn-hero">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src="/logo.jpeg" alt="Aiborg" className="h-12 w-auto object-contain" />
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
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-semibold mb-4">Our Programs</h4>
            <ul className="space-y-2">
              {programs.map(program => (
                <li key={program.label}>
                  <Link
                    to={program.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {program.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              {resources.map(resource => (
                <li key={resource.label}>
                  {resource.isModal ? (
                    <button className="text-muted-foreground hover:text-foreground transition-colors text-sm text-left">
                      {resource.label}
                    </button>
                  ) : (
                    <Link
                      to={resource.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {resource.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            © {currentYear} Aiborg™. All rights reserved. Powered by AI innovation.
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map(social => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
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
