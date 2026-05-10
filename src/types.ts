export type Visibility = "private" | "team" | "public";

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

