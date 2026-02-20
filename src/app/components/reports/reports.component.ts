import { Component } from '@angular/core';
import { SharedService } from 'app/services/shared.service';
import { SHARED_IMPORTS } from 'app/sharedimports';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    ...SHARED_IMPORTS,
  ],
  templateUrl: './reports.component.html',
  providers: [ConfirmationService, MessageService],
  styleUrls: ['./reports.component.css']
})

export class ReportsComponent {
  selectedMonth: Date | undefined;
  attendanceMonth: Date | undefined;
  
  selectedStartDate: string = '';
  selectedEndDate: string = '';
  selectedWeek!: number;

  constructor(public readonly sharedService: SharedService) {}

  // Invoice Download
  downloadInvoice(format: string) {
    if (!this.selectedMonth) {
      alert('Please select a month for the Invoice!');
      return;
    }
    const formattedDate = this.formatDate(this.selectedMonth);
    console.log(`Action: Invoice | Format: ${format} | Month: ${formattedDate}`);
  }

  // Attendance Download
  downloadAttendance() {
    if (!this.attendanceMonth) {
      alert('Please select a month for Attendance!');
      return;
    }
    const formattedDate = this.formatDate(this.attendanceMonth);
    console.log(`Action: Attendance | Month: ${formattedDate}`);
  }

  // Common Date Selection Logic
  onSelectMonth(d: Date) {
    if (d) {
      let selectedDate = new Date(d.getFullYear(), d.getMonth(), 1);
      let selectedWeek = this.sharedService.getWeekInfo(selectedDate, 'current');
      this.selectedStartDate = selectedWeek.startDate;
      this.selectedEndDate = selectedWeek.endDate;
      this.selectedWeek = selectedWeek.weekNumber;
    }
  }

  private formatDate(d: Date): string {
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}