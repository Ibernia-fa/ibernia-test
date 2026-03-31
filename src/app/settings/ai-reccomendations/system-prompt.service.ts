import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SystemPromptResponse {
  key: string;
  content: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface UpdateSystemPromptRequest {
  key: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class SystemPromptService {
  private readonly baseUrl = '/api/v1/admin/system-prompt';

  constructor(private http: HttpClient) {}

  getPrompt(key: string): Observable<SystemPromptResponse> {
    return this.http.get<SystemPromptResponse>(this.baseUrl, { params: { key } });
  }

  updatePrompt(request: UpdateSystemPromptRequest): Observable<void> {
    return this.http.put<void>(this.baseUrl, request);
  }
}
