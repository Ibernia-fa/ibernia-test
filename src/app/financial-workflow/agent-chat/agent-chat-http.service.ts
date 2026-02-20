import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AgentConversation {
  id: string;
  cashflowId: string;
  advisorId: string;
  created: string;
  updated: string;
}

export interface AgentMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  created: string;
}

export interface ConversationWithMessages {
  conversation: AgentConversation;
  messages: AgentMessage[];
}

@Injectable({ providedIn: 'root' })
export class AgentChatHttpService {
  private readonly base = '/api/v1/agentic';

  constructor(private http: HttpClient) {}

  createConversation(cashflowId: string): Observable<AgentConversation> {
    return this.http.post<AgentConversation>(`${this.base}/conversations`, { cashflowId });
  }

  getConversations(cashflowId: string): Observable<AgentConversation[]> {
    return this.http.get<AgentConversation[]>(`${this.base}/conversations?cashflowId=${encodeURIComponent(cashflowId)}`);
  }

  getConversation(id: string): Observable<ConversationWithMessages> {
    return this.http.get<ConversationWithMessages>(`${this.base}/conversations/${id}`);
  }

  sendMessage(conversationId: string, content: string): Observable<AgentMessage> {
    return this.http.post<AgentMessage>(`${this.base}/conversations/${conversationId}/messages`, { content });
  }
}
