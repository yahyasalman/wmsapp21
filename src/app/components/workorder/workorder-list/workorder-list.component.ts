import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { IWorkOrder, IEnum, IPager, SverityType } from 'app/app.model';
import { WorkOrderService } from 'app/services/workorder.service';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { BookingService } from 'app/services/booking.service';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { SelectChangeEvent } from 'primeng/select';
import { Popover } from 'primeng/popover';
import { catchError, filter, of, finalize, takeUntil, Subject } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ProgressSpinnerModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    AutoCompleteModule,
    CheckboxModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    PaginatorModule,
    TooltipModule,
    InputTextModule,
    TagModule
  ], providers: [ConfirmationService, MessageService],
  styleUrl: './workorder-list.component.css',
  templateUrl: './workorder-list.component.html'
})

export class WorkOrderListComponent implements OnInit, OnDestroy {
  @ViewChild('op') op!: Popover;
  selectedLocale: string = 'sv-SE';
  sortField = 'workorderId';
  sortOrder = -1;
  totalRecords: number = 0;

  orders: IWorkOrder[] = [];
  workOrderStatus: MenuItem[] = [];
  selectedWorkOrder: IWorkOrder = <IWorkOrder>{};
  pager: IPager = <IPager>{};
  paymentTypes: IEnum[] = [];
  filters: FormGroup;
  currentPage: number = 1;
  vehiclePlates: string[] = [];
  isLoading: boolean = false;
  hideDeletedBookings = true;
  private destroy$ = new Subject<void>();

  constructor(private logger: LogService,
    private readonly errorHandler: ErrorHandlerService,
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private readonly fb: FormBuilder,
    private readonly workOrderService: WorkOrderService,
    private readonly bookingService: BookingService,
    private readonly cdr: ChangeDetectorRef) {

    const currentDate = new Date();
    const oneYearBack = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());

    this.filters = this.fb.group({
      paymentType: '',
      workOrderStatus: '',
      year: (currentDate.getFullYear()).toString(),
      fromDate: this.sharedService.getDateString(oneYearBack),//(currentDate.getFullYear()) + '-01-01',
      toDate: this.sharedService.getDateString(currentDate),
      vehiclePlate: '',
      currentPage: 1,
      pageSize: 10,
      sortBy: this.sortField,
      sortDir: this.sortOrder,
      isActive: 1
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.initializePage();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.urlAfterRedirects.startsWith('/sv/workorder')) {
          this.initializePage();
        }
      });

  }
  initializePage() {
    this.route.queryParams.subscribe((params) => { this.sharedService.updateFiltersFromQueryParams(this.filters, params) });
    this.getOrders();
  }
  getOrders() {
    this.isLoading = true;
    this.workOrderService
      .getWorkOrders(this.filters)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.orders = res.objectList;
          this.logger.info('getOrders success', { orderCount: this.orders.length, orders: this.orders });
          this.orders.forEach((order) => {
            order.workOrderDate = new Date(order.workOrderDate).toISOString().split('T')[0];
            this.workOrderStatus = [];
            if (order.workOrderStatus != 'completed') {
              this.sharedService.getEnums('workOrderStatus').forEach((status) => {
                if (status.value != 'booking' && status.value != order.workOrderStatus) {
                  const copiedOrder = { ...order, workOrderStatus: status.value };
                  this.workOrderStatus.push({ label: status.text, command: () => { this.setWorkOrderStatus(copiedOrder); } });
                }
              });
            }
          });
          this.totalRecords = res.pager.totalRecords;
        },
        error: (err) => {
          this.errorHandler.handleError(err, 'getOrders', 'Failed to load work orders.');
        }
      });
  }
  getFilteredEnums(workOrderStatus: string) {
    let enums = this.sharedService.getEnums('workOrderStatus');
    let currentEnum = this.sharedService.getEnumByValue('workOrderStatus', workOrderStatus);
    return enums.filter(d => d.index >= currentEnum.index).sort((a, b) => a.index - b.index);
  }
  setWorkOrderStatus(workOrder: IWorkOrder) {
    this.isLoading = true;
    this.workOrderService
      .upsertWorkOrder(workOrder)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.messageService.add({
              severity: 'success',
              summary: this.sharedService.T('success'),
              icon: 'pi pi-check-circle'
            });
            this.getOrders();
          }
        },
        error: (err) => {
          this.logger.error('setWorkOrderStatus error', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.sharedService.T('g.errorOccurred'),
            life: 3000
          });
        }
      });
  }

  onStatusChange(workOrderId: number, newStatus: string) {
    console.log(`Status for Work Order ${workOrderId} changed to ${newStatus}`);
    let selectedWorkOrder: IWorkOrder | undefined = this.orders.find(workOrder => workOrder.workOrderId === workOrderId);
    if (selectedWorkOrder) {
      selectedWorkOrder.workOrderStatus = newStatus;
      this.setWorkOrderStatus(selectedWorkOrder);
    }

  }

  HideDeletedBookings(event: any) {
    const checked = event.checked;

    if (event.checked)
      this.filters.patchValue({ isActive: 1 });
    else
      this.filters.patchValue({ isActive: '' });

    this.filters.patchValue({ currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();
  }
  // dropdwon start
  toggle(event: any, workOrderId: IWorkOrder) {
    this.selectedWorkOrder = workOrderId;
    this.op.toggle(event);
  }
  confirmStatusChange(event: any, statusValue: string, statusText: string) {

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.sharedService.T('confirmMessage') + statusText,
      header: '',
      closable: false,
      closeOnEscape: false,
      rejectButtonProps: {
        label: this.sharedService.T('confirmCancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.sharedService.T('confirmSave'),
      },
      accept: () => {
        this.isLoading = true;
        this.selectedWorkOrder.workOrderStatus = statusValue;
        this.workOrderService
          .upsertWorkOrder(this.selectedWorkOrder)
          .pipe(
            catchError((err) => {
              console.log(err);
              this.isLoading = false;
              throw err;
            })
          )
          .subscribe((res: any) => {
            if (res) {
              this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('confirmSaveMessage') });
              this.getOrders();
            }
          });
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


  onSelectYear(selectedValue: any) {
    var selectedFromDate = selectedValue.getFullYear() + '-01-01';
    var selectedToDate = selectedValue.getFullYear() + '-12-31';
    this.filters.patchValue({ currentPage: 1, fromDate: selectedFromDate, toDate: selectedToDate });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();
  }

  onChangeType(event: SelectChangeEvent, type: string) {
    if (type == 'payment') {
      this.filters.patchValue({ paymentType: event.value, currentPage: 1 });
    } else {
      this.filters.patchValue({ status: event.value, currentPage: 1 });
    }
    this.filters.patchValue({ currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();
  }

  onSelectFromDate() {
    this.filters.patchValue({ currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();
  }

  onSelectToDate() {
    this.filters.patchValue({ currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();
  }
  onSelectNumberPlate(event: any) {
    // filters will automatically updated. Just reload filters
    this.filters.patchValue({ vehiclePlate: event.value, currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();
  }

  keyupNumberPlate(event: any) {
    if (event?.value) {
      this.workOrderService.getVehiclePlates(event?.value)
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe((response) => {
          this.vehiclePlates = response;
        });
    }
  }

  onClearNumberPlate() {
    // implement
    this.filters.patchValue({ vehiclePlate: '', currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();
  }
  onClearPaymentType() {
    this.filters.patchValue({ paymentType: '', currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();

  }
  onClearWorkOrderStatus() {
    this.filters.patchValue({ workOrderStatus: '', currentPage: 1 });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();

  }

  getSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'booking':
        return 'info'; // Blue
      case 'in-progress':
        return 'warn'; // Yellow
      case 'awaiting-parts':
        return 'danger'; // Red
      case 'completed':
        return 'success'; // Green
      default:
        return undefined; // Default case
    }
  }
  deleteBooking(workOrderId: number, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to this Booking?', //this.sharedService.T('workorder-list.confirm.message') + statusText,
      header: '',
      closable: false,
      closeOnEscape: false,
      rejectButtonProps: {
        label: this.sharedService.T('confirmCancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.sharedService.T('confirmSave'),
      },
      accept: () => {
        this.isLoading = true;
        this.bookingService
          .deleteBooking(workOrderId)
          .pipe(
            catchError((err) => {
              console.log(err);
              this.isLoading = false;
              throw err;
            })
          )
          .subscribe((res: any) => {
            if (res) {
              this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('confirmSaveMessage') });
              this.getOrders();
            }
          });
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

  redirectToOrderDetailComponent(workOrderId: number) {
    this.router.navigate(['sv/workorder/details', workOrderId]);
  }

  redirectToOrderCrudComponent() {
    this.router.navigate(['sv/workorder/crud']);
  }

  setSverity(value: string): SverityType {
    const allowed: SverityType[] = ['success', 'secondary', 'warn', 'help', 'info', 'danger', 'primary', 'contrast'];
    return allowed.includes(value as SverityType) ? (value as SverityType) : 'primary';
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
     setTimeout(() => {
      this.getOrders();
     }, 0);
  }

}
