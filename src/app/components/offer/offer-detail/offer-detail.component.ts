import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { IOffer, IOfferHistory } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { OfferService } from 'app/services/offer.service';
import { LogService } from 'app/services/log.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, firstValueFrom, finalize, takeUntil, Subject } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TimelineModule } from 'primeng/timeline';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { WorkshopService } from 'app/services/workshop.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@Component({
  selector: 'app-offer-detail',
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
    InputNumberModule,
    SelectModule,
    DialogModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './offer-detail.component.html',
  styleUrls: ['./offer-detail.component.css']
})
export class OfferDetailComponent implements OnInit, OnDestroy {
  @Output() invoiceEvent = new EventEmitter<string>();
  private destroy$ = new Subject<void>();

  offerId: number = 0;
  stateInfo:any;

  pdfUrl: any;
  offerHistory: IOfferHistory[] = [];
  offer!:IOffer;
  showEmailDialog: boolean = false;
  emailForm: FormGroup;
  isEmailSent: boolean | null = null;

  isSendButtonDisabled: boolean = false;
  isEditButtonDisabled: boolean = false;
  isLoading: boolean = true;
  constructor(private logger: LogService,
    private readonly errorHandler: ErrorHandlerService,
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private readonly offerService: OfferService,
    private readonly workshopService: WorkshopService,
    private http: HttpClient
  ) {
    this.emailForm = this.fb.group({
      emailTo: '',
      message: ''
    });

  }

async ngOnInit(): Promise<void> {
  try {
    // Wait for the offer to load
    this.offerId  = Number(this.route.snapshot.paramMap.get('id'));
    await this.getOffer();
    this.logger.info('Offer Loaded:', this.offer);
    this.loadPdf();
    this.loadHistory();
  } catch (error) {
    this.logger.error('Error during initialization:', error);
  } finally {
    // Set loading to false once everything is done
    this.isLoading = false;
  }
}

async getOffer(): Promise<void> {
  try {
    const response = await firstValueFrom(this.offerService.getOffer(this.offerId, undefined, false));
    this.offer = response.data; // Ensure response.data exists and is valid
  } catch (error) {
    this.logger.error('Failed to fetch offer:', error);
  }
}

  loadPdf() {

    this.workshopService
      .getWorkshop()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.sharedService
              .printPdf('offer', this.offerId.toString(), response.defaultInvoiceTemplate)
              .pipe(
                takeUntil(this.destroy$)
              )
              .subscribe({
                next: (response: any) => {
                  if (response) {
                    var newBlob = new Blob([response], { type: "application/pdf" });
                    this.pdfUrl = window.URL.createObjectURL(newBlob);
                    this.logger.info('getPdf success', { offerId: this.offerId });
                  }
                },
                error: (err) => {
                  this.errorHandler.handleError(err, 'getPdf', 'Failed to load PDF.');
                }
              });
               }
                },
                error: (err) => {
                  this.errorHandler.handleError(err, 'getInvoiceHistory', 'Failed to load invoice history.');
                }
              });

  }
  loadHistory() {
    this.isLoading = true;
    this.offerService
      .getOfferHistory(this.offerId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.logger.info(response);
            this.offerHistory = response;
          }
        },
        error: (err) => {
          this.logger.error('loadHistory error', err);
        }
      });
  }
  confirmDuplicate(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.sharedService.T('confirmMessage'),
      header: '',
      closable: false,
      closeOnEscape: false,
      rejectButtonProps: {
        label: this.sharedService.T('confirmCancel'),
        severity: 'secondary',
        //outlined: false,
      },
      acceptButtonProps: {
        label: this.sharedService.T('confirmSave'),
      },
      accept: () => {
        this.isLoading = true;
        this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('confirmSaveMessage') });
        this.redirectToOfferCrudComponent(true);
        this.isLoading = false;
      },
      reject: () => {
        this.isLoading = true;
        this.messageService.add({
          severity: 'error',
          summary: '',
          detail: this.sharedService.T('confirmCancelMessage'),
          life: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  redirectToCustomerDetailComponent() {
    let url = `sv/customer/details/${this.offer.customerId}`;
    this.router.navigate([url]);
  }

  redirectToOfferCrudComponent(duplicate: boolean = false) {
    this.router.navigate(['sv/offer/crud', { offerId: this.offerId, duplicate: duplicate }]);
  }


  redirectToInvoiceCrudComponent(type: string) {
    this.logger.info('navigating to invoice crud component with offerId: ' + this.offerId);
    this.router.navigate(['sv/invoice/crud', { offerId: this.offerId }]);
  }

  redirectToWorkOrderCrudComponent(type: string) {
    this.router.navigate(['sv/workorder/crud', { offerId: this.offerId }]);
  }
  generatePdf() {
    window.open(this.pdfUrl);
  }

  showDialog() {
    this.showEmailDialog = true;
  }

  sendEmail() {
    const emailTo = this.emailForm.get('emailTo')?.value;
    const message = this.emailForm.get('message')?.value;
    this.isLoading = true;
    this.sharedService
      .sendEmail('offer', this.offerId, emailTo, message)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.isEmailSent = true;
            this.loadHistory();
            this.closeEmailDialog();
          }
        },
        error: (err) => {
          this.isEmailSent = false;
          this.closeEmailDialog();
          this.logger.error('sendEmail error', err);
        }
      });
  }




  closeEmailDialog() {
    this.showEmailDialog = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
