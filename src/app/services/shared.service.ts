import { HttpClient, HttpHeaders,HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import{ForgotPassword, IFileUploadRequest, IFileUploadResponse, ITokenClaims, ITranslate, IVehicle, IWmsLog, IWorkshop, ResetPassword} from 'app/app.model'
import { IEmail, IEnum, IEnums,IPdf,ISelect, PdfObject } from 'app/app.model';
import { environment } from 'environments/environment';
import { BehaviorSubject, catchError, concatMap, firstValueFrom, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { LogService } from './log.service';
import { WmsUser } from 'app/app.model';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({providedIn: 'root'})

export class SharedService {

  private pageHeadingSubject = new BehaviorSubject<string>('');  
  pageHeading$ = this.pageHeadingSubject.asObservable();
  
  baseUrl: string = environment.BASE_URL;
  coreUrl: string = environment.BASE_URL + "/api/Core";
  authUrl: string = environment.BASE_URL + "/api/auth";
  userUrl: string = environment.BASE_URL + "/api/User";
  fileUrl: string = environment.BASE_URL + "/api/File";

  enums: IEnums[] = [];  
  private enumsLoadedSubject = new BehaviorSubject<boolean>(false);
  enumsLoaded$ = this.enumsLoadedSubject.asObservable();
 allManufacturers!: IVehicle[];
 translations!: ITranslate[];
  
  

  constructor(private http: HttpClient
              ,private logger: LogService,
              private router: Router, private route: ActivatedRoute
              ) {}

  get wmsId(): string {
    const wmsId = sessionStorage.getItem('wmsId') || '';
    if (!wmsId) this.logger.warn('Missing wmsId');
    return wmsId;
  }
  get workshopName(): string {
    const workshopName = sessionStorage.getItem('workshopName') || '';
    if (!workshopName) this.logger.warn('Missing workshopname');
    return workshopName;
  }
  get country(): string {
    const country = sessionStorage.getItem('country') || '';
    if (!country) this.logger.warn('Missing country');
    return country;
  }
  get currentLocale(): string {
    const country = sessionStorage.getItem('country') || '';
    if(country === 'se') return 'sv-SE';
    if(country === 'dk') return 'da-DK';
    return 'en-US'; // default to English if no country is set
  }
get lang(): 'en' | 'sv' {
  const lang = sessionStorage.getItem('lang') || '';
  if (!lang) {
    this.logger.warn('Missing Language');
  }

  // Validate the language value
  if (lang === 'en' || lang === 'sv') {
    return lang; // Return the valid language
  } else {
    this.logger.warn(`Invalid language: ${lang}, defaulting to 'en'`);
    return 'sv'; // Default to 'en' if the value is invalid
  }
}
  
  private stateInfo: {disableEdit:string, creditInvoice:string ,customerId: number; customerEmail: string } | null = null;
  setState(data:{disableEdit:string, creditInvoice:string,customerId: number;customerEmail: string }) {this.stateInfo = data;}
  getState() {return this.stateInfo; }
  clearState() { this.stateInfo = null; }
  
  // shared method
  buildQueryParams(filters: FormGroup,includeWmsId:boolean = true): string {
    const queryParams = new URLSearchParams();
    if(includeWmsId)
      queryParams.append("wmsId", this.wmsId);

    Object.keys(filters.controls).forEach((key) => {
      const value = filters.get(key)?.value;
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    return queryParams.toString();
  }
  
  uploadFile(uploadRequest:IFileUploadRequest)
  {
    const formData = new FormData();
    formData.append('wmsId', this.wmsId);
    formData.append('type', uploadRequest.type);
    formData.append('id', uploadRequest.id.toString());
    formData.append('file', uploadRequest.file);

    return this.http.post<IFileUploadResponse>(`${this.fileUrl}/upload-file`, formData);
  }
  
  deleteFile(key: string) {
    return this.http.delete<boolean>(
      `${this.fileUrl}/delete-file?key=${encodeURIComponent(key)}`
    );
  }

  downloadFile(key: string): void {
    const params = new HttpParams().set('key', key);

    this.http.get(`${this.fileUrl}/download-file`, {
      params,
      responseType: 'blob',  // ensures we receive binary data
      observe: 'response'    // allows access to headers (e.g., file name)
    }).subscribe({
      next: (response) => {
        const blob = new Blob([response.body!], { type: response.body?.type });

        // Extract filename from Content-Disposition header if present
        let filename = key; // default fallback
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) {
            filename = match[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading file:', error);
        // Show a user-friendly error if needed
      }
    });
  }
   isValidAppUser(userId:string)
   {
  
      const queryParams = new URLSearchParams();
      queryParams.append("userId", userId);
      const url = `${this.userUrl}/is-valid-appuser?${queryParams}`;
      return this.http.get<Boolean>(url);    
   } 
   listFiles(workOrderId:number)
  {
     const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.wmsId);
    queryParams.append("type", 'workorder');
    queryParams.append("id", workOrderId.toString());
    return this.http.get<IFileUploadResponse[]>(`${this.fileUrl}/list-files?${queryParams}`);
  }

 sendEmail(objectName:string,id:number,emailTo:string,customMessage:string)
  {
    const email:IEmail = ({
    country: this.country,
    lang: this.lang,
    objectName:objectName,
    wmsId: this.wmsId,
    workshopName:this.workshopName,
    id: id.toString(),
    emailTo:emailTo,
    subject:'',
    customMessage: customMessage
    });
    this.logger.info('inside-shared-sendEmail', email);    
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<IEmail>(`${this.coreUrl}/send-email`, email, {headers});
  }
 
  printPdf(objectName:string,ids:string,templateName:string)
  {
    const pdf:IPdf = ({ country:this.country,
                        lang:this.lang,
                        wmsId: this.wmsId,
                        objectName:objectName,
                        ids:ids,
                        templateName:templateName});
    return this.http.post(`${this.coreUrl}/pdf`, pdf, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/pdf'
    },
    responseType: 'blob' as 'json' // Type assertion to satisfy Angular's HttpClient
  });
  }

  printPdfDigitalService(objectName:string,ids:string,templateName:string)
  {
    const pdf:IPdf = ({ country:'se',
                        lang:'sv',
                        wmsId: '5591800080',
                        objectName:objectName,
                        ids:ids,
                        templateName:templateName});

    return this.http.post(`${this.coreUrl}/pdf`, pdf, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/pdf'
    },
    responseType: 'blob' as 'json' // Type assertion to satisfy Angular's HttpClient
  });
  }
   getClaimsFromToken(token:string)
   {
    const queryParams = new URLSearchParams();
    queryParams.append("token", token);
      const url = `${this.authUrl}/token-claims?${queryParams}`;
      return this.http.get<ITokenClaims>(url);
   }

   getOfferStatus(wmsId:string,offerId:number)
   {
      const queryParams = new URLSearchParams();
      queryParams.append("wmsId", wmsId);
      queryParams.append("offerId", offerId.toString());
      const url = `${this.authUrl}/offer-status?${queryParams}`;
       return this.http.get<{status: string,date:string }>(url);
   }
   updateCustomerOffer(wmsId:string,offerId:number,isAccepted?:boolean)
   {
     const queryParams = new URLSearchParams();
    queryParams.append("wmsId", wmsId);
    queryParams.append("offerId", offerId.toString());
    queryParams.append("isAccepted", isAccepted ? isAccepted.toString() : 'false');
      const url = `${this.authUrl}/update-customer-offer?${queryParams}`;
      return this.http.get<boolean>(url);
   }

  printPdfFromToken(token:string)
  {
        const queryParams = new URLSearchParams();
        queryParams.append("token", token);

    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post(`${this.authUrl}/pdf-from-token?${queryParams}`,null,{
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/pdf'
    },
    responseType: 'blob' as 'json' // Type assertion to satisfy Angular's HttpClient
  });
 }

  resetPassword(resetPassword:ResetPassword){
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<boolean>(`${this.userUrl}/resetpassword`, resetPassword, {headers});
  }   
  forgotPassword(forgotPassword:ForgotPassword){
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<boolean>(`${this.userUrl}/forgotpassword`, forgotPassword, {headers});
  }   

  login(login:WmsUser){
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<WmsUser>(`${this.authUrl}/login`, login, {headers});
  }   

  logout(){
      let userName = sessionStorage.getItem('userName') == null ? '':sessionStorage.getItem('userName');
      const queryParams = new URLSearchParams();
      queryParams.append("userName", userName!);

      const url = `${this.authUrl}/logout?${queryParams}`;
      return this.http.get<Boolean>(url);
  }   

  updateFiltersFromQueryParams(filters: FormGroup, params: any): void {
    Object.keys(params).forEach((key) => {
      if (params[key] && filters.contains(key)) {
        filters.patchValue({ [key]: params[key] });
      }
    });
  }
  updateFiltersInNavigation(filters: FormGroup): void {
  const filterValues = filters.getRawValue();

  // Filter out keys with empty, null, or undefined values
  const filteredParams = Object.keys(filterValues).reduce((params, key) => {
    if (filterValues[key] !== null && filterValues[key] !== undefined && filterValues[key] !== '') {
      params[key] = filterValues[key];
    }
    return params;
  }, {} as any);

  // Navigate with the filtered query parameters
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: filteredParams,
    queryParamsHandling: 'merge', // Merge with existing query parameters
  });
}
  getVehicleManufacturers(query:string):any[]
  {
    return this.allManufacturers  
    .map(m => m.name)
    .filter(vehicle => vehicle.startsWith(query))
    .sort((a, b) => a.localeCompare(b))??[];

  }
  getVehicleModels(manufactuererName:string,query:string)
  {
     debugger
    let models:string[] = []
    if(manufactuererName)
    {
      models = this.allManufacturers.find(v => v.name === manufactuererName)?.models.sort((a, b) => a.localeCompare(b))  ?? [];
    }
    else 
    {
      models = [...this.allManufacturers.flatMap(m => m.models)];
    }  
    //this.logger.info(models.filter(m => m.startsWith(query)).sort((a, b) => a.localeCompare(b)));
    return models.filter(m => m.startsWith(query)).sort((a, b) => a.localeCompare(b)); 
  }



loadResources(): Observable<void> {
  this.logger.info('Start loading resource files');

  const fileRequests: [Observable<ITranslate[]>, Observable<IEnums[]>, Observable<IVehicle[]>] = [
    this.http.get<ITranslate[]>('assets/wmsresources/wmstranslations.json').pipe(
      catchError(error => {
        this.logger.error('Error loading translation.json:', error);
        return of([] as ITranslate[]);
      })
    ),
    this.http.get<IEnums[]>('assets/wmsresources/wmsenums.json').pipe(
      catchError(error => {
        this.logger.error('Error loading wmsenums.json:', error);
        return of([] as IEnums[]);
      })
    ),
    this.http.get<IVehicle[]>('assets/wmsresources/wmsmodels.json').pipe(
      catchError(error => {
        this.logger.error('Error loading wmsmodels.json:', error);
        return of([] as IVehicle[]);
      })
    )
  ];

  return forkJoin<[ITranslate[], IEnums[], IVehicle[]]>(fileRequests).pipe(
    tap(([wmsTranslate, wmsEnums, wmsModels]) => {
      // Process the loaded files
      this.translations = wmsTranslate;
      this.enums = wmsEnums;
      this.allManufacturers = wmsModels;

      // Notify that resources are loaded
      this.enumsLoadedSubject.next(true);
      this.logger.info('All resource files loaded successfully');
    }),
    map(() => undefined), // Transform the emitted value to void
    catchError(error => {
      this.enumsLoadedSubject.next(false);
      this.logger.error('Unexpected error while loading resource files:', error);
      return of(undefined); // Return an observable emitting void in case of error
    })
  );
}
  
  
  //enums '/assets/wmsenums.json'
  loadEnums() {
    this.logger.info('start loading enum file');
    firstValueFrom(this.http.get<IEnums[]>(`${this.coreUrl}/enums`))
    .then(data => {
          this.enums = data;
          this.enumsLoadedSubject.next(true);
          this.logger.info('enums loaded successfully');
    })
   .catch(error => {
      this.enumsLoadedSubject.next(false);
      this.logger.error('Error loading enums:', error);
    });
  }
  
  areEnumsLoaded(): boolean {
    return this.enumsLoadedSubject.value;
  }
  
//   loadEnumsFromDb(): Promise<void> {
//   this.logger.info('start loading enums from db');
//   return firstValueFrom(this.http.get<IEnums[]>(`${this.coreUrl}/enums`))
//     .then(data => {
//       this.enums = data;
//       this.enumsLoadedSubject.next(true);
//       this.logger.info('enums loaded successfully');
//     })
//     .catch(error => {
//       this.enumsLoadedSubject.next(false);
//       this.logger.error('Error loading enums:', error);
//     });
// } 

  


T(key: string): string {
  //this.logger.info('inside-translation-key', key,this.lang);
  // if(this.translations)
  // {
  //   this.logger.info('inside-translation-total', this.translations.length);
  // }
  // else 
  // {
  //   this.logger.info('inside-translation-translations-is-null');
  // }
  const translation = this.translations.find(d => d.tkey === key);
  // this.logger.info('inside-translation-found', translation);
  // if(translation)
  // this.logger.info('inside-translation-Language', translation![this.lang]);

  return translation ? translation[this.lang] : '*'+key; // Return key if translation is not found
}
 getEnums(key:string){
    return this.enums.filter(d => d.country == this.country 
                                    && d.lang == this.lang 
                                    && d.key == key).sort((a, b) => a.index - b.index);
  }
  
  getEnumByValue(key:string,value:string){
    let singleEnum = this.enums.filter(d =>  d.country == this.country 
                                && d.lang == this.lang 
                                && d.key == key
                                && d.value == value)[0];
    
    if(!singleEnum) 
      {
        this.logger.error(`Missing enum for country="${this.country}" lang="${this.lang}", key="${key}" and value="${value}"`);
        this.loadEnums();
        singleEnum = this.enums.filter(d =>  d.country == this.country 
                                && d.lang == this.lang 
                                && d.key == key
                                && d.value == value)[0];
        
      }                               
    
    return singleEnum;      
  }
 
  getDefaultEnum(key:string){
    return this.enums.filter(d =>  d.country == this.country 
                                && d.lang == this.lang 
                                && d.key == key
                                && d.isdefault == true)[0];
      
  }

  getDateString(e:any)
  {
    const year:string  = e.getFullYear().toString();
    const month:string = (e.getMonth() + 1).toString().padStart(2, "0");
    const day:string   = e.getDate().toString().padStart(2, "0");
    return year +'-' + month + '-' + day
  }
  
  getDateTimeString(e:any)
  {
    this.logger.info('inside-getDateTimeString', e);
    const year:string  = e.getFullYear().toString();
    const month:string = (e.getMonth() + 1).toString().padStart(2, "0");
    const day:string   = e.getDate().toString().padStart(2, "0");
    const hours:string = e.getHours().toString().padStart(2, "0");
    const minutes:string = e.getMinutes().toString().padStart(2, "0");
    return year +'-' + month + '-' + day + ' ' + hours + ':' + minutes + ':00';
  }
  
  getTimeString(e:any)
  {
    const hours:string = e.getHours().toString().padStart(2, "0");
    const minutes:string = e.getMinutes().toString().padStart(2, "0");
    return hours + ':' + minutes + ':00';
  }
  
  // getCurrentWeekNumber(date:Date): number {
  // const d = new Date(date.getTime());
  // d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  // const yearStart = new Date(d.getFullYear(), 0, 1);
  // const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  // return weekNo;
  // }  

 getWeekInfo(date: Date, flag: 'current' | 'previous' | 'next'): { weekNumber: number, startDate: string, endDate: string } {
  const currentDate = new Date(date.getTime());

  // Adjust the date based on the flag
  if (flag === 'previous') {
    currentDate.setDate(currentDate.getDate() - 7); // Go back one week
  } else if (flag === 'next') {
    currentDate.setDate(currentDate.getDate() + 7); // Go forward one week
  }

  // Calculate the week number
  const d = new Date(currentDate.getTime());
  d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Adjust to Thursday in current week
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  // Calculate the start and end dates of the week
  const dayOfWeek = currentDate.getDay() || 7; // Sunday is 0, so make it 7
  const startOfWeek = new Date(currentDate);
  const endOfWeek = new Date(currentDate);

  startOfWeek.setDate(currentDate.getDate() - dayOfWeek + 1); // Monday
  endOfWeek.setDate(currentDate.getDate() + (7 - dayOfWeek)); // Sunday

  // Format dates to yyyy-mm-dd
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Ensure 2 digits
    const day = String(d.getDate()).padStart(2, '0'); // Ensure 2 digits
    return `${year}-${month}-${day}`;
  };

  return {
    weekNumber,
    startDate: formatDate(startOfWeek),
    endDate: formatDate(endOfWeek),
  };
}

  getNextId(tableName:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.wmsId);
    queryParams.append("tName", tableName);
    const url = `${this.baseUrl}/api/Core/next-id?${queryParams}`;
    return this.http.get<number>(url);
  }

  getWorkshop() {
    const url = `${this.baseUrl}/Core/Workshop/${this.wmsId}`;
    return this.http.get<IWorkshop>(url);
  }

  updateWorkshop(workshop: IWorkshop) {
    workshop.wmsId = this.wmsId;
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<IWorkshop>(`${this.baseUrl}/Core/UpdateWorkshop`, workshop, {headers});
  }

  getMarkModelByRegnr(prefix: string) {
    const url = `${this.baseUrl}/Core/MarkModelByRegnr/${prefix}`;
    return this.http.get<Array<string>>(url);
  }
  
   logError(wmsLog: IWmsLog) {
      const headers = new HttpHeaders({'Content-Type': 'application/json',});
      return this.http.post<IWmsLog>(`${this.baseUrl}/log-error`, wmsLog, {headers});
    }
  
    getCompanyInfo(companyId:string)
    {
        const queryParams = new URLSearchParams();
        queryParams.append("companyId", companyId);
        const url = `${this.coreUrl}/company-info?${queryParams}`;
        return this.http.get<any>(url);
    }

  // Templates 
  // getDetailTemplates() {
  //   const url = `${this.baseUrl}/Core/DetailTemplates/${this.wmsId}`;
  //   return this.http.get<ISelect[]>(url);
  // }
  
  // getDetailTemplate(templateId:number) {
  //   const url = `${environment.BASE_URL}/Core/DetailTemplate/${this.wmsId}/${templateId}`;
  //   return this.http.get<IDetailTemplate[]>(url);
  // }  

// sendEmail(type:string,id:number,workshopName:string,creditDays:number,dueDate:string,validFrom:string,validTo:string,
//   tokenExpiryDate:string,emailTo:string,subject:string,message:string)
// {
//   this.logger.info('inside-shared-sendEmail');
//   const emailInfo:IEmailParameters = 
//   {
//     country: this.country,
//     lang: this.lang,
//     type:type,
//     wmsId: this.wmsId,
//     id: id,
//     workshopName:workshopName,
//     creditDays:creditDays,
//     dueDate:dueDate,
//     validFrom:validFrom,
//     validTo:validTo,
//     tokenExpiryDate: tokenExpiryDate,
//     emailTo:emailTo,
//     subject:subject,
//     message: message  
  
//   };
  
//   this.logger.info(emailInfo);

//   const headers = new HttpHeaders({'Content-Type': 'application/json',});
//   return this.http.post<IEmailParameters>(`${environment.BASE_URL}/Core/SendEmail`, emailInfo, {headers});
// }

}

