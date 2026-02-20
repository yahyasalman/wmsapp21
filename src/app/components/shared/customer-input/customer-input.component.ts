import { Component, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from 'app/services/customer.service';
import { LogService } from 'app/services/log.service';
import { catchError } from 'rxjs';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { SharedService } from 'app/services';
export interface AutoCompleteCompleteEvent {
    originalEvent: Event;
    query: string;
}

@Component({
  selector: 'app-customer-input',
  standalone: true,
 imports: [
    ...SHARED_IMPORTS
    // All modules are already in SHARED_IMPORTS
  ],  templateUrl: './customer-input.component.html',
  styleUrls: ['./customer-input.component.css'],
  providers: [],

})

export class CustomerInputComponent {

  @Input() customerId: number | null = null;
  @Input() customerName: string | null= null;
  @Input() customerTelephone: string | null= null;
  @Input() customerEmail: string | null= null;
  @Input() submitted: boolean = false;
  @Input() showFooter: boolean = true;
  @Input() invalid: boolean = false;

  @Output() customerIdChange: EventEmitter<any> = new EventEmitter<any>();
  
  customers: any[] = [];
  
  selectedCustomerName: string | null = null;
  constructor(private logger: LogService,private customerService: CustomerService, public sharedService:SharedService) {}

    ngOnChanges(changes: SimpleChanges): void {
    if (changes['customerId'])
      this.selectedCustomerName = this.customerName;
    console.log('Received signal from parent' + this.invalid);
    if (this.invalid) {
      console.log('Form is invalid. Take necessary action in the child component.');
    }
  }

    filterCustomer(event: AutoCompleteCompleteEvent) {
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
    this.customerIdChange.emit(
        {
          customerId:event.value.customerId,
          customerName:event.value.customerName,
          invoiceCreditDays:event.value.invoiceCreditDays,
          telephone:event.value.telephone,
          email:event.value.email,showMessage:false
        }
      );
    }
  onUnselectCustomer()
  {
    this.customerIdChange.emit({customerId:null,
      customerName:null,
      invoiceCreditDays:0,
      telephone:'',
      email:'',showMessage:false});
  }

  createCustomer(customerName:string|null)
  {
    if(customerName)
      this.logger.info('Received customer' + customerName);
      this.customerService
            .createCustomer(customerName)
            .pipe(
              catchError((err) => {
                console.log(err);
                throw err;
              })
            )
            .subscribe((response: any) => {
              if (response) {
                this.customerIdChange.emit(
                  {
                    customerId:response,
                    customerName:customerName,
                    invoiceCreditDays:0,
                    customerType:'',
                    telephone:'',
                    email:'',
                    showMessage:true
                  }
                );

              }
            });
  }
  

}


