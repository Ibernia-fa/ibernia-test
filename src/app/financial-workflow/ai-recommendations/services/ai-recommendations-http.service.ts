import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanAnalysisResponse } from '../models/ai-recommendations.model';

@Injectable({
  providedIn: 'root'
})
export class AiRecommendationsHttpService {
  constructor(private httpClient: HttpClient) { }

  analyzePlan(cashflowId: string): Observable<PlanAnalysisResponse> {
    return this.httpClient.get<PlanAnalysisResponse>(`/api/v1/agentic/plan?cashflowId=${cashflowId}`);
  }
}
