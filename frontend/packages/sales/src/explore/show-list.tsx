
import { Calendar, ChevronDown } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { cn } from "@truths/ui/lib/utils";
import { 
  type Event,
  type Show,
  type ShowImage,
} from "@truths/ticketing";

export interface ShowWithEvents extends Show {
  events: Event[];
  bannerImage?: ShowImage;
}

interface ShowListProps {
  isLoading: boolean;
  shows: ShowWithEvents[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onShowClick: (show: ShowWithEvents) => void;
}

export function ShowList({
  isLoading,
  shows,
  hasActiveFilters,
  onClearFilters,
  onShowClick,
}: ShowListProps) {
  const density = useDensityStyles();
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-t-lg" />
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className={cn("font-semibold mb-2", density.textSizeCardTitle)}>No shows found</h3>
            <p className={cn("text-muted-foreground", density.textSizeCardDescription)}>
              {hasActiveFilters
                ? "Try adjusting your filters to see more shows."
                : "No shows with upcoming events available at the moment."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={onClearFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {shows.map((show) => {
        const hasEvents = show.events.length > 0;

        return (
          <Card 
            key={show.id} 
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onShowClick(show)}
          >
            {/* Banner Image */}
            {show.bannerImage?.file_url ? (
              <div className="relative h-48 w-full overflow-hidden bg-muted">
                <img
                  src={show.bannerImage.file_url}
                  alt={show.bannerImage.name || show.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide image on error
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              // Placeholder when no banner image
              <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className={cn("mb-2", density.textSizeCardTitle)}>{show.name}</CardTitle>
                  {show.code && (
                    <p className={cn("text-muted-foreground", density.textSizeCardDescription)}>
                      Code: {show.code}
                    </p>
                  )}
                  {show.started_date && show.ended_date && (
                    <p className={cn("text-muted-foreground mt-1", density.textSizeCardDescription)}>
                      {formatDate(new Date(show.started_date))} -{" "}
                      {formatDate(new Date(show.ended_date))}
                    </p>
                  )}
                </div>
                {hasEvents && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowClick(show);
                    }}
                    className="ml-4"
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    View Events ({show.events.length})
                  </Button>
                )}
              </div>
            </CardHeader>

            {!hasEvents && (
              <CardContent>
                <p className={cn("text-muted-foreground", density.textSizeCardDescription)}>
                  No events available for this show.
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
