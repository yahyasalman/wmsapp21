import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ICustomer, IInvoicePromptRequest } from 'app/app.model';
import { environment } from 'environments/environment';
@Injectable({providedIn: 'root'})

export class AiService {
  private baseUrl: string = environment.BASE_URL +  '/api/ai';
  constructor(private http: HttpClient) {}
    getInvoiceDescription(prompt:IInvoicePromptRequest) {
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<string>(`${this.baseUrl}/invoice-description`, prompt, {headers});
  }
 
  

}



