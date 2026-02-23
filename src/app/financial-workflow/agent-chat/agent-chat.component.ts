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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
