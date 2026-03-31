import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from 'app/services/employee.service';
import { LogService } from 'app/services/log.service';
import { SharedService } from 'app/services/shared.service';
import { IEmployee } from 'app/app.model';
import { catchError, finalize, takeUntil, Subject } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-employee-crud',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    ToastModule,
    TextareaModule
  ],
  templateUrl: './employee-crud.component.html',
  styleUrls: ['./employee-crud.component.css'],
  providers: [ConfirmationService, MessageService],
})
export class EmployeeCrudComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  employee!: FormGroup;
  isLoading: boolean = false;
  
  isNewObject: boolean = true;
  isCheckingName = false;

  duplicateNameMessage: string = '';

  activeOptions = [
    { text: 'Active', value: true },
    { text: 'Inactive', value: false }
  ];

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private employeeService: EmployeeService, 
    private logger: LogService,
    public readonly sharedService: SharedService, 
    private messageService: MessageService, 
    private route: ActivatedRoute,
    
  ) { 
  this.employee = this.fb.group({
      employeeId: [0, [Validators.required]],
      personNumber: ['', [Validators.required]],
      fullName: ['', [Validators.required]],
      jobTitle: this.sharedService.getDefaultEnum('jobTitle').value,
      hireDate: ['', [Validators.required]],
      terminationDate: [''],
      monthlySalary: [0],
      street: [''],
      postNo: [''],
      city: [''],
      country: this.sharedService.getDefaultEnum('country').value,
      telephone: ['',[Validators.required]],
      email: ['', [Validators.email]],
      skills: [''],
      certifications: [''],
      isActive: [true],
      isUpdate: false
    });
  

  }

  checkNameAvailability(fullName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!fullName || fullName.trim().length === 0) {
        resolve(false);
        return;
      }

      this.employeeService.checkExistingEmployee(
        this.sharedService.wmsId,
        fullName.trim()
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists: boolean) => {
          resolve(exists);
        },
        error: (error) => {
          this.logger.error('Error checking employee name:', error);
          reject(error);
        }
      });
    });
  }
  
  ngOnInit(): void {
    const employeeId = Number(this.route.snapshot.params['id']);
    this.employeeService.getEmployee(employeeId)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.isNewObject = response.isNewObject;
            if(this.isNewObject){
              this.employee.patchValue({employeeId: response.data.employeeId, isActive: true});
            } else {
            this.employee.patchValue(response.data);
            }
          }
        },
        error: (err) => {
          this.logger.error('Error loading employee:', err);
        }
      });


  }


  async onFormSubmit() {

    if (this.employee.invalid) {
      this.employee.markAllAsTouched();
      return;
    }

    // Validate 12-digit Person Number
    const personNumber = this.employee.get('personNumber')?.value;
    if (personNumber && personNumber.length !== 12) {
      this.messageService.add({
              severity: 'error',
              summary: this.sharedService.T('error'),
              detail: this.sharedService.T('Person Number must be exactly 12 digits.'),
              life: 8000
            });
      return;
    }

    // Check duplicate Full Name
    if (this.isNewObject) {
      const fullName = this.employee.get('fullName')?.value?.trim();
      if (fullName) {
        try {
          const exists = await this.checkNameAvailability(fullName);
          this.isCheckingName = false;

          if (exists) {
            this.messageService.add({
              severity: 'error',
              summary: this.sharedService.T('error'),
              detail: this.sharedService.T('employee name already exists.'),
              life: 8000
            });

            return;
          }
        } catch (error) {
            this.messageService.add({
              severity: 'error',
              summary: this.sharedService.T('error'),
              detail: this.sharedService.T('genericErrorContactSupport'),
              life: 8000
            });
          return;
        }
      }
    }

    // Submit Employee Data
    const employee = this.employee.value;
    this.isLoading = true;
    this.employeeService.upsertEmployee(employee)
      .pipe(
        finalize(() => { this.isLoading = false; }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            const empRes = res as IEmployee;
            const name = empRes.fullName || employee.fullName || 'Employee';
            this.messageService.add({       
              severity: 'success',
              summary: this.sharedService.T('success'),
              icon: 'pi pi-check-circle',
              life: 6000,
            });
            this.router.navigate(['sv/employee']);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: this.sharedService.T('error'),
              detail: this.sharedService.T('genericErrorContactSupport'),
              life: 8000
            });
          }
        },
        error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: this.sharedService.T('error'),
              detail: this.sharedService.T('genericErrorContactSupport'),
              life: 8000
            });
        }
      });
  }

  onCancelForm() {
    this.router.navigate(['sv/employee']);
  }

  // Extra Input Validations
  onPersonNumberInput(event: any) {
    const value = event.target.value.replace(/\D/g, '');
    this.employee.get('personNumber')?.setValue(value, { emitEvent: false });

    if (value.length !== 12 && this.employee.get('personNumber')?.touched) {
      this.employee.get('personNumber')?.setErrors({ invalidLength: true });
    } else {
      this.employee.get('personNumber')?.setErrors(null);
    }
  }

  onPersonNumberKeyPress(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}