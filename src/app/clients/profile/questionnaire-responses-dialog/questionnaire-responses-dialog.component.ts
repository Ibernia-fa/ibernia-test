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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Client } from '../../models/client';
import {
  GetClientQuestionnaireResponse,
  QuestionnaireResponseItem,
} from '../../services/questionnaire-http.service';
import { QuestionnaireDialogComponent } from '../questionnaire-dialog/questionnaire-dialog.component';
import {
  normalizeQuestionnaireRelationship,
  questionnaireRelationshipLabelKey,
  questionnaireRelationshipLabelParams,
} from 'src/app/shared/family-tree/family-relationships';

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
    private translate: TranslateService,
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

  formatImportantPersonLine(row: { name: string; relationship: string }): string {
    const canonical = normalizeQuestionnaireRelationship(row.relationship);
    const key = questionnaireRelationshipLabelKey(canonical);
    const clientFirst = this.data.client?.clientDetails?.firstName || '';
    const partnerFirst = this.data.client?.partnerDetail?.firstName || '';
    const params = questionnaireRelationshipLabelParams(
      canonical,
      clientFirst,
      partnerFirst,
    );
    const rel = params ? this.translate.instant(key, params) : this.translate.instant(key);
    return `${row.name} (${rel})`;
  }

  formatResponseValue(item: QuestionnaireResponseItem): string {
    const v = item.value;
    if (v == null) return '-';
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) {
      return v
        .map((x) =>
          typeof x === 'object' && x && 'name' in x && 'relationship' in x
            ? this.formatImportantPersonLine(x as { name: string; relationship: string })
            : String(x),
        )
        .join(', ');
    }
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      const selected = obj['selected'] as string[] | undefined;
      const others = obj['others'] as string | undefined;
      const parts = selected ? [...selected] : [];
      // Keep a stable token for icon lookups; localize at render time.
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
      const otherPrefix = `${this.translate.instant('Other')}:`;
      const key =
        chip.startsWith('Other:') || chip.startsWith(otherPrefix) ? 'Other' : chip;
      const iconUrl = icons?.[key];
      return { value: chip, iconUrl };
    });
  }

  formatAssetChip(chip: string): string {
    const localized = this.localizeChipValue(chip);
    if (!this.responseCurrencySymbol) return localized;
    return localized.replace(
      /\d[\d,]*(\.\d+)?/g,
      (match) => `${this.responseCurrencySymbol}${match}`,
    );
  }

  getFinanceLabel(type: string): string {
    if (type === 'InvestableAssets') return 'Investable assets';
    if (type === 'InvestmentApproach') return 'Investment approach';
    return type;
  }

  localizeChipValue(raw: string): string {
    const s = (raw ?? '').toString();
    if (!s) return s;

    if (s.startsWith('Other:')) {
      const rest = s.replace(/^Other:\s*/i, '');
      return `${this.translate.instant('Other')}: ${rest}`;
    }

    const t = this.translate.instant(s);
    return t && t !== s ? t : s;
  }

  localizePersonalChip(raw: string): string {
    const s = (raw ?? '').toString();
    const m = s.match(/^(.*)\(([^)]+)\)\s*$/);
    if (!m) return this.localizeChipValue(s);
    const prefix = m[1].trimEnd();
    const rel = m[2].trim();
    return `${prefix}(${this.localizeChipValue(rel)})`;
  }

  parsePersonalChip(raw: string): { name: string; relationship: string } {
    const s = (raw ?? '').toString();
    const m = s.match(/^(.*)\(([^)]+)\)\s*$/);
    if (!m) return { name: this.localizeChipValue(s), relationship: '' };
    return {
      name: m[1].trimEnd(),
      relationship: this.localizeChipValue(m[2].trim()),
    };
  }
}
