/**
 * Price Alerts Page
 * Manage price alerts for external courses
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  ArrowLeft,
  Trash2,
  ExternalLink,
  DollarSign,
  TrendingDown,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplacePriceAlerts } from '@/hooks/useMarketplaceCourses';
import { ProviderBadge } from '@/components/marketplace/ProviderBadge';
import { CompactPrice } from '@/components/marketplace/PriceDisplay';

export default function PriceAlertsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { alerts, isLoading, deleteAlert, isDeleting } = useMarketplacePriceAlerts();

  // Not logged in
  if (!isAuthLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Bell className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view price alerts</h1>
          <p className="text-muted-foreground mb-6">
            Create an account or sign in to set up price alerts.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link to="/marketplace">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Courses
              </Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="h-6 w-6 text-amber-500" />
              <h1 className="text-2xl font-bold">Price Alerts</h1>
            </div>
            <p className="text-muted-foreground">
              Get notified when course prices drop to your target.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="h-20 w-32 bg-muted rounded" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 w-3/4 bg-muted rounded" />
                          <div className="h-4 w-1/2 bg-muted rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-16">
                <TrendingDown className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No price alerts</h2>
                <p className="text-muted-foreground mb-6">
                  Set up alerts on paid courses to get notified when prices drop.
                </p>
                <Button asChild>
                  <Link to="/marketplace">
                    Browse Marketplace
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <Card key={alert.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Thumbnail */}
                        {alert.course?.thumbnail_url && (
                          <img
                            src={alert.course.thumbnail_url}
                            alt={alert.course.title}
                            className="h-24 w-40 object-cover rounded flex-shrink-0"
                          />
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <ProviderBadge
                                provider={alert.course?.provider_slug || 'coursera'}
                                size="sm"
                                className="mb-2"
                              />
                              <h3 className="font-semibold truncate">
                                {alert.course?.title || 'Course'}
                              </h3>
                            </div>

                            {/* Status Badge */}
                            {alert.triggered_at ? (
                              <Badge className="bg-green-500 flex-shrink-0">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Triggered
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex-shrink-0">
                                <Clock className="mr-1 h-3 w-3" />
                                Active
                              </Badge>
                            )}
                          </div>

                          {/* Price Info */}
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Current:</span>
                              <CompactPrice
                                priceType={alert.course?.price_type || 'paid'}
                                amount={alert.course?.price_amount}
                                currency={alert.course?.price_currency}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-4 w-4 text-green-500" />
                              <span className="text-muted-foreground">Target:</span>
                              <span className="font-medium text-green-600">
                                ${alert.target_price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                              <a
                                href={alert.course?.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Course
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteAlert(alert.course_id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete Alert
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
