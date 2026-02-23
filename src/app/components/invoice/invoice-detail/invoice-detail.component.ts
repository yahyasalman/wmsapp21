import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { IInvoice, IInvoiceHistory } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { InvoiceService } from 'app/services/invoice.service';
import { LogService } from 'app/services/log.service';
import { DigitalServiceService } from 'app/services/digitalservice.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';
import { TimelineModule } from 'primeng/timeline';
interface WorkshopService { name: string };

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    PdfViewerModule, GenericLoaderComponent,TimelineModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './invoice-detail.component.html'
})
export class InvoiceDetailComponent {

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
  constructor(private logger: LogService,
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
      .pipe(catchError((err) => {
        console.log(err); throw err;
      }))
      .subscribe((response: any) => {
        this.invoice = response.data;
        this.credit = this.invoice.priceIncVat > 0 ? false : true;
        this.disableEdit = this.invoice.isSent || this.invoice.isPaid || this.invoice.priceIncVat < 0;
        this.emailForm.patchValue({ emailTo: this.invoice.customerEmail });
       setTimeout(() => {
        this.isLoading = false;
      }, 800);
      });

  }

  getInvoiceHistory() {
    this.invoiceService
      .getInvoiceHistory(this.invoiceId)
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.logger.info(response);
          this.invoiceHistory = response;
        }
      });
  }

  getPdf() {
    this.sharedService
      .printPdf('invoice', this.invoiceId.toString(), 'basic')
      .pipe(
        catchError((err) => {
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
            catchError((err) => {
              console.log('Test-inside credit invoice');
              console.log(err);
              throw err;
            })
          )
          .subscribe((response: any) => {
            if (response) {
              this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('creditSuccessMessage') });
              const creditInvoice = true;
              const disableEdit = true;
              this.sharedService.clearState();
              this.sharedService.setState({ disableEdit: disableEdit.toString(), creditInvoice: creditInvoice.toString(), customerId: response.customerId, customerEmail: response.customerEmail });
              this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                this.router.navigate([`sv/invoice/details/${response.invoiceId}`]);
              });


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
        catchError((err) => {
          this.isEmailSent = false;
          this.closeEmailDialog();
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.isEmailSent = true;
          this.disableEdit = true;
          this.getInvoiceHistory();
          this.closeEmailDialog();
        }
      });
  }
  onServiceChange(event: any): void {
    const selectedServices = event.value.map((element: WorkshopService) => element.name).join(',');
  }

  
}
