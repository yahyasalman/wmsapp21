// logging.interceptor.ts
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LogService } from 'app/services/log.service';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  constructor(private logger: LogService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const methodName = req.method;
    const url = req.url;

    //this.logger.info(`[HTTP Request] ${methodName}: ${url}`, req.body);

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          //this.logger.info(`[HTTP Response] ${methodName}: ${url}`, event.body);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.error(`[HTTP Error] ${methodName}: ${url}`, {
          message: error.message,
          status: error.status,
          body: error.error
        });
        return throwError(() => error);
      })
    );
  }
}
