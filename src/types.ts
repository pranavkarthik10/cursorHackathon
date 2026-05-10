export type Visibility = "private" | "team" | "org" | "public";

export const VISIBILITIES: Visibility[] = ["public", "org", "team", "private"];

export type InsightCard = {
  title: string;
  problem: string;
  environment: string;
  fix: string;
  visibility: Visibility;
};

export type InsightRow = InsightCard & {
  id: string;
  created_at: string;
  rank?: number;
};

