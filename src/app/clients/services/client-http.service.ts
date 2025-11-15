import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Client } from '../models/client';

@Injectable({
  providedIn: 'root'
})
export class ClientHttpService {

  readonly CLIENT_URL_PREFIX = '/api/v1/Clients';
  constructor(
    private httpClient: HttpClient
  ) { }

  searchClients(query: string) {
    return this.httpClient.get<Array<Client>>(`${this.CLIENT_URL_PREFIX}/search?searchTerm=${query}`)
  }
  getClients(advisorId: string) {
    return this.httpClient.get<Array<Client>>(`${this.CLIENT_URL_PREFIX}/${advisorId}/all`)
  }

  getClient(id: string) {
    return this.httpClient.get<Client>(`${this.CLIENT_URL_PREFIX}/${id}`)
  }

  addClient(client: Client) {
    return this.httpClient.post<Client>(`${this.CLIENT_URL_PREFIX}`, client)
  }
  
  updateClient(client: Client) {
    return this.httpClient.put(`${this.CLIENT_URL_PREFIX}`, client)
  }
  deleteClient(clientId: string) {
    return this.httpClient.delete(`${this.CLIENT_URL_PREFIX}/${clientId}`, {
      responseType: "text"
    })
  }
}
