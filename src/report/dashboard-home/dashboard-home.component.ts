import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../services/doctor.service';
import { NgForm } from '@angular/forms';

interface AirQualityReport {
  reportId: string;
  timestamp: string;
  location: string;
  pm25: number;
  pm10: number;
  aqi: number;
  temperature: number;
  humidity: number;
  co2: number;
  no2: number;
  so2: number;
  o3: number;
  status: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous' | '';
  notes?: string;
}

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.sass'],
})
export class DashboardHomeComponent implements OnInit {
  DoctorDetails: any = {
    docID: '',
    fName: 'First Name',
    lName: 'Last Name',
    Doj: '',
    emailID: 'test_name@mail.com',
    phone: '123456789',
    city: 'city',
    state: 'state',
    speciality: 'speciality',
    imageHash: null,
  };

  reports: string[] = [];
  
  newReport: AirQualityReport = {
    reportId: '',
    timestamp: '',
    location: '',
    pm25: 0,
    pm10: 0,
    aqi: 0,
    temperature: 0,
    humidity: 0,
    co2: 0,
    no2: 0,
    so2: 0,
    o3: 0,
    status: '',
    notes: ''
  };

  isSubmitting: boolean = false;
  submitSuccess: boolean = false;
  submitError: string = '';

  constructor(private doctorService: DoctorService) {
    this.DoctorDetails = [];
  }

  ngOnInit(): void {
    // Set current datetime as default
    this.setCurrentDateTime();
    
    setTimeout(() => {
      this.getDoctorDetails();
    }, 3000);
  }

  async getDoctorDetails() {
    this.doctorService.getDoctor().then((data: any) => {
      console.log(data);
      this.DoctorDetails = data;
    });
  }

  setCurrentDateTime() {
    const now = new Date();
    // Format: YYYY-MM-DDTHH:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    this.newReport.timestamp = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  async submitReport() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = '';

    try {
      // Validate all required fields
      if (!this.validateReport()) {
        this.submitError = 'Please fill in all required fields correctly.';
        this.isSubmitting = false;
        return;
      }

      // Prepare report data
      const reportData = {
        reportId: this.newReport.reportId,
        timestamp: this.newReport.timestamp,
        location: this.newReport.location,
        pm25: Number(this.newReport.pm25),
        pm10: Number(this.newReport.pm10),
        aqi: Number(this.newReport.aqi),
        temperature: Number(this.newReport.temperature),
        humidity: Number(this.newReport.humidity),
        co2: Number(this.newReport.co2),
        no2: Number(this.newReport.no2),
        so2: Number(this.newReport.so2),
        o3: Number(this.newReport.o3),
        status: this.newReport.status,
        notes: this.newReport.notes || ''
      };

      console.log('Submitting report:', reportData);

      // Get doctor ID
      const account = await this.doctorService.account;
      
      // Call the service to add report
      await this.doctorService.addReport(reportData);

      this.submitSuccess = true;
      this.isSubmitting = false;

      // Reset form after 2 seconds
      setTimeout(() => {
        this.submitSuccess = false;
        this.resetFormData();
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting report:', error);
      this.submitError = error.message || 'Failed to submit report. Please try again.';
      this.isSubmitting = false;
    }
  }

  validateReport(): boolean {
    // Check required fields
    if (!this.newReport.reportId || !this.newReport.location || 
        !this.newReport.timestamp || !this.newReport.status) {
      return false;
    }

    // Validate numeric values
    if (this.newReport.aqi < 0 || this.newReport.aqi > 500) {
      return false;
    }

    if (this.newReport.pm25 < 0 || this.newReport.pm10 < 0) {
      return false;
    }

    if (this.newReport.humidity < 0 || this.newReport.humidity > 100) {
      return false;
    }

    return true;
  }

  resetForm(form: NgForm) {
    form.resetForm();
    this.resetFormData();
    this.submitSuccess = false;
    this.submitError = '';
  }

  resetFormData() {
    this.newReport = {
      reportId: '',
      timestamp: '',
      location: '',
      pm25: 0,
      pm10: 0,
      aqi: 0,
      temperature: 0,
      humidity: 0,
      co2: 0,
      no2: 0,
      so2: 0,
      o3: 0,
      status: '',
      notes: ''
    };
    this.setCurrentDateTime();
  }
}