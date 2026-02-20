import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { IDigitalService } from 'app/app.model';
import { ISelect, IPageList } from 'app/app.model';
import { FormGroup } from '@angular/forms';
import { LogService } from 'app/services/log.service';
import { SharedService } from 'app/services/shared.service';

@Injectable({ providedIn: 'root' })

export class DigitalServiceService {
  private baseUrl: string = environment.BASE_URL + '/api/digitalservice';
  private coreUrl: string = environment.BASE_URL + '/api/core';
  constructor(private http: HttpClient, private logger: LogService, private sharedService: SharedService) {
  }

  getDigitalServices(filters: FormGroup,onlyThisWmsid:boolean) {
    const queryString = this.sharedService.buildQueryParams(filters,onlyThisWmsid);
    const url = `${this.baseUrl}/service?${queryString}`;
    return this.http.get<IPageList<IDigitalService>>(url);
  }

  getDetail(digitalServiceId: number) {
    const queryParams = new URLSearchParams();
    queryParams.append("digitalServiceId", digitalServiceId.toString());
    const url = `${this.baseUrl}/detail?${queryParams}`;
    return this.http.get<IDigitalService>(url);
  }

  createDigitalService(digitalService: IDigitalService) {
    digitalService.wmsId = this.sharedService.wmsId;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', });
    return this.http.post<{ state: boolean, overlaps: IDigitalService[] }>(`${this.baseUrl}/create`, digitalService, { headers });
  }

  isDigitalServiceExists(invoiceId: number) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.sharedService.wmsId);
    queryParams.append("invoiceId", invoiceId.toString());
    const url = `${this.baseUrl}/isexists?${queryParams}`;
    return this.http.get<boolean>(url);
  }
   getPdf(requestBody: any): Observable<Blob> {
  return this.http.post(`${this.coreUrl}/pdf`, requestBody, {
    responseType: 'blob'
  });
}
}
