import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ITokenClaims } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { InvoiceService } from 'app/services/invoice.service';
import { LogService } from 'app/services/log.service';
import { finalize, takeUntil, Subject } from 'rxjs';
import { ButtonModule } from 'primeng/button';

 
@Component({
  selector: 'app-invoice-detail',
  standalone: true,
 imports: [
    CommonModule,
    PdfViewerModule,
    ButtonModule 
  ],
  templateUrl: './invoice-view.component.html'
})
export class InvoiceViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  token: string = '';
  workshopName: string = '';
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
    this.token = this.route.snapshot.queryParams['token'] || '';
    this.sharedService
      .getClaimsFromToken(this.token)
      .pipe(
        finalize(() => {}),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: ITokenClaims) => {
          if (response) {
            this.workshopName = response.workshopName;
          }
        },
        error: (err) => {
          this.logger.error('Error getting claims from token:', err);
        }
      });

    this.sharedService
      .printPdfFromToken(this.token)
      .pipe(
        finalize(() => {}),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            const newBlob = new Blob([response], { type: 'application/pdf' });
            this.pdfUrl = window.URL.createObjectURL(newBlob);
          }
        },
        error: (err) => {
          this.logger.error('Error loading invoice PDF:', err);
        }
      });
  }

  generatePdf() {
    window.open(this.pdfUrl);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
