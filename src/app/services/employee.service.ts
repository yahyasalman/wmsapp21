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

export class EmployeeService {
  wmsId:string = '';
  country:string  = '';
  lang:string = '';
  private baseUrl: string = environment.BASE_URL +  '/api/employee';
  constructor(private http: HttpClient,private logger: LogService,private sharedService:SharedService) {
  }

    getAllEmployees(){
      const queryParams = new URLSearchParams();
      queryParams.append("wmsId", this.sharedService.wmsId);
      const url = `${this.baseUrl}/employees?${queryParams}`;
      return this.http.get<IEmployee[]>(url);
    }

  getEmployee(employeeId:number | undefined){
      const queryParams = new URLSearchParams();
      queryParams.append("wmsId", this.sharedService.wmsId);
      if (employeeId !== undefined && employeeId > 0)
        queryParams.append("employeeId", employeeId.toString());
      const url = `${this.baseUrl}/detail?${queryParams}`;
      return this.http.get<IEmployee>(url);
    }

    upsertEmployee(employee:IEmployee){
      this.logger.debug('Service: Upserting employee with data:');
      this.logger.debug(employee);
      employee.wmsId = this.sharedService.wmsId;
      const headers = new HttpHeaders({'Content-Type': 'application/json',});
      return this.http.post<IEmployee>(`${this.baseUrl}/upsert-employee`, employee, {headers});
    }

    deleteEmployee(employeeId:number){
      const url = `${this.baseUrl}/${this.sharedService.wmsId}/${employeeId}`;
      return this.http.delete<boolean>(url);
    }

  

    checkExistingEmployee(wmsId:string,employeeName:string){
      const url = `${this.baseUrl}/isalreadyexists?wmsId=${wmsId}&employeeName=${employeeName}`;
      return this.http.get<boolean>(url);
    }

}
