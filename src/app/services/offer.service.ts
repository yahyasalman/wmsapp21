import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { IPageList,IOffer, IInvoice, IWorkOrder, IOfferDetail, IEmail, IOfferHistory} from 'app/app.model';
import { FormGroup } from '@angular/forms';
import { LogService } from './log.service';
import { SharedService } from './shared.service';


@Injectable({ providedIn: 'root' }) 

export class OfferService {
 
 private baseUrl: string = environment.BASE_URL +  '/api/offer';
 constructor(private http: HttpClient,private logger: LogService,private sharedService:SharedService) {}
   
 getOffers(filters:FormGroup) {
    const queryString = this.sharedService.buildQueryParams(filters);
    const url = `${this.baseUrl}/list?${queryString}`;
    return this.http.get<IPageList<IOffer>>(url);
  }

  getOffer(offerId:number | undefined,customerId:number | undefined,duplicate:boolean = false)
  {
    this.logger.info('offerId=' + offerId + 'customerId=' + customerId + 'duplicate=' + duplicate);
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);

      if (offerId !== undefined && offerId > 0) 
        queryParams.append("offerId", offerId.toString());
      if (customerId !== undefined && customerId > 0) 
        queryParams.append("customerId", customerId.toString());
      
      queryParams.append("duplicate", duplicate.toString());  
      const url = `${this.baseUrl}/detail?${queryParams}`;
      return this.http.get<any>(url);
  } 
  getOffersByCustomerId(customerId:number) {
      const queryParams = new URLSearchParams();
      queryParams.append("wmsId", this.sharedService.wmsId);
      queryParams.append("customerId", customerId.toString());
      const url = `${this.baseUrl}/list-by-customerid?${queryParams}`;
      return this.http.get<IOffer[]>(url);
    }




  upsertOffer(offer: IOffer) {
    offer.wmsId = this.sharedService.wmsId;
    offer.details.forEach(dtl => {dtl.wmsId = this.sharedService.wmsId;dtl.offerId = offer.offerId;});
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<IOffer>(`${this.baseUrl}/upsert-offer`, offer, {headers});
  }
  
  markAsSent(offerId: number) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("offerId", offerId.toString());
    const url = `${this.baseUrl}/set-as-delivered?${queryParams}`;
    return this.http.get<boolean>(url);
  }

  getOfferHistory(offerId:number) {
    const queryParams = new URLSearchParams();
    queryParams.append("country", this.sharedService.country);
    queryParams.append("lang", this.sharedService.lang);
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("offerId", offerId.toString());
    const url = `${this.baseUrl}/history?${queryParams}`;
    return this.http.get<IOfferHistory[]>(url);
  }

  getVehiclePlates(prefix:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("prefix", prefix);
    return this.http.get<Array<string>>(`${this.baseUrl}/vehicleplates?${queryParams}`);
  }
  offerSumByCustomer(customerId: number) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("customerId", customerId.toString());
    const url = `${this.baseUrl}/sum-by-customer?${queryParams}`;
    return this.http.get<{total:number,accepted:number,rejected:number}>(url);
  }

  
}
