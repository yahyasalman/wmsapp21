import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IWorkOrder } from 'app/app.model'
import { IDailyCalendar,IWeeklyCalendar} from 'app/app.model';
import { environment } from 'environments/environment';
import { SharedService } from 'app/services/shared.service';
import { LogService } from 'app/services/log.service';

@Injectable({ providedIn: 'root' })

export class BookingService {

  private baseUrl: string = environment.BASE_URL + '/api/booking';
  constructor(private http: HttpClient,private logger: LogService,private sharedService:SharedService) {}
  
  getWeeklyBookings(startDate:string,endDate:string,filters:FormGroup)
  {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append('fromDate',startDate);    
    queryParams.append('endDate',endDate);

    if (filters.get('employeeIds')?.value != undefined || filters.get('employeeIds')?.value != null)
      queryParams.append('employeeIds',filters.get('employeeIds')?.value);    
    
    const url = `${this.baseUrl}/week?${queryParams.toString()}`;
    return this.http.get<IWeeklyCalendar[]>(url);
  }
  getDayBookings(bookingDate:string)
  {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append('bookingDate',bookingDate);    
    const url = `${this.baseUrl}/daily?${queryParams.toString()}`;
    return this.http.get<IDailyCalendar[]>(url);
  }

  getWorkOrdersByBookingTime(bookingDate:string,bookingTime:string)
  {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("bookingDate", bookingDate);
    
    if (bookingTime != '')
      queryParams.append('bookingTime',bookingTime);

    const url = `${this.baseUrl}/workorders-by-time?${queryParams.toString()}`;
    
    return this.http.get<IWorkOrder[]>(url);
  }
  
  deleteBooking(workorderId:number)
  {
    const url = `${this.baseUrl}/${this.sharedService.wmsId}/${workorderId}`;
    return this.http.delete<boolean>(url);
  }

}

  