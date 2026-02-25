import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IEmployee, IWorkOrder, IWeeklyCalendar } from 'app/app.model';
import { SharedService } from 'app/services/shared.service';
import { BookingService } from 'app/services/booking.service';
import { EmployeeService } from 'app/services/employee.service';
import { LogService } from 'app/services/log.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectChangeEvent } from 'primeng/select';
import { catchError, firstValueFrom } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS, GenericLoaderComponent
  ], templateUrl: './booking-list.component.html',
  providers: [ConfirmationService, MessageService, ConfirmDialogModule],
  styleUrls: ['./booking-list.component.css', './booking-list.colors.css']
})
export class BookingListComponent {

  @ViewChild('op') popover: any;
  filters: FormGroup;
  weekCalendar: IWeeklyCalendar[] = [];

  selectedDay: number = new Date().getDay();
  selectedYear: number;
  selectedMonth: string = '';
  selectedWeek: number;
  selectedStartDate: string = ''
  selectedEndDate: string = ''
  isLoading: boolean = false
  selectedPaymentTypeText: string = '';
  selectedServiceTypeText: string = '';
  selectedCustomerName: string = '';
  selectedEmployeeName: string = '';

  currentWeekMondayDate: string = '';
  currentWeekMondayBookingCount: number = 0;
  currentWeekTuesdayBookingCount: number = 0;
  currentWeekWednesdayBookingCount: number = 0;
  currentWeekThursdayBookingCount: number = 0;
  currentWeekFridayBookingCount: number = 0;
  currentWeekSaturdayBookingCount: number = 0;
  currentWeekSundayBookingCount: number = 0;

  currentWeekTuesdayDate: string = '';
  currentWeekWednesdayDate: string = '';
  currentWeekThursdayDate: string = '';
  currentWeekFridayDate: string = '';
  currentWeekSaturdayDate: string = '';
  currentWeekSundayDate: string = '';

  date: Date[] | undefined;
  employees: IEmployee[] = [];
  selectedEmployees: IEmployee[] = [];
  selectedBooking : IWorkOrder = {} as IWorkOrder;
  isDialogVisible:boolean = false;
  //bookingsLabel = ''
  //noBookingsLabel = ''
  openMenuKey: string | null = null;

  constructor(private logger: LogService,
    public readonly sharedService: SharedService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly bookingService: BookingService,
    private readonly employeeService: EmployeeService,
     private readonly route: ActivatedRoute,
  ) {

    //this.selectedWeek = this.sharedService.getCurrentWeekNumber(new Date());
    this.selectedYear = new Date().getFullYear();

    var currentWeek = this.sharedService.getWeekInfo(new Date(), 'current');
    this.selectedStartDate = currentWeek.startDate;
    this.selectedEndDate = currentWeek.endDate;
    this.selectedWeek = currentWeek.weekNumber;

    const currentDate = new Date();
    const monthName = currentDate.toLocaleString('default', { month: 'long' }); // Get full month name
    const year = currentDate.getFullYear();
    this.selectedMonth = `${monthName} ${year}`;

    this.filters = this.fb.group({
      serviceType: '',
      employeeIds: [],
    });
  }

  async ngOnInit(): Promise<void>{
    try{
    await this.getEmployees();
    this.selectedEmployees = [...this.employees];
    this.route.queryParams.subscribe((params) => {this.sharedService.updateFiltersFromQueryParams(this.filters, params)});
    this.filters.patchValue({ employeeIds: this.selectedEmployees.map(employee => employee.employeeId).join(',') });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getBookings();
    }catch (error) {
    this.logger.error('Error during initialization:', error);
  } finally {
    // Set loading to false once everything is done
    this.isLoading = false;
  }
  }

async getEmployees(): Promise<void> {
  try {
    const response = await firstValueFrom(this.employeeService.getAllEmployees());
    this.employees = response; 
  } catch (error) {
    this.logger.error('Failed to fetch employees:', error);
  }
}

// getEmployees() {
//   this.isLoading = true;
//     this.employeeService
//       .getAllEmployees()
//       .pipe(
//         catchError((err) => {
//            this.isLoading = false;
//           console.log(err);
//           throw err;
//         })
//       )
//       .subscribe((res: any) => {
//         if (res) {
//           this.employees = res;
//           this.selectedEmployees = [...this.employees];
//           this.filters.patchValue({ employeeIds: this.selectedEmployees.map(employee => employee.employeeId).join(',') });
//           this.getBookings();
//       }
//       });
// setTimeout(() => {
//    this.isLoading = false;
// }, 500);  }

  getBookings() {
    this.isLoading = true;
    this.bookingService
      .getWeeklyBookings(this.selectedStartDate, this.selectedEndDate, this.filters)
      .pipe(
        catchError((err) => {
           this.isLoading = false;
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.weekCalendar = res;
          this.logger.info(this.weekCalendar);
          this.currentWeekMondayDate = this.weekCalendar[0].mondayDate;
          this.currentWeekTuesdayDate = this.weekCalendar[0].tuesdayDate;
          this.currentWeekWednesdayDate = this.weekCalendar[0].wednesdayDate;
          this.currentWeekThursdayDate = this.weekCalendar[0].thursdayDate;
          this.currentWeekFridayDate = this.weekCalendar[0].fridayDate;
          this.currentWeekSaturdayDate = this.weekCalendar[0].saturdayDate;
          this.currentWeekSundayDate = this.weekCalendar[0].sundayDate;
          this.currentWeekMondayBookingCount = this.weekCalendar.reduce(
            (total, row) => total + (row.mondayBookings?.length ?? 0),
            0
          );
          this.currentWeekTuesdayBookingCount = this.weekCalendar.reduce(
            (total, row) => total + (row.tuesdayBookings?.length ?? 0),
            0
          );
          this.currentWeekWednesdayBookingCount = this.weekCalendar.reduce(
            (total, row) => total + (row.wednesdayBookings?.length ?? 0),
            0
          );
          this.currentWeekThursdayBookingCount = this.weekCalendar.reduce(
            (total, row) => total + (row.thursdayBookings?.length ?? 0),
            0
          );
          this.currentWeekFridayBookingCount = this.weekCalendar.reduce(
            (total, row) => total + (row.fridayBookings?.length ?? 0),
            0
          );
          this.currentWeekSaturdayBookingCount = this.weekCalendar.reduce(
            (total, row) => total + (row.saturdayBookings?.length ?? 0),
            0
          );
          this.currentWeekSundayBookingCount = this.weekCalendar.reduce(
            (total, row) => total + (row.sundayBookings?.length ?? 0),
            0
          );
        }
      });
       setTimeout(() => {
         this.isLoading = false;
       }, 500);
  }

  onSelectMonth(d: Date) {
    let selectedDate = new Date(d.getFullYear(), d.getMonth(), 1);

    let selectedWeek = this.sharedService.getWeekInfo(selectedDate, 'current');
    this.selectedStartDate = selectedWeek.startDate;
    this.selectedEndDate = selectedWeek.endDate;
    this.selectedWeek = selectedWeek.weekNumber;
    this.getBookings();
    //this.selectedYear = selectedDate.getFullYear();

  }

  

  onClickPreviousWeek() {
    const previousstartDateObject = new Date(this.selectedStartDate);
    let selectedWeek = this.sharedService.getWeekInfo(previousstartDateObject, 'previous');
    this.selectedStartDate = selectedWeek.startDate;
    this.selectedEndDate = selectedWeek.endDate;
    this.selectedWeek = selectedWeek.weekNumber;

    const currentstartDateObject = new Date(this.selectedStartDate);
    const monthName = currentstartDateObject.toLocaleString('default', { month: 'long' }); // Get full month name
    const year = currentstartDateObject.getFullYear();

    this.selectedMonth = `${monthName} ${year}`;

    this.getBookings();


  }

  onClickNextWeek() {
    const previousstartDateObject = new Date(this.selectedStartDate);
    let selectedWeek = this.sharedService.getWeekInfo(previousstartDateObject, 'next');
    this.selectedStartDate = selectedWeek.startDate;
    this.selectedEndDate = selectedWeek.endDate;
    this.selectedWeek = selectedWeek.weekNumber;

    const currentstartDateObject = new Date(this.selectedStartDate);
    const monthName = currentstartDateObject.toLocaleString('default', { month: 'long' }); // Get full month name
    const year = currentstartDateObject.getFullYear();

    this.selectedMonth = `${monthName} ${year}`;

    this.getBookings();

  }

  viewBooking(id: string): void {
    console.log(`Viewing booking with ID: ${id}`);
  }

  editBooking(id: string): void {
    console.log(`Editing booking with ID: ${id}`);
  }

  onChangeBookingType(event: SelectChangeEvent) {
    this.filters.patchValue({ isReserved: event.value });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getBookings();
  }

  // onChangeEmployee(event: SelectChangeEvent) {
  //   this.selectedEmployees = event.value;
  //   this.filters.patchValue({ employeeIds: this.selectedEmployees.map(employee => employee.employeeId).join(',') });
  //    this.sharedService.updateFiltersInNavigation(this.filters);
  //   this.getBookings();
  // }
onChangeEmployee() {
  // selectedEmployees already updated hai ngModel ki wajah se
  const ids = this.selectedEmployees.map((emp: any) => emp.employeeId).join(',');
  
  this.filters.patchValue({ employeeIds: ids });
  this.sharedService.updateFiltersInNavigation(this.filters);
  this.getBookings();
}
  onSelectFromDate() {

    //this.filters.patchValue({fromDate: selectedFromDate.toISOString().split('T')[0] });
    //this.logger.info(this.filters.get('fromDate')?.value);
    //this.filters.patchValue({fromDate: this.filters.get('fromDate')?.value });
    this.getBookings();
  }

  onSelectToDate() {
    //this.filters.patchValue({toDate: selectedToDate});
    this.getBookings();
  }

  onPageChange(e: any) {
    this.logger.info('e.page');
    this.logger.info(e.page);

    this.filters.patchValue({ currentPage: e.page + 1 });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getBookings();
  }

  showBookingInfo(booking: IWorkOrder) {
    this.logger.info('inside');
    this.logger.info(booking);
    this.selectedBooking = booking;
    this.selectedCustomerName = booking.customerName;
    this.selectedEmployeeName = booking.employeeName;
    this.selectedPaymentTypeText = this.sharedService.getEnumByValue('paymentType', booking.paymentType).text;
    //this.selectedServiceTypeText = this.sharedService.getEnumByValue('serviceType',booking.serviceType).text;
    this.isDialogVisible = true;
  }

  toggleBookingMenu(event: Event, key: string) {
    event.stopPropagation();
    this.openMenuKey = this.openMenuKey === key ? null : key;
  }

  bookingLabel(booking: IWorkOrder): string {
    const parts = [
      booking.vehiclePlate,
      booking.vehicleManufacturer,
      booking.vehicleModel,
      booking.vehicleYear,
    ].filter(Boolean);
    return parts.join(' ');
  }

  printBooking(event: Event, booking: IWorkOrder) {
    event.stopPropagation();
    if (!booking?.workOrderId) {
      this.messageService.add({
        severity: 'error',
        summary: '',
        detail: 'Missing work order id.',
        life: 3000,
      });
      return;
    }
    this.sharedService
      .printPdf('workorder', booking.workOrderId.toString(), 'basic')
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          var newBlob = new Blob([response], { type: "application/pdf" });
          window.open(window.URL.createObjectURL(newBlob));
        }
      });
  }

  isTimeBookedAt(timeStr: string): boolean {
    const currentMinutes = this.toMinutes(timeStr);
    if (currentMinutes === null) {
      return false;
    }
    const dayKeys = [
      'mondayBookings',
      'tuesdayBookings',
      'wednesdayBookings',
      'thursdayBookings',
      'fridayBookings',
      'saturdayBookings',
      'sundayBookings',
    ] as const;

    for (const row of this.weekCalendar) {
      for (const dayKey of dayKeys) {
        const bookings = row[dayKey] as IWorkOrder[] | undefined;
        if (!bookings?.length) {
          continue;
        }
        for (const booking of bookings) {
          const startMinutes = this.toMinutes(booking.bookingTime || row.cTime);
          const durationMinutes = this.getDurationMinutes(booking);
          if (startMinutes === null || durationMinutes === null) {
            continue;
          }
          const endMinutes = startMinutes + durationMinutes;
          if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private toMinutes(timeStr: string): number | null {
    if (!timeStr) {
      return null;
    }
    const parts = timeStr.split(':').map((part) => Number.parseInt(part, 10));
    if (parts.length < 2 || parts.some((val) => Number.isNaN(val))) {
      return null;
    }
    return parts[0] * 60 + parts[1];
  }

  private getDurationMinutes(booking: IWorkOrder): number | null {
    const hours = Number.parseFloat(booking.estimatedHours ?? '');
    if (Number.isFinite(hours) && hours > 0) {
      return Math.round(hours * 60);
    }
    if (booking.woServices?.length) {
      const sum = booking.woServices.reduce((total, service) => total + (service.serviceHours || 0), 0);
      if (sum > 0) {
        return Math.round(sum * 60);
      }
    }
    return null;
  }

  scrollBooking(event: Event, direction: number) {
    const target = event.currentTarget as HTMLElement | null;
    const slider = target?.closest('.booking-slider') as HTMLElement | null;
    const track = slider?.querySelector('.booking-track') as HTMLElement | null;
    if (!track) {
      return;
    }
    const slides = Array.from(track.querySelectorAll<HTMLElement>('.booking-slide'));
    if (slides.length === 0) {
      return;
    }
    const current = slides.reduce((closestIdx, slide, idx) => {
      const closest = slides[closestIdx];
      return Math.abs(slide.offsetLeft - track.scrollLeft) < Math.abs(closest.offsetLeft - track.scrollLeft)
        ? idx
        : closestIdx;
    }, 0);
    const next = Math.max(0, Math.min(slides.length - 1, current + direction));
    track.scrollTo({ left: slides[next].offsetLeft, behavior: 'smooth' });
  }

  scrollToIndex(event: Event, index: number) {
    const target = event.currentTarget as HTMLElement | null;
    const slider = target?.closest('.booking-slider') as HTMLElement | null;
    const track = slider?.querySelector('.booking-track') as HTMLElement | null;
    if (!track) {
      return;
    }
    const slides = Array.from(track.querySelectorAll<HTMLElement>('.booking-slide'));
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    if (!slides[clamped]) {
      return;
    }
    track.scrollTo({ left: slides[clamped].offsetLeft, behavior: 'smooth' });
  }

  createBooking(bookingDate: string, bookingTime: string) {
    this.router.navigate(['sv/workorder/crud', { bookingDate: bookingDate, bookingTime: bookingTime }]);
  }


  printBookings(selectedDate: any) {

    //let today = new Date().toISOString().split('T')[0];
    this.logger.info('Inside');
    this.logger.info(selectedDate);
    this.bookingService
      .getWorkOrdersByBookingTime(selectedDate, '')
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          let workorders: IWorkOrder[] = response;
          let workOrderIds = '';
          workorders.forEach(function (workOrder) {
            workOrderIds += workOrder.workOrderId.toString() + ",";
          });
          workOrderIds = workOrderIds.substring(0, workOrderIds.length - 1);
          this.logger.info('ids...' + workOrderIds);
          this.sharedService
            .printPdf('workorder', workOrderIds, 'basic')
            .pipe(
              catchError((err) => {
                console.log(err);
                throw err;
              })
            )
            .subscribe((response: any) => {
              if (response) {
                var newBlob = new Blob([response], { type: "application/pdf" });
                window.open(window.URL.createObjectURL(newBlob));
              }
            });

        }
      });

  }
  deleteBooking(workOrderId: number, event: any) {
    this.logger.info('inside....');
    this.logger.info(workOrderId);

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to this Booking?', //this.sharedService.T('workorder-list.confirm.message') + statusText,
      header: '',
      closable: false,
      closeOnEscape: false,
      rejectButtonProps: {
        label: this.sharedService.T('workorder-list.confirm.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.sharedService.T('workorder-list.confirm.save'),
      },
      accept: () => {
        this.bookingService
          .deleteBooking(workOrderId)
          .pipe(
            catchError((err) => {
              console.log(err);
              throw err;
            })
          )
          .subscribe((res: any) => {
            if (res) {
              this.messageService.add({ severity: 'info', summary: '', detail: this.sharedService.T('workorder-list.confirm.save.message') });
              this.getBookings();
              this.getEmployees();
            }
          });

      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: '',
          detail: this.sharedService.T('workorder-list.confirm.cancel.message'),
          life: 3000,
        });
      },
    });
  }

  getCssClass(description: string) {
    let color = 'lightBlue';
    if (description == 'helg')
      color = '#FF1A00';
    return `py-1 px-2 mb-1 rounded-sm w-fit text-xs font-bold text-[${color}] bg-[#FF1A001A]`
  }

  onCancel(){
    this.isDialogVisible = false;
  }

}


