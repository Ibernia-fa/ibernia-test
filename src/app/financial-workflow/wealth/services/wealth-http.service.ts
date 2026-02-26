import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  WealthDashboardModel,
  AddWealthAssetRequest,
  UpdateWealthAssetRequest,
  AddWealthLiabilityRequest,
  UpdateWealthLiabilityRequest
} from '../models/wealth.model';

@Injectable({ providedIn: 'root' })
export class WealthHttpService {
  private baseUrl = '/api/v1/wealth';

  constructor(private http: HttpClient) {}

  getDashboard(cashflowId: string): Observable<WealthDashboardModel> {
    return this.http.get<WealthDashboardModel>(`${this.baseUrl}/${cashflowId}`);
  }

  addAsset(cashflowId: string, request: AddWealthAssetRequest): Observable<WealthDashboardModel> {
    return this.http.post<WealthDashboardModel>(`${this.baseUrl}/${cashflowId}/assets`, request);
  }

  updateAsset(cashflowId: string, request: UpdateWealthAssetRequest): Observable<WealthDashboardModel> {
    return this.http.put<WealthDashboardModel>(`${this.baseUrl}/${cashflowId}/assets`, request);
  }

  deleteAsset(cashflowId: string, assetId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${cashflowId}/assets/${assetId}`);
  }

  updateAssetLiquidity(cashflowId: string, assetId: string, liquidity: string): Observable<WealthDashboardModel> {
    return this.http.put<WealthDashboardModel>(
      `${this.baseUrl}/${cashflowId}/assets/${assetId}/liquidity`,
      { liquidity }
    );
  }

  addLiability(cashflowId: string, request: AddWealthLiabilityRequest): Observable<WealthDashboardModel> {
    return this.http.post<WealthDashboardModel>(`${this.baseUrl}/${cashflowId}/liabilities`, request);
  }

  updateLiability(cashflowId: string, request: UpdateWealthLiabilityRequest): Observable<WealthDashboardModel> {
    return this.http.put<WealthDashboardModel>(`${this.baseUrl}/${cashflowId}/liabilities`, request);
  }

  deleteLiability(cashflowId: string, liabilityId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${cashflowId}/liabilities/${liabilityId}`);
  }
}
