import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Client } from '../../models/client';
import {
  GetClientQuestionnaireResponse,
  QuestionnaireResponseItem,
} from '../../services/questionnaire-http.service';
import { QuestionnaireDialogComponent } from '../questionnaire-dialog/questionnaire-dialog.component';

export interface QuestionnaireResponsesDialogData {
  questionnaireResponses: GetClientQuestionnaireResponse;
  client: Client | null;
  responseCurrencySymbol: string;
}

@Component({
  selector: 'app-questionnaire-responses-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
  ],
  providers: [DatePipe],
  templateUrl: './questionnaire-responses-dialog.component.html',
  styleUrl: './questionnaire-responses-dialog.component.scss',
})
export class QuestionnaireResponsesDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<QuestionnaireResponsesDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: QuestionnaireResponsesDialogData,
  ) {}

  get questionnaireResponses(): GetClientQuestionnaireResponse {
    return this.data.questionnaireResponses;
  }

  get responseCurrencySymbol(): string {
    return this.data.responseCurrencySymbol || '';
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onNewClicked(): void {
    this.dialogRef.close();
    this.dialog.open(QuestionnaireDialogComponent, {
      width: '612px',
      disableClose: true,
      data: { client: this.data.client },
    });
  }

  getSectionResponses(section: string): QuestionnaireResponseItem[] {
    const typeMap: Record<string, string[]> = {
      Personal: ['ImportantPeople'],
      Finance: ['InvestableAssets', 'InvestmentApproach'],
      'Current satisfaction': ['FinancialPlanningImprovement'],
      Goals: ['Goals'],
      'Protection priorities': ['AreasOfWorry'],
    };
    const types = typeMap[section] || [];
    return this.questionnaireResponses.responses.filter((r) =>
      types.includes(r.type),
    );
  }

  formatResponseValue(item: QuestionnaireResponseItem): string {
    const v = item.value;
    if (v == null) return '-';
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) {
      return v
        .map((x) =>
          typeof x === 'object' && x && 'name' in x && 'relationship' in x
            ? `${(x as { name: string }).name} (${(x as { relationship: string }).relationship})`
            : String(x),
        )
        .join(', ');
    }
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      const selected = obj['selected'] as string[] | undefined;
      const others = obj['others'] as string | undefined;
      const parts = selected ? [...selected] : [];
      if (others) parts.push(`Other: ${others}`);
      return parts.join(', ') || '-';
    }
    return String(v);
  }

  getResponseChips(item: QuestionnaireResponseItem): string[] {
    const formatted = this.formatResponseValue(item);
    if (!formatted || formatted === '-') return [];
    return formatted.split(', ').filter(Boolean);
  }

  getResponseChipsWithIcons(item: QuestionnaireResponseItem): {
    value: string;
    iconUrl?: string;
  }[] {
    const chips = this.getResponseChips(item);
    if (!chips.length || !item.optionIcons)
      return chips.map((c) => ({ value: c }));
    const icons = item.optionIcons;
    return chips.map((chip) => {
      const key = chip.startsWith('Other:') ? 'Other' : chip;
      const iconUrl = icons?.[key];
      return { value: chip, iconUrl };
    });
  }

  formatAssetChip(chip: string): string {
    if (!this.responseCurrencySymbol) return chip;
    return chip.replace(
      /\d[\d,]*(\.\d+)?/g,
      (match) => `${this.responseCurrencySymbol}${match}`,
    );
  }

  getFinanceLabel(type: string): string {
    if (type === 'InvestableAssets') return 'Investable assets';
    if (type === 'InvestmentApproach') return 'Investment approach';
    return type;
  }
}
