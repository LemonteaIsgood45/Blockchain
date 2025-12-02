import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRecordComponent } from './view-record.component';

describe('ViewRecordComponent', () => {
  let component: ViewRecordComponent;
  let fixture: ComponentFixture<ViewRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewRecordComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load reports on init', () => {
    spyOn(component, 'loadReports');
    component.ngOnInit();
    expect(component.loadReports).toHaveBeenCalled();
  });

  it('should format date correctly', () => {
    const testDate = '2024-01-15T10:30:00';
    const formatted = component.formatDate(testDate);
    expect(formatted).toContain('1/15/2024');
  });

  it('should return correct AQI color for good air quality', () => {
    const color = component.getAQIColor(45);
    expect(color).toBe('#00e400');
  });

  it('should return correct AQI color for moderate air quality', () => {
    const color = component.getAQIColor(75);
    expect(color).toBe('#ffff00');
  });

  it('should return correct AQI color for hazardous air quality', () => {
    const color = component.getAQIColor(350);
    expect(color).toBe('#7e0023');
  });

  it('should return correct status color', () => {
    expect(component.getStatusColor('Good')).toBe('#00e400');
    expect(component.getStatusColor('Moderate')).toBe('#ffff00');
    expect(component.getStatusColor('Unhealthy')).toBe('#ff7e00');
    expect(component.getStatusColor('Hazardous')).toBe('#ff0000');
  });
});