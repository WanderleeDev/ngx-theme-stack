import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxDarkMode } from './ngx-dark-mode';

describe('NgxDarkMode', () => {
  let component: NgxDarkMode;
  let fixture: ComponentFixture<NgxDarkMode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxDarkMode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxDarkMode);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
