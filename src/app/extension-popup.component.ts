import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailInputComponent } from './components/email-input/email-input.component';
import { IntentSummaryCardComponent } from './components/intent-summary-card/intent-summary-card.component';
import { RiskPanelComponent } from './components/risk-panel/risk-panel.component';
import { ReplyDraftsComponent } from './components/reply-drafts/reply-drafts.component';
import { QuestionsCardComponent } from './components/questions-card/questions-card.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReplywiseApiService } from './services/replywise-api.service';
import { GenerateResponse, ReplyDraft } from './models/replywise.models';
import { fadeIn, slideIn } from './app.animations';

@Component({
  selector: 'app-extension-popup',
  standalone: true,
  imports: [
    CommonModule,
    EmailInputComponent,
    IntentSummaryCardComponent,
    RiskPanelComponent,
    ReplyDraftsComponent,
    QuestionsCardComponent,
    MatProgressBarModule,
    MatCardModule,
    MatSnackBarModule
  ],
  template: `
    <div class="extension-container">
      <div class="extension-header">
        <h1>✨ ReplyWise</h1>
        <p class="subtitle">AI-Powered Email Replies</p>
      </div>

      <div class="extension-content">
        <app-email-input
          [emailText]="emailText()"
          [context]="context()"
          [loading]="loading()"
          [demoMode]="false"
          [sampleEmail]="apiService.SAMPLE_EMAIL"
          (emailTextChange)="onEmailTextChange($event)"
          (contextChange)="onContextChange($event)"
          (generateClick)="onGenerate()">
        </app-email-input>

        @if (loading() && !hasResults()) {
          <mat-card class="loading-card" @fadeIn>
            <mat-card-content>
              <div class="loading-content">
                <div class="spinner"></div>
                <p>Crafting your perfect reply...</p>
              </div>
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            </mat-card-content>
          </mat-card>
        }

        @if (hasResults()) {
          <div class="results-section" @fadeIn>
            <app-intent-summary-card
              [intentSummary]="generateResponse()!.intent_summary">
            </app-intent-summary-card>

            <app-reply-drafts
              [replyDrafts]="generateResponse()!.reply_drafts"
              [originalEmail]="emailText()"
              [loading]="loading()"
              (selectedTabChange)="onDraftSelect($event)">
            </app-reply-drafts>

            <app-questions-card
              [questions]="generateResponse()!.questions_to_ask"
              [selectedDraftBody]="selectedDraft()?.body || ''">
            </app-questions-card>

            <app-risk-panel
              [risk]="generateResponse()!.risk">
            </app-risk-panel>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .extension-container {
      width: 500px;
      max-height: 700px;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .extension-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    .extension-header h1 {
      font-size: 24px;
      margin: 0 0 5px 0;
      font-weight: 700;
    }

    .subtitle {
      font-size: 12px;
      opacity: 0.9;
      margin: 0;
    }

    .extension-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f8f9fa;
    }

    .loading-card {
      margin-top: 16px;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .results-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    mat-card {
      border-radius: 8px;
    }
  `],
  animations: [fadeIn, slideIn]
})
export class ExtensionPopupComponent {
  // State
  emailText = signal<string>('');
  context = signal<string>('');
  loading = signal<boolean>(false);
  generateResponse = signal<GenerateResponse | null>(null);
  selectedDraftIndex = signal<number>(0);

  // Computed properties
  hasResults = computed(() => this.generateResponse() !== null);
  selectedDraft = computed(() => {
    const response = this.generateResponse();
    if (!response || !response.reply_drafts.length) return null;
    return response.reply_drafts[this.selectedDraftIndex()];
  });

  constructor(
    public apiService: ReplywiseApiService,
    private snackBar: MatSnackBar
  ) {
    // Load email from chrome storage if available
    this.loadEmailFromStorage();
  }

  private loadEmailFromStorage(): void {
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
      (window as any).chrome.storage.local.get(['selectedEmail', 'lastEmail', 'lastContext'], (result: any) => {
        if (result.selectedEmail) {
          this.emailText.set(result.selectedEmail);
        } else if (result.lastEmail) {
          this.emailText.set(result.lastEmail);
        }
        if (result.lastContext) {
          this.context.set(result.lastContext);
        }
      });
    }
  }

  onEmailTextChange(text: string): void {
    this.emailText.set(text);
    // Save to chrome storage
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
      (window as any).chrome.storage.local.set({ lastEmail: text });
    }
  }

  onContextChange(text: string): void {
    this.context.set(text);
    // Save to chrome storage
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
      (window as any).chrome.storage.local.set({ lastContext: text });
    }
  }

  onGenerate(): void {
    const email = this.emailText().trim();

    if (!email) {
      this.snackBar.open('Please enter the email text', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    this.loading.set(true);

    this.apiService
      .generate({
        emailText: email,
        context: this.context().trim() || undefined
      })
      .subscribe({
        next: (response) => {
          this.generateResponse.set(response);
          this.selectedDraftIndex.set(0);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('API Error:', error);
          this.snackBar.open(
            'Failed to generate reply. Make sure the backend server is running.',
            'Close',
            {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            }
          );
        }
      });
  }

  onDraftSelect(index: number): void {
    this.selectedDraftIndex.set(index);
  }

  onCopyReply(): void {
    const draft = this.selectedDraft();
    if (!draft) return;

    navigator.clipboard.writeText(draft.body).then(() => {
      this.snackBar.open('Reply copied to clipboard!', 'Close', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    });
  }
}
