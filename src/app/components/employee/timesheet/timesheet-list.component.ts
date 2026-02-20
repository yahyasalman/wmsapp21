import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError } from 'rxjs';
import { Form, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';
import { TimesheetService } from 'app/services/timesheet.service';
import { ITimesheet, IPager, ISelect, IEnums, IEmployee } from 'app/app.model'
import { SHARED_IMPORTS } from 'app/sharedimports';
import { SelectChangeEvent } from 'primeng/select';
import { GenericLoaderComponent } from 'app/components/shared/generic-loader/generic-loader.component';
import { EmployeeService } from 'app/services/employee.service';
import { Popover } from 'primeng/popover';


@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS, GenericLoaderComponent
  ],
  templateUrl: './timesheet-list.component.html',
  styleUrl: './timesheet-list.component.css',
  providers: [ConfirmationService, MessageService]
})
export class TimesheetListComponent implements OnInit {
  @ViewChild('checkoutPopup') checkoutPopup!: Popover;
  @ViewChild('deletePopup') deletePopup!: Popover;
  @ViewChild('commentsPopup') commentsPopup!: Popover;
  todayDateString: string = '';
  timesheets: ITimesheet[] = [];
  errorTimesheets: ITimesheet[] = [];
  selectedComment: string = '';
  selectedTimeSheetId: number = 0;
  filters: FormGroup;
  timesheet: FormGroup;
  checkoutTimesheet: FormGroup;
  deleteTimesheet: FormGroup;
  isInsert: boolean = true;
  employees: ISelect[] = [];
  pager: IPager = <IPager>{};
  isLoading: boolean = false;
  isDialogVisible: boolean = false;
  selectedDate: Date | null = null;
  employeeCount: number = 0;
  isSelectedDateFutureDate:boolean = false;
  timesheetTypeOptions:IEnums[] = [];
  constructor(private logger: LogService,
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly fb: FormBuilder,
    private readonly timesheetService: TimesheetService,
    private readonly employeeService: EmployeeService,
    private route: ActivatedRoute,
    private messageService: MessageService,) {

    this.filters = this.fb.group({
      year: (new Date().getFullYear()).toString(),
      fromDate: (new Date().getFullYear()) + '-01-01',
      toDate: (new Date().getFullYear()) + '-12-31',
      timesheetType: '',
      employeeId: '',
      isActive: '',
      currentPage: 1,
      pageSize: 10,
      sortBy: '',
      sortDir: '-1'
    });

    const startDate = new Date();
    this.timesheet = this.fb.group({
      employeeId: 0,
      timesheetType: this.sharedService.getDefaultEnum('timesheetType').value,
      startDate: startDate,
      timeIn: '',
      timeOut: '',
      isFullDay: false,
      isActive: true,
      comments: '',
      deleteComments: '',
    });

    this.deleteTimesheet = this.fb.group({
      deleteComments: ['', Validators.required],
    });

    this.checkoutTimesheet = this.fb.group({
      timeOut: ['', Validators.required],
    });
  }
  ngOnInit() {
    this.todayDateString = this.sharedService.getDateString(new Date());
    this.route.queryParams.subscribe((params) => { this.sharedService.updateFiltersFromQueryParams(this.filters, params) });
    this.timesheetTypeOptions = this.sharedService.getEnums('timesheetType');
    this.getEmployees();
    this.getTimesheets();
    this.resetTimesheetForm();
  }

  getEmployees() {
    this.isLoading = true;
    this.employeeService
      .getAllEmployees()
      .pipe(
        catchError((err) => {
          console.log(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res: IEmployee[]) => {
        if (res) {
          this.employees = res.map(employee => ({text: employee.fullName,value: employee.employeeId.toString()}));          
          this.employeeCount = res.length;
        }
      });
      this.isLoading = false;
  }

  getTimesheets() {
    this.isLoading = true;
    this.timesheetService
      .getTimesheets(this.filters)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        const objectData: any = res.objectList;
        this.timesheets = objectData;
        this.logger.info(this.timesheets);
        this.pager = res.pager;
        this.logger.info('Page-Info');
        this.logger.info(this.pager);
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  onChangeEmployee(event: SelectChangeEvent) {
    this.filters.patchValue({ employeeId: event.value });
     this.sharedService.updateFiltersInNavigation(this.filters);
     this.logger.info(this.filters.value);
     this.getTimesheets();
  }
  onClearEmployee() {
    this.filters.patchValue({ employeeId: '' });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getTimesheets();

  }
  onSelectStartDate(selectedStartDate: Date) {
    this.timesheet.get('startDate')?.setValue(selectedStartDate);
    this.selectedDate = selectedStartDate;
    const currentDate = new Date(); 
    currentDate.setHours(0, 0, 0, 0); 
    if(selectedStartDate > currentDate)
    {
        this.timesheetTypeOptions = this.timesheetTypeOptions.filter(option => option.value !== 'workhour');
        this.timesheet.patchValue({'timesheetType':'leave'});
    }
    else 
    {
      this.timesheetTypeOptions = this.sharedService.getEnums('timesheetType');
      this.timesheet.patchValue({'timesheetType':this.sharedService.getDefaultEnum('timesheetType').value})
    }
  }

  onChangeStatus(event: SelectChangeEvent) {
    this.filters.patchValue({ isActive: event.value });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getTimesheets();
  }
  onClearStatus() {
    this.filters.patchValue({ isActive: '' });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getTimesheets();
  }

  onChangeType(event: SelectChangeEvent) {
    this.filters.patchValue({ timesheetType: event.value });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getTimesheets();
  }

  onClearType() {
    this.filters.patchValue({ timesheetType: '' });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getTimesheets();
  }

  onSelectYear(selectedValue: any) {
    var selectedFromDate = selectedValue.getFullYear() + '-01-01';
    var selectedToDate = selectedValue.getFullYear() + '-12-31';
    this.filters.patchValue({ fromDate: selectedFromDate, toDate: selectedToDate });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getTimesheets();
  }

  onSelectFromDate(selectedFromDate: Date) {
    this.filters.patchValue({ fromDate: this.sharedService.getDateString(selectedFromDate) });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getTimesheets();
  }

  onSelectToDate(selectedToDate: Date) {
    this.filters.patchValue({ toDate: this.sharedService.getDateString(selectedToDate) });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getTimesheets();
  }

  // Pager 
  onPageChange(e: any) {
    this.filters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getTimesheets();
  }
  onPageSizeChange(event: SelectChangeEvent) {
    this.filters.patchValue({ pageSize: event.value });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getTimesheets();
  }

  sortColumn(e: any) {
    if (e) {
      let pageIndex = e.first / e.rows;
      this.pager.firstPage = e.first;
      this.filters.patchValue({ currentPage: (++pageIndex).toString(), pageSize: e.rows, sortDir: e.sortOrder, sortBy: e.sortField });
       this.sharedService.updateFiltersInNavigation(this.filters);
      this.getTimesheets();
    }
  }

  // *** pager ends ****
  showCheckInDialog() {
    this.resetTimesheetForm();
    this.isDialogVisible = true;
  }

  onChangeTimesheetType(event: any) {
    const selectedType = event.value;
    if (selectedType !== 'workhour') {
      this.timesheet.patchValue({ timeIn: '', timeOut: '', comments: '' });
    }
  }

  checkIn() {

    const type = this.getf('timesheetType')?.value;
    const timeIn = this.getf('timeIn')?.value;

    if (type === 'workhour') {
      // 1. Required Check
      if (!timeIn || timeIn.trim() === '') {
        this.getf('timeIn')?.setErrors({ required: true }); // Border red karne ke liye
        this.getf('timeIn')?.markAsTouched();

        // this.messageService.add({
        //   severity: 'warn',
        //   summary: 'Required Field',
        //   detail: 'Time In is required'
        // });
        return;
      }

      // 2. Format Check (00:00 - 23:59)
      const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
      if (!timeRegex.test(timeIn)) {
        this.getf('timeIn')?.setErrors({ pattern: true });

        this.messageService.add({
          severity: 'error',
          summary: this.sharedService.T("invalidFormat"),
          detail: this.sharedService.T('enterTimeFormat')
        });
        return;
      }
    }
    this.isLoading = true;

    if (this.timesheet.invalid) {
      this.timesheet.get('startDate')?.setErrors({ invalid: 'Datum/Tid in är obligatorisk' });
      this.timesheet.markAllAsTouched();
      this.isLoading = false;
      return;
    }
    var submitTimeSheet: ITimesheet = this.timesheet.value;
    const formData = this.timesheet.getRawValue();
    submitTimeSheet.startDate = this.sharedService.getDateString(formData['startDate']);

    this.isLoading = false;
    this.timesheetService
      .checkin(submitTimeSheet)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        if (res.state == false) {
          this.errorTimesheets = res.overlaps;
          const overlapDetails = res.overlaps.map(overlap => {
            const timesheetId = overlap.timesheetId;
            const timesheetDate = overlap.startDate.split(' ')[0];
            return `${timesheetId} - ${timesheetDate}`;
          });
          const overlapTime = overlapDetails.join('\n');
          this.logger.info(res); this.messageService.add({
            severity: 'error',
            summary: this.sharedService.T('timeOverlapDetected'),

            detail: this.sharedService.T('timeOverlapWithRecords') + `\n${overlapTime}\n\n`,
            life: 10000
          });

        } else {
          this.messageService.add({
            severity: 'success',
            detail: this.sharedService.T('timeRegisterSuccess'),
          });
          this.getTimesheets();
          this.resetTimesheetForm();
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }
  cancelCheckIn() {
    this.resetTimesheetForm();
    this.isDialogVisible = false;
  }
  resetTimesheetForm() {
    const startDate = new Date();
    this.timesheet.patchValue({
      employeeId: '',
      timesheetType: this.sharedService.getDefaultEnum('timesheetType').value,
      startDate: startDate,
      timeIn: '',
      timeOut: '',
      isFullDay: false,
      isActive: true,
      comments: '',
      deleteComments: '',
    });

    this.selectedDate = startDate;

  }


  async openCheckout(timesheetId: number, event?: Event) {
    this.selectedTimeSheetId = timesheetId;
    this.checkoutPopup.toggle(event);
  }
  checkout(event: Event) {
    if (this.checkoutTimesheet.invalid) {
      this.checkoutTimesheet.get('timeOut')?.setErrors({ required: true });
      this.checkoutTimesheet.markAllAsTouched();
      return;
    }
    const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
    if (!timeRegex.test(this.checkoutTimesheet.get('timeOut')?.value)) {
      this.messageService.add({
        severity: 'error',
        detail: this.sharedService.T('enterTimeFormat'),
      });
      return;
    }
    this.timesheetService
      .checkout(this.selectedTimeSheetId, this.checkoutTimesheet.get('timeOut')?.value)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.messageService.add({
            severity: 'success',
            detail: this.sharedService.T('timeRegisterSuccess'),
            life: 3000
          });
          this.checkoutTimesheet.patchValue({ timeOut: '' });
          this.checkoutPopup.toggle(event);
          this.getTimesheets();
        }
        else {
          this.logger.info('Checkout failed');
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);

  }

  async openDelete(timesheetId: number, event?: Event) {
    this.selectedTimeSheetId = timesheetId;
    this.deletePopup.toggle(event);
  }

  delete(event: Event) {
    if (this.deleteTimesheet.invalid) {
      this.deleteTimesheet.get('deleteComments')?.setErrors({ required: true });
      this.deleteTimesheet.markAllAsTouched();
      return;
    }
    const deleteTimesheet: Partial<ITimesheet> = {
      timesheetId: this.selectedTimeSheetId,
      isActive: false,
      deleteComments: this.deleteTimesheet.get('deleteComments')?.value
    };
    this.timesheetService
      .delete(deleteTimesheet as ITimesheet)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.messageService.add({
            severity: 'success',
            detail: this.sharedService.T('sucess'),
            life: 3000
          });
          this.deletePopup.toggle(event);
          this.getTimesheets();
        }
        else {
          this.logger.info('Deletion failed');
        }
      });
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }
  openComments(timesheet: ITimesheet, event: Event) {
    this.selectedTimeSheetId = timesheet.timesheetId;
    this.selectedComment = timesheet.isActive ? (timesheet.comments || '') : (timesheet.deleteComments || '');
    this.commentsPopup.toggle(event);
  }

  updateComment(event: Event) {
    if (this.selectedTimeSheetId === 0) return;

    this.isLoading = true;

    const updatePayload: any = {
      timesheetId: this.selectedTimeSheetId,
      comments: this.selectedComment
    };

    this.timesheetService.updateComments(updatePayload)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          this.messageService.add({ severity: 'error', detail: 'Update failed' });
          throw err;
        })
      )
      .subscribe((res) => {
        this.isLoading = false;
        if (res) {
          this.messageService.add({
            severity: 'success',
            detail: this.sharedService.T('commentsUpdated'),
            life: 3000
          });
          this.commentsPopup.hide();
          this.getTimesheets();
        }
      });
  }

  //for : this
  // --- Function for Time In ---
  onTimeInInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    let displayValue = value;

    if (value.length >= 2) {
      let hours = parseInt(value.substring(0, 2));
      let minutes = value.length > 2 ? parseInt(value.substring(2, 4)) : 0;

      if (hours > 23 || minutes > 59) {
        this.getf('timeIn')?.setErrors({ 'invalidTime': true });
        this.messageService.add({ severity: 'error', summary: this.sharedService.T('invalidTime'), detail: this.sharedService.T('enterTimeFormat'), life: 2000 });
      } else {
        this.getf('timeIn')?.setErrors(null);
      }

      if (value.length > 2) {
        displayValue = value.substring(0, 2) + ':' + value.substring(2, 4);
      }
    }
    this.getf('timeIn')?.setValue(displayValue, { emitEvent: false });
    this.getf('timeIn')?.markAsTouched();
  }

  // --- Function for Time Out ---
  onTimeOutInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    let displayValue = value;

    if (value.length >= 2) {
      let hours = parseInt(value.substring(0, 2));
      let minutes = value.length > 2 ? parseInt(value.substring(2, 4)) : 0;

      if (hours > 23 || minutes > 59) {
        this.getf('timeOut')?.setErrors({ 'invalidTime': true });
        this.messageService.add({ severity: 'error', summary: this.sharedService.T('invalidTime'), detail: this.sharedService.T('enterTimeFormat'), life: 2000 });
      } else {
        this.getf('timeOut')?.setErrors(null);
      }

      if (value.length > 2) {
        displayValue = value.substring(0, 2) + ':' + value.substring(2, 4);
      }
    }
    this.getf('timeOut')?.setValue(displayValue, { emitEvent: false });
    this.getf('timeOut')?.markAsTouched();
  }
  onCheckoutTimeInput(event: any) {

    let value = event.target.value.replace(/\D/g, '');
    let displayValue = value;

    if (value.length >= 2) {
      let hours = parseInt(value.substring(0, 2));
      let minutes = value.length > 2 ? parseInt(value.substring(2, 4)) : 0;

      if (hours > 23 || minutes > 59) {
        this.checkoutTimesheet.get('timeOut')?.setErrors({ 'invalidTime': true });
        this.messageService.add({ severity: 'error', summary: this.sharedService.T('invalidTime'), detail: this.sharedService.T('enterTimeFormat'), life: 2000 });
      } else {
        this.checkoutTimesheet.get('timeOut')?.setErrors(null);
      }

      if (value.length > 2) {
        displayValue = value.substring(0, 2) + ':' + value.substring(2, 4);
      }
    }
    this.checkoutTimesheet.get('timeOut')?.setValue(displayValue, { emitEvent: false });
    this.checkoutTimesheet.get('timeOut')?.markAsTouched();
  }

  getf(field: string) {
    return this.timesheet.get(field);
  }
}
