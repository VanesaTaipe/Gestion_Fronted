import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-container" [class.fullscreen]="fullscreen">
      <div class="spinner-wrapper">
        <mat-spinner 
          [diameter]="size" 
          [strokeWidth]="strokeWidth"
          [color]="color">
        </mat-spinner>
        <p class="loading-text" *ngIf="showText">{{ text }}</p>
        <p class="loading-subtext" *ngIf="subtext">{{ subtext }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      min-height: 200px;
    }

    .loading-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      z-index: 9999;
      min-height: 100vh;
      padding: 0;
    }

    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loading-text {
      margin: 0;
      color: #2c3e50;
      font-size: 1rem;
      font-weight: 500;
      text-align: center;
    }

    .loading-subtext {
      margin: 0;
      color: #6c757d;
      font-size: 0.875rem;
      text-align: center;
      max-width: 300px;
      line-height: 1.4;
    }

    /* Animación adicional para el wrapper */
    .spinner-wrapper {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: number = 50;
  @Input() strokeWidth: number = 4;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() text: string = 'Cargando...';
  @Input() subtext: string = '';
  @Input() showText: boolean = true;
  @Input() fullscreen: boolean = false;
}