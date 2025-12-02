import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchStationComponent } from './search-station.component';

describe('SearchStationComponent', () => {
  let component: SearchStationComponent;
  let fixture: ComponentFixture<SearchStationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchStationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchStationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate ethereum address correctly', () => {
    expect(component.isValidEthereumAddress('0x1234567890abcdef1234567890abcdef12345678')).toBeTruthy();
    expect(component.isValidEthereumAddress('invalid')).toBeFalsy();
    expect(component.isValidEthereumAddress('')).toBeFalsy();
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

  it('should return correct AQI color for hazardous air quality', () => {
    const color = component.getAQIColor(350);
    expect(color).toBe('#7e0023');
  });

  it('should clear search data', () => {
    component.searchStationId = '0x123';
    component.reports = [{ reportId: 'test' } as any];
    component.errorMessage = 'test error';
    
    component.clearSearch();
    
    expect(component.searchStationId).toBe('');
    expect(component.reports.length).toBe(0);
    expect(component.errorMessage).toBe('');
  });

  it('should show error for invalid station ID', async () => {
    component.searchStationId = 'invalid';
    await component.searchReports();
    expect(component.errorMessage).toContain('Invalid');
  });
});