import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsultationComponent } from './consultation/consultation.component';
import { DashboardHomeComponent } from './dashboard-home/dashboard-home.component';
import { DoctorDashboardComponent } from './doctor-dashboard/doctor-dashboard.component';
import { ViewRecordComponent } from './view-record/view-record.component';
import { SearchStationComponent } from './search-station/search-station.component';

const routes: Routes = [
  {
    path: '',
    component: DoctorDashboardComponent,
    children: [
      { path: '', redirectTo: 'report-dashboard', pathMatch: 'full' },
      { path: 'report-dashboard', component: DashboardHomeComponent },
      { path: 'consult', component: ConsultationComponent },
      { path: 'view-report', component: ViewRecordComponent },
      { path: 'search-station', component: SearchStationComponent }
    ],
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportRoutingModule {}
