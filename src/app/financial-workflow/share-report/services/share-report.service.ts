import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface ClientReportRequest {
  clientId: string;
  cashflowId: string;
  expiryDays: number;
  requestBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShareReportHttpService {

  constructor(private httpClient: HttpClient) { }

  addClientReport(clientReportRequest: ClientReportRequest) {
    return this.httpClient.post<any>(
      `/api/v1/ClientReport/share-client-report`,
      clientReportRequest
    );
  }
}
