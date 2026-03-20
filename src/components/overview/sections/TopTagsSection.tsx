/**
 * TopTagsSection
 *
 * Top Tags list card — replaces DomainsSection on the overview page.
 * Uses SectionCard for the consistent header pattern.
 */

import { Tag } from "lucide-react";
import { InlineState } from "@/components/ui/InlineState";
import { OverviewData } from "@/hooks/useOverviewData";
import { SectionCard } from "../cards/SectionCard";

type Props = {
  query: OverviewData["topTags"];
};

export function TopTagsSection({ query }: Props) {
  const { data: tags, isLoading, error, refetch } = query;

  return (
    <SectionCard
      title="Top Tags"
      icon={<Tag size={16} className="text-purple-600" />}
      isLoading={isLoading}
      viewAllHref="/tags"
    >
      {isLoading && (
        <InlineState type="loading" message="Loading tags..." />
      )}

      {error && (
        <InlineState
          type="error"
          message="Failed to load tags."
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && tags?.length === 0 && (
        <InlineState type="empty" message="No tags available." />
      )}

      {!isLoading && !error && tags && tags.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm text-gray-700">{tag.name}</span>
                {/* <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                  {tag.tag_type}
                </span> */}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {tag.total_assets} {tag.total_assets === 1 ? "asset" : "assets"}
              </span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
