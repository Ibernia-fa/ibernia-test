import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Client } from './client';

@Injectable({
  providedIn: 'root'
})
export class ClientHttpService {

  constructor(
    private httpClient: HttpClient
  ) { }

  searchClients(query: string) {
    return this.httpClient.get<Array<Client>>(`${environment.apiUrl}api/v1/Clients/search?searchTerm=${query}`)
  }
  getClients() {
    return this.httpClient.get<Array<Client>>(`${environment.apiUrl}api/v1/Clients`)
  }

  getClient(id: string) {
    return this.httpClient.get<Client>(`${environment.apiUrl}api/v1/Clients/${id}`)
  }

  addClient(client: Client) {
    return this.httpClient.post(`${environment.apiUrl}api/v1/Clients`, client)
  }
  
  updateClient(client: Client) {
    return this.httpClient.put(`${environment.apiUrl}api/v1/Clients`, client)
  }
  deleteClient(clientId: string) {
    return this.httpClient.delete(`${environment.apiUrl}api/v1/Clients/${clientId}`, {
      responseType: "text"
    })
  }
}
