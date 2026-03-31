import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanAnalysisResponse } from '../models/ai-recommendations.model';

export interface AgenticUsageResponse {
  used: number;
  limit: number;
}

export interface AnalyzePlanRequest {
  cashflowId: string;
  advisorGuidelines?: string | null;
  clientNotes?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AiRecommendationsHttpService {
  constructor(private httpClient: HttpClient) { }

  getUsage(): Observable<AgenticUsageResponse> {
    return this.httpClient.get<AgenticUsageResponse>('/api/v1/agentic/usage');
  }

  getSavedInsights(cashflowId: string): Observable<PlanAnalysisResponse> {
    return this.httpClient.get<PlanAnalysisResponse>(`/api/v1/agentic/insights/${cashflowId}`);
  }

  analyzePlan(request: AnalyzePlanRequest): Observable<PlanAnalysisResponse> {
    return this.httpClient.post<PlanAnalysisResponse>('/api/v1/agentic/plan', {
      cashflowId: request.cashflowId,
      advisorGuidelines: request.advisorGuidelines ?? undefined,
      clientNotes: request.clientNotes ?? undefined
    });
  }

  submitFeedback(cashflowId: string, providerName: string, rating: number): Observable<void> {
    return this.httpClient.post<void>('/api/v1/agentic/feedback', {
      cashflowId,
      providerName,
      rating
    });
  }
}
