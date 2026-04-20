import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LegacyDashboardModel,
  AddFamilyMemberRequest,
  UpdateFamilyMemberRequest,
  CompletePartnerProfileRequest,
  UpdateParentEstateRequest,
  UpdateTaxSettingsRequest,
  SaveBeneficiaryRuleRequest,
  ScenarioResultModel,
  ScenarioType
} from '../models/legacy.model';

@Injectable({ providedIn: 'root' })
export class LegacyHttpService {
  private baseUrl = '/api/v1/legacy';

  constructor(private http: HttpClient) {}

  getDashboard(cashflowId: string): Observable<LegacyDashboardModel> {
    return this.http.get<LegacyDashboardModel>(`${this.baseUrl}/${cashflowId}`);
  }

  addFamilyMember(cashflowId: string, request: AddFamilyMemberRequest): Observable<LegacyDashboardModel> {
    return this.http.post<LegacyDashboardModel>(`${this.baseUrl}/${cashflowId}/members`, request);
  }

  updateFamilyMember(cashflowId: string, request: UpdateFamilyMemberRequest): Observable<LegacyDashboardModel> {
    return this.http.put<LegacyDashboardModel>(`${this.baseUrl}/${cashflowId}/members`, request);
  }

  completePartnerProfile(
    cashflowId: string,
    request: CompletePartnerProfileRequest,
  ): Observable<LegacyDashboardModel> {
    return this.http.post<LegacyDashboardModel>(
      `${this.baseUrl}/${cashflowId}/members/complete-partner-profile`,
      request,
    );
  }

  removeFamilyMember(cashflowId: string, memberId: string): Observable<LegacyDashboardModel> {
    return this.http.delete<LegacyDashboardModel>(`${this.baseUrl}/${cashflowId}/members/${memberId}`);
  }

  updateParentEstate(cashflowId: string, request: UpdateParentEstateRequest): Observable<LegacyDashboardModel> {
    return this.http.put<LegacyDashboardModel>(`${this.baseUrl}/${cashflowId}/parent-estates`, request);
  }

  updateTaxSettings(cashflowId: string, request: UpdateTaxSettingsRequest): Observable<LegacyDashboardModel> {
    return this.http.put<LegacyDashboardModel>(`${this.baseUrl}/${cashflowId}/tax-settings`, request);
  }

  saveBeneficiaryRule(cashflowId: string, request: SaveBeneficiaryRuleRequest): Observable<LegacyDashboardModel> {
    return this.http.put<LegacyDashboardModel>(`${this.baseUrl}/${cashflowId}/beneficiary-rules`, request);
  }

  deleteBeneficiaryRule(cashflowId: string, scenario: ScenarioType): Observable<LegacyDashboardModel> {
    return this.http.delete<LegacyDashboardModel>(`${this.baseUrl}/${cashflowId}/beneficiary-rules/${scenario}`);
  }

  simulateScenario(cashflowId: string, scenario: ScenarioType): Observable<ScenarioResultModel> {
    return this.http.get<ScenarioResultModel>(`${this.baseUrl}/${cashflowId}/simulate/${scenario}`);
  }
}
