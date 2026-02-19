export interface RecommendationItem {
  action: string;
  why: string;
  impact: string;
}

export interface PlanAnalysisResponse {
  recommendations: RecommendationItem[];
}
