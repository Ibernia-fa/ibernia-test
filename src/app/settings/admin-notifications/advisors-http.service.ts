import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdvisorSearchResult {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AdvisorsHttpService {
  private readonly baseUrl = '/api/v1/Advisors';

  constructor(private http: HttpClient) {}

  search(query: string, limit = 20): Observable<AdvisorSearchResult[]> {
    const params = { q: query || '', limit: limit.toString() };
    return this.http.get<AdvisorSearchResult[]>(`${this.baseUrl}/search`, { params });
  }
}
