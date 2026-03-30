import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';

import { environment } from 'environments/environment';
import { IEmployee,ITimesheet } from 'app/app.model';
import { ISelect,IPageList } from 'app/app.model';
import { FormGroup } from '@angular/forms';
import { LogService } from 'app/services/log.service';
import { SharedService } from 'app/services/shared.service';

@Injectable({ providedIn: 'root'})

export class TimesheetService {
  wmsId:string = '';
  country:string  = '';
  lang:string = '';
  private baseUrl: string = environment.BASE_URL +  '/api/timesheet';
  constructor(private http: HttpClient,private logger: LogService,private sharedService:SharedService) {
  }

    getTimesheets(filters:FormGroup) {
        const queryString = this.sharedService.buildQueryParams(filters);
        const url = `${this.baseUrl}/list-timesheet?${queryString}`;
        return this.http.get<IPageList<ITimesheet>>(url);
      }
    getPdfTimesheets(filters:FormGroup) {
        
      const queryParams = new URLSearchParams();
      queryParams.append("wmsId", this.sharedService.wmsId);
      Object.keys(filters.controls).forEach((key) => {
      const value = filters.get(key)?.value;
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
      });
      queryParams.append("country", this.sharedService.country);
      queryParams.append("lang", this.sharedService.lang);
      const url = `${this.baseUrl}/pdf-timesheet?${queryParams.toString()}`;
      return this.http.get(url, { responseType: 'blob' });
  }
    checkin(timesheet: ITimesheet) {
      this.logger.info('checkin', timesheet);
        timesheet.wmsId = this.sharedService.wmsId;
        const headers = new HttpHeaders({'Content-Type': 'application/json',});
        return this.http.post<{state:boolean,overlaps:ITimesheet[]}>(`${this.baseUrl}/checkin`, timesheet, {headers});        
      }

    checkout(timesheetId: number,timeOut: string) {
      this.logger.info('checkout');
      const queryParams = new URLSearchParams();
      queryParams.append("wmsId", this.sharedService.wmsId);
      queryParams.append("id", timesheetId.toString());
      queryParams.append("timeOut", timeOut);
      const url = `${this.baseUrl}/checkout?${queryParams}`;
      return this.http.get<boolean>(url);
      }


      delete(timesheet: ITimesheet) {
        timesheet.wmsId = this.sharedService.wmsId;
        this.logger.info(timesheet);
        const headers = new HttpHeaders({'Content-Type': 'application/json',});
        return this.http.post<boolean>(`${this.baseUrl}/delete`, timesheet, {headers});        
      }

      updateComments(timesheet: ITimesheet) {
        timesheet.wmsId = this.sharedService.wmsId;
        this.logger.info(timesheet);
        const headers = new HttpHeaders({'Content-Type': 'application/json',});
        return this.http.post<boolean>(`${this.baseUrl}/update-comments`, timesheet, {headers});        
      }

    
    // checkOut(timesheet: ITimesheet) {
    //   timesheet.wmsId = this.wmsId;  
    //   timesheet.endDateTime = timesheet.endDateTime == null ? '': this.sharedService.getDateTimeString(timesheet.endDateTime);

    //   const headers = new HttpHeaders({'Content-Type': 'application/json',});
    //   return this.http.post<boolean>(`${this.baseUrl}/UpdateTimesheet`, timesheet, {headers});
    // }

    checkExistingEmployee(wmsId:string,employeeName:string){
      const url = `${this.baseUrl}/isalreadyexists?wmsId=${wmsId}&employeeName=${employeeName}`;
      return this.http.get<boolean>(url);
    }

}
