import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import {
  AgentChatHttpService,
  AgentConversation,
  AgentMessage,
  ConversationWithMessages
} from './agent-chat-http.service';

export type MessageDisplayType = 'text' | 'list' | 'table' | 'sections';

export interface MessageDisplaySection {
  title: string;
  tableHeaders?: string[];
  tableRows?: unknown[][];
  list?: unknown[];
}

export interface MessageDisplay {
  type: MessageDisplayType;
  text?: string;
  list?: unknown[];
  tableHeaders?: string[];
  tableRows?: unknown[][];
  sections?: MessageDisplaySection[];
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  selector: 'app-agent-chat',
  templateUrl: './agent-chat.component.html',
  styleUrl: './agent-chat.component.scss'
})
export class AgentChatComponent implements OnInit, OnDestroy {
  cashflowId: string;
  conversationId: string | null = null;
  messages: AgentMessage[] = [];
  conversations: AgentConversation[] = [];
  inputText = '';
  loading = false;
  sending = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private navItemService: NavItemService,
    private chatService: AgentChatHttpService
  ) {
    this.navItemService.currentRouteName = 'AI Chat';
  }

  ngOnInit(): void {
    this.cashflowId = this.route.snapshot.params['id'];
    if (!this.cashflowId) return;
    this.loadConversations();
  }

  loadConversations(): void {
    this.chatService.getConversations(this.cashflowId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (list) => {
        this.conversations = list || [];
        if (this.conversations.length > 0 && !this.conversationId) {
          this.selectConversation(this.conversations[0].id);
        }
      },
      error: () => (this.error = 'Failed to load conversations')
    });
  }

  selectConversation(id: string): void {
    this.conversationId = id;
    this.loading = true;
    this.error = null;
    this.chatService.getConversation(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: ConversationWithMessages) => {
        this.messages = res?.messages ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load messages';
        this.loading = false;
      }
    });
  }

  startNewConversation(): void {
    this.sending = true;
    this.error = null;
    this.chatService.createConversation(this.cashflowId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (conv) => {
        this.conversations = [conv, ...this.conversations];
        this.conversationId = conv.id;
        this.messages = [];
        this.sending = false;
      },
      error: () => {
        this.error = 'Failed to create conversation';
        this.sending = false;
      }
    });
  }

  send(): void {
    const content = this.inputText?.trim();
    if (!content || !this.conversationId) return;

    this.sending = true;
    this.error = null;
    this.inputText = '';

    this.messages = [...this.messages, { id: '', conversationId: this.conversationId, role: 'User', content, created: new Date().toISOString() }];

    this.chatService.sendMessage(this.conversationId, content).pipe(takeUntil(this.destroy$)).subscribe({
      next: (reply) => {
        this.messages = [...this.messages, reply];
        this.sending = false;
      },
      error: () => {
        this.error = 'Failed to send message';
        this.sending = false;
      }
    });
  }

  /**
   * Extracts JSON from content: strips markdown code blocks (```json ... ```) and/or finds outermost [...] or {...}.
   */
  private extractJson(content: string): string | null {
    let s = content.trim();
    // Strip markdown code block
    const codeBlockMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) s = codeBlockMatch[1].trim();
    // Find outermost array or object
    const arrayStart = s.indexOf('[');
    const objectStart = s.indexOf('{');
    let start = -1;
    let endChar = '';
    if (arrayStart >= 0 && (objectStart < 0 || arrayStart < objectStart)) {
      start = arrayStart;
      endChar = ']';
    } else if (objectStart >= 0) {
      start = objectStart;
      endChar = '}';
    }
    if (start < 0 || !endChar) return null;
    const end = s.lastIndexOf(endChar);
    if (end <= start) return null;
    return s.slice(start, end + 1);
  }

  /**
   * Interprets assistant message content. Prefer chat-style text; only treat as structured (list/table/sections) when content clearly looks like JSON.
   */
  getMessageDisplay(content: string): MessageDisplay {
    if (!content?.trim()) return { type: 'text', text: '' };

    const trimmed = content.trim();
    // Prefer prose: if response doesn't look like JSON (starts with { or [ or has ```json), show as text
    const looksLikeJson = /^\s*(\{|\[)|```json/.test(trimmed);
    if (!looksLikeJson) return { type: 'text', text: content };

    const jsonStr = this.extractJson(content);
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr) as unknown;

        if (Array.isArray(parsed)) {
          if (parsed.length === 0) return { type: 'list', list: [] };
          const first = parsed[0];
          if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
            const keys = Object.keys(first as Record<string, unknown>);
            const allSameKeys = parsed.every(
              (item) => typeof item === 'object' && item !== null && Object.keys(item as object).join(',') === keys.join(',')
            );
            if (allSameKeys && keys.length > 0) {
              const tableRows = (parsed as Record<string, unknown>[]).map((row) =>
                keys.map((k) => row[k] != null ? String(row[k]) : '')
              );
              return { type: 'table', tableHeaders: keys, tableRows };
            }
          }
          return { type: 'list', list: parsed };
        }

        if (typeof parsed === 'object' && parsed !== null) {
          const obj = parsed as Record<string, unknown>;
          const arrayKeys = Object.keys(obj).filter((k) => Array.isArray(obj[k]));
          // Multiple arrays (e.g. income + expenses) -> sections
          if (arrayKeys.length > 0) {
            const sections: MessageDisplaySection[] = arrayKeys.map((key) => {
              const arr = obj[key] as unknown[];
              const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
              if (arr.length === 0) return { title, list: [] };
              const first = arr[0];
              if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
                const keys = Object.keys(first as Record<string, unknown>);
                const allSame = arr.every(
                  (item) => typeof item === 'object' && item !== null && Object.keys(item as object).join(',') === keys.join(',')
                );
                if (allSame && keys.length > 0) {
                  const tableRows = (arr as Record<string, unknown>[]).map((row) =>
                    keys.map((k) => row[k] != null ? String(row[k]) : '')
                  );
                  return { title, tableHeaders: keys, tableRows };
                }
              }
              return { title, list: arr };
            });
            return { type: 'sections', sections };
          }
        }
      } catch {
        // Fall through to text
      }
    }

    return { type: 'text', text: content };
  }

  formatListItem(item: unknown): string {
    if (item == null) return '';
    if (typeof item === 'object' && !Array.isArray(item)) {
      return Object.entries(item as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${v ?? ''}`)
        .join(' · ');
    }
    return String(item);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
