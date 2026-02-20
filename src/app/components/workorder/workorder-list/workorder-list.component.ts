import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { IWorkOrder, IEnum, IPager, SverityType } from 'app/app.model';
import { WorkOrderService } from 'app/services/workorder.service';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { BookingService } from 'app/services/booking.service';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { SelectChangeEvent } from 'primeng/select';
import { Popover } from 'primeng/popover';
import { catchError, filter, of } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';
@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS, GenericLoaderComponent
  ], providers: [ConfirmationService, MessageService],
  styleUrl: './workorder-list.component.css',
  templateUrl: './workorder-list.component.html'
})

export class WorkOrderListComponent {
  @ViewChild('op') op!: Popover;
  selectedLocale: string = 'sv-SE';

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

  constructor(private logger: LogService,
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private readonly fb: FormBuilder,
    private readonly workOrderService: WorkOrderService,
    private readonly bookingService: BookingService) {

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
      sortBy: '',
      sortDir: '',
      isActive: 1
    });
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
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        this.orders = res.objectList;
        this.orders.forEach((order) => {
          order.workOrderDate = new Date(order.workOrderDate).toISOString().split('T')[0];
          this.workOrderStatus = [];
          this.logger.info('workorder status', order.workOrderStatus);
          if (order.workOrderStatus != 'completed') {
            this.sharedService.getEnums('workOrderStatus').forEach((status) => {
              if (status.value != 'booking' && status.value != order.workOrderStatus) {
                const copiedOrder = { ...order, workOrderStatus: status.value };
                this.workOrderStatus.push({ label: status.text, command: () => { this.setWorkOrderStatus(copiedOrder); } });
              }
            });
          }
          //order.workOrderStatusItems = this.workOrderStatus;
        });
        this.pager = res.pager;
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
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
        catchError((err) => {
          console.log(err);
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.sharedService.T('g.errorOccurred'),
            life: 3000
          });
          throw err;
        })
      )
      .subscribe((res: any) => {
        if (res) {
          this.messageService.add({
            severity: 'success', summary: this.sharedService.T('success'),
            detail: this.sharedService.T('workorder') + '#' + workOrder.workOrderId + ' ' + this.sharedService.T('statusConfirmMessage') + this.sharedService.getEnumByValue('workOrderStatus', workOrder.workOrderStatus).text
          });
          this.getOrders();
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  onStatusChange(workOrderId: number, newStatus: string) {
    console.log(`Status for Work Order ${workOrderId} changed to ${newStatus}`);
    let selectedWorkOrder: IWorkOrder | undefined = this.orders.find(workOrder => workOrder.workOrderId === workOrderId);
    if (selectedWorkOrder) {
      selectedWorkOrder.workOrderStatus = newStatus;
      this.setWorkOrderStatus(selectedWorkOrder);
    }
    // Update the status in your backend or state management

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
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
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
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
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
  // printTodaysPdf()
  // {
  //   let today = new Date().toISOString().split('T')[0];
  //   this.logger.info(today);

  //   this.workOrderService
  //   .getWorkOrdersByCalendarDate(today)
  //   .pipe(
  //     catchError((err) => {
  //       console.log(err);
  //       throw err;
  //     })
  //   )
  //   .subscribe((response: any) => {
  //     if(response){
  //       let workorders:IWorkOrder[] = response;
  //       let workOrderIds = '';
  //       workorders.forEach(function (workOrder) {
  //         workOrderIds += workOrder.workOrderId.toString() + ",";
  //       }); 
  //       workOrderIds = workOrderIds.substring(0, workOrderIds.length - 1);
  //       this.logger.info('ids...' + workOrderIds);
  //       this.workOrderService
  //     .getPdf(workOrderIds)
  //   .pipe(
  //     catchError((err) => {
  //       console.log(err);
  //       throw err;
  //     })
  //   )
  //   .subscribe((response: any) => {
  //     if(response){
  //       var newBlob = new Blob([response], { type: "application/pdf" });
  //       window.open(window.URL.createObjectURL(newBlob));
  //     }
  //   });

  //     }
  //   });

  // }
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
            setTimeout(() => {
              this.isLoading = false;
            }, 500);
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
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  redirectToOrderDetailComponent(workOrderId: number) {
    this.router.navigate(['sv/workorder/details', workOrderId]);
  }

  redirectToOrderCrudComponent() {
    this.router.navigate(['sv/workorder/crud']);
  }

  onPageSizeChange(event: SelectChangeEvent) {
    this.filters.patchValue({ currentPage: 1, pageSize: event.value });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();
  }

  onPageChange(e: any) {
    this.filters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
    this.sharedService.updateFiltersInNavigation(this.filters);
    this.getOrders();
  }

  sortColumn(e: any) {
    if (e) {
      let pageIndex = e.first / e.rows;
      // If the current page is already set, use it instead of resetting
      if (this.filters.get('currentPage')?.value) {
        pageIndex = +this.filters.get('currentPage')?.value - 1; // Convert to zero-based index
      }
      // Update the pager and filters
      this.pager.firstPage = e.first;
      this.filters.patchValue({
        currentPage: (pageIndex + 1).toString(), // Convert back to one-based index
        pageSize: e.rows,
        sortDir: e.sortOrder,
        sortBy: e.sortField,
      });
      this.sharedService.updateFiltersInNavigation(this.filters);
      this.getOrders
    }
  }
  setSverity(value: string): SverityType {
    const allowed: SverityType[] = ['success', 'secondary', 'warn', 'help', 'info', 'danger', 'primary', 'contrast'];
    return allowed.includes(value as SverityType) ? (value as SverityType) : 'primary';
  }

}
