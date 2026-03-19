import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { SharedService } from 'app/services/shared.service';
import { InvoiceService } from 'app/services/invoice.service';
import { LogService } from 'app/services/log.service';
import { finalize, takeUntil, Subject } from 'rxjs';
 import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'digitalservice-view',
  standalone: true,
 imports: [
    CommonModule,
    PdfViewerModule,
    ButtonModule
  ],
  templateUrl: './digitalservice-view.component.html'
})
export class DigitalServiceViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  pdfUrl: any;

  constructor(private logger: LogService,
              private readonly sharedService:SharedService,
              private router: Router,
              private readonly route: ActivatedRoute,
              private readonly invoiceService: InvoiceService,
              private http: HttpClient
              ) {
  }

  ngOnInit(): void {
    // Component initialization
  }

  generatePdf() {
    window.open(this.pdfUrl);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
