import { CommonModule } from '@angular/common';
import { Component, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IDigitalService, IWorkOrder, IPager, IInvoice, IEnums, IFileUploadRequest } from 'app/app.model';
import { WorkOrderService } from 'app/services/workorder.service';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { DigitalServiceService } from 'app/services/digitalservice.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectChangeEvent } from 'primeng/select';
import { Popover } from 'primeng/popover';
import { catchError, EMPTY, filter, switchMap, take, finalize, takeUntil, Subject } from 'rxjs';
import { InvoiceService } from 'app/services/invoice.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { ListboxModule } from 'primeng/listbox';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { CustomerService } from 'app/services/customer.service';
import { WorkshopService } from 'app/services/workshop.service';


@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ProgressSpinnerModule, IconFieldModule, InputIconModule, ButtonModule, CheckboxModule, DatePickerModule, AutoCompleteModule, TableModule, SelectModule, PaginatorModule, ToastModule, TooltipModule, InputTextModule, ListboxModule, MessageModule, DialogModule, ConfirmDialogModule, FileUploadModule, ProgressBarModule],
  providers: [ConfirmationService, MessageService],
 templateUrl: './digitalservice-list.component.html'
})

export class DigitalServiceListComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  digitalServices: IDigitalService[] = [];
  pager: IPager = <IPager>{};
  selectedId: number = 0;
  sortField = 'creationDate';
  sortOrder = -1;
  totalRecords: number = 0;
  showAttachmentDialog: boolean = false;
  filters: FormGroup;
  currentPage: number = 1;
  vehiclePlates: string[] = [];
  invoice!: IInvoice; // used in createservice popup
  isLoading: boolean = false
  showDigitalServiceDialog: boolean = false;
  digitalService: FormGroup;
  manufacturers: any[] = [];
  models: any[] = [];
  isEmailSent: boolean | null = null;
  onlyThisWmsid:boolean = true;
  
  // PDF Upload Properties
  selectedVehicleData: any = null;
  uploadProgress: number = 0;
  wmsId: string = '';
  pdfBlobUrl: SafeResourceUrl | null = null;
  constructor(private logger: LogService,
    public readonly sharedService: SharedService,
    private router: Router,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private readonly fb: FormBuilder,
    private readonly workOrderService: WorkOrderService,
    private readonly customerService: CustomerService,
    private readonly digitalServiceService: DigitalServiceService,
    private readonly invoiceService: InvoiceService,
    private readonly workshopService: WorkshopService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer) {

    const currentDate = new Date();
    const twoYearBack = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());

    this.filters = this.fb.group({
      paymentType: '',
      workOrderStatus: '',
      year: (currentDate.getFullYear()).toString(),
      fromDate: this.sharedService.getDateString(twoYearBack),//(currentDate.getFullYear()) + '-01-01',
      toDate: this.sharedService.getDateString(currentDate),
      vehiclePlate: '',
      currentPage: 1,
      pageSize: 10,
      sortBy: this.sortField,
      sortDir: this.sortOrder,

    });



    // POPUP FORM INITIALIZATION
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    this.digitalService = this.fb.group({
  digitalServiceId: null,
  userId: ['', Validators.required], // Required
  serviceType: ['service', Validators.required], // Required
  serviceDate: ['', Validators.required], // Required
  nextServiceDate: ['', Validators.required], // Required
  vehiclePlate: ['', Validators.required], // Required
  vehicleMileage: ['', Validators.required], // Required
  nextServiceVehicleMileage: ['', Validators.required], // Required
  vehicleManufacturer: ['', Validators.required], // Required
  vehicleModel: ['', Validators.required], // Required
  vehicleYear: ['', Validators.required], // Required
  invoiceId: '', // Optional
  services: [[], Validators.required], // Checkbox list - Required
  comments: '', // Optional
  isValidInvoice: false
});



  }

  ngOnInit() {
    this.initializePage();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        if (event.urlAfterRedirects.startsWith('/sv/digitalservice')) {
          this.initializePage();
        }
      });
  }

  initializePage() {
  console.trace('initializePage called'); 
  this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {this.sharedService.updateFiltersFromQueryParams(this.filters, params)});
  this.digitalService.get('serviceDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(d => {
      if (!d) return;
      const n = new Date(d);
      n.setFullYear(n.getFullYear() + 1);
      this.digitalService.get('nextServiceDate')
        ?.setValue(n.toISOString().slice(0, 10));
    });
    this.digitalService.get('vehicleMileage')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.digitalService.get('nextServiceVehicleMileage')
        ?.setValue(v ? +v + 10000 : '');
    });
    this.getDigitalServices(this.onlyThisWmsid);

  }


  getDigitalServices(onlyThisWmsId:boolean) {
    this.isLoading = true;
    this.digitalServiceService
      .getDigitalServices(this.filters, onlyThisWmsId)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.logger.info(res.objectList);
          this.digitalServices = res.objectList;
          this.totalRecords = res.pager.totalRecords;
        },
        error: (err) => {
          this.logger.error(err);
        }
      });
  }


  onChangeCurrentWorkshop(event: any): void {
    this.onlyThisWmsid = event.checked;
    this.getDigitalServices(this.onlyThisWmsid);
  }

  onSelectYear(selectedValue: any) {
    var selectedFromDate = selectedValue.getFullYear() + '-01-01';
    var selectedToDate = selectedValue.getFullYear() + '-12-31';
    this.filters.patchValue({ fromDate: selectedFromDate, toDate: selectedToDate });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getDigitalServices(this.onlyThisWmsid);
  }


  onSelectFromDate() {
    this.getDigitalServices(this.onlyThisWmsid);
  }

  onSelectToDate() {
    this.getDigitalServices(this.onlyThisWmsid);
  }
  onSelectNumberPlate(event: any) {
    // filters will automatically updated. Just reload filters
    this.filters.patchValue({ vehiclePlate: event.value });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getDigitalServices(this.onlyThisWmsid);
  }

  keyupNumberPlate(event: any) {
    if (event?.value) {
      this.workOrderService.getVehiclePlates(event?.value)
        .subscribe((response) => {
          this.vehiclePlates = response;
        });
    }
  }

  onClearNumberPlate() {
    // implement
    this.filters.patchValue({ vehiclePlate: '' });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getDigitalServices(this.onlyThisWmsid);
  }

  ///New code I added for popup///

  resetDigitalServiceForm() {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    this.digitalService.patchValue({
      digitalServiceId: 0,
      userId: '',
      serviceType: 'service',
      serviceDate: formattedToday,
      nextServiceDate: [nextYear.toISOString().substring(0, 10)],
      vehiclePlate: '',
      vehicleMileage: '',
      nextServiceVehicleMileage: [''],
      vehicleManufacturer: '',
      vehicleModel: '',
      vehicleYear: '',
      invoiceId: '',
      services: '',
      comments: '',
      isValidInvoice: false
    });
  }

  openDigitalServiceDialog() {

    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    this.showDigitalServiceDialog = true;
    this.resetDigitalServiceForm();
    this.digitalService.patchValue({
      serviceDate: this.invoice?.invoiceDate ?? formattedToday ?? '',
      vehiclePlate: this.invoice?.vehiclePlate ?? '',
      vehicleMileage: this.invoice?.vehicleMileage ?? '',
      vehicleManufacturer: this.invoice?.vehicleManufacturer ?? '',
      vehicleModel: this.invoice?.vehicleModel ?? '',
      vehicleYear: this.invoice?.vehicleYear ?? '',
      invoiceId: this.invoice?.invoiceId ?? null
    });
  }


  closeDigitalServiceDialog() {
    this.showDigitalServiceDialog = false;
    this.resetDigitalServiceForm();
  }

  // PDF Upload Dialog Methods
  closeAttachmentDialog() {
    this.showAttachmentDialog = false;
    this.selectedVehicleData = null;
    this.uploadProgress = 0;
    // Clean up blob URL
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL((this.pdfBlobUrl as any).changingThisBreaksApplicationSecurity);
      this.pdfBlobUrl = null;
    }
  }

  openAttachmentDialog(selectedDigitalService: IDigitalService) {
    this.showAttachmentDialog = true;
    this.selectedId = selectedDigitalService.digitalServiceId;
    
    // Get WMS ID from shared service
    this.wmsId = this.sharedService.wmsId;
    
    const pdfFileName = `${selectedDigitalService.digitalServiceId}.pdf`;
    const fileKey = `${this.wmsId}/digitalservice/${selectedDigitalService.digitalServiceId}.pdf`;
    
    // Prepare vehicle data to display in dialog
    this.selectedVehicleData = {
      digitalServiceId: selectedDigitalService.digitalServiceId,
      vehiclePlate: selectedDigitalService.vehiclePlate,
      manufacturer: selectedDigitalService.vehicleManufacturer,
      serviceDate: selectedDigitalService.serviceDate,
      pdfFileName: pdfFileName,
      downloadUrl: fileKey,
      pdfExists: false
    };

    // Fetch the PDF from server and display in viewer
    this.sharedService.getPDFBlob(fileKey).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(blob);
        this.pdfBlobUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        this.selectedVehicleData.pdfExists = true;
        this.logger.info(`PDF loaded for Digital Service: ${selectedDigitalService.digitalServiceId}`);
      },
      error: (error) => {
        console.error('Error fetching PDF:', error);
        this.pdfBlobUrl = null;
        this.selectedVehicleData.pdfExists = false;
        this.logger.error(`Failed to load PDF for Digital Service: ${selectedDigitalService.digitalServiceId}`);
      }
    });
  }

  onPDFSelected(event: any) {
    const files = event.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.validatePDFFile(file);
    }
  }

  private validatePDFFile(file: File): boolean {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File Type',
        detail: 'Only PDF files are allowed.',
        life: 4000
      });
      return false;
    }
    
    if (file.size > 10000000) {
      this.messageService.add({
        severity: 'error',
        summary: 'File Too Large',
        detail: 'Maximum file size is 10MB.',
        life: 4000
      });
      return false;
    }
    return true;
  }

  uploadPDF(fileUpload: any) {
    if (!fileUpload.files || fileUpload.files.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No File Selected',
        detail: 'Please select a PDF file to upload.',
        life: 3000
      });
      return;
    }

    const file = fileUpload.files[0];

    if (!this.validatePDFFile(file)) {
      return;
    }

    this.uploadProgress = 0;
    const uploadRequest: IFileUploadRequest = {
      type: 'digitalservice',
      id: this.selectedVehicleData.digitalServiceId,
      file: file
    };

    console.log('=== PDF UPLOAD INITIATED ===');
    console.log('Upload Request Type:', uploadRequest.type);
    console.log('Digital Service ID:', uploadRequest.id);
    console.log('File Name:', file.name);
    console.log('File Size:', file.size);
    console.log('WMS ID:', this.wmsId);
    console.log('Expected Download URL:', this.selectedVehicleData.downloadUrl);
    console.log('=============================');
    this.logger.info(`Starting PDF upload - Service ID: ${uploadRequest.id}, File: ${file.name}`);

    this.sharedService.uploadFile(uploadRequest)
      .pipe(
        finalize(() => {
          this.uploadProgress = 0;
          fileUpload.clear();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          console.log('=== PDF UPLOAD SUCCESS ===');
          console.log('Digital Service ID:', this.selectedVehicleData.digitalServiceId);
          console.log('File Name:', this.selectedVehicleData.pdfFileName);
          console.log('Download URL (File Key):', this.selectedVehicleData.downloadUrl);
          console.log('WMS ID:', this.wmsId);
          console.log('===========================');
          this.logger.info(`PDF uploaded successfully. File Key: ${this.selectedVehicleData.downloadUrl}`);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'PDF uploaded successfully.',
            life: 4000
          });
          
          // Fetch and display the newly uploaded PDF
          this.sharedService.getPDFBlob(this.selectedVehicleData.downloadUrl).pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            next: (blob) => {
              const blobUrl = URL.createObjectURL(blob);
              this.pdfBlobUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
              this.selectedVehicleData.pdfExists = true;
              this.logger.info(`Updated PDF displayed after upload`);
            },
            error: (err) => {
              console.error('Error fetching uploaded PDF:', err);
              this.selectedVehicleData.pdfExists = true;
              this.logger.error('Failed to fetch uploaded PDF for display');
            }
          });
        },
        error: (error) => {
          console.log('=== PDF UPLOAD ERROR ===');
          console.log('Digital Service ID:', this.selectedVehicleData.digitalServiceId);
          console.log('Download URL (File Key):', this.selectedVehicleData.downloadUrl);
          console.log('Error:', error);
          console.log('========================');
          this.logger.error('PDF upload failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to upload PDF. Please try again.',
            life: 4000
          });
        }
      });
  }

  downloadPDF() {
    if (!this.selectedVehicleData || !this.selectedVehicleData.pdfExists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No PDF Available',
        detail: 'No PDF file available to download.',
        life: 3000
      });
      return;
    }

    const fileKey = this.selectedVehicleData.downloadUrl;
    console.log('=== PDF DOWNLOAD DEBUG ===');
    console.log('File Key:', fileKey);
    console.log('Digital Service ID:', this.selectedVehicleData.digitalServiceId);
    console.log('WMS ID:', this.wmsId);
    console.log('Selected Vehicle Data:', this.selectedVehicleData);
    console.log('File Exists:', this.selectedVehicleData.pdfExists);
    console.log('========================');
    this.logger.info(`Downloading PDF with key: ${fileKey}`);

    this.sharedService.downloadFile(fileKey);
  }

  viewPDF() {
    if (!this.selectedVehicleData || !this.selectedVehicleData.pdfExists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No PDF Available',
        detail: 'No PDF file available to view.',
        life: 3000
      });
      return;
    }

    const fileKey = this.selectedVehicleData.downloadUrl;
    console.log('=== PDF VIEW DEBUG ===');
    console.log('File Key:', fileKey);
    console.log('Digital Service ID:', this.selectedVehicleData.digitalServiceId);
    console.log('WMS ID:', this.wmsId);
    console.log('Selected Vehicle Data:', this.selectedVehicleData);
    console.log('File Exists:', this.selectedVehicleData.pdfExists);
    console.log('====================');
    this.logger.info(`Viewing PDF with key: ${fileKey}`);

    this.sharedService.downloadFile(fileKey);
  
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }


  onServiceChange(event: any): void {
    const selectedServices = event.value
      .map((element: any) => element)
      .join(',');
    this.digitalService.patchValue({ services: selectedServices });
  }

 validateDigitalService(event: Event) {
   
    if (this.digitalService.get('invoiceId')?.value && !this.digitalService.get('isValidInvoice')?.value) {
      this.messageService.add({
        severity: 'error',
        summary: this.sharedService.T('error'),
        detail: this.sharedService.T('attachInvoiceText'),
        life: 3000
      });
      this.getf('invoiceId')?.setErrors({ required: true });
      this.getf('invoiceId')?.markAsDirty();
      return;
    }
  
  
  // 1. Check if the form is invalid
  if (this.digitalService.invalid) {
    
    // Mark everything as touched and dirty to force red borders (including listbox)
    this.digitalService.markAllAsTouched();
    Object.values(this.digitalService.controls).forEach(control => {
      control.markAsDirty();
      control.updateValueAndValidity();
    });

    // English Toastr for required fields
    this.messageService.add({
      severity: 'error',
      summary: this.sharedService.T('error'),
      detail: this.sharedService.T('requiredFields'),
      life: 3000
    });
    return;
  }

  // 2. If form is valid, proceed to verify User ID
  const userId = this.digitalService.get('userId')?.value;
  
  this.isLoading = true;
  this.sharedService.isValidAppUser(userId).subscribe({
    next: (isValid: any) => {
      this.isLoading = false;
      if (isValid) {
        // All good, show confirmation popup
        this.confirmDigitalService(event);
      } else {
        // User ID is incorrect
        this.messageService.add({
          severity: 'error',
          summary: this.sharedService.T('error'),
          detail: this.sharedService.T('digitalServiceIdInvalid'),
          life: 3000
        });
        this.digitalService.get('userId')?.setErrors({ invalidUserId: true });
        this.digitalService.get('userId')?.markAsDirty();
      }
    }
  });
}
  get f() {
    return this.digitalService.controls;
  }

  validateAndAttachInvoice(invoiceId: number | string) {
    // 1. Basic validation
    this.isLoading = true;

    this.invoiceService.isValidDigitalService(invoiceId)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          // CASE: data === null (Invoice exists hi nahi karti)
          if (res.data === null) {
            this.messageService.add({
              severity: 'error',
              summary: this.sharedService.T('error'),
              detail: this.sharedService.T('invoiceInvalid'),
              life: 3000
            });
            this.resetDigitalServiceForm();
            this.digitalService.patchValue({ invoiceId: invoiceId });
            this.getf('invoiceId')?.setErrors({ invalid: true });
            return;
          }
          else {
            this.invoiceService.getInvoice(undefined, undefined, undefined, Number(invoiceId), false)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (invoiceRes: any) => {
                  // Double check if invoice data exists in second API
                  if (!invoiceRes || !invoiceRes.data) {
                    this.messageService.add({
                      severity: 'error',
                      summary: this.sharedService.T('error'),
                      detail: this.sharedService.T('invoiceInvalid'),
                      life: 3000
                    });
                    this.resetDigitalServiceForm();
                    return;
                  }

                  // Success logic
                  this.messageService.add({
                    severity: 'success',
                    summary: this.sharedService.T('success'),
                    icon: 'pi pi-check-circle',
                    life: 3000
                  });

                  this.customerService.getCustomer(invoiceRes.data.customerId)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                      next: (customerRes: any) => {
                        if (customerRes && customerRes.data) {
                          this.digitalService.patchValue({
                            invoiceId: invoiceRes.data.invoiceId,
                            userId: customerRes.data.digitalServiceId || '',
                            vehiclePlate: invoiceRes.data.vehiclePlate,
                            vehicleManufacturer: invoiceRes.data.vehicleManufacturer,
                            vehicleModel: invoiceRes.data.vehicleModel,
                            vehicleYear: invoiceRes.data.vehicleYear,
                            vehicleMileage: invoiceRes.data.vehicleMileage,
                            isValidInvoice: true
                          });
                          this.getf('invoiceId')?.setErrors(null);
                        }
                      },
                      error: (err) => {
                        this.logger.error(err);
                        this.resetDigitalServiceForm();
                      }
                    });
                },
                error: (err) => {
                  this.logger.error(err);
                  this.resetDigitalServiceForm();
                }
              });
          }
        },
        error: (err) => {
          this.logger.error(err);
          this.resetDigitalServiceForm();
        }
      });
  }

  getf(controlName: string) {
    return this.digitalService.get(controlName);
  }

  redirectToVehicleDetailComponent(vehiclePlate: string,userId:string) {
    const requestBody = {
      country: 'se',
      lang: 'sv',
      objectName: 'digitalservice',
      vehiclePlate: vehiclePlate,
      userId: userId
    };
    this.isLoading = true;
    this.digitalServiceService.getPdf(requestBody)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (_) => {
          this.router.navigate(['sv/digitalservice/details', vehiclePlate,userId]);
        },
        error: (err) => {
          this.logger.error(err);
        }
      });
  }
  filterManufacturers(event: any): void {
    this.manufacturers = this.sharedService.getVehicleManufacturers(event.query.toUpperCase());
  }
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/[^A-Z0-9]/gi, ''); // Remove invalid characters
    input.value = sanitizedValue.toUpperCase(); // Convert to uppercase
    this.digitalService.get('vehiclePlate')?.setValue(sanitizedValue); // Update 
  }
  filterModels(event: any): void {
    this.models = this.sharedService.getVehicleModels(this.digitalService.get('vehicleManufacturer')?.value, event.query.toUpperCase());
  }
  onServiceTypeChange(event: SelectChangeEvent): void {
    const selectedType = event.value;
    if(selectedType === 'repairService') {
      this.digitalService.get('nextServiceVehicleMileage')?.clearValidators(); // Remove validation
      this.digitalService.get('nextServiceVehicleMileage')?.updateValueAndValidity(); // Update validity
  }
    else {
      this.digitalService.get('nextServiceVehicleMileage')?.setValidators([Validators.required]); // Add validation
      this.digitalService.get('nextServiceVehicleMileage')?.updateValueAndValidity(); // Update validity
    }
  }
  confirmDigitalService(event: Event) {
    const serviceTypeRaw = this.digitalService.get('serviceType')?.value;
    let serviceTypeText = '';

    // Service Type text nikalna
    if (serviceTypeRaw) {
      if (typeof serviceTypeRaw === 'object') {
        serviceTypeText = serviceTypeRaw.text || serviceTypeRaw.value || '-';
      } else {
        const enumObj = this.sharedService.getEnumByValue('digitalserviceType', serviceTypeRaw);
        serviceTypeText =
          enumObj && typeof enumObj === 'object'
            ? (enumObj as any).text
            : serviceTypeRaw;
      }
    }

    // Work Carried Out (checkboxes)
    const selectedValues = this.digitalService.get('services')?.value;
    let workCarriedOutHtml = '';

    if (Array.isArray(selectedValues) && selectedValues.length > 0) {
      workCarriedOutHtml = `
          <div style="max-height: 180px; overflow-y: auto; padding-right: 6px;">
            ${selectedValues
          .map((val) => {
            const actualVal =
              typeof val === 'object' ? val.value || val.text : val;
            const enumObj = this.sharedService.getEnumByValue(
              'digitalservice',
              actualVal
            );
            const text =
              enumObj && typeof enumObj === 'object'
                ? (enumObj as any).text
                : actualVal;

            return `<div style="margin-bottom: 6px;">• ${text}</div>`;
          })
          .join('')}
          </div>
        `;
    } else {
      workCarriedOutHtml = 'Ingen data';
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: this.sharedService.T('confirmation'),
      closable: false,

      message: `
        <p style="color: red;"> ${this.sharedService.T('irreversibleAction')}</p>
        <div class="rounded-[14px] border border-slate-200/95 bg-white shadow-sm 
                    max-h-[70vh] overflow-y-auto">

          <table class="w-full border-collapse">
            <tbody>
              ${this.createRow('Faktura#', this.digitalService.get('invoiceId')?.value)}
              ${this.createRow('Service ID', this.digitalService.get('userId')?.value)}
              ${this.createRow(this.sharedService.T('vehiclePlate'), this.digitalService.get('vehiclePlate')?.value)}

              ${this.createRow(this.sharedService.T('vehicleMake'), this.digitalService.get('vehicleManufacturer')?.value)}
              ${this.createRow(this.sharedService.T('vehicleModel'), this.digitalService.get('vehicleModel')?.value)}
              ${this.createRow(this.sharedService.T('vehicleYear'), this.digitalService.get('vehicleYear')?.value)}

              ${this.createRow(this.sharedService.T('serviceDate'), this.digitalService.get('serviceDate')?.value)}
              ${this.createRow(
        this.sharedService.T('vehicleMileage') + ' (km)',
        this.digitalService.get('vehicleMileage')?.value
      )}
              ${this.createRow(this.sharedService.T('serviceType'), serviceTypeText)}

              ${this.createRow(this.sharedService.T('nextServiceDate'), this.digitalService.get('nextServiceDate')?.value)}
              ${this.createRow(this.sharedService.T('nextServiceMileage'), this.digitalService.get('nextServiceVehicleMileage')?.value)}

              <!-- WORK CARRIED OUT -->
              <tr>
                <th class="w-[36%] px-4 py-3 text-left align-top text-[0.72rem] tracking-[0.12em] uppercase 
                           text-slate-500 bg-slate-100/75 border-r border-slate-200/80">
                  ${this.sharedService.T('workCarriedOut')}
                </th>
                <td class="px-4 py-3 text-[0.95rem] text-slate-900">
                  ${workCarriedOutHtml}
                </td>
              </tr>

              ${this.createRow(this.sharedService.T('comments'), this.digitalService.get('comments')?.value)}
            </tbody>
          </table>
        </div>
        `,

      rejectButtonProps: {
        label: this.sharedService.T('cancel'),
        severity: 'secondary'
      },
      acceptButtonProps: {
        label: this.sharedService.T('createDigitalservice')
      },

      accept: () => {
        this.isLoading = true;
        const payload = {
          ...this.digitalService.value,
          services: Array.isArray(selectedValues) ? selectedValues.join(',') : selectedValues
        };
        this.logger.info('Digital Service Payload');
        this.logger.info(payload);
        this.digitalServiceService.createDigitalService(payload)
          .pipe(
            finalize(() => { this.isLoading = false; }),
            takeUntil(this.destroy$)
          )
          .subscribe({
            next: (res: any) => {
              if (res) {
                this.isEmailSent = true;
                this.closeDigitalServiceDialog();
                this.filters.patchValue({
                  vehiclePlate: '',
                  currentPage: 1
                });
                this.sharedService.updateFiltersInNavigation(this.filters);
                this.getDigitalServices(this.onlyThisWmsid);
                this.messageService.add({
                  severity: 'success',
                  summary: this.sharedService.T('success'),
                  icon: 'pi pi-check-circle',
                  life: 3000
                });
              }
            },
            error: (err) => {
              this.logger.error(err);
            }
          });
      },

      reject: () => {
        this.messageService.add({
          severity: 'error',
          detail: this.sharedService.T('cancelled'),
          life: 3000
        });
      }
    });
  }


  // Table row banane ke liye chota helper function
  private createRow(label: string, value: any): string {
    return `
      <tr>
        <th class="w-[36%] px-4 py-3 text-left align-top text-[0.72rem] tracking-[0.12em] uppercase text-slate-500 bg-slate-100/75 border-r border-slate-200/80">${label}</th>
        <td class="px-4 py-3 text-[0.95rem] text-slate-900 break-words">${value || '-'}</td>
      </tr>
    `;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(e: any) {
  const currentPage = (e.first / e.rows) + 1;
  this.sortField = (e.sortField || this.sortField || 'invoiceId').trim();
  this.sortOrder = (e.sortOrder !== undefined && e.sortOrder !== null) ? Number(e.sortOrder) : (this.sortOrder ?? 1);
  const oldSortBy = this.filters.get('sortBy')?.value?.trim(); 
  const oldSortDir = Number(this.filters.get('sortDir')?.value); 
  const isSortChanged = (this.sortField !== oldSortBy) || (this.sortOrder !== oldSortDir);
  const pageToSet = isSortChanged ? 1 : currentPage;
  this.filters.patchValue({currentPage: pageToSet,pageSize: e.rows,sortBy: this.sortField,sortDir: this.sortOrder});
  this.sharedService.updateFiltersInNavigation(this.filters);
  this.cdr.detectChanges();
  this.getDigitalServices(this.onlyThisWmsid);
  }

}
