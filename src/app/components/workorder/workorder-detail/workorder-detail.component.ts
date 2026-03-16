import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { IWorkOrder, IFileUploadRequest, IFileUploadResponse, IInvoice } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { WorkOrderService } from 'app/services/workorder.service';
import { LogService } from 'app/services/log.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, concatMap, from, of, switchMap, tap } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
interface WorkshopService { name: string };
@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS, ProgressSpinnerModule,
    PdfViewerModule
  ],
  providers: [ConfirmationService, MessageService],
  styleUrl: './workorder-detail.component.css',
  templateUrl: './workorder-detail.component.html'
})
export class WorkOrderDetailComponent implements OnInit {
  @Output() invoiceEvent = new EventEmitter<string>();

  workOrderId: number = 0 ;
  workOrder: IWorkOrder = <IWorkOrder>{};
  existingFiles: any[] = []; // Holds pre-loaded files
  pdfUrl: any;
  uploadedFile: any = null;  // For current file being uploaded
  uploadedFiles: any[] = []; // List of all uploaded files
  uploadUrl: string = '/api/workorder/upload';
  showDigitalServiceDialog: boolean = false;
  isDigitalServiceExists: boolean = false;
  isEmailSent: boolean | null = null;
  selectedServices!: WorkshopService[];
  services!: WorkshopService[];
  invoice!: IInvoice;
  isLoading:boolean = false;
  //createInvoiceLabel = '';

  formatSize(sizeInKB: number): string {
    if (sizeInKB === 0) return '0 KB';

    const k = 1024;
    const sizes = ['KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(sizeInKB) / Math.log(k));

    // Convert KB to the appropriate unit
    const value = sizeInKB / Math.pow(k, i);
    return parseFloat(value.toFixed(2)) + ' ' + sizes[i];
  }

  constructor(
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly workOrderService: WorkOrderService,
    private readonly route: ActivatedRoute,
    private logger: LogService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private http: HttpClient,
  ) {
    const today = new Date();
    const nextYear = new Date(today.setFullYear(today.getFullYear() + 1));
  }

  ngOnInit(){

    this.workOrderId = Number(this.route.snapshot.paramMap.get('workOrderId'));
    if (this.workOrderId > 0) {
      this.getOrder();
    }

    this.sharedService
      .printPdf('workorder', this.workOrderId.toString(), 'basic')
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

    this.getFiles();
  }

  private getFiles(): void {
    this.sharedService.listFiles(this.workOrderId)
      .pipe(
        catchError(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load file list'
          });
          console.error('Error loading file list:', error);
          return of([]);
        })
      )
      .subscribe(files => {
        this.existingFiles = files; // Store all files in the list
        this.uploadedFile = null;   // Reset current upload file
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
        this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('confirmsavemessage') });
        this.redirectToWorkOrderCrudComponent(true);
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: '',
          detail: this.sharedService.T('confirmCancelMessage'),
          life: 3000,
        });
      },
    });
  }


  redirectToWorkOrderCrudComponent(isDuplicate?: boolean) {
    const params: any = { workOrderId: this.workOrderId };
    if (isDuplicate) {
      params.isDuplicate = true;
    }
    this.router.navigate(['sv/workorder/crud', params]);
  }

  downloadFile(key: string) {
    this.logger.log('Downloading file with key:', key);
    this.sharedService.downloadFile(key);
  }

  redirectToInvoiceCrudComponent(type: string) {
    this.router.navigate(['sv/invoice/crud', { workOrderId: this.workOrderId }]);
  }

  closeDigitalServiceDialog() {
    this.showDigitalServiceDialog = false;
  }

  generatePdf() {
    window.open(this.pdfUrl);
  }

  redirectToCustomerDetailComponent() {
    let url = 'sv/customer/details/' + this.workOrder.customerId;
    this.router.navigate([url]);
  }

  getOrder() {
    this.isLoading = true;
    this.workOrderService.getWorkOrder(undefined, undefined, this.workOrderId).pipe(
      catchError((err) => {
        console.log(err);
        this.isLoading = false;
        throw err;
      })
    )
      .subscribe((response: any) => {
        if (response) {
          this.workOrder = response.data;
          this.logger.info('Workoder::',this.workOrder);  
        }
      });
setTimeout(() => {
  this.isLoading = false;
}, 500);
  }

  uploadFile(event: any) {
    console.log('File upload event:', event);
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {

      // Take only the first file
      const file = input.files[0];

      // Show confirmation dialog
      this.confirmationService.confirm({
        message: `Are you sure you want to upload ${file.name}?`,
        header: 'Upload Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          const uploadRequest: IFileUploadRequest = {
            type: 'workorder',
            id: this.workOrderId,
            file: file
          };
this.isLoading = true;
          this.sharedService.uploadFile(uploadRequest).pipe(
            switchMap(() => this.sharedService.listFiles(this.workOrderId)),
            catchError(error => {
              this.messageService.add({
                severity: 'error',
                summary: 'Upload Failed',
                detail: `Failed to upload ${file.name}: ${error.message}`
              });
              this.isLoading = false;
              return of([]);
            })
          ).subscribe({
            next: (files: IFileUploadResponse[]) => {
              this.uploadedFiles = files; // Update the list of all files
              this.uploadedFile = null;   // Reset current upload file
              this.messageService.add({
                severity: 'success',
                summary: 'Upload Successful',
                detail: `Successfully uploaded ${file.name}`
              });
              this.getFiles();
            },
            error: (error) => {
              console.error('Upload process failed:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Upload process failed'
              });
            }
            
          });
          setTimeout(() => {
  this.isLoading = false;
}, 500);
        }
      });
    }
    else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a file to upload'
      });
      this.isLoading = false;
      return;
    }
  }

  removeFile(file: any) {
    if (!file) return;

    // If the removed file was a PDF and it was being displayed, clear the pdfUrl
    if (file.type === 'application/pdf' && this.pdfUrl) {
      this.pdfUrl = null;
    }
this.isLoading = true;
    this.sharedService.deleteFile(file.key).pipe(
      catchError(error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to delete file: ${file.fileName || file.name}`
        });
        this.isLoading = false;
        return of(null);
      })
    ).subscribe((result) => {
      // Remove the file from both lists
      this.existingFiles = this.existingFiles.filter(f => f.key !== file.key);
      this.uploadedFiles = this.uploadedFiles.filter(f => f.key !== file.key);

      this.messageService.add({
        severity: 'info',
        summary: 'File Removed',
        detail: `${file.fileName || file.name} has been removed`
      });
      this.getFiles();
    });
    setTimeout(() => {
  this.isLoading = false;
}, 500);
  }

}