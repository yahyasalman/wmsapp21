import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';



@Component({
  selector: 'app-opt-out',
  standalone : true,
  imports: [MessageModule,CommonModule,FormsModule],
  templateUrl: 'opt-out.component.html',
  styleUrls: ['opt-out.component.css'],
  
})
export class OptOutComponent {
  username: string = ''; // Holds the username input
  successMessage: boolean = false; // Controls the visibility of the success message
  successProductLabel: string = 'Your data deletion request has been received. We will process it shortly.';

  constructor(
  ) {}

  // Method to handle form submission
  onOptOut() {
    if (this.username.trim()) {
      // Simulate API call or logic to delete user data
      console.log(`Request to delete data for user: ${this.username}`);
      this.successMessage = true; // Show the success message
      this.username = ''; // Clear the form
    }
  }
}
