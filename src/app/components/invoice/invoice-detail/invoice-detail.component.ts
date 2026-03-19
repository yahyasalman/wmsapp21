import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { IInvoice, IInvoiceHistory } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { InvoiceService } from 'app/services/invoice.service';
import { LogService } from 'app/services/log.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { DigitalServiceService } from 'app/services/digitalservice.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize, takeUntil, catchError, Subject } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TimelineModule } from 'primeng/timeline';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
interface WorkshopService { name: string };

@Component({
  selector: 'app-invoice-detail',
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
    TimelineModule,
    ProgressSpinnerModule,
    PdfViewerModule,
    DialogModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.css',
})
export class InvoiceDetailComponent implements OnInit, OnDestroy {

  invoiceId: number = 0;
  disableEdit: boolean = false;
  credit: boolean = false;
  isLoading: boolean = false;
  invoice!: IInvoice;
  invoiceHistory: IInvoiceHistory[] = [];
  pdfUrl: any;

  showEmailDialog: boolean = false;
  emailForm: FormGroup;
  isEmailSent: boolean | null = null;

  //ds
  services!: WorkshopService[];
  selectedServices!: WorkshopService[];
  private destroy$ = new Subject<void>();

  constructor(private logger: LogService,
    private readonly errorHandler: ErrorHandlerService,
    public readonly sharedService: SharedService,
    public readonly digitalServiceService: DigitalServiceService,
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly invoiceService: InvoiceService,
    private http: HttpClient,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {

    this.emailForm = this.fb.group({
      emailTo: '',
      message: ''
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.invoiceId = Number(this.route.snapshot.paramMap.get('id'));
    this.getInvoice();
    this.getPdf();
    this.getInvoiceHistory();

    this.services = [
      { name: 'Engine oil and Filter' },
      { name: 'Air Filter' },
      { name: 'Fuel Filter' },
      { name: 'Pollen Filter' },
      { name: 'Spark Plugs' }
    ];

    //this.sharedService.setPageHeader(this.sharedService.T('g.invoice') + ' [#' + this.invoiceId + ']');
  }

  getInvoice() {
    this.isLoading = true;
    this.invoiceService
      .getInvoice(undefined, undefined, undefined, this.invoiceId, false)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.invoice = response.data;
          this.credit = this.invoice.priceIncVat > 0 ? false : true;
          this.disableEdit = this.invoice.isSent || this.invoice.isPaid || this.invoice.priceIncVat < 0;
          this.emailForm.patchValue({ emailTo: this.invoice.customerEmail });
          this.logger.info('getInvoice success', { invoiceId: this.invoiceId });
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getInvoice', 'Failed to load invoice.');
        }
      });
  }

  getInvoiceHistory() {
    this.invoiceService
      .getInvoiceHistory(this.invoiceId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.invoiceHistory = response;
            this.logger.info('getInvoiceHistory success', { historyCount: this.invoiceHistory.length });
          }
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getInvoiceHistory', 'Failed to load invoice history.');
        }
      });
  }

  getPdf() {
    this.sharedService
      .printPdf('invoice', this.invoiceId.toString(), 'basic')
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            var newBlob = new Blob([response], { type: "application/pdf" });
            this.pdfUrl = window.URL.createObjectURL(newBlob);
            this.logger.info('getPdf success', { invoiceId: this.invoiceId });
          }
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getPdf', 'Failed to load PDF.');
        }
      });
  }

  confirmDuplicate(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.sharedService.T('duplicateConfirmMessage'),
      header: '',
      closable: false,
      closeOnEscape: false,
      rejectButtonProps: {
        label: this.sharedService.T('no'),
        severity: 'secondary',
        //outlined: false,
      },
      acceptButtonProps: {
        label: this.sharedService.T('yes'),
      },
      accept: () => {
        this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('duplicateConfirmMessage') });
        this.redirectToInvoiceCrudComponent(true);

      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: '',
          detail: this.sharedService.T('cancelled'),
          life: 3000,
        });
      },
    });
  }

  confirmCredit(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.sharedService.T('creditConfirmMessage'),
      header: '',
      closable: false,
      closeOnEscape: false,
      rejectButtonProps: {
        label: this.sharedService.T('no'),
        severity: 'secondary',
        //outlined: false,
      },
      acceptButtonProps: {
        label: this.sharedService.T('yes'),
      },
      accept: () => {
        this.invoiceService
          .createCreditInvoice(this.invoiceId)
          .pipe(
            finalize(() => {
              // No loading state to reset here
            }),
            takeUntil(this.destroy$)
          )
          .subscribe({
            next: (response: any) => {
              if (response) {
                this.logger.info('createCreditInvoice success', { creditInvoiceId: response.invoiceId });
                this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('creditSuccessMessage') });
                this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                  this.router.navigate([`sv/invoice/details/${response.invoiceId}`]);
                });
              }
            },
            error: (err) => {
              this.errorHandler.handleError(err, 'createCreditInvoice', 'Failed to create credit invoice.');
            }
          });
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: '',
          detail: this.sharedService.T('cancelled'),
          life: 3000,
        });
      },
    });
  }

  redirectToInvoiceCrudComponent(duplicate: boolean = false) {
    this.router.navigate(['sv/invoice/crud', { invoiceId: this.invoiceId, duplicate: duplicate }]);
  }

  redirectToCustomerDetailComponent() {
    let url = 'sv/customer/details/' + this.invoice.customerId;
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
    const emailTo = this.emailForm.get('emailTo')?.value;
    const message = this.emailForm.get('message')?.value;
    this.sharedService
      .sendEmail('invoice', this.invoiceId, emailTo, message)
      .pipe(
        finalize(() => {
          // No additional action needed on finalize
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.isEmailSent = true;
            this.disableEdit = true;
            this.logger.info('sendEmail success', { emailTo, invoiceId: this.invoiceId });
            this.getInvoiceHistory();
            this.closeEmailDialog();
          }
        },
        error: (err) => {
          this.isEmailSent = false;
          this.errorHandler.handleError(err, 'sendEmail', 'Failed to send email.');
          this.closeEmailDialog();
        }
      });
  }
  onServiceChange(event: any): void {
    const selectedServices = event.value.map((element: WorkshopService) => element.name).join(',');
  }

  
}
