import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import {IInvoiceHistory, IPageList} from 'app/app.model'
import {IInvoice, IInvoicePayment } from 'app/app.model';
import { FormGroup } from '@angular/forms';
import { LogService } from 'app/services/log.service';
import { SharedService } from 'app/services/shared.service';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private baseUrl: string = environment.BASE_URL +  '/api/invoice';
  constructor(private http: HttpClient,private logger: LogService,private sharedService:SharedService) {}
  
  getInvoices(filters:FormGroup) {
    const queryString = this.sharedService.buildQueryParams(filters);
    const url = `${this.baseUrl}/list?${queryString}`;
    return this.http.get<IPageList<IInvoice>>(url);
  }
 
  getInvoice(offerId:number | undefined,workOrderId:number | undefined,customerId:number | undefined,invoiceId:number,duplicate:boolean = false)
  {
    this.logger.info('Get Invoice Detail');
    this.logger.info('offerId=' + offerId + 'workOrderId=' + workOrderId + 'customerId=' + customerId + 'invoiceId=' + invoiceId + 'duplicate=' + duplicate);
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);

      if (offerId !== undefined && offerId > 0) 
        queryParams.append("offerId", offerId.toString());
      if (workOrderId !== undefined && workOrderId >0 ) 
        queryParams.append("workOrderId", workOrderId.toString());
      if (customerId !== undefined && customerId > 0) 
        queryParams.append("customerId", customerId.toString());
      if (invoiceId !== undefined && invoiceId > 0) 
        queryParams.append("invoiceId", invoiceId.toString());
      
      queryParams.append("duplicate", duplicate.toString());  
      const url = `${this.baseUrl}/detail?${queryParams}`;
      return this.http.get<any>(url);
  }
  getInvoicesByCustomerId(customerId:number) {
      const queryParams = new URLSearchParams();
      queryParams.append("wmsId", this.sharedService.wmsId);
      queryParams.append("customerId", customerId.toString());
      const url = `${this.baseUrl}/list-by-customerid?${queryParams}`;
      return this.http.get<IInvoice[]>(url);
    }
  

  createCreditInvoice(invoiceId:number)
  {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
      if (invoiceId !== undefined && invoiceId !== null && invoiceId !== 0) 
        queryParams.append("invoiceId", invoiceId.toString());
      const url = `${this.baseUrl}/credit-invoice?${queryParams}`;
      return this.http.get<IInvoice>(url);
  }
  
  upsertInvoice(invoice: IInvoice) {
    invoice.wmsId = this.sharedService.wmsId;
    invoice.details.forEach(dtl => {dtl.wmsId = this.sharedService.wmsId;dtl.invoiceId = invoice.invoiceId;});
    this.logger.info('print invoice');
    this.logger.info(invoice);
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<IInvoice>(`${this.baseUrl}/upsert-invoice`, invoice, {headers});
  }

  markAsSent(invoiceId: number) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("invoiceId", invoiceId.toString());
    const url = `${this.baseUrl}/set-as-delivered?${queryParams}`;
    return this.http.get<boolean>(url);
  }

  
  getInvoicePayments(invoiceId:number) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("invoiceId", invoiceId.toString());
    const url = `${this.baseUrl}/payments?${queryParams}`;
    return this.http.get<IInvoicePayment[]>(url);
  }

  createInvoicePayment(invoicePayment: IInvoicePayment) {
    invoicePayment.wmsId = this.sharedService.wmsId;
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<IInvoice>(`${this.baseUrl}/add-invoice-payment`, invoicePayment, {headers});
  }
  deleteInvoicePayment(invoiceId:number,invoicePaymentId:number) {
    const url = `${this.baseUrl}/${this.sharedService.wmsId}/${invoiceId}/${invoicePaymentId}`;
    return this.http.delete<boolean>(url);
  }

  getVehiclePlates(prefix:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("prefix", prefix);
    return this.http.get<Array<string>>(`${this.baseUrl}/vehicleplates?${queryParams}`);
  }
  isValidDigitalService(invoiceId: string | number) {
    const params = {
    wmsId: this.sharedService.wmsId,
    invoiceId: invoiceId.toString()
  };
  return this.http.get<any>(`${this.baseUrl}/is-valid-for-digitalservice`, { params });
  }

  getInvoiceHistory(invoiceId:number) {
    const queryParams = new URLSearchParams();
    queryParams.append("country", this.sharedService.country);
    queryParams.append("lang", this.sharedService.lang);
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("invoiceId", invoiceId.toString());
    const url = `${this.baseUrl}/history?${queryParams}`;
    return this.http.get<IInvoiceHistory[]>(url);
  }

  invoiceSumByCustomer(customerId: number) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("customerId", customerId.toString());
    const url = `${this.baseUrl}/sum-by-customer?${queryParams}`;
    return this.http.get<{total:number,paid:number,balance:number}>(url);
  }
  exportInvoicesToExcel(year: number, month: number) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("year", year.toString());
    queryParams.append("month", month.toString());
    const url = `${this.baseUrl}/export?${queryParams}`;
    return this.http.get(url, { responseType: 'blob' });
  }

}
