import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../workspace/services/workspace.service';

interface TempUser {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="user-selector-container">
      <div class="selector-card">
        <div class="header">
          <mat-icon class="header-icon">account_circle</mat-icon>
          <h2>Seleccionar Usuario Temporal</h2>
          <p>Mientras implementas el login, selecciona un usuario de tu base de datos:</p>
        </div>

        <div class="users-grid">
          <mat-card 
            *ngFor="let user of tempUsers" 
            class="user-card"
            [class.selected]="selectedUserId === user.id"
            (click)="selectUser(user)">
            <mat-card-header>
              <mat-icon mat-card-avatar>person</mat-icon>
              <mat-card-title>{{ user.name }}</mat-card-title>
              <mat-card-subtitle>{{ user.email }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="user-id">ID: {{ user.id }}</p>
            </mat-card-content>
            <mat-card-actions>
              <button 
                mat-button 
                color="primary"
                [disabled]="selectedUserId === user.id">
                {{ selectedUserId === user.id ? 'Seleccionado' : 'Seleccionar' }}
              </button>
            </mat-card-actions>
          </mat-card>
        </div>

        <div class="actions-section">
          <button 
            mat-raised-button 
            color="primary"
            class="continue-button"
            [disabled]="!selectedUserId"
            (click)="continueToWorkspace()">
            <mat-icon>arrow_forward</mat-icon>
            Continuar a Espacios
          </button>
        </div>

        <div class="note">
          <mat-icon>info</mat-icon>
          <div>
            <p>
              <strong>Nota:</strong> Este selector es temporal. Los usuarios están hardcodeados 
              y corresponden a IDs reales de tu tabla de usuarios en la base de datos.
            </p>
            <p>
              Una vez implementes el sistema de autenticación, este componente se eliminará 
              y el usuario se obtendrá automáticamente del token de login.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-selector-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .selector-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      max-width: 900px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header-icon {
      font-size: 48px !important;
      color: #667eea;
      margin-bottom: 1rem;
    }

    .header h2 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .header p {
      color: #7f8c8d;
      margin: 0;
    }

    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .user-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .user-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .user-card.selected {
      border-color: #667eea;
      background: #f8f9ff;
    }

    .user-id {
      font-size: 0.9rem;
      color: #666;
      margin: 0;
    }

    .actions-section {
      text-align: center;
      margin: 2rem 0;
    }

    .continue-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      padding: 12px 32px !important;
      border-radius: 25px !important;
      font-size: 1.1rem !important;
      font-weight: 500 !important;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
      transition: all 0.3s ease !important;
    }

    .continue-button:hover:not([disabled]) {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important;
    }

    .continue-button[disabled] {
      background: #ccc !important;
      color: #666 !important;
      box-shadow: none !important;
    }

    .continue-button mat-icon {
      margin-right: 0.5rem;
    }

    .note {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 1rem;
      color: #856404;
    }

    .note mat-icon {
      color: #f39c12;
      margin-top: 0.1rem;
      flex-shrink: 0;
    }

    .note div {
      flex: 1;
    }

    .note p {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .note p:last-child {
      margin-bottom: 0;
    }

    @media (max-width: 600px) {
      .users-grid {
        grid-template-columns: 1fr;
      }
      
      .user-selector-container {
        padding: 1rem;
      }
      
      .selector-card {
        padding: 1.5rem;
      }
    }
  `]
})
export class UserSelectorComponent {
  private workspaceService = inject(WorkspaceService);
  private router = inject(Router);

  selectedUserId: number | null = null;

  // TODO: Reemplazar con usuarios reales de tu base de datos
  // Estos IDs deben corresponder con los IDs reales de tu tabla usuarios
  tempUsers: TempUser[] = [
    { id: 1, name: 'Usuario Admin', email: 'admin@empresa.com' },
    { id: 2, name: 'María González', email: 'maria@empresa.com' },
    { id: 3, name: 'Juan Pérez', email: 'juan@empresa.com' },
    { id: 4, name: 'Ana López', email: 'ana@empresa.com' }
  ];

  selectUser(user: TempUser): void {
    this.selectedUserId = user.id;
    this.workspaceService.setTemporaryUser(user.id);
    console.log('Usuario temporal seleccionado:', user);
    
    // Guardar en localStorage para recordar la selección
    localStorage.setItem('tempUserId', user.id.toString());
    localStorage.setItem('tempUserName', user.name);
  }

  continueToWorkspace(): void {
    if (this.selectedUserId) {
      // Navegar a la ruta de workspace
      this.router.navigate(['/workspace']);
    }
  }
}