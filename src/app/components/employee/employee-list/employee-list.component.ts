import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IEmployee, IPager } from 'app/app.model'
import { SharedService } from 'app/services/shared.service';
import { catchError } from 'rxjs';
import { LogService } from 'app/services/log.service';
import { EmployeeService } from 'app/services/employee.service';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { GenericLoaderComponent } from '../shared/generic-loader/generic-loader.component';
@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    ProgressSpinnerModule
  ],
  templateUrl: './employee-list.component.html'
})
export class EmployeeListComponent {
  employees: IEmployee[] = [];
  filters: FormGroup;
  pager: IPager = <IPager>{};
  isLoading: boolean = false;
  // Filter data
  employeeTypes: any[] = [];
  employeeTags: any[] = [];
  employeeCities: any[] = [];

  constructor(
    private logger: LogService,
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly fb: FormBuilder,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
  ) {
    this.filters = this.fb.group({
      currentPage: 1,
      pageSize: 10,
      sortBy: undefined,
      sortDir: undefined,
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => { this.sharedService.updateFiltersFromQueryParams(this.filters, params) });

    this.getEmployees();
    this.loadFilterOptions();
  }

  getEmployees() {
    this.isLoading = true;
    this.employeeService
      .getEmployees(this.filters)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        const objectData: any = res.objectList;
        this.employees = objectData;
        this.pager = res.pager;
        this.isLoading = false;
      });
  }


  onPageChange(e: any) {
    this.filters.patchValue({ currentPage: e.page + 1, pageSize: e.rows });
    this.getEmployees();
  }

  onPageSizeChange(event: any) {
    this.filters.patchValue({ pageSize: event.value });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getEmployees();
  }

  sortColumn(e: any) {
    if (e) {
      let pageIndex = e.first / e.rows;
      this.pager.firstPage = e.first;
      this.filters.patchValue({ currentPage: (++pageIndex).toString(), pageSize: e.rows, sortDir: e.sortOrder, sortBy: e.sortField });
       this.sharedService.updateFiltersInNavigation(this.filters);
      this.getEmployees();
    }
  }

  deleteEmployee(employeeId: number) {
    const selected = this.employees.find(e => e.employeeId === employeeId);
    if (!selected) return;

    const toDeactivate: IEmployee = { ...selected, isActive: false } as IEmployee;

    this.isLoading = true;
    this.employeeService
      .upsertEmployee(toDeactivate)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          this.isLoading = false;
          throw err;
        })
      )
      .subscribe((res) => {
        this.getEmployees();
        this.isLoading = false;
      });
  }

  editEmployee(employeeId: number) {
    this.router.navigate(['sv/employee/crud', employeeId]);
  }

  redirectToEmployeeCrudComponent() {
    this.router.navigate(['sv/employee/crud', 0]);
  }

  loadFilterOptions(): void {
    this.employeeTypes = [
      { employeeTypeId: 1, employeeTypeName: 'Permanent' },
      { employeeTypeId: 2, employeeTypeName: 'Contract' },
      { employeeTypeId: 3, employeeTypeName: 'Intern' }
    ];
    this.employeeTags = [
      { employeeTagId: 1, employeeTagName: 'Developer' },
      { employeeTagId: 2, employeeTagName: 'Designer' },
      { employeeTagId: 3, employeeTagName: 'Manager' }
    ];
    this.employeeCities = [
      { employeeCityId: 1, employeeCityName: 'Lahore' },
      { employeeCityId: 2, employeeCityName: 'Karachi' },
      { employeeCityId: 3, employeeCityName: 'Islamabad' }
    ];
  }

  keyupEmployeeName(target: any) {
    const name = target.value?.trim() || '';
    this.filters.patchValue({ employeeName: name });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getEmployees();
  }

  onClearEmployeeName() {
    this.filters.patchValue({ employeeName: '' });
     this.sharedService.updateFiltersInNavigation(this.filters);
    this.getEmployees();
  }
}