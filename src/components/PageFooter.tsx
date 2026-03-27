import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import type { MutateOptions } from "@tanstack/react-query";
import type { YTVideo } from "#/types/yt";

interface PageFooterProps {
  isFirebaseEmpty: boolean;
  hasNextSavedPage: boolean;
  isLoadingSaved: boolean;
  isFetchingSavedNext: boolean;
  shouldLoadAllSaved: boolean;
  isRefreshing: boolean;
  shouldLoadAll: boolean;
  refreshForNew: (
    variables: void,
    options?: MutateOptions<YTVideo[], Error, void, unknown> | undefined,
  ) => void;
  setShouldLoadAllSaved: (open: boolean) => void;
  setShouldLoadAll: (open: boolean) => void;
}

function PageFooter({
  isFirebaseEmpty,
  hasNextSavedPage,
  isRefreshing,
  isLoadingSaved,
  isFetchingSavedNext,
  shouldLoadAll,
  shouldLoadAllSaved,
  setShouldLoadAllSaved,
  setShouldLoadAll,
  refreshForNew,
}: PageFooterProps) {
  return (
    <footer className="max-w-7xl fixed bottom-24 left-1/2 -translate-x-1/2 w-full flex justify-center z-10 px-4">
      {!isFirebaseEmpty ? (
        <div className="flex flex-col md:flex-row gap-4 bg-background/80 backdrop-blur p-2 rounded-lg shadow-lg border">
          {hasNextSavedPage && (
            <Button
              onClick={() => setShouldLoadAllSaved(true)}
              size="sm"
              disabled={
                isLoadingSaved || isFetchingSavedNext || shouldLoadAllSaved
              }
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${shouldLoadAllSaved ? "animate-spin" : ""}`}
              />
              Sync Full Channel
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => refreshForNew()}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Check for New
          </Button>
        </div>
      ) : (
        <Button onClick={() => setShouldLoadAll(true)} size="sm">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${shouldLoadAll ? "animate-spin" : ""}`}
          />{" "}
          Sync Full Channel
        </Button>
      )}
    </footer>
  );
}

export default PageFooter;
