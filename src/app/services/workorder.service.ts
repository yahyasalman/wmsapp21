import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {ISelect, IWorkOrder,IPageList } from 'app/app.model';
import { environment } from 'environments/environment';
import { SharedService} from 'app/services/shared.service';
import { LogService } from './log.service';

@Injectable({providedIn: 'root'})
export class WorkOrderService {
  private baseUrl: string = environment.BASE_URL +  '/api/workorder';
  constructor(private http: HttpClient,private logger: LogService,private sharedService:SharedService) {
  }
  
  getWorkOrders(filters:FormGroup) {
    const queryString = this.sharedService.buildQueryParams(filters);
    const url = `${this.baseUrl}/list?${queryString}`;
    return this.http.get<IPageList<IWorkOrder>>(url);
  }

  getWorkOrdersByCustomerId(customerId:number) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("customerId", customerId.toString());
    const url = `${this.baseUrl}/list-by-customerid?${queryParams}`;
    return this.http.get<IWorkOrder[]>(url);
  }

  getWorkOrder(offerId:number | undefined,customerId:number | undefined,workOrderId:number | undefined,isDuplicate:boolean = false)
  {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
      if (offerId !== undefined && offerId !== null && offerId !== 0) 
        queryParams.append("offerId", offerId.toString());
      if (customerId !== undefined && customerId !== null && customerId !== 0) 
        queryParams.append("customerId", customerId.toString());
      if (workOrderId !== undefined && workOrderId !== null && workOrderId !== 0) 
        queryParams.append("workOrderId", workOrderId.toString());
      if (isDuplicate == true) 
        queryParams.append("duplicate", true.toString());
    
      const url = `${this.baseUrl}/detail?${queryParams}`;
    return this.http.get<IWorkOrder>(url);
  }

  upsertWorkOrder(workOrder:IWorkOrder){
    workOrder.wmsId = this.sharedService.wmsId;
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<IWorkOrder>(`${this.baseUrl}`, workOrder, {headers});
  }
  
  getVehiclePlates(prefix:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("prefix", prefix);
    return this.http.get<string[]>(`${this.baseUrl}/vehicleplates?${queryParams}`);
  }

  
  
}
