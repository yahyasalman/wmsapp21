import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { IMonthSummary, IOffer, IOutStandingBalance, IPageList, ISelect, ITopCustomer, ITopManufacturer, ITopSale, IUnpaidInvoice} from 'app/app.model'
import { LogService } from 'app/services/log.service';
import { SharedService } from 'app/services/shared.service';
import { FormGroup } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private baseUrl: string = environment.BASE_URL +  '/api/dashboard';
  constructor(private http: HttpClient,private logger: LogService,private sharedService:SharedService) {}
  
  getTopSales(previousMonths:string) {
    const queryParams = new URLSearchParams();
      queryParams.append("wmsId", this.sharedService.wmsId);
      queryParams.append("months", previousMonths);
    return this.http.get<ITopSale[]>(`${this.baseUrl}/top-sales?${queryParams}`);
  }

  getTopCustomers() {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    return this.http.get<ITopCustomer[]>(`${this.baseUrl}/top-customers?${queryParams}`);
  }
  getTopManufacturers() {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    return this.http.get<ITopManufacturer[]>(`${this.baseUrl}/top-manufacturers?${queryParams}`);
  }
  getOutStandingInvoices() {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    return this.http.get<IOutStandingBalance>(`${this.baseUrl}/outstanding-invoices?${queryParams}`);
  }
  getOutStandingOffers() {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    return this.http.get<IOutStandingBalance>(`${this.baseUrl}/outstanding-offers?${queryParams}`);
  }

    getUnpaidInvoices(filters:FormGroup) {
      const queryParams = new URLSearchParams();
      queryParams.append("wmsId", this.sharedService.wmsId);
      const url = `${this.baseUrl}/unpaid-invoices?${queryParams}`;
      return this.http.get<IUnpaidInvoice[]>(url);
    }
    getWaitingOffers() {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    return this.http.get<IOffer[]>(`${this.baseUrl}/waiting-offers?${queryParams}`);

    }
  
 getMonthSale(cyear:string,cmonth:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("cyear", cyear);
    queryParams.append("cmonth", cmonth);
    return this.http.get<string>(`${this.baseUrl}/month-sale?${queryParams}`);
  }
 
  getMonthSaleTarget(cyear:string,cmonth:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("cyear", cyear);
    queryParams.append("cmonth", cmonth);
    return this.http.get<string>(`${this.baseUrl}/month-saletarget?${queryParams}`);
  }

  getMonthOrders(cyear:string,cmonth:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("cyear", cyear);
    queryParams.append("cmonth", cmonth);
    return this.http.get<string>(`${this.baseUrl}/month-orders?${queryParams}`);
  }
  
  getMonthOffers(cyear:string,cmonth:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("cyear", cyear);
    queryParams.append("cmonth", cmonth);
    return this.http.get<string>(`${this.baseUrl}/month-offers?${queryParams}`);
  }

  getMonthDigitalServices(cyear:string,cmonth:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("cyear", cyear);
    queryParams.append("cmonth", cmonth);
    return this.http.get<string>(`${this.baseUrl}/month-digitalservices?${queryParams}`);
  }

  getMonthWorkOrders(cyear:string,cmonth:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("cyear", cyear);
    queryParams.append("cmonth", cmonth);
    return this.http.get<string>(`${this.baseUrl}/month-workorders?${queryParams}`);
  }

  getMonthCustomers(cyear:string,cmonth:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("cyear", cyear);
    queryParams.append("cmonth", cmonth);
    return this.http.get<string>(`${this.baseUrl}/month-customers?${queryParams}`);
  }


  // getTopModels() {
  //   const queryParams = new URLSearchParams();
  //   queryParams.append("wmsId", this.sharedService.wmsId);
  //   return this.http.get<ITopModel[]>(`${this.baseUrl}/top-models?${queryParams}`);
  // }

  // getTopWorkOrders() {
  //   const queryParams = new URLSearchParams();
  //   queryParams.append("wmsId", this.sharedService.wmsId);
  //   return this.http.get<ITopDashboardItem[]>(`${this.baseUrl}/top-workorders?${queryParams}`);
  // }
  //   getTopInvoices() {
  //   const queryParams = new URLSearchParams();
  //   queryParams.append("wmsId", this.sharedService.wmsId);
  //   return this.http.get<ITopDashboardItem[]>(`${this.baseUrl}/top-invoices?${queryParams}`);
  // }
  //   getTopOffers() {
  //   const queryParams = new URLSearchParams();
  //   queryParams.append("wmsId", this.sharedService.wmsId);
  //   return this.http.get<ITopDashboardItem[]>(`${this.baseUrl}/top-offers?${queryParams}`);
  // }

}
