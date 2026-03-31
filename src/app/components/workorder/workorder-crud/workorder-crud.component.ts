import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IWorkOrder, ISupplier, ICustomer, IDailyCalendar, IEnum, IWOPurchase, IProduct, ICustomerType, ICustomerTag, IEmployee } from 'app/app.model';
import { WorkshopService } from 'app/services/workshop.service';
import { EmployeeService } from 'app/services/employee.service';
import { WorkOrderService } from 'app/services/workorder.service';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SupplierService } from 'app/services/supplier.service';
import { BookingService } from 'app/services/booking.service';
import { ProductService } from 'app/services/product.service';
import { MessageService } from 'primeng/api';
import { EMPTY, of, Subject } from 'rxjs';
import { catchError, map, switchMap, tap, finalize, takeUntil } from 'rxjs/operators';
import { SelectChangeEvent } from 'primeng/select';
import { CustomerService } from 'app/services/customer.service';
import { Popover } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { PopoverModule } from 'primeng/popover';
import { TagModule } from 'primeng/tag';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { emailOrTelephoneRequiredValidator } from 'app/validators/validator';
import { DigitalServiceService } from 'app/services/digitalservice.service';

@Component({
  selector: 'app-order-crud',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ProgressSpinnerModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    InputTextModule,
    AutoCompleteModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TabsModule,
    CheckboxModule,
    PanelModule,
    DialogModule,
    MessageModule,
    ToastModule,
    ConfirmDialogModule,
    FileUploadModule,
    PopoverModule,
    TagModule,
    MultiSelectModule,
    TextareaModule,
    TooltipModule
  ],
  templateUrl: './workorder-crud.component.html',
  styleUrls: ['./workorder-crud.component.css'],
  providers: [MessageService]
})

export class WorkOrderCrudComponent implements OnInit, OnDestroy {
  @ViewChild('nextInput') nextInput!: ElementRef;
  @ViewChild('customerPopup') customerPopup!: Popover;
  private destroy$ = new Subject<void>();
  uploadedFiles: any[] = [];
  customers: ICustomer[] = [];
  showSpinner: boolean = false;
  showCustomerSpinner:boolean = false;
  duplicateCustomerName: boolean = false; 
  services: IProduct[] = [];
  selectedServices: any[] = [];

  employees: IEmployee[] = [];
  dayBookings: IDailyCalendar[] = [];
  vehicles: string[] = [];
  times: string[] = [];
  paymentType: IEnum[] = [];
  workOrderStatus: IEnum[] = [];
  workOrder: FormGroup;
  oilTypes: string[] = ['5W30', '0W20', '5W40', '0W30', '10W30', '10W40'];
  isCreate: boolean = true;
  isNewObject: boolean = true;
  
  manufacturers: any[] = [];
  suppliers: ISupplier[] = [];
  products: any[] = [];
  models: any[] = [];

  // startCustomerId: number | null = null;
  // startCustomerName: string | null = null;
  // startCustomerTelephone: string | null = null;
  // startCustomerEmail: string | null = null;
  // submitted: boolean = false;

  //customerInput
  selectedCustomerName: any = null;


  /*** */

  woPurchases: IWOPurchase[] = [];
  newWOPurchase: IWOPurchase = {
    woPurchaseId: 0,
    supplierName: '',
    purchaseReference: '',
    purchaseNote: ''
  }


  groupedOrders: any;
  op: any;
  // Newly Added 
  customer: FormGroup;
  creditDays: number[] = [0, 7, 14, 21, 30];
  customerTypes: ICustomerType[] = [];
  customerTags: ICustomerTag[] = [];


  constructor(
    private messageService: MessageService,
    private logger: LogService,
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly workOrderService: WorkOrderService,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly workshopService: WorkshopService,
    private readonly employeeService: EmployeeService,
    private readonly supplierService: SupplierService,
    private readonly bookingService: BookingService,
    private readonly productService: ProductService,
    private cdr: ChangeDetectorRef,
    private readonly customerService: CustomerService,
    private readonly digitalService: DigitalServiceService,

  ) {

    this.workOrder = this.fb.group({
      workOrderId: null,
      customerId: [null, Validators.required],
      customerName: [null],
      customerTelephone: '',                    // Use customerTelephone
      customerEmail: ['', [Validators.email]],  // Use customerEmail
      serviceDuration: [null],
      oilType: '5W30',
      oilCapacity: null,
      workOrderDate: null,
      vehiclePlate: [null, Validators.required],
      vehicleMileage: null,
      vehicleManufacturer: null,
      vehicleModel: null,
      vehicleYear: null,
      paymentType: null,
      workOrderStatus: null,
      description: null,
      bookingDate: null,
      bookingTime: null,
      employeeId: null,
      offerId: null,
    });

    this.customer = this.fb.group({
      customerId: [0, Validators.required],
      customerName: ['', Validators.required],
      customerType: [],
      customerTag: [],
      organizationNo: [],
      vatId: [],
      invoiceCreditDays: [0],
      isCreditAllowed: [true],
      telephone: [],
      email: ['', [Validators.email]],
      digitalServiceId: ['', [Validators.email]],
    },
    {
      validators: [emailOrTelephoneRequiredValidator]  
    }
  );

  }
  ngOnInit() {
    const param: any = this.route.snapshot.params;
    this.loadCustomerTypes();
    this.loadCustomerTags();
  
    this.workOrderService
      .getWorkOrder(param.offerId, param.customerId, param.workOrderId, param.isDuplicate)
      .pipe(
        catchError((err) => {
          throw err; // Handle the error
        }),
        switchMap((response: any) => {
          if (response.data) {
            this.logger.info('WorkOrder Loaded', response.data);
            return this.productService.getProductsByCategory('labour').pipe(
              tap((response: any) => {
                this.logger.info(response);
                this.services = response;
                this.logger.info('Services Loaded', this.services);

              }),
              map(() => response)
            );
          }
          return of(null);
        })
      )
      .pipe(finalize(() => { }))
      .subscribe((response: any) => {
        if (response.data) {
          if (param.bookingDate)
            response.data.bookingDate = param.bookingDate;
          if (param.bookingTime)
            response.data.bookingTime = param.bookingTime;
          this.woPurchases = response.data.woPurchases || [];

          this.logger.info('WO Purchases', this.woPurchases);

          response.data.woServices.forEach((s: any) => {
            const matchingService = this.services.find(service => service.productName === s.serviceName);
            if (matchingService) {
              this.selectedServices.push(matchingService);
            }
          });
          
          // this.startCustomerId = response.data.customerId;
          // this.startCustomerName = response.data.customerName;
          // this.startCustomerTelephone = response.data.customerTelephone;
          // this.startCustomerEmail = response.data.customerEmail;
          
          this.selectedCustomerName = response.data.customerName;

          this.isNewObject = response.isNewObject;
          this.workOrder.patchValue(response.data);
          this.logger.info('WORKORDERS-0', response.data);
          this.logger.info('WORKORDERS', this.workOrder.value);

          //this.getSuppliers();
          this.getAllEmployees();
          if (response.data.bookingDate)
            this.getBookings(response.data.bookingDate);
          else
            this.getBookings(new Date().toISOString().split('T')[0]);
        }
        this.cdr.detectChanges();
      });
      
      
  }

  loadCustomerTags() {
    this.workshopService
      .getCustomerTags()
      .pipe(
        finalize(() => {
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.customerTags = response;
            this.logger.info('Customer Tags', this.customerTags);
            if (!(this.customer.get('customerTag') && Number(this.customer.get('customerTag')) > 0))
              this.customer.patchValue({ 'customerTag': this.customerTags[0].customerTagId });
          }
        },
        error: (err) => {
          this.logger.error('loadCustomerTags error', err);
        }
      });
  }

  loadCustomerTypes() {
    this.workshopService
      .getCustomerTypes()
      .pipe(
        finalize(() => {
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.customerTypes = response;
            this.logger.info('Customer Types', this.customerTypes);

            if (!(this.customer.get('customerType') && Number(this.customer.get('customerType')) > 0))
              this.customer.patchValue({ 'customerType': this.customerTypes[0].customerTypeId });
          }
        },
        error: (err) => {
          this.logger.error('loadCustomerTypes error', err);
        }
      });
  }
  onChangeCustomerType(event: SelectChangeEvent) {
    this.customer.patchValue({ customerType: event.value });
  }
  onChangeCustomerTag(event: SelectChangeEvent) {
    this.customer.patchValue({ customerTag: event.value });
  }

  getSuppliers() {
    this.supplierService
      .getAllSuppliers()
      .pipe(
        finalize(() => {
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.suppliers = res;
            this.logger.info('Printing Suppliers', this.suppliers);
          }
        },
        error: (err) => {
          this.logger.error('getSuppliers error', err);
        }
      });
  }

  getAllEmployees() {
    this.employeeService
      .getAllEmployees()
      .pipe(
        finalize(() => {
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.employees = res;
            this.logger.info('Printing Employees', this.employees);
          }
        },
        error: (err) => {
          this.logger.error('getAllEmployees error', err);
        }
      });
  }

  getBookings(bookingDate: string) {
    this.bookingService
      .getDayBookings(bookingDate)
      .pipe(
        finalize(() => {
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.logger.info(res);
          this.dayBookings = res;
        },
        error: (err) => {
          this.logger.error('getBookings error', err);
        }
      });
  }

  onChangeCustomer($event: any) {
    this.workOrder.patchValue({
      customerId: $event.customerId,
      customerName: $event.customerName,
      customerTelephone: $event.telephone || $event.customerTelephone,  // Map both possibilities
      customerEmail: $event.email || $event.customerEmail,              // Map both possibilities
    });
  }
  setFocusToNextComponent() {
    // Blur the currently focused element, if any
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.blur();
    }

    // Now set focus to the desired element
    if (this.nextInput) {
      this.nextInput.nativeElement.focus();
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/[^A-Z0-9]/gi, ''); // Remove invalid characters
    input.value = sanitizedValue.toUpperCase(); // Convert to uppercase
    this.workOrder.get('vehiclePlate')?.setValue(sanitizedValue); // Update 
  }
  filterManufacturers(event: any): void {
    this.manufacturers = this.sharedService.getVehicleManufacturers(event.query.toUpperCase());
  }
  filterSuppliers(event: any): void {
    this.supplierService
      .getSuppliersByprefix(event.query.toUpperCase())
      .pipe(
        finalize(() => {
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.suppliers = res;
            this.logger.info('Printing Suppliers', this.suppliers);
          }
        },
        error: (err) => {
          this.logger.error('filterSuppliers error', err);
        }
      });
  }

  filterProducts(event: any): void {
    this.productService.getProductsByprefix(event.query.toUpperCase())
      .pipe(
        finalize(() => {
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (products: IProduct[]) => {
          this.products = products.map(product => product.productName);
        },
        error: (err) => {
          this.logger.error('filterProducts error', err);
        }
      });
  }

  filterModels(event: any): void {
    this.models = this.sharedService.getVehicleModels(this.workOrder.get('vehicleManufacturer')?.value, event.query.toUpperCase());
  }
  onSelectCalendarDate() {
    //this.logger.info(selectedDate.toISOString().split('T')[0]);
    this.getBookings(this.workOrder.get('bookingDate')?.value);
  }

  onSelectService(event: any) {
    let hoursSum = 0;
    this.selectedServices.forEach(element => {
      hoursSum += element.quantity;
    });
    this.workOrder.patchValue({ serviceDuration: hoursSum });
  }
  saveWOPurchase() {
    const newPurchase = { ...this.newWOPurchase, woPurchaseId: this.woPurchases.length + 1 };
    this.woPurchases.push(newPurchase);
    this.newWOPurchase = { woPurchaseId: 0, supplierName: '', purchaseReference: '', purchaseNote: '' };
  }
  removeWOPurchase(woPurchase: any): void {

    this.logger.info('WO Purchases', this.woPurchases);
    this.logger.info('Received Purchases', woPurchase);
    this.woPurchases = this.woPurchases.filter(purchase => purchase.woPurchaseId !== woPurchase.woPurchaseId);

    this.logger.info('Remaining WO Purchases', this.woPurchases);

    this.woPurchases.forEach((order, index) => {
      order.woPurchaseId = index + 1; // Reassign index starting from 1
    });
  }
  saveWorkOrder() {
    this.logger.info('Submitting WorkOrder Form...');
    this.showSpinner = true;
    if (this.workOrder.invalid) {
      this.workOrder.markAllAsTouched();
      this.showSpinner = false;
      return;
    }
    this.logger.info(this.selectedServices);
    if(this.selectedServices.length === 0){ 
     this.workOrder.markAllAsTouched();
     this.showSpinner = false; 
     return;
    }

    var submittedWorkOrder: IWorkOrder = this.workOrder.value;
    submittedWorkOrder.woPurchases = [];
    this.woPurchases.forEach(p =>
      submittedWorkOrder.woPurchases.push({
        woPurchaseId: p.woPurchaseId,
        supplierName: p.supplierName,
        purchaseReference: p.purchaseReference,
        purchaseNote: p.purchaseNote
      }
      ));


    submittedWorkOrder.woServices = [];
    let i = 1; // Initialize the index to start from 1
    this.selectedServices.forEach(s => {
      submittedWorkOrder.woServices.push({
        index: i,
        serviceName: s.productName,
        serviceHours: s.quantity
      });
      i++;
    });

    
    this.workOrderService
      .upsertWorkOrder(submittedWorkOrder)
      .pipe(
        finalize(() => {
          this.showSpinner = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.router.navigate(['sv/workorder/details', this.workOrder.get('workOrderId')?.value]);
          }
        },
        error: (err) => {
          this.logger.error('onFormSubmit error', err);
        }
      });
  }


  onCancelForm() {
    this.location.back();
  }
  openCustomerDialog(event: Event) {
    this.showCustomerSpinner = false;
    this.customerService
      .getCustomer(undefined)
      .pipe(
        finalize(() => {
          // loading state is not set here since this is just filtering
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
                  this.loadCustomerTags();
                  this.loadCustomerTypes();
                  this.customer.patchValue({
                    customerId: res.data.customerId,
                    customerName: '',
                    organizationNo:'',
                    vatId: '',
                    invoiceCreditDays: 0 ,
                    telephone: '',
                    email: '',
                    digitalServiceId: '',
                  });
                  this.customerPopup.toggle(event);
          }
        },
        error: (err) => {
          this.logger.error('filterCustomer error', err);
        }
      });
  }

 
  saveCustomer() {
    this.logger.info('Save Customer Clicked');
    this.showCustomerSpinner = true; 
    this.customer.markAllAsTouched();
    if (this.customer.get('invoiceCreditDays')?.value == 0)
        this.customer.patchValue({ isCreditAllowed: false});
 
 if (this.customer.invalid) {
  Object.keys(this.customer.controls).forEach((key) => {
    const controlErrors = this.customer.get(key)?.errors;
    if (controlErrors) {
      console.log(`Control: ${key}, Errors:`, controlErrors);
    }
  });
}
 
 
    this.logger.info('Contact Required validation');
    if (this.customer.invalid) {
      this.logger.info('customer form is invalid');
        if (this.customer.hasError('contactRequired')) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please provide either Telephone or Email.',
            life: 4000
          });
          this.showCustomerSpinner = false;
          return;
        }
     
    
    this.logger.info('Customer email validation');
    const emailCtrl = this.customer.get('email');
    if (emailCtrl?.hasError('email')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Email Format',
        detail: 'Please enter a valid email address (e.g. user@example.com).',
        life: 4000
      });
      this.showCustomerSpinner = false;
      return;
    }
  }
    // Run async validations and save if valid
    this.logger.info('Start Running async validations for customer:');
    this.runAsyncValidationsAndSave();
    return;
  
    
  }
  runAsyncValidationsAndSave(): void {
  
  const name = this.customer.get('customerName')?.value?.trim();
  const digitalId = this.customer.get('digitalWorkshopId')?.value?.trim(); 
  
  this.logger.info('Running async validations for customer:', { name, digitalId });

  this.customerService.isCustomerExists(name).pipe(
    takeUntil(this.destroy$),
    // 1) Duplicate customer name
    switchMap((exists: boolean) => {
      if (exists) {
        this.logger.warn('Duplicate customer name:', name);
        this.showCustomerSpinner = false;
        this.duplicateCustomerName = true;
        this.messageService.add({
          severity: 'error',
          summary: 'Duplicate Customer',
          detail: 'This customer name already exists.',
          life: 4000,
        });
        // Stop the chain – do not continue to next steps
        return EMPTY;
      }
      
      // if (digitalId?.trim()) {
      //   return this.digitalService.isValidDigitalWorkshopId(digitalId.trim());
      // }
      // No digitalId to validate → treat as valid and move on
      return of(true);
    }),

    // 3) If digitalWorkshopId is invalid, stop; otherwise call upsertCustomer
    switchMap((isValidId: boolean) => {
      if (!isValidId) {
        this.showCustomerSpinner = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid DigitalWorkshop Id',
          detail: 'Please provide a valid DigitalWorkshop Id.',
          life: 4000,
        });
        return EMPTY;
      }

      return this.customerService.upsertCustomer(this.customer.value);
    }),

    finalize(() => {
      this.showCustomerSpinner = false;
    })
  ).subscribe({
    next: (res: any) => {
      if (res === true) {
          this.workOrder.patchValue({ 
            customerId: this.customer.get('customerId')?.value,
            customerName: this.customer.get('customerName')?.value,
            customerTelephone: this.customer.get('telephone')?.value,
            customerEmail: this.customer.get('email')?.value
          });  
          this.selectedCustomerName = this.customer.get('customerName')?.value;
          this.messageService.add({
            severity: 'success',
            summary: this.sharedService.T('success'),
            icon: 'pi pi-check-circle',
            life: 6000
          });
          this.customerPopup.hide();
      } else {
        // Backend returned something unexpected
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Something went wrong while saving the customer!',
          life: 6000,
        });
      }
    },
    error: (err) => {
      this.logger.error('upsertCustomer pipeline error', err);
    }
  });
}

filterCustomer(event: any) {
    let query = event.query;
    this.customerService
      .getCustomerByPrefix(query)
      .pipe(
        finalize(() => {
          // loading state is not set here since this is just filtering
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.customers = res;
          }
        },
        error: (err) => {
          this.logger.error('filterCustomer error', err);
        }
      });
  }

  onSelect(event: any) {
    this.workOrder.patchValue({
      customerId: event.value.customerId,
      customerName: event.value.customerName,
      customerTelephone: event.value.telephone,
      customerEmail: event.value.email,
    });
    this.selectedCustomerName = event.value.customerName;
  }

  onUnselectCustomer() {
    this.workOrder.patchValue({
      customerId: null,
      customerName: null,
      customerTelephone: '',
      customerEmail: '',
    });
    this.selectedCustomerName = null;
  }

  onCancelCreateCustomer() {
    this.customerPopup.hide();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

