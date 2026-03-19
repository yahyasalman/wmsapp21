import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  
  constructor(private readonly logger: LogService) {}

  /**
   * Handle errors from subscriptions with dev/prod differentiation
   * In production: Shows user-friendly message, logs only the message
   * In development: Shows full error details, logs error object with context
   * 
   * @param error - The error object from the subscription
   * @param methodName - The name of the method where the error occurred
   * @param userMessage - User-friendly message to display to user (default: generic message)
   * @param context - Optional additional context information for logging in dev mode
   */
  handleError(
    error: any,
    methodName: string,
    userMessage: string = 'Something went wrong. Please try again later.',
    context?: any
  ): void {
    const logMessage = `[${methodName}] ${userMessage}`;
    
    if (environment.production) {
      // Production: Clean log without exposing technical details
      this.logger.error(logMessage);
    } else {
      // Development: Full error details and context for debugging
      const errorDetails = {
        error,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      this.logger.error(logMessage, errorDetails);
      // Also log to console in dev for immediate visibility
      console.error(`🔴 ${logMessage}`, error, context);
    }
  }

  /**
   * Get user-friendly error message for UI display
   * In production: Returns generic, sanitized message
   * In development: Returns detailed error information for debugging
   * 
   * @param error - The error object
   * @param defaultMessage - Default user-friendly message
   * @returns Appropriate message based on environment
   */
  getUserMessage(
    error: any,
    defaultMessage: string = 'Something went wrong. Please try again later.'
  ): string {
    if (environment.production) {
      return defaultMessage;
    } else {
      // Dev: Include technical details for debugging
      const errorDetails = error?.message || error?.statusText || error?.error?.message || 'Unknown error';
      return `${defaultMessage} - [${errorDetails}]`;
    }
  }

  /**
   * Alternative: Handle error and return the message (useful for toast notifications)
   * Combines logging and message generation in one call
   */
  handleErrorWithMessage(
    error: any,
    methodName: string,
    userMessage: string = 'Something went wrong. Please try again later.',
    context?: any
  ): string {
    this.handleError(error, methodName, userMessage, context);
    return this.getUserMessage(error, userMessage);
  }
}
