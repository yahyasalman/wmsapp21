import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ICustomerTag, ICustomerType, IEnum } from 'app/app.model';
import { CustomerService } from 'app/services/customer.service';
import { SharedService } from 'app/services/shared.service';
import { SelectChangeEvent } from 'primeng/select';
import { catchError, firstValueFrom } from 'rxjs';
import { LogService } from 'app/services/log.service';
import { RemovePlaceholderOnFocusDirective } from 'app/directives/remove-placeholder-on-focus.directive'
import { WorkshopService } from 'app/services/workshop.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-customer-crud',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
   RemovePlaceholderOnFocusDirective,ProgressSpinnerModule


  ],
  templateUrl: './customer-crud.component.html',
  //styleUrl: './customer-crud.component.css',
  providers: [ConfirmationService, MessageService],
})
export class CustomerCrudComponent {

  customer: FormGroup;
  creditDays: number[] = [0, 7, 14, 21, 30];
  customerTypes: ICustomerType[] = [];
  customerTags: ICustomerTag[] = [];
  countries: IEnum[] = [];
  isNewObject: boolean = true;
  isLoading: boolean = false;
  constructor(
    private logger: LogService,
    public readonly sharedService: SharedService,
    private router: Router,
    private readonly fb: FormBuilder,
    private workshopService: WorkshopService,
    private customerService: CustomerService,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {

    this.customer = this.fb.group({
      customerId: [0, Validators.required],
      customerName: ['', Validators.required],
      customerType: [],
      customerTag: [],
      organizationNo: [],
      vatId: [],
      invoiceCreditDays: [0],
      careOf: [],
      customerAddress: [],
      customerPostNo: [],
      customerCity: [],
      customerCountry: this.sharedService.getDefaultEnum('country').value,
      isCreditAllowed: [true],
      telephone: [],
      email: ['', [Validators.email]],
      digitalServiceId: ['', [Validators.email]],
    });
  }

  ngOnInit() {
    const param: any = this.route.snapshot.params;
    this.customerService
      .getCustomer(param.customerId)
      .pipe(
        catchError((err) => {
          console.log(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.isNewObject = response.isNewObject;
          this.customer.patchValue(response.data);
          this.logger.info('Loaded customer data');
          this.loadCustomerTypes();
          this.loadCustomerTags();
          this.logger.info('Tags and Types loaded');
        }
      });

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
        this.isLoading = false;
      });
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
        this.isLoading = false;
      });

  }
fetchCompanyInfo()
{
  const companyId = this.customer.get('organizationNo')?.value;
   this.sharedService
      .getCompanyInfo(companyId)
      .pipe(
        catchError((err) => {
          this.logger.error(err);
          throw err;
        })
      )
      .subscribe((response: any) => {
      this.logger.info(response);  
      if(response)
      {
        const name = response.organisationer[0].organisationsnamn.organisationsnamnLista[0].namn;
        const careOf = response.organisationer[0].postadressOrganisation.postadress.coAdress;
        const postnr = response.organisationer[0].postadressOrganisation.postadress.postnummer;
        const city = response.organisationer[0].postadressOrganisation.postadress.postort;
        const address = response.organisationer[0].postadressOrganisation.postadress.utdelningsadress;
        const country = response.organisationer[0].postadressOrganisation.postadress.land;
        this.customer.patchValue({
        customerName:name,
        careOf: careOf,
        customerAddress: address,
        customerPostNo: postnr,
        customerCity: city,
        country:country
        });
        
        this.messageService.add({
        severity: 'sucess',
        summary: this.sharedService.T('success'),
        detail: this.sharedService.T('information added'),
        life: 3000
      });
    }
    else 
    {
      this.messageService.add({
        severity: 'error',
        summary: this.sharedService.T('error'),
        detail: this.sharedService.T('No records exists for this organization#'),
        life: 3000
      });
    }
  });

  }

  onChangeCustomerType(event: SelectChangeEvent) {
    this.customer.patchValue({ customerType: event.value });
  }
  onChangeCustomerTag(event: SelectChangeEvent) {
    this.customer.patchValue({ customerTag: event.value });
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
      return response; 
    } catch (error) {
      console.error('Error checking if customer exists:', error);
      return false;
    }
  }

  async getCustomerName(customerId: number): Promise<string> {
    try {
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
      return ''; 
    }
  }

async onFormSubmit() {
    this.isLoading = true;
    this.customer.markAllAsTouched();

    const customerNameControl = this.customer.get('customerName');
    const emailControl = this.customer.get('email');
    const telephoneControl = this.customer.get('telephone');
    const digitalWorkShopid = this.customer.get('digitalServiceId');

    if (!customerNameControl?.value?.trim()) {
      customerNameControl?.setErrors({ required: true });
      this.isLoading = false; 
      return;
    }

    const emailValue = emailControl?.value?.trim();
    const telephoneValue = telephoneControl?.value?.trim();

    if (!emailValue && !telephoneValue) {
      emailControl?.setErrors({ required: true });
      telephoneControl?.setErrors({ required: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please provide either Telephone or Email.',
        life: 4000,
      });
      this.isLoading = false; 
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailValue && !emailRegex.test(emailValue)) {
      emailControl?.setErrors({ email: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Email Format',
        detail: 'Please enter a valid email address (e.g. user@example.com).',
        life: 4000,
      });
      this.isLoading = false; 
      return;
    }

    const digitalServiceIdValue = digitalWorkShopid?.value?.trim();
    
    if (digitalServiceIdValue && !emailRegex.test(digitalServiceIdValue)) {
      digitalWorkShopid?.setErrors({ invalidFormat: true });
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Digital Workshop',
        detail: 'Please enter a valid Digital Workshop (e.g. workshop@example.com).',
        life: 4000,
      });
      this.isLoading = false; 
      return;
    }

    if (digitalServiceIdValue) {
      try {
        const isValidUser = await firstValueFrom(this.sharedService.isValidAppUser(digitalServiceIdValue));
        if (!isValidUser) {
          digitalWorkShopid?.setErrors({ invalidUser: true });
          this.messageService.add({
            severity: 'error',
            summary: 'Invalid Digital Service ID',
            detail: 'The Digital Service ID is not valid.',
            life: 4000,
          });
          this.isLoading = false; 
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
        this.isLoading = false; 
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
      this.isLoading = false; 
      return;
    }

    const customerName = this.customer.get('customerName')?.value;
    const customerId = this.customer.get('customerId')?.value;

    try {
      const originalCustomerName = await this.getCustomerName(customerId);

      if (
        (this.isNewObject === false &&
          customerName.toLowerCase() !== originalCustomerName.toLowerCase()) ||
        this.isNewObject === true
      ) {
        const exists = await this.checkIfCustomerExists(customerName);
        if (exists) {
          this.customer.get('customerName')?.setErrors({ customerExists: true });
          this.messageService.add({
            severity: 'error',
            summary: 'Duplicate Customer',
            detail: 'This customer name already exists.',
            life: 4000,
          });
          this.isLoading = false; 
          return;
        }
      }

      // Credit logic
      if (this.customer.get('invoiceCreditDays')?.value > 0)
        this.customer.patchValue({ isCreditAllowed: true });
      else
        this.customer.patchValue({ isCreditAllowed: false, invoiceCreditDays: 0 });

      // API call
      const res: any = await firstValueFrom(
        this.customerService.upsertCustomer(this.customer.value).pipe(
          catchError((err) => {
            // Note: Spinner will be stopped in the main catch block below
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

      // Success / Update Message
      if (res === true || res?.success === true) {
        
        this.isLoading = false;

        const message = this.isNewObject
          ? `${customerName} has been successfully created!`
          : `${customerName} has been successfully updated!`;

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: message,
          life: 6000,
        });

        setTimeout(() => {
          this.router.navigate(['sv/customer/details', this.customer.get('customerId')?.value]);
        }, 1000);
      } else {
        this.isLoading = false; 
        this.messageService.add({
          severity: 'warn',
          summary: 'Unexpected Response',
          detail: 'Server did not confirm save operation.',
          life: 6000,
        });
      }
    } catch (error) {
      this.isLoading = false; 
      console.error('Form submission failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save customer. Please try again later.',
        life: 6000,
      });
    }
  }

  onCancelForm() {
    this.router.navigate(['sv/customer']);
  }

}
