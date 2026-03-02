import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { IOffer, IOfferHistory } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { OfferService } from 'app/services/offer.service';
import { LogService } from 'app/services/log.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';
import { TimelineModule } from 'primeng/timeline';
@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS, GenericLoaderComponent, TimelineModule,
    PdfViewerModule
  ], providers: [ConfirmationService, MessageService],
  templateUrl: './offer-detail.component.html',
  styleUrls: ['./offer-detail.component.css']
})
export class OfferDetailComponent {

  offerId: number = 0;
  stateInfo:any;
  // disableEdit: boolean = this.stateInfo ? this.stateInfo.disableEdit === 'true' : false;
  // customerId: number = this.stateInfo ? this.stateInfo.customerId : 0;
  // customerEmail: string = this.stateInfo ? this.stateInfo.customerEmail : '';

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
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private readonly offerService: OfferService,
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
    this.stateInfo = this.sharedService.getState();
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
    // this.isLoading = true;
    // await 
    // this.offerService
    //   .getOffer(this.offerId,undefined,false)
    //   .pipe(catchError((err) => {
    //     console.log(err); throw err;
    //   }))
    //   .subscribe((response: any) => {
    //     this.offer = response.data;
    //     this.logger.info(this.offer);
    //    setTimeout(() => {
    //     this.isLoading = false;
    //   }, 800);
    //   });

  

  loadPdf() {
    this.isLoading = true;
    this.sharedService
      .printPdf('offer', this.offerId.toString(), 'basic')
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          var newBlob = new Blob([response], { type: "application/pdf" });
          this.pdfUrl = window.URL.createObjectURL(newBlob);
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);

  }
  loadHistory() {
    this.isLoading = true;
    this.offerService
      .getOfferHistory(this.offerId)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.logger.info(response);
          this.offerHistory = response;
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
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
        catchError((err) => {
          this.isEmailSent = false;
          this.closeEmailDialog();
          setTimeout(() => {
            this.isLoading = false;
          }, 500);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.isEmailSent = true;
          this.loadHistory();
          this.closeEmailDialog();
        }
      });
    setTimeout(() => {
      this.isLoading = false;

    }, 500);
  }




  closeEmailDialog() {
    this.showEmailDialog = false;
  }
}
