import { inject,Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IPageList, IEnum } from 'app/app.model';
import { ICustomer } from 'app/app.model';
import { environment } from 'environments/environment';
import { FormGroup } from '@angular/forms';
import { LogService } from 'app/services/log.service';
import { SharedService } from './shared.service';


@Injectable({providedIn: 'root'})

export class CustomerService {
  private baseUrl: string = environment.BASE_URL +  '/api/customer';
  constructor(private http: HttpClient,private logger: LogService,private sharedService:SharedService) {}

  getCustomers(filters:FormGroup) {
    const queryString = this.sharedService.buildQueryParams(filters);
    const url = `${this.baseUrl}/list?${queryString}`;
    return this.http.get<IPageList<ICustomer>>(url);
  }
 
  getCustomer(customerId:number | undefined)
  {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
      if (customerId !== undefined && customerId > 0) 
        queryParams.append("customerId", customerId.toString());
      const url = `${this.baseUrl}/detail?${queryParams}`;
      return this.http.get<ICustomer>(url);
  }

getCustomerName(customerId:number) {
  const queryParams = new URLSearchParams();
  queryParams.append("wmsId", this.sharedService.wmsId);
  queryParams.append("customerId", customerId.toString());
  const url = `${this.baseUrl}/customer-name?${queryParams}`;
  return this.http.get<{customerName: string }>(url);
}

  getCustomerByPrefix(prefix:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("prefix", prefix);
    return this.http.get<ICustomer[]>(`${this.baseUrl}/customers-by-prefix?${queryParams}`);
  }


getCustomerTags(filters:FormGroup) {
  const queryString = this.sharedService.buildQueryParams(filters);
  return this.http.get<string[]>(`${this.baseUrl}/customer-tags?${queryString}`);
}

getCustomerCities(filters:FormGroup) {
  const queryString = this.sharedService.buildQueryParams(filters);
  return this.http.get<string[]>(`${this.baseUrl}/customer-cities?${queryString}`);
}
isCustomerExists(customerName:string) {
  const queryParams = new URLSearchParams();
  queryParams.append("wmsId", this.sharedService.wmsId);
  queryParams.append("customerName", customerName);
return this.http.get<boolean>(`${this.baseUrl}/is-customer-exists?${queryParams}`);
}

upsertCustomer(customer: ICustomer) {
    customer.wmsId = this.sharedService.wmsId;
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<ICustomer>(`${this.baseUrl}/upsert`, customer, {headers});
  }
  createCustomer(customerName: string|null) {
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<Number>(`${this.baseUrl}/create`, {wmsId:this.sharedService.wmsId,customerName:customerName}, {headers});
  }
  
}



