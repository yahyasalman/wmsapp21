import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from 'app/services/employee.service';
import { LogService, SharedService } from 'app/services';
import { IEmployee } from 'app/app.model';
import { catchError } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-employee-crud',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
    ProgressSpinnerModule
  ],
  templateUrl: './employee-crud.component.html',
  styleUrls: ['./employee-crud.component.css'],
  providers: [ConfirmationService, MessageService],
})
export class EmployeeCrudComponent implements OnInit {
  employee!: FormGroup;
  isLoading: boolean = false;
  
  isNewObject: boolean = true;
  isCheckingName = false;

  duplicateNameMessage: string = '';

  // Dropdown Options
  readonly calendarColorOptions = [
    { text: '🔵 Blue', value: 'blue' },
    { text: '🟢 Green', value: '#579467' },
    { text: '🔴 Red', value: 'red' },
    { text: '🟡 Yellow', value: 'yellow' },
    { text: '🟣 Purple', value: 'purple' }
  ];
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
    
  ) { }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      ).subscribe({
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
    this.initializeForm();
    this.loadEmployeeData(employeeId);
  }

  initializeForm(): void {
    this.employee = this.fb.group({
      employeeId: [0, [Validators.required]],
      personNumber: ['', [Validators.required]],
      fullName: ['', [Validators.required]],
      friendlyName: [''],
      jobTitle: ['', [Validators.required]],
      hireDate: ['', [Validators.required]],
      terminationDate: [''],
      monthlySalary: [0],
      calendarColor: [''],
      street: [''],
      postNo: [''],
      city: [''],
      country: [''],
      telephone: [''],
      email: ['', [Validators.email]],
      skills: [''],
      certifications: [''],
      employeeCountry: [''],
      isActive: [true],
      isUpdate: false
    });
  }

  loadEmployeeData(employeeId: number): void {
    this.logger.info('Loading Employee Data:');
    this.isLoading = true;
    this.employeeService.getEmployee(employeeId)
      .pipe(catchError((err) => { 
        console.log(err); 
        this.isLoading = false; 
        throw err; 
      }))
      .subscribe((response: any) => {
        if (response) {
          this.logger.info('Loaded Employee Data:');
          this.logger.info(response.data);
          
          this.employee.patchValue(response.data);
          this.isNewObject  = response.isNewObject;
        }
        this.isLoading = false;
      });
  }

  setPageHeaderForCreate(): void {
  }

  onFullNameFocus() {
    this.duplicateNameMessage = '';
  }

  async onFormSubmit() {
    this.employee.markAllAsTouched();

    // Validate required fields
    if (this.employee.invalid) {
      if (this.employee.get('fullName')?.hasError('required')) {
        this.showError('Full Name is required.');
      } else if (this.employee.get('personNumber')?.hasError('required')) {
        this.showError('Person Number is required.');
      } else if (this.employee.get('jobTitle')?.hasError('required')) {
        this.showError('Job Title is required.');
      } else if (this.employee.get('hireDate')?.hasError('required')) {
        this.showError('Hire Date is required.');
      } else if (this.employee.get('email')?.hasError('email')) {
        this.showError('Please enter a valid Digital Workshop (e.g. workshop@example.com)');
      } else {
        this.showError('Please fill all required fields correctly.');
      }
      this.scrollToTop();
      return;
    }

    // Validate 12-digit Person Number
    const personNumber = this.employee.get('personNumber')?.value;
    if (personNumber && personNumber.length !== 12) {
      this.showError('Person Number must be exactly 12 digits.');
      this.scrollToTop();
      return;
    }

    // Check duplicate Full Name
    if (this.isNewObject) {
      const fullName = this.employee.get('fullName')?.value?.trim();
      if (fullName) {
        this.isCheckingName = true;
        try {
          const exists = await this.checkNameAvailability(fullName);
          this.isCheckingName = false;

          if (exists) {
            this.duplicateNameMessage = 'An employee with this name already exists.';
            this.showError(this.duplicateNameMessage);
            this.scrollToTop();
            return;
          }
        } catch (error) {
          this.isCheckingName = false;
          console.error('Error checking name:', error);
          this.showError('Error while checking employee name. Please try again.');
          return;
        }
      }
    }

    // Submit Employee Data
    const employee = this.employee.value;
    this.isLoading = true; 
    try {
      const res = await this.employeeService.upsertEmployee(employee).toPromise();

      if (res) {
        const empRes = res as IEmployee;
        const name = empRes.fullName || employee.fullName || 'Employee';

        this.showSuccess(
          this.isNewObject
            ? `Employee "${name}" has been created successfully`
            : `Employee "${name}" has been updated successfully`
        );

        this.scrollToTop();

        // Redirect after delay
        setTimeout(() => {
          this.router.navigate(['sv/employee']);
        }, 900);
      } else {
        this.showError('Failed to save employee.');
        this.scrollToTop();
      }
    } catch (error) {
      console.error('Error while saving employee:', error);
      this.showError('Error occurred while saving employee.');
    }
    finally {
      this.isLoading = false; 
    }
  }

  showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: message,
      life: 8000
    });
  }

  showSuccess(message: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 8000
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

  onTelephoneInput(event: any) {
    const value = event.target.value.replace(/\D/g, '');
    this.employee.get('telephone')?.setValue(value, { emitEvent: false });

    if (value.length > 0 && value.length < 7) {
      this.employee.get('telephone')?.setErrors({ invalidTelephone: true });
    } else {
      this.employee.get('telephone')?.setErrors(null);
    }
  }

  onTelephoneKeyPress(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }
}