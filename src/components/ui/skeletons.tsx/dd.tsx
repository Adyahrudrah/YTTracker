import { Card, CardContent } from "../card";

export function VideoCardSkeleton() {
  return (
    <Card className="border-none bg-transparent shadow-none">
      {/* Thumbnail Skeleton */}
      <div className="relative aspect-video w-full rounded-xl bg-muted animate-pulse" />

      {/* Metadata Skeleton */}
      <CardContent className="px-1 py-3 space-y-3">
        {/* Title Lines */}
        <div className="space-y-2">
          <div className="h-4 w-[90%] rounded bg-muted animate-pulse" />
          <div className="h-4 w-[60%] rounded bg-muted animate-pulse" />
        </div>

        {/* Stats Line */}
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          <div className="h-3 w-3 rounded-full bg-muted/40 animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
