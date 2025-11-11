import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { UserService as AuthService } from '../../../../core/auth/services/use.service';
import { ArchivoAdjunto, Card, Comentario } from '../../models/board.model';
import { BoardService } from '../../services/board.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-card-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  styleUrls: ['./card-detail.component.css'],
  template: `
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" 
       (click)="onBackdropClick($event)">
    <div class="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex relative"
         (click)="$event.stopPropagation()">
      
      <!-- Botón cerrar -->
      <button (click)="close()" 
              class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full p-1 shadow-md">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Panel Izquierdo: Contenido Principal -->
      <div class="flex-1 flex flex-col overflow-hidden">
        
        <!-- Header con título -->
        <div class="p-6 pb-4">
          <input 
            *ngIf="editingTitle; else titleDisplay"
            [(ngModel)]="card.title"
            (blur)="saveTitle()"
            (keyup.enter)="saveTitle()"
            class="text-xl font-bold w-full border-b-2 border-cyan-500 outline-none"
            autofocus />
          <ng-template #titleDisplay>
            <h2 class="text-xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded -ml-2"
                (click)="editingTitle = true">
              {{ card.title }}
            </h2>
          </ng-template>
        </div>

        <!-- Contenido con scroll -->
        <div class="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          
          <!-- ========== DESCRIPCIÓN ========== -->
          <div>
            <h3 class="text-base font-semibold text-gray-900 mb-3">Descripción</h3>
            
            <!-- Modo lectura -->
            <div *ngIf="!editingDescription">
              <div class="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors min-h-[60px]"
                  (click)="toggleDescriptionEdit()">
                
                <!-- Texto de la descripción -->
                <div class="text-sm text-gray-700 leading-relaxed" 
                    [innerHTML]="getFormattedDescription()"></div>
                
                <!-- Checklist integrado -->
                <div *ngIf="hasChecklist()" class="mt-4 pt-4 border-t border-gray-200">
                  
                  <!-- Header del checklist -->
                  <div class="flex items-center gap-2 mb-3">
                    <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                    <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Checklist</span>
                    <span class="text-xs text-gray-500">
                      ({{ getCheckedItemsCount() }}/{{ getChecklistItems().length }})
                    </span>
                  </div>
                  
                  <!-- Barra de progreso -->
                  <div class="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                    <div class="bg-cyan-600 h-1.5 rounded-full transition-all duration-300"
                        [style.width.%]="getChecklistProgress()">
                    </div>
                  </div>
                  
                  <!-- Items del checklist -->
                  <div class="space-y-1.5">
                    <div *ngFor="let item of getChecklistItems(); let i = index" 
                        class="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-gray-100 transition-colors group">
                      <input 
                        type="checkbox" 
                        [checked]="item.checked"
                        [id]="'checkbox-' + i"
                        (click)="toggleChecklistItem(i, $event)"
                        (click)="$event.stopPropagation()"
                        class="mt-0.5 w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 cursor-pointer">
                      <label 
                        [for]="'checkbox-' + i"
                        [class.line-through]="item.checked"
                        [class.text-gray-400]="item.checked"
                        [class.text-gray-700]="!item.checked"
                        (click)="toggleChecklistItem(i, $event)"
                        class="text-sm flex-1 cursor-pointer select-none">
                        {{ item.text }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Modo edición -->
            <div *ngIf="editingDescription" class="space-y-2">
              
              <!-- Toolbar -->
              <div class="flex items-center gap-2 p-2 bg-gray-100 border border-gray-300 rounded-t-lg">
                
                <!-- Botón Negrita -->
                <button type="button" 
                        (click)="insertMarkdown('**')" 
                        class="px-3 py-1.5 hover:bg-white rounded transition-colors text-sm font-semibold" 
                        title="Negrita - selecciona texto y haz clic">
                  <strong>B</strong>
                </button>
                
                <!-- Botón Subrayado -->
                <button type="button" 
                        (click)="insertMarkdown('__')" 
                        class="px-3 py-1.5 hover:bg-white rounded transition-colors text-sm" 
                        title="Subrayado - selecciona texto y haz clic">
                  <u>U</u>
                </button>
                
                <div class="w-px h-6 bg-gray-300"></div>
                
                <!-- Botón Lista/Checkbox -->
                <div class="relative">
                  <button type="button" 
                          (click)="showBulletMenu = !showBulletMenu"
                          class="px-3 py-1.5 hover:bg-white rounded transition-colors text-sm flex items-center gap-1" 
                          title="Insertar viñeta o checkbox">
                    <input *ngIf="selectedBulletType === 'checkbox'" 
                          type="checkbox" 
                          [checked]="selectedBullet === '[x]'"
                          disabled
                          class="w-3.5 h-3.5 pointer-events-none">
                    <span *ngIf="selectedBulletType === 'bullet'" class="text-base">{{ selectedBullet }}</span>
                    <span class="text-xs">Lista</span>
                    <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  
                  <!-- Menú desplegable -->
                  <div *ngIf="showBulletMenu" 
                      (click)="$event.stopPropagation()"
                      class="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[220px]">
                    
                    <div class="p-2 border-b border-gray-200">
                      <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide px-2 py-1">Viñetas y Checkboxes</p>
                    </div>
                    
                    <div class="p-2 space-y-1 max-h-60 overflow-y-auto">
                      <button *ngFor="let bullet of bulletTypes"
                              type="button"
                              (click)="selectBullet(bullet.symbol, bullet.type)"
                              class="w-full text-left px-3 py-2 hover:bg-cyan-50 rounded transition-colors flex items-center gap-3"
                              [class.bg-cyan-100]="selectedBullet === bullet.symbol">
                        
                        <span *ngIf="bullet.type === 'checkbox'" class="w-6 flex items-center justify-center">
                          <input type="checkbox" 
                                [checked]="bullet.symbol === '[x]'"
                                disabled
                                class="w-4 h-4 pointer-events-none">
                        </span>
                        
                        <span *ngIf="bullet.type === 'bullet'" class="text-lg w-6 text-center">
                          {{ bullet.symbol }}
                        </span>
                        
                        <span class="text-sm text-gray-700 flex-1">{{ bullet.name }}</span>
                        
                        <svg *ngIf="selectedBullet === bullet.symbol" 
                            class="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Contador de caracteres -->
                <span class="ml-auto text-xs text-gray-500">
                  {{ card.descripcion?.length || 0 }} / 50,000
                </span>
              </div>
              
              <!-- Textarea -->
              <textarea
                #descTextarea
                [(ngModel)]="card.descripcion"
                (keydown)="onDescriptionKeyDown($event)"
                (keydown.tab)="onTab($event)"
                class="w-full min-h-[150px] max-h-[400px] p-4 border border-gray-300 rounded-b-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-white resize-y"
                style="direction: ltr; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5;"
                placeholder="Escribe aquí... Usa los botones de arriba para dar formato"
                maxlength="50000"></textarea>

              <!-- Botones de acción -->
              <div class="flex gap-2 justify-end">
                <button (click)="cancelDescriptionEdit()" 
                        type="button"
                        class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button (click)="saveDescription()" 
                        type="button"
                        class="px-4 py-2 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
                  Guardar
                </button>
              </div>
            </div>
          </div>

          <!-- ========== COMENTARIOS ========== -->
          <div>
            
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-gray-900">
                Comentarios ({{ getActiveComments().length }}/10)
              </h3>
              <span *ngIf="getActiveComments().length >= 10" class="text-xs text-red-600 font-medium">
                Límite alcanzado
              </span>
            </div>

            <!-- Input para agregar comentario -->
            <form [formGroup]="commentForm" (ngSubmit)="addComment()" class="mb-4">
              <div class="flex gap-2">
                <textarea
                  formControlName="contenido"
                  class="flex-1 p-3 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  rows="2"
                  [placeholder]="getActiveComments().length >= 10 ? 'Límite de comentarios alcanzado' : 'Escribir un comentario...'"
                  [disabled]="getActiveComments().length >= 10"></textarea>
                <button
                  type="submit"
                  [disabled]="commentForm.invalid || isSubmittingComment || getActiveComments().length >= 10"
                  class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed h-fit transition-colors">
                  {{ isSubmittingComment ? 'Enviando...' : 'Enviar' }}
                </button>
              </div>
            </form>

            <!-- Lista de comentarios -->
            <div class="space-y-4">
              <div *ngFor="let comment of getActiveComments()" 
                  class="flex gap-3 group relative bg-white hover:bg-gray-50 p-3 rounded-lg transition-colors">
                
                <!-- Avatar -->
                <div class="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {{ getCommentInitial(comment.usuario || comment.nombre_usuario) }}
                </div>
                
                <!-- Contenido -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline gap-2 mb-1">
                    <p class="font-semibold text-sm text-gray-900">
                      {{ comment.usuario || comment.nombre_usuario || 'Usuario' }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ formatCommentTime(comment.created_at || comment.fecha) }}
                    </p>
                  </div>
                  
                  <textarea
                    *ngIf="editingCommentId === getCommentId(comment)"
                    [(ngModel)]="editingCommentText"
                    class="w-full p-2 border-2 border-cyan-500 rounded text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    rows="3"></textarea>
                  
                  <p *ngIf="editingCommentId !== getCommentId(comment)" 
                    class="text-sm text-gray-700 break-words whitespace-pre-wrap">
                    {{ comment.contenido || comment.texto }}
                  </p>
                </div>

                <!-- Botones de acción -->
                <div class="flex gap-1 ml-auto">
                  <button
                    *ngIf="canEditComment(comment) && editingCommentId !== getCommentId(comment)"
                    (click)="startEditComment(comment)"
                    class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                    title="Editar comentario">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  
                  <ng-container *ngIf="editingCommentId === getCommentId(comment)">
                    <button
                      (click)="saveEditComment(comment)"
                      class="px-3 py-1.5 text-xs font-medium bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors">
                      Guardar
                    </button>
                    <button
                      (click)="cancelEditComment()"
                      class="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                      Cancelar
                    </button>
                  </ng-container>
                  
                  <button
                    *ngIf="canDeleteComment(comment) && editingCommentId !== getCommentId(comment)"
                    (click)="deleteComment(comment)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                    [title]="isLeader ? 'Eliminar comentario (líder)' : 'Eliminar mi comentario'">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>

              <p *ngIf="getActiveComments().length === 0" 
                class="text-gray-400 text-center text-sm py-6">
                No hay comentarios aún
              </p>
            </div>
          </div>
          
        </div>
      </div>

      <!-- ========== PANEL DERECHO ========== -->
      <div class="w-80 bg-gray-50 border-l flex flex-col overflow-y-auto">
        <div class="p-5 space-y-4">
          
        <!-- Prioridad -->
          <div>
            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
              Prioridad
            </label>
            <select 
              [(ngModel)]="card.prioridad"
              (change)="saveCard()"
              class="w-full px-3 py-2.5 border rounded-lg text-sm font-semibold cursor-pointer transition-colors"
              [ngClass]="{
                'text-red-700 bg-red-100 border-red-300 hover:bg-red-200': card.prioridad === 'alta',
                'text-orange-700 bg-orange-100 border-orange-300 hover:bg-orange-200': card.prioridad === 'media',
                'text-yellow-700 bg-yellow-100 border-yellow-300 hover:bg-yellow-200': card.prioridad === 'baja',
                'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200': card.prioridad === 'No asignada' || !card.prioridad
              }">
              <option value="No asignada">No asignada</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <!-- Fecha límite -->
          <div>
            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
              Fecha límite
            </label>
            <input
              type="date"
              [value]="getFormattedDate()"
              (change)="onDateChange($event); saveCard()"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500" />
          </div>

          <!-- Asignado -->
          <div>
            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
              Asignado
            </label>
            
            <!-- Sin asignar -->
            <div *ngIf="!editingAssignee && !isAssigneeFixed()" 
                class="flex items-center gap-3 p-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-cyan-400 transition-colors"
                (click)="startEditingAssignee()">
              <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <span class="text-sm text-gray-500 font-medium">Seleccionar usuario</span>
            </div>

            <!-- Asignado (bloqueado) -->
            <div *ngIf="isAssigneeFixed()"
                class="flex items-center gap-3 p-2.5 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed">
              <div class="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {{ getUserInitial() }}
              </div>
              <span class="flex-1 text-sm font-medium text-gray-700">
                {{ card.asignado_a || 'Sin asignar' }}
              </span>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>

            <!-- Selector de usuario -->
            <div *ngIf="editingAssignee" class="relative">
              <div class="flex items-center gap-2 p-2 border-2 border-cyan-500 rounded-lg bg-white shadow-lg">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input 
                  type="text"
                  [(ngModel)]="searchUserTerm"
                  (input)="onSearchUser()"
                  class="flex-1 outline-none text-sm"
                  placeholder="Buscar miembro..."
                  autofocus>
                <button 
                  type="button"
                  (click)="cancelEditingAssignee()"
                  class="p-1 text-gray-400 hover:text-gray-600 transition">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Dropdown -->
              <div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                
                <div (click)="assignUser(null)"
                    class="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b transition-colors">
                  <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </div>
                  <span class="text-sm text-gray-600">Sin asignar</span>
                </div>

                <div *ngIf="loadingUsers" class="flex items-center justify-center py-6">
                  <svg class="animate-spin h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>

                <div *ngFor="let member of filteredProjectMembers"
                    (click)="assignUser(member)"
                    class="flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-50 cursor-pointer transition-colors"
                    [class.bg-cyan-100]="card.id_asignado === member.id_usuario">
                  <div class="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {{ getMemberInitial(member) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ member.nombre || member.username || member.email }}
                    </p>
                    <p class="text-xs text-gray-500 truncate">{{ member.email }}</p>
                  </div>
                  <svg *ngIf="card.id_asignado === member.id_usuario" 
                      class="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>

                <div *ngIf="!loadingUsers && filteredProjectMembers.length === 0"
                    class="py-8 text-center">
                  <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <p class="text-sm text-gray-500">No se encontraron miembros</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Adjuntos -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Adjuntos ({{ getActiveFiles().length }}/3)
              </label>
              <span *ngIf="getActiveFiles().length >= 3" class="text-xs text-red-600 font-medium">
                Límite alcanzado
              </span>
            </div>

            <div class="mb-3" *ngIf="getActiveFiles().length < 3">
              <label class="w-full cursor-pointer">
                <div class="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-700">Agregar archivo</span>
                </div>
                <input 
                  type="file"
                  (change)="onFileSelected($event)"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  class="hidden">
              </label>
            </div>
            
            <div *ngIf="getActiveFiles().length > 0" class="space-y-2">
              <div *ngFor="let archivo of getActiveFiles()" 
                  class="group relative bg-white border border-gray-200 rounded-lg p-3 hover:border-cyan-300 transition-all">
                
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    <img *ngIf="isImageFile(archivo)" 
                        [src]="archivo.archivo_ruta" 
                        [alt]="archivo.archivo_nombre"
                        class="w-full h-full object-cover cursor-pointer hover:opacity-75 transition"
                        (click)="openFile(archivo.archivo_ruta)"
                        (error)="$event.target.style.display='none'">
                    
                    <div *ngIf="!isImageFile(archivo)" 
                        class="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
                        (click)="openFile(archivo.archivo_ruta)">
                      <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-cyan-600 transition"
                      (click)="openFile(archivo.archivo_ruta)"
                      [title]="archivo.archivo_nombre">
                      {{ archivo.archivo_nombre }}
                    </p>
                  </div>

                  <button
                    (click)="deleteFile(archivo)"
                    class="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Eliminar archivo">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div *ngIf="getActiveFiles().length === 0" 
                class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              <p class="text-sm text-gray-400 font-medium">No hay archivos adjuntos</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
`
})
export class CardDetailModalComponent implements OnInit, OnChanges {
  @Input() card!: Card;
  @Input() columnName: string = '';
  @Input() isLeader: boolean = false;
  @Input() currentUserId!: number;
  @Input() proyectoId!: number;
  @Output() closeModal = new EventEmitter<void>();
  @Output() cardUpdated = new EventEmitter<Card>();
  @Output() cardDeleted = new EventEmitter<number>();

  @ViewChild('descTextarea') descTextarea?: ElementRef<HTMLTextAreaElement>;

  editingTitle = false;
  editingDescription = false;
  originalDescription = '';
  commentForm: FormGroup;
  isSubmittingComment = false;
  searchUserTerm = '';
  editingAssignee = false;
  editingCommentId: number | null = null;
  editingCommentText: string = '';

  projectMembers: any[] = [];
  filteredProjectMembers: any[] = [];
  loadingUsers = false;
  private api = environment.apiBase;
  private _deletedMemberId?: number;

  bulletTypes = [
    { symbol: '•', name: 'Punto', type: 'bullet' },
    { symbol: '■', name: 'Cuadrado', type: 'bullet' },
    { symbol: '→', name: 'Flecha', type: 'bullet' },
    { symbol: '[ ]', name: 'Checkbox sin marcar', type: 'checkbox' },
    { symbol: '[x]', name: 'Checkbox marcado', type: 'checkbox' }
  ] as const;

  selectedBullet = '•';
  selectedBulletType: 'bullet' | 'checkbox' = 'bullet';
  showBulletMenu = false;
  @Input() set deletedMemberId(userId: number | undefined) {
    if (userId && this.card?.id_asignado === userId) {
      console.log('🔔 Usuario asignado eliminado, actualizando card...');

      // Actualizar inmediatamente en el modal
      this.card.id_asignado = undefined;
      this.card.asignado_a = 'Sin asignar';

      console.log('✅ Card actualizada:', {
        id_asignado: this.card.id_asignado,
        asignado_a: this.card.asignado_a
      });

      // Recargar lista de miembros
      this.loadProjectMembers();
    }
    this._deletedMemberId = userId;
  }

  constructor(
    private fb: FormBuilder,
    private boardService: BoardService,
    private taskService: TaskService,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.commentForm = this.fb.group({
      contenido: ['', Validators.required],
      descripcion: ['']
    });
  }

  public getCommentId(comment: Comentario): number {
    return comment.id_comentario || comment.id || 0;
  }

  ngOnInit() {
    // ✅ CRÍTICO: Convertir isLeader a boolean
    if (typeof this.isLeader !== 'boolean') {
      console.warn('⚠️ isLeader no es boolean, convirtiendo...');
      const originalValue = this.isLeader;
      this.isLeader = this.isLeader === true ||
        this.isLeader === 'true' ||
        this.isLeader === 1 ||
        (this.isLeader as any) === '1';
      console.log('🔄 isLeader convertido:', { antes: originalValue, despues: this.isLeader });
    }

    // ✅ NUEVO: Cargar los datos completos de la tarjeta
    console.log('📥 Cargando tarjeta completa:', this.card.id);
    this.loadFullCard();

    // ✅ Normalizar fecha al cargar
    if (this.card.fecha_vencimiento && !this.card.due_at) {
      this.card.due_at = this.card.fecha_vencimiento;
    }

    // Extraer solo la parte de fecha (quitar timestamp)
    if (this.card.due_at && typeof this.card.due_at === 'string') {
      this.card.due_at = this.card.due_at.split('T')[0];
    }

    if (this.card.fecha_vencimiento && typeof this.card.fecha_vencimiento === 'string') {
      this.card.fecha_vencimiento = this.card.fecha_vencimiento.split('T')[0];
    }

    if (!this.card.comentarios) {
      this.card.comentarios = [];
    }

    if (!this.card.archivos) {
      this.card.archivos = [];
    }

    if (!this.currentUserId) {
      this.currentUserId = this.authService.getCurrentUserId() || 0;
    }

    this.loadComments();
    this.loadFiles();
    this.loadProjectMembers();
  }

  // ✅ NUEVO MÉTODO: Cargar la tarjeta completa desde el backend
  loadFullCard() {
    this.taskService.getCard(this.card.id).subscribe({
      next: (cardData: any) => {
        console.log('✅ Tarjeta completa cargada:', cardData);

        // Actualizar la descripción
        if (cardData.descripcion) {
          this.card.descripcion = cardData.descripcion;
          console.log('📝 Descripción cargada:', this.card.descripcion);
        }

        // Actualizar otros campos si es necesario
        this.card.title = cardData.titulo || cardData.title || this.card.title;
        this.card.prioridad = cardData.prioridad || this.card.prioridad;
        this.card.asignado_a = cardData.asignado_a || this.card.asignado_a;
        this.card.id_asignado = cardData.id_asignado || this.card.id_asignado;
      },
      error: (e) => {
        console.error('❌ Error cargando tarjeta completa:', e);
      }
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    // ✅ Detectar cuando la card cambia desde fuera (ej: miembro eliminado)
    if (changes['card'] && !changes['card'].firstChange) {
      const newCard = changes['card'].currentValue;

      console.log('🔄 Card actualizada desde fuera:', {
        antes: changes['card'].previousValue?.asignado_a,
        ahora: newCard?.asignado_a,
        id_asignado_antes: changes['card'].previousValue?.id_asignado,
        id_asignado_ahora: newCard?.id_asignado
      });

      // Si la tarea quedó sin asignar, recargar miembros
      if (!newCard?.id_asignado && changes['card'].previousValue?.id_asignado) {
        console.log('✅ Tarea desasignada, recargando miembros...');
        this.loadProjectMembers();
      }
    }
  }


  // ✅ Método para formatear fecha
  getFormattedDate(): string {
    if (!this.card.due_at && !this.card.fecha_vencimiento) {
      console.log('📅 No hay fecha para formatear');
      return '';
    }

    const dateStr = this.card.due_at || this.card.fecha_vencimiento;

    try {
      if (!dateStr) {
        console.log('📅 No hay fecha para formatear');
        return '';
      }
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      const formatted = `${year}-${month}-${day}`;

      console.log('📅 Fecha formateada:', {
        original: dateStr,
        formatted: formatted
      });

      return formatted;
    } catch (e) {
      console.error('❌ Error formateando fecha:', e);
      return '';
    }
  }

  // ✅ Manejar cambio de fecha
  onDateChange(event: any) {
    const newDate = event.target.value;
    console.log('📅 Fecha cambiada a:', newDate);

    if (newDate) {
      this.card.due_at = newDate;
      this.card.fecha_vencimiento = newDate;
    } else {
      this.card.due_at = undefined;
      this.card.fecha_vencimiento = undefined;
    }

    console.log('📅 Fecha actualizada en el card:', {
      due_at: this.card.due_at,
      fecha_vencimiento: this.card.fecha_vencimiento
    });
  }

  loadProjectMembers() {
    if (!this.proyectoId) {
      console.warn('No hay proyectoId para cargar miembros');
      return;
    }

    this.loadingUsers = true;
    this.http.get(`${this.api}/proyectos/${this.proyectoId}/miembros`).subscribe({
      next: (res: any) => {
        this.projectMembers = res?.miembros || res?.data || [];
        this.filteredProjectMembers = this.projectMembers;
        this.loadingUsers = false;
        console.log('Miembros del proyecto cargados:', this.projectMembers);
      },
      error: (e) => {
        console.error('Error cargando miembros:', e);
        this.projectMembers = [];
        this.filteredProjectMembers = [];
        this.loadingUsers = false;
      }
    });
  }

  startEditingAssignee() {
    this.editingAssignee = true;
    this.searchUserTerm = '';
    this.filteredProjectMembers = this.projectMembers;
  }

  cancelEditingAssignee() {
    this.editingAssignee = false;
    this.searchUserTerm = '';
  }

  onSearchUser() {
    const term = this.searchUserTerm.toLowerCase();

    if (!term) {
      this.filteredProjectMembers = this.projectMembers;
      return;
    }

    this.filteredProjectMembers = this.projectMembers.filter(m =>
      m.nombre?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.username?.toLowerCase().includes(term)
    );
  }

  assignUser(member: any | null) {
    // ✅ Validación: No permitir cambiar si ya está asignado
    if (this.isAssigneeFixed()) {
      alert('No se puede cambiar el usuario asignado una vez que la tarea ha sido asignada');
      this.editingAssignee = false;
      return;
    }

    const previousAssignee = this.card.asignado_a;
    const previousId = this.card.id_asignado;

    if (member) {
      this.card.id_asignado = member.id_usuario;
      this.card.asignado_a = member.nombre || member.username || member.email;
      console.log('Asignando tarea a:', this.card.asignado_a);
    } else {
      this.card.id_asignado = undefined;
      this.card.asignado_a = 'Sin asignar';
      console.log('Desasignando tarea');
    }

    this.editingAssignee = false;
    this.searchUserTerm = '';

    this.taskService.updateCard(this.card).subscribe({
      next: () => {
        console.log('✅ Asignación actualizada correctamente');
        this.cardUpdated.emit(this.card);
      },
      error: (e) => {
        console.error('❌ Error actualizando asignación:', e);
        this.card.asignado_a = previousAssignee;
        this.card.id_asignado = previousId;
        alert('Error al actualizar la asignación. Por favor, intenta nuevamente.');
      }
    });
  }

  getMemberInitial(member: any): string {
    const name = member.nombre || member.username || member.email || 'U';
    return name.charAt(0).toUpperCase();
  }

  loadComments() {
    this.taskService.getComments(this.card.id).subscribe({
      next: (comentarios: any[]) => {
        console.log('Comentarios cargados:', comentarios);

        this.card.comentarios = comentarios.map((c: any) => ({
          id: c.id_comentario || c.id,
          id_comentario: c.id_comentario || c.id,
          id_usuario: c.id_usuario,
          usuario: c.nombre_usuario || c.usuario || 'Usuario',
          nombre_usuario: c.nombre_usuario || c.usuario,
          contenido: c.contenido,
          texto: c.contenido,
          fecha: c.created_at || c.fecha,
          created_at: c.created_at || c.fecha,
          minutos_desde_creacion: c.minutos_desde_creacion,
          status: c.status || '0'
        }));

        this.card.comentarios?.forEach(c => {
          console.log(`Comentario ${c.id}: Usuario ${c.id_usuario}, Puede eliminar: ${this.canDeleteComment(c)}`);
        });
      },
      error: (e) => {
        console.error('Error cargando comentarios:', e);
        this.card.comentarios = [];
      }
    });
  }

  loadFiles() {
    this.taskService.getTaskFilesComplete(this.card.id).subscribe({
      next: (archivos: ArchivoAdjunto[]) => {
        console.log('Archivos recibidos en componente:', archivos);
        this.card.archivos = archivos;
      },
      error: (e) => {
        console.error('Error cargando archivos:', e);
        this.card.archivos = [];
      }
    });
  }

  getActiveComments(): Comentario[] {
    return (this.card.comentarios || []).filter(c => c.status !== '1');
  }

  getActiveFiles(): ArchivoAdjunto[] {
    if (!this.card.archivos) {
      return [];
    }

    const activos = this.card.archivos.filter(a => {
      const isActive = a.status !== '1' && a.status !== '1';
      console.log(`Archivo ${a.id} (${a.archivo_nombre}): status=${a.status}, activo=${isActive}`);
      return isActive;
    });

    console.log(`Total archivos activos: ${activos.length}/${this.card.archivos.length}`);
    return activos;
  }

  // ✅ Solo el autor puede editar su propio comentario
  canEditComment(comment: Comentario): boolean {
    const canEdit = comment.id_usuario === this.currentUserId;

    console.log(`✏️ ¿Puede editar comentario ${this.getCommentId(comment)}?`, {
      comentarioAutor: comment.id_usuario,
      usuarioActual: this.currentUserId,
      resultado: canEdit
    });

    return canEdit;
  }

  // ✅ Líder puede eliminar todos, miembro solo los suyos
  canDeleteComment(comment: Comentario): boolean {
    console.log('🔍 === canDeleteComment ===');
    console.log('Comentario ID:', this.getCommentId(comment));
    console.log('Autor ID:', comment.id_usuario);
    console.log('Autor Nombre:', comment.usuario || comment.nombre_usuario);
    console.log('Usuario Actual ID:', this.currentUserId);
    console.log('isLeader:', this.isLeader);
    console.log('tipo isLeader:', typeof this.isLeader);

    // ✅ Convertir isLeader a boolean robustamente
    const esLider = this.isLeader === true ||
      (this.isLeader as any) === '1';

    console.log('Es Líder (convertido):', esLider);

    // Líder puede eliminar cualquier comentario
    if (esLider) {
      console.log('✅ PUEDE ELIMINAR (ES LÍDER)');
      return true;
    }

    // Miembro solo puede eliminar sus propios comentarios
    const esAutor = comment.id_usuario === this.currentUserId;
    console.log(`${esAutor ? '✅' : '❌'} ${esAutor ? 'PUEDE' : 'NO PUEDE'} ELIMINAR (${esAutor ? 'ES AUTOR' : 'NO ES AUTOR'})`);

    return esAutor;
  }

  startEditComment(comment: Comentario) {
    console.log('=== INICIAR EDICIÓN ===');
    console.log('Comentario:', comment);
    console.log('ID (id_comentario):', comment.id_comentario);
    console.log('ID (id):', comment.id);

    this.editingCommentId = this.getCommentId(comment);
    this.editingCommentText = comment.contenido || comment.texto || '';

    console.log('editingCommentId asignado:', this.editingCommentId);
    console.log('editingCommentText:', this.editingCommentText);
  }

  cancelEditComment() {
    this.editingCommentId = null;
    this.editingCommentText = '';
  }

  saveEditComment(comment: Comentario) {
    if (!this.editingCommentText.trim()) {
      alert('El comentario no puede estar vacío');
      return;
    }

    const commentId = this.getCommentId(comment);

    this.taskService.updateComment(commentId, this.editingCommentText).subscribe({
      next: () => {
        const index = this.card.comentarios?.findIndex(c =>
          this.getCommentId(c) === commentId
        );

        if (index !== undefined && index >= 0 && this.card.comentarios) {
          this.card.comentarios[index].contenido = this.editingCommentText;
          this.card.comentarios[index].texto = this.editingCommentText;
        }

        this.cancelEditComment();
      },
      error: (e) => {
        console.error('Error actualizando comentario:', e);
        alert('No se pudo actualizar el comentario');
      }
    });
  }

  deleteComment(comment: Comentario) {
    if (!this.canDeleteComment(comment)) {
      alert('No tienes permiso para eliminar este comentario');
      return;
    }

    if (!confirm('¿Eliminar este comentario?')) {
      return;
    }

    const commentId = this.getCommentId(comment);

    this.taskService.deleteComment(commentId).subscribe({
      next: () => {
        if (this.card.comentarios) {
          this.card.comentarios = this.card.comentarios.filter(c =>
            (c.id_comentario || c.id) !== commentId
          );
          this.card.comentarios_count = this.getActiveComments().length;
        }
      },
      error: (e) => {
        console.error('Error eliminando comentario:', e);
        alert(e.message || 'No se pudo eliminar el comentario');
      }
    });
  }

  addComment() {
    if (this.commentForm.invalid || this.isSubmittingComment) {
      return;
    }

    if (this.getActiveComments().length >= 10) {
      alert('Esta tarea ya tiene 10 comentarios (límite máximo)');
      return;
    }

    const currentUserId = this.currentUserId || this.authService.getCurrentUserId();

    if (!currentUserId) {
      alert('Error: Usuario no autenticado');
      return;
    }

    this.isSubmittingComment = true;
    const contenido = this.commentForm.value.contenido.trim();

    const comentarioData = {
      id_tarea: this.card.id,
      id_usuario: currentUserId,
      contenido: contenido
    };

    console.log('Enviando comentario:', comentarioData);

    this.taskService.addComment(comentarioData).subscribe({
      next: (res) => {
        console.log('Comentario agregado:', res);
        this.loadComments();
        this.commentForm.reset();
        this.isSubmittingComment = false;

        if (this.card.comentarios_count !== undefined) {
          this.card.comentarios_count += 1;
        }
      },
      error: (e) => {
        console.error('Error agregando comentario:', e);

        let errorMsg = 'No se pudo agregar el comentario';

        if (e.error?.error) {
          errorMsg = e.error.error;
        } else if (e.status === 400) {
          errorMsg = 'Datos inválidos. Verifica el contenido del comentario.';
        } else if (e.status === 401) {
          errorMsg = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
        }

        alert(errorMsg);
        this.isSubmittingComment = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (!file) {
      return;
    }

    if (this.getActiveFiles().length >= 3) {
      alert('Límite de 3 archivos alcanzado');
      event.target.value = '';
      return;
    }

    console.log('Archivo seleccionado:', file.name);
    this.taskService.uploadFileToTask(this.card.id, file).subscribe({
      next: (archivo) => {
        console.log('Archivo subido:', archivo);
        this.loadFiles();
        event.target.value = '';
      },
      error: (e) => {
        console.error('Error subiendo archivo:', e);
        alert(e.message || 'Error al subir el archivo');
        event.target.value = '';
      }
    });
  }

  deleteFile(archivo: ArchivoAdjunto) {
    if (!confirm(`¿Eliminar "${archivo.archivo_nombre}"?`)) {
      return;
    }

    console.log(`Eliminando archivo ${archivo.id}...`);

    this.taskService.deleteFile(archivo.id).subscribe({
      next: () => {
        console.log('Archivo eliminado exitosamente');
        this.loadFiles();
      },
      error: (e) => {
        console.error('Error eliminando archivo:', e);
        alert(e.message || 'No se pudo eliminar el archivo');
      }
    });
  }

  isImageFile(archivo: ArchivoAdjunto): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => archivo.archivo_nombre.toLowerCase().endsWith(ext));
  }

  openFile(url: string) {
    window.open(url, '_blank');
  }

  close() {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }


  saveTitle() {
    this.editingTitle = false;
    this.saveCard();
  }



  // ✅ Guardar cambios en BD
  saveCard() {
    console.log('💾 Guardando cambios de la tarjeta:', {
      id: this.card.id,
      titulo: this.card.title,
      descripcion: this.card.descripcion,
      prioridad: this.card.prioridad,
      due_at: this.card.due_at,
      fecha_vencimiento: this.card.fecha_vencimiento,
      id_asignado: this.card.id_asignado
    });

    this.cardUpdated.emit(this.card);

    this.taskService.updateCard(this.card).subscribe({
      next: (updatedCard) => {
        console.log('✅ Tarjeta actualizada correctamente en BD:', updatedCard);
      },
      error: (e) => {
        console.error('❌ Error actualizando tarjeta en BD:', e);
        alert('No se pudo guardar los cambios. Por favor, intenta nuevamente.');
      }
    });
  }
  hasChecklist(): boolean {
    return this.card.descripcion?.includes('[ ]') ||
      this.card.descripcion?.includes('[x]') ||
      false;
  }
  getChecklistItems(): Array<{ text: string, checked: boolean, lineIndex: number }> {
    if (!this.card.descripcion) {
      console.log('⚠️ No hay descripción');
      return [];
    }

    const lines = this.card.descripcion.split('\n');
    const items: Array<{ text: string, checked: boolean, lineIndex: number }> = [];

    lines.forEach((line, index) => {
      // Buscar [ ] (sin marcar) - case insensitive
      const uncheckedMatch = line.match(/^\[ \]\s*(.+)$/i);
      // Buscar [x] (marcado) - case insensitive
      const checkedMatch = line.match(/^\[x\]\s*(.+)$/i);

      if (uncheckedMatch) {
        items.push({
          text: uncheckedMatch[1].trim(),
          checked: false,
          lineIndex: index
        });
        console.log(`📋 Item sin marcar encontrado: "${uncheckedMatch[1].trim()}" en línea ${index}`);
      } else if (checkedMatch) {
        items.push({
          text: checkedMatch[1].trim(),
          checked: true,
          lineIndex: index
        });
        console.log(`✅ Item marcado encontrado: "${checkedMatch[1].trim()}" en línea ${index}`);
      }
    });

    console.log(`📊 Total items encontrados: ${items.length}`);
    return items;
  }



  toggleChecklistItem(index: number, event?: Event) {
    console.log('🔄 toggleChecklistItem llamado:', { index, event });

    // Prevenir propagación
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const items = this.getChecklistItems();
    console.log('📋 Items del checklist:', items);

    if (index < 0 || index >= items.length) {
      console.error('❌ Índice fuera de rango');
      return;
    }

    const item = items[index];
    console.log('📝 Item a modificar:', item);

    if (!this.card.descripcion) {
      console.error('❌ No hay descripción');
      return;
    }

    const lines = this.card.descripcion.split('\n');
    const lineIndex = item.lineIndex;
    const currentLine = lines[lineIndex];

    console.log('📄 Línea actual:', currentLine);

    // Alternar el estado
    if (item.checked) {
      // Desmarcar: [x] → [ ]
      lines[lineIndex] = currentLine.replace(/^\[x\]/i, '[ ]');
      console.log('✅ Desmarcando...');
    } else {
      // Marcar: [ ] → [x]
      lines[lineIndex] = currentLine.replace(/^\[ \]/i, '[x]');
      console.log('✅ Marcando...');
    }

    console.log('📄 Nueva línea:', lines[lineIndex]);

    // Actualizar la descripción
    this.card.descripcion = lines.join('\n');

    console.log('💾 Guardando cambios...');

    // Forzar detección de cambios
    this.saveCard();
  }


  deleteCard() {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      this.cardDeleted.emit(this.card.id);
      this.close();
    }
  }

  getUserInitial(): string {
    const name = this.card.asignado_a || 'U';
    return name.charAt(0).toUpperCase();
  }

  getCommentInitial(usuario?: string): string {
    if (!usuario) return 'U';
    return usuario.charAt(0).toUpperCase();
  }

  formatCommentTime(date?: string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();

    const diffInSeconds = Math.floor(diffInMs / 1000);
    if (diffInSeconds < 60) {
      if (diffInSeconds < 5) return 'hace un momento';
      return `hace ${diffInSeconds} segundos`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      if (diffInMinutes === 1) return 'hace 1 minuto';
      return `hace ${diffInMinutes} minutos`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      if (diffInHours === 1) return 'hace 1 hora';
      return `hace ${diffInHours} horas`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'hace 1 día';
    return `hace ${diffInDays} días`;
  }

  formatFullDate(date?: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatFileDate(date?: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }

  // ✅ Verificar si el usuario asignado está fijo
  isAssigneeFixed(): boolean {
    return !!this.card.id_asignado;
  }
  applyFormat(command: string) {
    document.execCommand(command, false, undefined);

    // Forzar LTR sin mover cursor
    const editor = document.querySelector('.rich-text-editor') as HTMLElement;
    if (editor) {
      this.forceLTRWithoutMovingCursor(editor);
    }
  }
  onDescriptionKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      const textarea = this.descTextarea?.nativeElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const before = textarea.value.substring(0, start);
      const after = textarea.value.substring(start);

      const lastLineStart = before.lastIndexOf('\n') + 1;
      const currentLine = before.substring(lastLineStart);

      // Detectar viñetas normales
      const bulletMatch = currentLine.match(/^([•■→]) /);

      // Detectar checkboxes
      const checkboxMatch = currentLine.match(/^(\[ \]|\[x\]) /);

      if (bulletMatch) {
        const bullet = bulletMatch[1];

        if (currentLine.trim() === bullet) {
          event.preventDefault();
          this.card.descripcion = before.substring(0, lastLineStart) + after;

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lastLineStart, lastLineStart);
          }, 0);
          return;
        }

        event.preventDefault();
        this.card.descripcion = before + '\n' + bullet + ' ' + after;

        setTimeout(() => {
          textarea.focus();
          const newPosition = start + 1 + bullet.length + 1;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      } else if (checkboxMatch) {
        const checkbox = checkboxMatch[1];

        if (currentLine.trim() === checkbox) {
          event.preventDefault();
          this.card.descripcion = before.substring(0, lastLineStart) + after;

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lastLineStart, lastLineStart);
          }, 0);
          return;
        }

        event.preventDefault();
        this.card.descripcion = before + '\n[ ] ' + after;

        setTimeout(() => {
          textarea.focus();
          const newPosition = start + 1 + 4;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    }
  }
  onDescriptionInput(event: any) {
    const editor = event.target as HTMLElement;

    // NO manipular el DOM, solo leer el contenido
    const content = editor.innerHTML;

    // Limitar caracteres
    if (content.length > 50000) {
      alert('⚠️ La descripción no puede superar los 50,000 caracteres');
      return;
    }

    // Solo actualizar el modelo
    this.card.descripcion = content;
  }
  private forceLTRWithoutMovingCursor(editor: HTMLElement) {
    // Forzar en el editor principal SIN tocar el DOM
    if (editor.style.direction !== 'ltr') {
      editor.style.setProperty('direction', 'ltr', 'important');
    }
    if (editor.style.textAlign !== 'left') {
      editor.style.setProperty('text-align', 'left', 'important');
    }
    if (editor.style.unicodeBidi !== 'embed') {
      editor.style.setProperty('unicode-bidi', 'embed', 'important');
    }
    if (editor.getAttribute('dir') !== 'ltr') {
      editor.setAttribute('dir', 'ltr');
    }
  }
  private setCursorPosition(element: HTMLElement, position: number) {
    const selection = window.getSelection();
    const range = document.createRange();

    let currentPos = 0;
    let found = false;

    const walk = (node: Node) => {
      if (found) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (currentPos + textLength >= position) {
          range.setStart(node, position - currentPos);
          range.setEnd(node, position - currentPos);
          found = true;
          return;
        }
        currentPos += textLength;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
          if (found) return;
        }
      }
    };

    walk(element);

    if (found && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  onEditorFocus(event: any) {
    //const editor = event.target as HTMLElement;
    //this.forceLTRWithoutMovingCursor(editor);
  }

  onKeyDown(event: KeyboardEvent) {
    // NO hacer nada especial, dejar que el navegador maneje todo naturalmente
    // Solo verificar el límite de caracteres
    const editor = event.target as HTMLElement;

    setTimeout(() => {
      const content = editor.innerHTML;
      if (content.length > 50000) {
        alert('⚠️ Límite de caracteres alcanzado');
        event.preventDefault();
      }
    }, 0);
  }


  /**
 * Capturar cambios del editor
 */

  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    const text = event.clipboardData?.getData('text/plain') || '';

    // Insertar como texto plano (sin HTML)
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));

      // Mover cursor al final del texto insertado
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const editor = event.target as HTMLElement;
    this.card.descripcion = editor.textContent || '';
  }
  cleanHTML(html: string): string {
    if (!html) return '';

    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Forzar LTR en el contenedor temporal
    temp.style.direction = 'ltr';
    temp.setAttribute('dir', 'ltr');

    // Eliminar etiquetas no permitidas
    const allowedTags = ['B', 'STRONG', 'U', 'BR', 'DIV', 'P', 'SPAN'];
    this.removeUnallowedTags(temp, allowedTags);

    // Forzar LTR en todos los elementos resultantes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach((el: Element) => {
      el.setAttribute('dir', 'ltr');
    });

    return temp.innerHTML;
  }
  private removeUnallowedTags(element: HTMLElement, allowedTags: string[]) {
    Array.from(element.children).forEach((child: Element) => {
      if (!allowedTags.includes(child.tagName)) {
        // Reemplazar la etiqueta por su contenido de texto
        const text = document.createTextNode(child.textContent || '');
        child.replaceWith(text);
      } else {
        this.removeUnallowedTags(child as HTMLElement, allowedTags);
      }
    });
  }


  onBeforeInput(event: any) {
    // Interceptar ANTES de que se modifique el contenido
    const editor = event.target as HTMLElement;

    // Si es un salto de línea, asegurarnos que sea LTR
    if (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak') {
      // Dejar que el navegador lo maneje naturalmente
      setTimeout(() => {
        // Después de que se inserte, verificar que mantenga LTR
        const allDivs = editor.querySelectorAll('div, p');
        allDivs.forEach(el => {
          if (!el.hasAttribute('dir')) {
            el.setAttribute('dir', 'ltr');
          }
        });
      }, 0);
    }
  }
  // ✅ Abrir editor
  toggleDescriptionEdit() {
    this.originalDescription = this.card.descripcion || '';
    this.editingDescription = true;

    setTimeout(() => {
      const textarea = this.descTextarea?.nativeElement;
      if (textarea) {
        textarea.focus();
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }
    }, 100);
  }

  // ✅ Insertar marcadores de formato
  insertMarkdown(marker: string) {
    const textarea = this.descTextarea?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    if (selectedText) {
      // Si hay texto seleccionado, envolverlo
      this.card.descripcion = before + marker + selectedText + marker + after;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + marker.length, end + marker.length);
      }, 0);
    } else {
      // Si no hay selección, insertar placeholder
      this.card.descripcion = before + marker + 'texto' + marker + after;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + marker.length, start + marker.length + 5);
      }, 0);
    }
  }
  selectBullet(symbol: string, type: 'bullet' | 'checkbox' = 'bullet') {
    this.selectedBullet = symbol;
    this.selectedBulletType = type;
    this.showBulletMenu = false;
    this.insertList();
  }

  insertList() {
    const textarea = this.descTextarea?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    const lastNewline = before.lastIndexOf('\n');
    const isStartOfLine = lastNewline === before.length - 1 || before === '';
    const needsNewline = isStartOfLine ? '' : '\n';

    if (selectedText) {
      const lines = selectedText.split('\n');
      const bulletedText = lines
        .filter(line => line.trim())
        .map(line => `${this.selectedBullet} ${line.trim()}`)
        .join('\n');

      this.card.descripcion = before + needsNewline + bulletedText + after;

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + needsNewline.length + bulletedText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      this.card.descripcion = before + needsNewline + this.selectedBullet + ' ' + after;

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + needsNewline.length + this.selectedBullet.length + 1;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }

  onTab(event: Event) {
    event.preventDefault();
    const textarea = this.descTextarea?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(start);

    this.card.descripcion = before + '  ' + after;

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2);
    }, 0);
  }


  getFormattedDescription(): string {
    if (!this.card.descripcion?.trim()) {
      return '<span class="text-gray-400">Haz clic para agregar descripción</span>';
    }

    let formatted = this.card.descripcion
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<u>$1</u>')
      // ✅ Convertir viñetas normales en <li>
      .replace(/^([•■→]) (.+)$/gm, '<li data-bullet="$1">$2</li>')
      // ✅ OCULTAR las líneas de checkbox (no mostrarlas como texto)
      .replace(/^\[ \] .+$/gm, '')
      .replace(/^\[x\] .+$/gm, '')
      .replace(/\n/g, '<br>');

    // Limpiar múltiples <br> seguidos que quedan al eliminar los checkboxes
    formatted = formatted.replace(/(<br>){2,}/g, '<br>');

    // Envolver <li> consecutivos en <ul>
    formatted = formatted.replace(/(<li[^>]*>.*?<\/li>(<br>)?)+/g, (match) => {
      return '<ul style="list-style: none; padding-left: 1.5rem; margin: 0.5rem 0;">' +
        match.replace(/<br>/g, '').replace(/<li data-bullet="([^"]+)">(.*?)<\/li>/g,
          '<li style="position: relative; padding-left: 0.5rem;"><span style="position: absolute; left: -1.5rem;">$1</span>$2</li>') +
        '</ul>';
    });

    return formatted;
  }

  saveDescription() {
    this.editingDescription = false;
    this.saveCard();
  }


  cancelDescriptionEdit() {
    this.card.descripcion = this.originalDescription;
    this.editingDescription = false;
  }


  getDescriptionLength(): number {
    return this.card.descripcion?.length || 0;
  }


  getCheckedItemsCount(): number {
    return this.getChecklistItems().filter(item => item.checked).length;
  }

  getChecklistProgress(): number {
    const items = this.getChecklistItems();
    if (items.length === 0) return 0;
    return (this.getCheckedItemsCount() / items.length) * 100;
  }

}




