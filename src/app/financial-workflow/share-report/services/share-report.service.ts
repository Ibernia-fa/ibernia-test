import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface ClientReportRequest {
  clientId: string;
  cashflowId: string;
  expiryDays: number;
  requestBy: string;
  /** When false, creates credentials without sending email. Omit or true to send as before. */
  sendEmail?: boolean;
}

export interface ClientReportShareResponse {
  success: boolean;
  message?: string;
  shareableUrl?: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShareReportHttpService {

  constructor(private httpClient: HttpClient) { }

  addClientReport(clientReportRequest: ClientReportRequest) {
    return this.httpClient.post<ClientReportShareResponse>(
      `/api/v1/ClientReport/share-client-report`,
      clientReportRequest
    );
  }
}
