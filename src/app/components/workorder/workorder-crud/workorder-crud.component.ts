import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { IWorkOrder, ISupplier, ICustomer, IDailyCalendar, IEnum, ISelect, IWOPurchase, IWorkShopService, IWOService, IProduct, ICustomerType, ICustomerTag, IEmployee } from 'app/app.model';
import { WorkshopService } from 'app/services/workshop.service';
import { EmployeeService } from 'app/services/employee.service';
import { WorkOrderService } from 'app/services/workorder.service';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { SupplierService } from 'app/services/supplier.service';
import { BookingService } from 'app/services/booking.service';
import { ProductService } from 'app/services/product.service';
import { MessageService } from 'primeng/api';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { SelectChangeEvent } from 'primeng/select';
import { RemovePlaceholderOnFocusDirective } from 'app/directives/remove-placeholder-on-focus.directive';
import { CustomerService } from 'app/services/customer.service';
import { Popover } from 'primeng/popover';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-order-crud',
  standalone: true,

  imports: [
    ...SHARED_IMPORTS,
    RemovePlaceholderOnFocusDirective,
    GenericLoaderComponent,IconFieldModule,InputIconModule  
  ],
  templateUrl: './workorder-crud.component.html',
  styleUrls: ['./workorder-crud.component.css'],
  providers: [MessageService]
})

export class WorkOrderCrudComponent implements OnInit {
  @ViewChild('nextInput') nextInput!: ElementRef;
  @ViewChild('customerPopup') customerPopup!: Popover;
  uploadedFiles: any[] = [];
  customers: ICustomer[] = [];

  services: IWorkShopService[] = [];
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
  isLoading: boolean = false;
  manufacturers: any[] = [];
  suppliers: ISupplier[] = [];
  products: any[] = [];
  models: any[] = [];

  startCustomerId: number | null = null;
  startCustomerName: string | null = null;
  startCustomerTelephone: string | null = null;
  startCustomerEmail: string | null = null;
  submitted: boolean = false;

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
    });

  }
  ngOnInit() {
    const param: any = this.route.snapshot.params;
    this.isLoading = true;
    this.workOrderService
      .getWorkOrder(param.offerId, param.customerId, param.workOrderId, param.isDuplicate)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          throw err; // Handle the error
        }),
        switchMap((response: any) => {
          if (response.data) {
            this.logger.info('WorkOrder Loaded', response.data);
            return this.workshopService.getServices().pipe(
              tap((servicesResponse: any) => {
                this.services = servicesResponse;
                this.logger.info('Services Loaded', this.services);
              }),
              map(() => response)
            );
          }
          this.isLoading = false;
          return of(null);
        })
      ).subscribe((response: any) => {
        if (response.data) {
          if (param.bookingDate)
            response.data.bookingDate = param.bookingDate;
          if (param.bookingTime)
            response.data.bookingTime = param.bookingTime;
          this.woPurchases = response.data.woPurchases || [];

          this.logger.info('WO Purchases', this.woPurchases);

          response.data.woServices.forEach((s: any) => {
            const matchingService = this.services.find(service => service.serviceName === s.serviceName);
            if (matchingService) {
              this.selectedServices.push(matchingService);
            }
          });
          this.startCustomerId = response.data.customerId;
          this.startCustomerName = response.data.customerName;
          this.startCustomerTelephone = response.data.customerTelephone;
          this.startCustomerEmail = response.data.customerEmail;
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
    this.loadCustomerTags();
    this.loadCustomerTypes();
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  loadCustomerTags() {
    this.isLoading = true;
    this.workshopService
      .getCustomerTags()
      .pipe(catchError((err) => {
        console.log(err); throw err;
      })).subscribe((response: any) => {
        if (response) {
          this.customerTags = response;
          if (!(this.customer.get('customerTag') && Number(this.customer.get('customerTag')) > 0))
            this.customer.patchValue({ 'customerTag': this.customerTags[0].customerTagId });
        }

      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  loadCustomerTypes() {
    this.isLoading = true;
    this.workshopService
      .getCustomerTypes()
      .pipe(catchError((err) => {
        console.log(err); throw err;
      })).subscribe((response: any) => {
        if (response) {
          this.customerTypes = response;
          if (!(this.customer.get('customerType') && Number(this.customer.get('customerType')) > 0))
            this.customer.patchValue({ 'customerType': this.customerTypes[0].customerTypeId });
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }
  onChangeCustomerType(event: SelectChangeEvent) {
    this.customer.patchValue({ customerType: event.value });
  }
  onChangeCustomerTag(event: SelectChangeEvent) {
    this.customer.patchValue({ customerTag: event.value });
  }


  // loadGroupOrders() {
  //   this.purchaseOrder.supplier = null;
  //   this.purchaseOrder.supplierOrderId = null;
  //   this.purchaseOrder.productName = undefined;
  //   this.purchaseOrder.quantity = null;
  //   this.purchaseOrder.unit = null;
  //   this.purchaseOrder.unitPrice = null;

  //   this.groupedOrders = Object.values(
  //     this.purchaseOrders.reduce((acc, item) => {
  //       if (!acc[item.supplierOrderId]) acc[item.supplierOrderId] = [];
  //       acc[item.supplierOrderId].push(item);
  //       return acc;
  //     }, {} as { [key: number]: IWOPurchaseOrder[] })
  //   );
  // }

  getSuppliers() {
    this.isLoading = true;
    this.supplierService
      .getAllSuppliers()
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        if (res) {
          this.suppliers = res;
          this.logger.info('Printing Suppliers', this.suppliers);
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  getAllEmployees() {
    this.isLoading = true;
    this.employeeService
      .getAllEmployees()
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        if (res) {
          this.employees = res;
          this.logger.info('Printing Employees', this.employees);
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  getBookings(bookingDate: string) {
    this.isLoading = true;
    this.logger.info('Sending Bookingdate...', bookingDate);
    this.bookingService
      .getDayBookings(bookingDate)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {

        this.logger.info(res);
        this.dayBookings = res;
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  // onChangeCustomer($event: any) {
  //   this.logger.info('EVENT Parent == ', $event.customerId, $event.customerName, $event.telephone, $event.email, $event.isCreatedNow);
  //   if ($event && $event.showMessage) {
  //     this.logger.info('Inside IF' + $event.customerId);
  //     if ($event.customerId > 0) {
  //       this.messageService.add({ severity: 'info', summary: 'Info', detail: 'New Customer has been created', life: 3000 });
  //       setTimeout(() => {
  //         this.setFocusToNextComponent();
  //       }, 3000);
  //     }
  //     else {
  //       this.messageService.add({ severity: 'error', summary: '', detail: this.sharedService.T('inv.sent.confirm.message.error') });
  //     }
  //   }

  //   this.workOrder.patchValue({
  //     customerId: $event.customerId,
  //     customerName: $event.customerName,
  //     customerTelephone: $event.telephone,
  //     customerEmail: $event.email
  //   });


  // }

  onChangeCustomer($event: any) {

    this.logger.info('onChangeCustomer EVENT Parent == ');

    this.logger.info('EVENT Parent == ', $event.customerId, $event.customerName, $event.telephone, $event.email, $event.isCreatedNow, $event.customerType, $event.startCustomerName);

    // if ($event && $event.showMessage) {
    //   this.logger.info('Inside IF' + $event.customerId);
    //   if ($event.customerId > 0) {
    //     this.messageService.add({ severity: 'info', summary: 'Info', detail: 'New Customer has been created', life: 3000 });
    //     setTimeout(() => {
    //       this.setFocusToNextComponent();
    //     }, 3000);
    //   }
    //   else {
    //     this.messageService.add({ severity: 'error', summary: '', detail: this.sharedService.T('inv.sent.confirm.message.error') });
    //   }
    // }

    // Patch values - map from customer edit screen names to work order form names
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
    this.isLoading = true;
    this.supplierService
      .getSuppliersByprefix(event.query.toUpperCase())
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        if (res) {
          this.suppliers = res;
          this.logger.info('Printing Suppliers', this.suppliers);
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  filterProducts(event: any): void {
    this.isLoading = true;
    this.productService.getProductsByprefix(event.query.toUpperCase())
      .subscribe((products: IProduct[]) => {
        this.products = products.map(product => product.productName);
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }





  filterModels(event: any): void {
    this.models = this.sharedService.getVehicleModels(this.workOrder.get('vehicleManufacturer')?.value, event.query.toUpperCase());
  }
  onSelectCalendarDate() {
    //this.logger.info(selectedDate.toISOString().split('T')[0]);
    this.getBookings(this.workOrder.get('bookingDate')?.value);
  }

  onSelectService(event: any) {
    this.logger.info(event.itemValue.serviceName + ' ' + event.itemValue.serviceHours);
    let hoursSum = 0;
    this.selectedServices.forEach(element => {
      hoursSum += element.serviceHours;
    });
    this.workOrder.patchValue({ serviceDuration: hoursSum });
  }

  // savePurchaseOrder() {
  //   const newPurchaseOrder = { ...this.purchaseOrder, index: this.purchaseOrders.length + 1 };
  //   this.purchaseOrders.push(newPurchaseOrder);
  //   this.loadGroupOrders();
  // }

  saveWOPurchase() {
    const newPurchase = { ...this.newWOPurchase, woPurchaseId: this.woPurchases.length + 1 };
    this.woPurchases.push(newPurchase);
    // Reset the newWOPurchase object for next entry
    this.newWOPurchase = { woPurchaseId: 0, supplierName: '', purchaseReference: '', purchaseNote: '' };
  }

  // savePurchaseOrderDetail(group: any) {
  //   // Check if there is an existing row with the same supplierOrderId and undefined ProductName
  //   const existingOrder = this.purchaseOrders.find(
  //     (order) => order.supplierOrderId === group.supplierOrderId && !order.productName
  //   );

  //   if (existingOrder) {
  //     this.logger.info('Existing Order Found', existingOrder);
  //     existingOrder.productName = this.purchaseOrder.productName; // Update ProductName or other details
  //     existingOrder.quantity = this.purchaseOrder.quantity;
  //     existingOrder.unit = this.purchaseOrder.unit;
  //     existingOrder.unitPrice = this.purchaseOrder.unitPrice;
  //     this.logger.info('Updated Existing Order:', existingOrder);
  //   } else {
  //     const newPurchaseOrder = {
  //       ...this.purchaseOrder,
  //       index: this.purchaseOrders.length + 1,
  //       supplier: {
  //         supplierId: group.supplier.supplierId,
  //         supplierName: group.supplier.supplierName
  //       },
  //       supplierOrderId: group.supplierOrderId
  //     };
  //     this.logger.info('PO-After', newPurchaseOrder);
  //     this.purchaseOrders.push(newPurchaseOrder);
  //   }


  //this.loadGroupOrders();
  //}


  // removePurchaseOrder(key: any): void {
  //   this.purchaseOrders = this.purchaseOrders.filter(order => order.supplierOrderId !== key.supplierOrderId);
  //   this.purchaseOrders.forEach((order, index) => {
  //     order.index = index + 1; // Reassign index starting from 1
  //   });
  //   this.loadGroupOrders();
  // }

  // removePurchaseOrderItem(key: any, item: any): void {
  //   this.purchaseOrders = this.purchaseOrders.filter(order =>
  //     !(order.supplierOrderId === key.supplierOrderId && order.index === item.index)
  //   );
  //   this.purchaseOrders.forEach((order, index) => {
  //     order.index = index + 1; // Reassign index starting from 1
  //   });
  //   this.loadGroupOrders();
  // }

  removeWOPurchase(woPurchase: any): void {

    this.logger.info('WO Purchases', this.woPurchases);
    this.logger.info('Received Purchases', woPurchase);
    this.woPurchases = this.woPurchases.filter(purchase => purchase.woPurchaseId !== woPurchase.woPurchaseId);

    this.logger.info('Remaining WO Purchases', this.woPurchases);

    this.woPurchases.forEach((order, index) => {
      order.woPurchaseId = index + 1; // Reassign index starting from 1
    });
  }


  onFormSubmit() {
    this.logger.info('Submitting WorkOrder Form...');

    if (this.workOrder.invalid) {
      this.logger.info(this.workOrder.invalid);
      this.logger.info(this.workOrder.errors);
      this.workOrder.markAllAsTouched();
      return;
    }
    this.logger.info('Form is Valid.. Starting Submittion');

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
        serviceName: s.serviceName,
        serviceHours: s.serviceHours
      });
      i++;
    });
    this.logger.info('submittedWorkOrder', submittedWorkOrder);
    this.isLoading = true;
    this.workOrderService
      .upsertWorkOrder(submittedWorkOrder)
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        if (res) {
          this.router.navigate(['sv/workorder/details', this.workOrder.get('workOrderId')?.value]);
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }


  onCancelForm() {
    this.location.back();
  }
  // loadCustomerTypes() {
  //   this.workshopService
  //     .getCustomerTypes()
  //     .pipe(catchError((err) => {
  //       console.log(err); throw err;
  //     })).subscribe((response: any) => {
  //       if (response) {
  //         this.customerTypes = response;
  //         this.logger.info('CUSTOMER TYPE', this.customerTypes);
  //         if (!(this.workOrder.get('customerType') && Number(this.workOrder.get('customerType')) > 0))
  //           this.workOrder.patchValue({ 'customerType': this.customerTypes[0].customerTypeId });

  //       }
  //     });

  // }

  // onChangeCustomerType(event: SelectChangeEvent) {
  //   this.workOrder.patchValue({ customerType: event.value });
  //   //if (event.value == 'privat')
  //   this.logger.info(event.value);
  // }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.workOrder.get(fieldName);
    return field ? field.invalid && (field.touched || this.submitted) : false;
  }
  async openCustomerDialog(event: Event) {
    const response: any = await firstValueFrom(
      this.customerService.getCustomer(0).pipe(
        catchError((err) => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Something went wrong while saving the customer!',
            life: 6000,
          });
          throw err;
        })));

    // ✅ Success / Update Message
    if (response.isNewObject && response.data.customerId > 0) {
      this.logger.info('Creating new customer object');
      this.customer.patchValue({ customerId: response.data.customerId });
      this.customerPopup.toggle(event);
    } else {
      this.logger.info('Could not create new customer object');
    }
  }

  // Helper method to clear field errors

  async onCreateCustomer() {
    // Mark all touched to trigger red borders
    this.customer.markAllAsTouched();
    const customerId = this.customer.get('customerId')?.value;
    const customerName = this.customer.get('customerName')?.value;
    const customerTelephone = this.customer.get('telephone')?.value;
    const customerEmail = this.customer.get('email')?.value;
    const digitalServiceId = this.customer.get('digitalServiceId')?.value;

    // 🔸 Customer Name Empty Validation
    if (!customerName?.trim()) {
      this.customer.get('customerName')?.setErrors({ required: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter the customer name.',
        life: 4000,
      });
      return;
    }

    // 🔸 Either Telephone or Email Required Validation

    if (!customerTelephone && customerEmail) {
      this.customer.get('customerEmail')?.setErrors({ required: true });
      this.customer.get('customerTelephone')?.setErrors({ required: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please provide either Telephone or Email.',
        life: 4000,
      });
      return;
    }

    // 🔸 Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (customerEmail && !emailRegex.test(customerEmail)) {
      this.customer.get('customerEmail')?.setErrors({ email: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Email Format',
        detail: 'Please enter a valid email address (e.g. user@example.com).',
        life: 4000,
      });
      return;
    }

    // 🔸 Digital Workshop ID Format Validation

    if (digitalServiceId && !emailRegex.test(digitalServiceId)) {
      this.customer.get('digitalServiceId')?.setErrors({ invalidFormat: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Digital Workshop',
        detail: 'Please enter a valid Digital Workshop (e.g. workshop@example.com).',
        life: 4000,
      });
      return;
    }
    if (digitalServiceId) {
      try {
        const isValidUser = await firstValueFrom(this.sharedService.isValidAppUser(digitalServiceId));
        if (!isValidUser) {
          this.customer.get('digitalServiceId')?.setErrors({ invalidUser: true });
          this.messageService.add({
            severity: 'error',
            summary: 'Invalid Digital Service ID',
            detail: 'The Digital Service ID is not valid.',
            life: 4000,
          });
          return;
        }
      } catch (error) {
        console.error('Error validating App User', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Could not validate Digital Service ID. Please try again.',
          life: 4000,
        });
        return;
      }
    }

    if (this.customer.invalid) {
      this.customer.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all required fields.',
        life: 4000,
      });
      return;
    }

    const originalCustomerName = await this.getCustomerName(customerId);
    const exists = await this.checkIfCustomerExists(customerName);

    if (exists) {
      this.customer.get('customerName')?.setErrors({ customerExists: true });
      this.messageService.add({
        severity: 'error',
        summary: 'Duplicate Customer',
        detail: 'This customer name already exists.',
        life: 4000,
      });
      return;
    }
    if (this.customer.get('invoiceCreditDays')?.value > 0)
      this.customer.patchValue({ isCreditAllowed: true });
    else
      this.customer.patchValue({ isCreditAllowed: false, invoiceCreditDays: 0 });
    this.isLoading = true;
    // 🧠 API call
    const res: any = await firstValueFrom(
      this.customerService.upsertCustomer(this.customer.value).pipe(
        catchError((err) => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Something went wrong while saving the customer!',
            life: 6000,
          });
          throw err;
        })
      )
    );

    if (res === true || res?.success === true) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${customerName} has been successfully created!`,
        life: 6000,
      });
      // Wait a bit so toastr shows before navigating
      setTimeout(() => {

        this.startCustomerId = customerId;
        this.startCustomerName = customerName;;
        this.startCustomerTelephone = customerTelephone;
        this.startCustomerEmail = customerEmail;

        this.workOrder.patchValue({
          customerId: customerId,
          customerName: customerName,
          customerTelephone: customerTelephone,
          customerEmail: customerEmail
        });
        this.resetCustomerForm();
        this.logger.info(customerTelephone, customerEmail);
        this.logger.info('Work Order Value:', this.workOrder.value);
        this.customerPopup.hide();
        this.isLoading = false;
      }, 1000);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Unexpected Response',
        detail: 'Server did not confirm save operation.',
        life: 6000,
      });
      this.isLoading = false;
    }
  }


  async checkIfCustomerExists(customerName: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.customerService.isCustomerExists(customerName).pipe(
          catchError((err) => {
            console.log(err);
            throw err;
          })
        )
      );
      return response; // Assuming the API returns `true` if the customer exists
    } catch (error) {
      console.error('Error checking if customer exists:', error);
      return false; // Handle errors gracefully
    }
  }

  async getCustomerName(customerId: number): Promise<string> {
    try {
      this.isLoading = true;
      const response = await firstValueFrom(
        this.customerService.getCustomerName(customerId).pipe(
          catchError((err) => {
            console.log(err);
            throw err;
          })
        )
      );
      return response.customerName;
    } catch (error) {
      console.error('Error checking if customer exists:', error);
      setTimeout(() => {
        this.isLoading = false;
      }, 500);
      return ''; // Handle errors gracefully
    }
  }


  onCancelCreateCustomer() {
    this.logger.info('on cancel');
  }

  private clearFieldErrors(): void {
    const fields = ['customerName', 'email', 'telephone', 'customerTypeName'];
    fields.forEach(field => {
      const control = this.workOrder.get(field);
      if (control?.errors) {
        control.setErrors(null);
      }
    });
  }

  // Reset form method
  private resetCustomerForm(): void {
    this.customer.get('customerName')?.setErrors(null);
    this.customer.get('telephone')?.setErrors(null);
    this.customer.get('email')?.setErrors(null);
    this.customer.get('digitalServiceId')?.setErrors(null);

    this.customer.patchValue({
      customerId: [0],
      customerName: [''],
      customerType: [],
      customerTag: [],
      organizationNo: [],
      vatId: [],
      invoiceCreditDays: [0],
      isCreditAllowed: [true],
      telephone: [],
      email: [''],
      digitalServiceId: [''],
    });
    this.clearFieldErrors();
  }

  //(copy from customer-input)


  filterCustomer(event: any) {
    let query = event.query;
    this.customerService
      .getCustomerByPrefix(query)
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((res: any) => {
        if (res) {
          this.customers = res;
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
}

