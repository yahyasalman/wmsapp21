import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { DigitalServiceService } from 'app/services/digitalservice.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { finalize, takeUntil, Subject } from 'rxjs';


@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    MessageModule,
    TableModule,
    ProgressSpinnerModule,
    PdfViewerModule,
    DialogModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './digitalservice-detail.component.html'
})
export class DigitalServiceDetailComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  vehiclePlate: string = '';
  pdfUrl: any;
  showEmailDialog: boolean = false;
  emailForm: FormGroup;
  isEmailSent: boolean | null = null;
  isLoading: boolean = false;
  constructor(private logger: LogService,
    public readonly sharedService: SharedService,
    public readonly digitalServiceService: DigitalServiceService,
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private messageService: MessageService,
        
  ) {

    this.emailForm = this.fb.group({
      emailTo: '',
      message: ''
    });
  }

  ngOnInit(){
    this.vehiclePlate = this.route.snapshot.params['vehiclePlate'];
    this.getPdf();
  }

  getPdf() {
    this.isLoading = true;
    const requestBody = {
      country: 'se',
      lang: 'sv',
      templateName: 'basic',
      objectName: 'digitalservice',
      vehiclePlate: this.vehiclePlate
    };
    this.logger.info('Request body for PDF', requestBody);
    this.digitalServiceService.getPdf(requestBody)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          const newBlob = new Blob([response], { type: 'application/pdf' });
          this.pdfUrl = window.URL.createObjectURL(newBlob);
        },
        error: (err) => {
          this.logger.error('Error loading PDF', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load PDF'
          });
        }
      });
  }

  redirectToCustomerDetailComponent() {
    let url = 'sv/customer/details/';
    this.router.navigate([url]);
  }

  generatePdf() {
    window.open(this.pdfUrl);
  }
  openEmailDialog() {
    this.showEmailDialog = true;
  }
  closeEmailDialog() {
    this.showEmailDialog = false;
  }

  sendEmail() {
    // const emailTo = this.emailForm.get('emailTo')?.value;
    // const message = this.emailForm.get('message')?.value;
    // this.sharedService
    //   .sendEmail('invoice', this.invoiceId, emailTo, message)
    //   .pipe(
    //     catchError((err) => {
    //       this.isEmailSent = false;
    //       this.closeEmailDialog();
    //       throw err;
    //     })
    //   )
    //   .subscribe((response: any) => {
    //     if (response) {
    //       this.isEmailSent = true;
    //       this.disableEdit = true;
    //       // this.getInvoiceHistory();
    //       this.closeEmailDialog();
    //     }
    //   });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}