import { Component, OnInit } from '@angular/core';
import { combineLatest, map, switchMap, tap } from 'rxjs';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { PdfReportsHttpService as PdfReportsHttpService } from './services/pdf-reports-http.service';
import { PdfReportsModel as PdfReportsModel } from './models/pdf-reports.model';

@Component({
  selector: 'app-pdf-reports',
  templateUrl: './pdf-reports.component.html',
  styleUrl: './pdf-reports.component.scss'
})

export class PdfReportsComponent implements OnInit {
  constructor(
    private pdfReportsHttpService: PdfReportsHttpService,
    private navItemService: NavItemService
  ) {
    this.navItemService.currentRouteName = 'PdfReports';
  }

  ngOnInit(): void {
    
  }
}
