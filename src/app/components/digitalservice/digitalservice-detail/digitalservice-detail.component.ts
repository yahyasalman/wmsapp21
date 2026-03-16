import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { DigitalServiceService } from 'app/services/digitalservice.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { ProgressSpinnerModule } from 'primeng/progressspinner';


@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,ProgressSpinnerModule,
    // Only add modules that are NOT in SHARED_IMPORTS
    PdfViewerModule
  ],
  providers: [ConfirmationService, MessageService],
  styleUrl: './digitalservice-detail.component.css',
  templateUrl: './digitalservice-detail.component.html'
})
export class DigitalServiceDetailComponent {
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
    this.digitalServiceService.getPdf(requestBody).subscribe({
      next: (response: any) => {
        const newBlob = new Blob([response], { type: 'application/pdf' });
        this.pdfUrl = window.URL.createObjectURL(newBlob);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading PDF', err);
        this.isLoading = false;
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

}