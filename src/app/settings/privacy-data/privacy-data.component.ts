import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, EMPTY } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from 'src/app/auth/services/auth.service';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { DataPrivacyService } from './data-privacy.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-privacy-data',
  templateUrl: './privacy-data.component.html',
  styleUrls: ['./privacy-data.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDividerModule,
    TranslateModule,
  ],
})
export class PrivacyDataComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  user: any;
  isExporting = false;
  isTerminating = false;
  showTerminateConfirm = false;
  readonly privacyPolicyUrl = 'https://ibernia.app/privacy';
  readonly termsUrl = 'https://ibernia.app/terms';

  constructor(
    private privacyService: DataPrivacyService,
    private auth: AuthService,
    private navItemService: NavItemService,
    private toastr: ToastrService,
  ) {
    this.navItemService.currentRouteName = 'Privacy & Data';
  }

  ngOnInit(): void {
    this.user = this.auth.getUserProfile();
  }

  exportMyData(): void {
    if (!this.user?.sub) return;
    this.isExporting = true;

    this.privacyService
      .exportAdvisorData(this.user.sub)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Export failed', err);
          this.toastr.error('Failed to export data', 'Error');
          return EMPTY;
        }),
        finalize(() => (this.isExporting = false)),
      )
      .subscribe(async (blob) => {
        try {
          await this.buildAndDownloadArchive(blob);
          this.toastr.success('Data exported successfully', 'Success');
        } catch (e) {
          console.error('Archive build failed', e);
          this.toastr.error('Failed to build export archive', 'Error');
        }
      });
  }

  private async buildAndDownloadArchive(jsonBlob: Blob): Promise<void> {
    const [excelMod, zipMod, fsMod] = await Promise.all([
      import('exceljs'),
      import('jszip'),
      import('file-saver'),
    ]);

    const ExcelJS = (excelMod as any).default ?? excelMod;
    const JSZipCtor = (zipMod as any).default ?? zipMod;
    const saveAs = (fsMod as any).saveAs ?? (fsMod as any).default?.saveAs;

    const text = await jsonBlob.text();
    const data = JSON.parse(text);

    const zip = typeof JSZipCtor === 'function' ? new JSZipCtor() : new (JSZipCtor as any)();
    const workbook = ExcelJS.Workbook
      ? new ExcelJS.Workbook()
      : new (ExcelJS as any).default.Workbook();
    const imageUrls: { name: string; url: string }[] = [];

    const overviewData: Record<string, any> = {
      exportDate: data.exportDate,
      exportType: data.exportType,
    };
    if (data.advisorProfile) {
      for (const [k, v] of Object.entries(data.advisorProfile)) {
        if (v !== null && typeof v !== 'object') overviewData[`advisor.${k}`] = v;
      }
    }
    if (data.organizationProfile) {
      for (const [k, v] of Object.entries(data.organizationProfile)) {
        if (typeof v === 'string' && this.isImageUrl(v)) {
          const ext = this.getExtensionFromUrl(v);
          const imgName = `org_${imageUrls.length + 1}.${ext}`;
          imageUrls.push({ name: imgName, url: v });
          overviewData[`organization.${k}`] = `images/${imgName}`;
        } else if (v !== null && typeof v !== 'object') {
          overviewData[`organization.${k}`] = v;
        }
      }
    }
    this.addSheetFromArray(workbook, 'Overview', overviewData);

    const clients: any[] = data.clients ?? [];
    if (clients.length > 0) {
      const clientRows = clients.map((c: any) => this.flattenObject(c, ['cashflowPlans']));
      this.addSheetFromRows(workbook, 'Clients', clientRows, imageUrls);

      const planRows: Record<string, any>[] = [];
      const finRecRows: Record<string, any>[] = [];
      const potRows: Record<string, any>[] = [];
      const txRows: Record<string, any>[] = [];
      const tlRows: Record<string, any>[] = [];
      const wealthRows: Record<string, any>[] = [];
      const emergRows: Record<string, any>[] = [];
      const convRows: Record<string, any>[] = [];
      const reportRows: Record<string, any>[] = [];

      for (const client of clients) {
        const clientLabel = client.clientDetails?.firstName
          ? `${client.clientDetails.firstName} ${client.clientDetails.lastName ?? ''}`
          : client.clientDetails?.id ?? 'Unknown';

        const plans: any[] = client.cashflowPlans ?? [];
        for (const plan of plans) {
          const planInfo = plan.plan ?? {};
          planRows.push({ client: clientLabel, ...this.flattenNestedObject(planInfo) });

          this.pushItems(finRecRows, plan.financialRecords, clientLabel, planInfo.name);
          this.pushItems(potRows, plan.savingPots, clientLabel, planInfo.name);
          this.pushItems(txRows, plan.transactions, clientLabel, planInfo.name);
          this.pushItems(tlRows, plan.timelines, clientLabel, planInfo.name);
          this.pushItems(wealthRows, plan.wealthRecords, clientLabel, planInfo.name);
          this.pushItems(emergRows, plan.emergencies, clientLabel, planInfo.name);
          this.pushItems(convRows, plan.aiConversations, clientLabel, planInfo.name);
          this.pushItems(reportRows, plan.reports, clientLabel, planInfo.name);
        }
      }

      if (planRows.length) this.addSheetFromRows(workbook, 'Cashflow Plans', planRows, imageUrls);
      if (finRecRows.length) this.addSheetFromRows(workbook, 'Financial Records', finRecRows, imageUrls);
      if (potRows.length) this.addSheetFromRows(workbook, 'Saving Pots', potRows, imageUrls);
      if (txRows.length) this.addSheetFromRows(workbook, 'Transactions', txRows, imageUrls);
      if (tlRows.length) this.addSheetFromRows(workbook, 'Timelines', tlRows, imageUrls);
      if (wealthRows.length) this.addSheetFromRows(workbook, 'Wealth Records', wealthRows, imageUrls);
      if (emergRows.length) this.addSheetFromRows(workbook, 'Emergencies', emergRows, imageUrls);
      if (convRows.length) this.addSheetFromRows(workbook, 'AI Conversations', convRows, imageUrls);
      if (reportRows.length) this.addSheetFromRows(workbook, 'Reports', reportRows, imageUrls);
    }

    if (workbook.worksheets.length === 0) {
      const sheet = workbook.addWorksheet('Data');
      this.writeObjectToSheet(sheet, data, imageUrls);
    }

    const excelBuffer = await workbook.xlsx.writeBuffer();
    const dateSuffix = new Date().toISOString().slice(0, 10);
    zip.file(`ibernia-data-export-${dateSuffix}.xlsx`, excelBuffer);

    const imagesFolder = zip.folder('images');
    if (imagesFolder && imageUrls.length > 0) {
      const fetchResults = await Promise.allSettled(
        imageUrls.map(async (img) => {
          const resp = await fetch(img.url);
          if (!resp.ok) return null;
          const imgBlob = await resp.blob();
          return { name: img.name, blob: imgBlob };
        }),
      );
      for (const result of fetchResults) {
        if (result.status === 'fulfilled' && result.value) {
          imagesFolder.file(result.value.name, result.value.blob);
        }
      }
    }

    const archiveBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(archiveBlob, `ibernia-data-export-${dateSuffix}.zip`);
  }

  private pushItems(
    target: Record<string, any>[],
    items: any[] | undefined | null,
    clientLabel: string,
    planName: string,
  ): void {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      target.push({ client: clientLabel, plan: planName, ...this.flattenNestedObject(item) });
    }
  }

  private flattenObject(obj: any, excludeKeys: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (excludeKeys.includes(key)) continue;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const nested = this.flattenObject(value as Record<string, any>, []);
        for (const [nk, nv] of Object.entries(nested)) {
          result[`${key}.${nk}`] = nv;
        }
      } else if (!Array.isArray(value)) {
        result[key] = value;
      }
    }
    return result;
  }

  private flattenNestedObject(obj: any): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const nested = this.flattenNestedObject(value as Record<string, any>);
        for (const [nk, nv] of Object.entries(nested)) {
          result[`${key}.${nk}`] = nv;
        }
      } else if (Array.isArray(value)) {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private addSheetFromArray(workbook: any, name: string, flatData: Record<string, any>): void {
    if (Object.keys(flatData).length === 0) return;
    const sheet = workbook.addWorksheet(name);
    sheet.columns = [
      { header: 'Field', key: 'field', width: 35 },
      { header: 'Value', key: 'value', width: 50 },
    ];
    this.styleHeaderRow(sheet);
    for (const [field, value] of Object.entries(flatData)) {
      sheet.addRow({ field, value: value ?? '' });
    }
  }

  private addSheetFromRows(
    workbook: any,
    name: string,
    rows: Record<string, any>[],
    imageUrls: { name: string; url: string }[],
  ): void {
    const allKeys = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => allKeys.add(k)));
    const columns = Array.from(allKeys);
    if (columns.length === 0) return;

    const sheet = workbook.addWorksheet(name.substring(0, 31));
    sheet.columns = columns.map((col) => ({
      header: col,
      key: col,
      width: Math.min(40, Math.max(15, col.length + 5)),
    }));
    this.styleHeaderRow(sheet);

    for (const row of rows) {
      const rowData: Record<string, any> = {};
      for (const col of columns) {
        let val = row[col] ?? '';
        if (typeof val === 'string' && this.isImageUrl(val)) {
          const ext = this.getExtensionFromUrl(val);
          const imgName = `${name}_${imageUrls.length + 1}.${ext}`;
          imageUrls.push({ name: imgName, url: val });
          val = `images/${imgName}`;
        }
        rowData[col] = val;
      }
      sheet.addRow(rowData);
    }
  }

  private writeObjectToSheet(
    sheet: any,
    data: any,
    imageUrls: { name: string; url: string }[],
  ): void {
    sheet.columns = [
      { header: 'Field', key: 'field', width: 35 },
      { header: 'Value', key: 'value', width: 60 },
    ];
    this.styleHeaderRow(sheet);
    const flat = this.flattenNestedObject(data);
    for (const [field, value] of Object.entries(flat)) {
      let val = value ?? '';
      if (typeof val === 'string' && this.isImageUrl(val)) {
        const ext = this.getExtensionFromUrl(val);
        const imgName = `image_${imageUrls.length + 1}.${ext}`;
        imageUrls.push({ name: imgName, url: val });
        val = `images/${imgName}`;
      }
      sheet.addRow({ field, value: val });
    }
  }

  private styleHeaderRow(sheet: any): void {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A6CF7' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.alignment = { vertical: 'middle' };
  }

  private isImageUrl(value: string): boolean {
    if (!value) return false;
    try {
      const url = new URL(value, window.location.origin);
      return /\.(png|jpe?g|gif|svg|webp|bmp|ico)(\?.*)?$/i.test(url.pathname);
    } catch {
      return false;
    }
  }

  private getExtensionFromUrl(url: string): string {
    try {
      const pathname = new URL(url, window.location.origin).pathname;
      const match = pathname.match(/\.(\w+)$/);
      return match ? match[1] : 'png';
    } catch {
      return 'png';
    }
  }

  terminateAccount(): void {
    this.isTerminating = true;

    this.privacyService
      .terminateAccount()
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Account termination failed', err);
          this.toastr.error('Failed to process account closure request', 'Error');
          return EMPTY;
        }),
        finalize(() => (this.isTerminating = false)),
      )
      .subscribe((response) => {
        this.showTerminateConfirm = false;
        this.toastr.success(response.message, 'Account Closure Initiated');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
