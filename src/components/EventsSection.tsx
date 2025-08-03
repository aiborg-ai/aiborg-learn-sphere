import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "./EventCard";
import { useEvents } from "@/hooks/useEvents";
import { useEventRegistrations } from "@/hooks/useEventRegistrations";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar,
  Users,
  MapPin,
  Filter,
  ChevronDown,
  Sparkles,
  Star,
  TrendingUp
} from "lucide-react";

const filterOptions = [
  { id: "all", label: "All Events", count: 0 },
  { id: "upcoming", label: "Upcoming", count: 0 },
  { id: "registered", label: "My Registrations", count: 0 },
];

export function EventsSection() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { events, loading, error } = useEvents();
  const { registrations } = useEventRegistrations();
  const { user } = useAuth();

  // Filter events based on selected filter
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.event_date);
    const today = new Date();
    
    switch (selectedFilter) {
      case "upcoming":
        return eventDate >= today;
      case "registered":
        return user && registrations.some(reg => reg.event_id === event.id);
      default:
        return true;
    }
  });

  // Update filter counts
  const updatedFilterOptions = filterOptions.map(option => ({
    ...option,
    count: option.id === "all" ? events.length :
           option.id === "upcoming" ? events.filter(e => new Date(e.event_date) >= new Date()).length :
           option.id === "registered" ? registrations.length : 0
  }));

  const getFilterButtonStyle = (filterId: string) => {
    const isSelected = selectedFilter === filterId;
    const baseStyle = "text-sm transition-all duration-200 hover:scale-105";
    
    if (isSelected) {
      return `${baseStyle} bg-primary text-primary-foreground shadow-md`;
    }
    return `${baseStyle} bg-background border border-border hover:bg-muted`;
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading events...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-destructive">Error loading events: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Calendar className="h-4 w-4" />
            <span>Networking & Events</span>
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Join Our Events</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Connect with AI enthusiasts, entrepreneurs, and industry leaders at our exclusive networking events. 
            Build meaningful relationships and discover new opportunities in the AI ecosystem.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 border-primary/20">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary mb-2">{events.length}+</div>
            <div className="text-sm text-muted-foreground">Upcoming Events</div>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 border-secondary/20">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div className="text-2xl font-bold text-secondary-foreground mb-2">500+</div>
            <div className="text-sm text-muted-foreground">Network Members</div>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 border-accent/20">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="text-2xl font-bold text-accent-foreground mb-2">London</div>
            <div className="text-sm text-muted-foreground">Prime Locations</div>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {updatedFilterOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedFilter === option.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(option.id)}
                className={getFilterButtonStyle(option.id)}
                disabled={option.id === "registered" && !user}
              >
                {option.label}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Authentication prompt for registered filter */}
        {selectedFilter === "registered" && !user && (
          <Card className="p-8 text-center mb-8 bg-muted/50">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Sign in to view your registrations</h3>
            <p className="text-muted-foreground mb-4">
              Log in to see the events you've registered for and manage your participation.
            </p>
            <Button className="btn-hero">
              Sign In
            </Button>
          </Card>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No events found</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedFilter === "upcoming" && "No upcoming events at the moment."}
                  {selectedFilter === "registered" && "You haven't registered for any events yet."}
                  {selectedFilter === "all" && "No events available at the moment."}
                </p>
                {selectedFilter !== "all" && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedFilter("all")}
                  >
                    View All Events
                  </Button>
                )}
              </Card>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}