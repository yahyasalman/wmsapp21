import { HttpClient, HttpHeaders,HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import{ForgotPassword, IFileUploadRequest, IFileUploadResponse, ITokenClaims, ITranslate, IVehicle, IWmsLog, IWorkshop, ResetPassword, VehicleSearch, VehicleSearchResponse} from 'app/app.model'
import { IEmail, IEnum, IEnums,IPdf,ISelect, PdfObject } from 'app/app.model';
import { environment } from 'environments/environment';
import { BehaviorSubject, catchError, forkJoin, from, map, Observable, of, tap, finalize } from 'rxjs';
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
  resourceFileVersion: number = 1;
  enums: IEnums[] = [];  
  private resourcesLoadedSubject = new BehaviorSubject<boolean>(false);
  resourcesLoaded$ = this.resourcesLoadedSubject.asObservable();
  private resourceLoadingPromise: Promise<void> | null = null;
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
  
  getVehicleList(vehiclePlate:string)
  {
     const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.wmsId);
    queryParams.append("vehiclePlate", vehiclePlate);
    const url = `${this.coreUrl}/vehicle-list?${queryParams}`;
    return this.http.get<VehicleSearch>(url);
  }
  
  getVehicleInfo(vehiclePlate:string)
  {
     const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.wmsId);
    queryParams.append("vehiclePlate", vehiclePlate);
    const url = `${this.coreUrl}/vehicle-info?${queryParams}`;
    return this.http.get<VehicleSearchResponse>(url);
  }


  getPDFBlob(key: string): Observable<Blob> {
    const params = new HttpParams().set('key', key);
    return this.http.get(`${this.fileUrl}/download-file`, {
      params,
      responseType: 'blob'
    });
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

  signup(signupData: any){
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<any>(`${this.authUrl}/signup`, signupData, {headers});
  }

  bookDemo(demoData: any){
    const headers = new HttpHeaders({'Content-Type': 'application/json',});
    return this.http.post<any>(`${this.baseUrl}/api/Demo/bookdemo`, demoData, {headers});
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

  // Return immediately if resources are already loaded
  if (this.areResourcesLoaded()) {
    this.logger.info('Resources already loaded, returning cached data');
    return of(undefined);
  }

  // Return the memoized promise to prevent parallel loading
  if (this.resourceLoadingPromise) {
    this.logger.info('Resource loading already in progress, waiting for completion');
    return from(this.resourceLoadingPromise);
  }

  // Create the actual loading operation
  const translationsUrl = 'assets/resources/trans-1.json';
  const enumsUrl =   'assets/resources/enums-1.json';
  const modelsUrl =  'assets/resources/models-1.json';  

  const fileRequests: [Observable<ITranslate[]>, Observable<IEnums[]>, Observable<IVehicle[]>] = [
    this.http.get<ITranslate[]>(translationsUrl).pipe(
      catchError(error => {
        this.logger.error('Error loading translation.json:', error);
        return of([] as ITranslate[]);
      })
    ),
    this.http.get<IEnums[]>(enumsUrl).pipe(
      catchError(error => {
        this.logger.error('Error loading enums.json:', error);
        return of([] as IEnums[]);
      })
    ),
    this.http.get<IVehicle[]>(modelsUrl).pipe(
      catchError(error => {
        this.logger.error('Error loading models.json:', error);
        return of([] as IVehicle[]);
      })
    )
  ];

  // Create the observable that will be memoized
  const loadingObservable = forkJoin<[ITranslate[], IEnums[], IVehicle[]]>(fileRequests).pipe(
    tap(([wmsTranslate, wmsEnums, wmsModels]) => {
      this.translations = wmsTranslate;
      this.enums = wmsEnums;
      this.allManufacturers = wmsModels;
      this.logger.info('All resource files loaded successfully');
    }),
    map(() => undefined)
  );

  // Memoize the promise and clear it when complete
  this.resourceLoadingPromise = new Promise<void>((resolve, reject) => {
    loadingObservable.pipe(
      finalize(() => {
        // Set the resourcesLoaded state based on data availability
        const isLoaded = this.translations && this.translations.length > 0;
        this.resourcesLoadedSubject.next(isLoaded);
      })
    ).subscribe({
      next: () => resolve(),
      error: (err) => {
        this.resourcesLoadedSubject.next(false);
        this.logger.error('Resource loading error:', err);
        resolve(); // Resolve instead of reject to handle failures gracefully
      }
    });
  });

  // Ensure promise is cleared after completion
  this.resourceLoadingPromise.finally(() => {
    this.resourceLoadingPromise = null;
  });

  return from(this.resourceLoadingPromise);
}
   areResourcesLoaded(): boolean {
    return this.resourcesLoadedSubject.value;
  }
  

T(key: string): string {
  const translation = this.translations.find(d => d.tkey === key);
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
        //this.loadEnums();
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
  
 
  getNextId(tableName:string) {
    const queryParams = new URLSearchParams();
    queryParams.append("wmsId", this.wmsId);
    queryParams.append("tName", tableName);
    const url = `${this.baseUrl}/api/Core/next-id?${queryParams}`;
    return this.http.get<number>(url);
  }
    getCompanyInfo(companyId:string)
    {
        const queryParams = new URLSearchParams();
        queryParams.append("companyId", companyId);
        const url = `${this.coreUrl}/company-info?${queryParams}`;
        return this.http.get<any>(url);
    }

}

