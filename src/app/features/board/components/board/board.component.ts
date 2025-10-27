import { 
  CdkDragDrop, 
  moveItemInArray,
  DragDropModule 
} from '@angular/cdk/drag-drop';
import {  DestroyRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, from, Observable, of } from 'rxjs';
import { catchError, concatMap, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { Board, Card, Column } from '../../models/board.model';
import { BoardService } from '../../services/board.service';
import { ProjectPermissionService } from '../../services/project-permission.service';
import { UserService as AuthService } from '../../../../core/auth/services/use.service';
import { ColumnComponent } from '../column/column.component';
import { HeaderComponent } from '../header/header.component';
import { CardDetailModalComponent } from '../card/card-detail.component';
import { BoardSettingsComponent } from '../board/settings/board-settings.component';
import { BoardDashboardComponent } from '../board/dashboard/dashboard.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule, 
    ColumnComponent, 
    HeaderComponent,  
    ReactiveFormsModule,
    CardDetailModalComponent,
    DragDropModule,
    BoardDashboardComponent,
    BoardSettingsComponent,
   
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent {
  board?: Board;
  columns: Column[] = []; 
  allColumns: Column[] = [];
  columnIds: string[] = []; 
  proyectoId: number = 0;
  proyectoNombre: string = ''; 
  private authService = inject(AuthService);
private destroyRef = inject(DestroyRef);
currentUserId = 0;
currentUserName = '';
  selectedCard: Card | null = null;
  selectedColumnName: string = '';
  showCardDetail = false;
  colModalOpen = false;
  editMode = false;
  editingColumn?: Column;
  colForm!: FormGroup;
  colorPalette = [
     '#72DED3', '#48B2FF', '#FFC27C','#F6EC7D', '#FB89D9',
      '#7BFAAA', '#CF8AD5', '#F58686', '#A4A4A4', '#AAAAFF'
  ];

  isLeader = false;
  isMember = false;
  userRole: 'lider' | 'miembro' | null = null;
  activeView: 'board' | 'dashboard' | 'settings' = 'board';
  projectDescription: string = '';
  projectMembers: any[] = [];

  private location = inject(Location);
  private route = inject(ActivatedRoute);
  workspaceId?: number;
  
  

  constructor(
    private boardService: BoardService, 
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient,
    private permissionService: ProjectPermissionService,
    private taskService: TaskService,
  ) {
    this.colForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      color: [this.colorPalette[0], Validators.required],
      tipo_columna: ['normal', Validators.required], //añadi al form el tipo de columna 
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.proyectoId = +params['projectId']; 
      this.workspaceId = +params['workspaceId'];
    
      
      console.log('Cargando tablero para proyecto:', this.proyectoId);
      this.loadUserPermissions();
    });

    this.route.queryParams.subscribe(params => {
      if (params['projectName']) {
        this.proyectoNombre = params['projectName'];
      }
    });
    this.authService.currentUser
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(user => {
      if (user) {
        this.currentUserName = user.username || 'Usuario';
        this.currentUserId = user.id_usuario;
      }
    });
  }

  private loadUserPermissions() {
    const currentUserId = this.authService.getCurrentUserId();
    
    if (!currentUserId) {
      console.error('Usuario no autenticado');
      this.router.navigate(['/login']);
      return;
    }

    this.permissionService.getUserRoleInProject(this.proyectoId, currentUserId).subscribe({
      next: (role) => {
        this.userRole = role;
        this.isLeader = this.permissionService.isLeader();
        this.isMember = this.permissionService.isMember();
        
        console.log('Permisos cargados:', { role, isLeader: this.isLeader, isMember: this.isMember });
        this.loadBoard();
      },
      error: (e) => {
        console.error('Error cargando permisos:', e);
        alert('No tienes acceso a este proyecto');
        this.router.navigate(['/workspace', this.workspaceId]);
      }
    });
  }

  private loadBoard() {
    if (!this.proyectoId) {
      console.error('No hay projectId');
      return;
    }

    console.log('Cargando datos del proyecto ID:', this.proyectoId);

    this.http.get<any>(`${environment.apiBase}/proyectos/${this.proyectoId}`).subscribe({
      next: (resProyecto) => {
        console.log('Respuesta RAW del backend:', resProyecto);
        const proyecto = resProyecto?.proyecto;
        
        if (!proyecto) {
          console.error('No se encontró el objeto "proyecto" en la respuesta');
          this.proyectoNombre = `Proyecto ${this.proyectoId}`;
        } else {
          this.proyectoNombre = proyecto.nombre || proyecto.name || `Proyecto ${this.proyectoId}`;
          this.projectDescription = proyecto.descripcion || proyecto.description || '';
          
          console.log('Nombre del proyecto:', this.proyectoNombre);
          console.log('Descripción:', this.projectDescription);
        }
        

        this.loadColumns();
      },
      error: (e) => {
        console.error('Error cargando proyecto:', e);
  
        if (!this.proyectoNombre) {
          this.proyectoNombre = `Proyecto ${this.proyectoId}`;
        }
        
        this.loadColumns();
      }
    });
  }

  private loadColumns() {
    this.http.get<any>(`${environment.apiBase}/proyectos/${this.proyectoId}/columnas`).subscribe({
      next: (resColumnas) => {
        const todasLasColumnas = resColumnas?.columnas?.data || resColumnas?.columnas || resColumnas?.data || [];
        
         this.allColumns = todasLasColumnas.map((c: any, index: number) => {
          const posIndex = index % this.colorPalette.length;
          const colorFinal = this.colorPalette[posIndex];

          console.log(`Columna ${c.nombre}:`, {
            posicion: c.posicion,
            color_bd: c.color,
            color_asignado: colorFinal
          });
          
          return {
            id: c.id_columna ?? c.id,
            nombre: c.nombre,
            color: colorFinal, 
            status: c.status,
            posicion: c.posicion,
            tipo_columna: c.tipo_columna || 'normal',
            cards: []
          };
        });
        
        console.log('Columnas cargadas con colores:', this.allColumns);
        this.loadBoardData();
      },
      error: (e) => {
        console.error('Error cargando columnas:', e);
        this.allColumns = [];
        this.loadBoardData();
      }
    });
  }

  private loadBoardData() {
 
    const columnasActivas = this.allColumns.filter(col => String(col.status) === '0');
    columnasActivas.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0));

    this.columns = columnasActivas.map(col => ({
      ...col,
      cards: []
    }));
    
    console.log('Columnas activas:', this.columns);
    
    if (this.columns.length === 0) {
      console.log('Sin columnas, creando por defecto...');
      this.createDefaultColumns();
      return;
    }
    
    this.loadTasksFromResumen();
  }

  private loadTasksFromResumen() {
    this.http.get<any>(`${environment.apiBase}/proyectos/${this.proyectoId}/tareas/resumen`).subscribe({
      next: (resumen) => {
        resumen.forEach((columnaResumen: any) => {
          const columna = this.columns.find(c => c.id === columnaResumen.id_columna);
          if (!columna) return;
          
          columna.cards = columnaResumen.tareas.map((tarea: any) => ({
            id: tarea.id_tarea,
            id_columna: columnaResumen.id_columna,
            title: tarea.titulo,
            prioridad: this.normalizePriority(tarea.prioridad),
            comentarios_count: tarea.comentarios_count,
            position: tarea.position,
            fecha_vencimiento: tarea.ultima_actualizacion,
            id_asignado: tarea.id_asignado,                
            asignado_a: tarea.asignado?.nombre || 'Sin asignar', 
            descripcion: '',
            comentarios: [],
            archivos: []
          }));
        });
        
        this.board = {
          id: this.proyectoId,
          nombre: this.proyectoNombre,
          columns: this.columns
        };
        
        this.columnIds = this.columns.map(c => 'col-' + c.id);
      
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Error cargando tareas:', e);
        
        this.board = {
          id: this.proyectoId,
          nombre: this.proyectoNombre,
          columns: this.columns
        };
        
        this.cdr.detectChanges();
      }
    });
  }

  private normalizePriority(prioridad: string): 'baja' | 'media' | 'alta' | 'No asignada' {
    const p = prioridad?.toLowerCase();
    if (p === 'alta' || p === 'media' || p === 'baja') {
      return p as 'baja' | 'media' | 'alta';
    }
    return 'No asignada';
  }

private createDefaultColumns() {
  if (!this.proyectoId) return;

  const defaultColumns = [
    { title: 'Backlog', color: this.colorPalette[0], position: 1 },
    { title: 'Por Hacer', color: this.colorPalette[1], position: 2 },
    { title: 'En Desarrollo', color: this.colorPalette[2], position: 3 },
    { title: 'Hecho', color: this.colorPalette[4], position: 4 }
  ];


  from(defaultColumns).pipe(
    concatMap((col) => {
      console.log(`Creando: ${col.title} - Color: ${col.color}`);
      
      return this.boardService.createColumn(this.proyectoId!, col.title, col.position, col.color).pipe(
        catchError((err) => {
          console.error(`Error creando ${col.title}:`, err);
          return of(null);
        })
      );
    })
  ).subscribe({
    complete: () => {
      console.log('Columnas creadas. Recargando...');

      this.loadBoard();
    }
  });
}

  dropColumn(event: CdkDragDrop<Column[]>) {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    if (this.board) this.board.columns = [...this.columns];
    this.updateColumnPositions;
  }
  getCurrentUserName(): string {
  return this.currentUserName;
}

 updateColumnPositions() {
  const updates = this.columns.map((col, index) => {
    const nuevaPosicion = index + 1;
    return this.boardService.updateColumnPosition(col.id, nuevaPosicion).pipe(
      catchError(err => {
        console.error(`Error actualizando columna ${col.id}:`, err);
        return of(null);
      })
    );
  });

  forkJoin(updates).subscribe({
    next: () => console.log('Posiciones actualizadas en backend'),
    error: (e) => console.error('Error general al actualizar posiciones:', e)
  });
}


  trackByColumnId = (_: number, column: Column) => column.id;

  onCardsChanged() {
    console.log('Tarjetas actualizadas');
  }

  openCardDetail(card: Card) {
  if (!card?.id) return;

  // 🔹 Llama al backend para traer todos los datos (incluido due_at)
  this.taskService.getTaskById(card.id).subscribe({
    next: (tareaCompleta: any) => {
      // Combina datos antiguos con los nuevos del backend
      this.selectedCard = {
        ...card,
        ...tareaCompleta,
        due_at: tareaCompleta.due_at || card.due_at || null
      };
      this.selectedColumnName = this.columns.find(c => c.id === card.id_columna)?.nombre || '';
      this.showCardDetail = true;
      console.log('Tarea completa cargada:', this.selectedCard);
    },
  });
}

  closeCardDetail() {
    this.showCardDetail = false;
    this.selectedCard = null;
    this.selectedColumnName = '';
  }

  onCardUpdated(updatedCard: Card) {
    if (!this.columns) return;
    for (const col of this.columns) {
      const cardIndex = col.cards.findIndex(c => c.id === updatedCard.id);
      if (cardIndex !== -1) {
        col.cards[cardIndex] = { ...updatedCard };
        break;
      }
    }
  }

  onCardDeleted(cardId: number) {
    if (!this.columns) return;
    for (const col of this.columns) {
      const cardIndex = col.cards.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        col.cards.splice(cardIndex, 1);
        break;
      }
    }
    this.closeCardDetail();
  }
  
  openAddColumn() {
    if (!this.isLeader) {
      alert('Solo el líder puede crear columnas');
      return;
    }
    this.editMode = false;
    this.editingColumn = undefined;
    this.colForm.reset({ nombre: '', color: this.colorPalette[0] , tipo_columna: 'normal'});
    this.colModalOpen = true;
  }

  submitAddColumn() {
    if (!this.board || this.colForm.invalid) {
      this.colForm.markAllAsTouched();
      return;
    }

    const nombre = (this.colForm.value.nombre as string).trim();
    const color = this.colForm.value.color as string; 
    const tipo_columna = this.colForm.value.tipo_columna as 'normal' | 'fija';

    console.log('Datos:', { nombre, color });
    
    if (this.editMode && this.editingColumn) {
      const tipo_columna = this.colForm.value.tipo_columna;
      const idColumna = this.editingColumn.id;


      if (tipo_columna !== this.editingColumn.tipo_columna) { //Nuevo BoardService
        this.boardService.updateColumnType(this.proyectoId, idColumna, tipo_columna).subscribe({
          next: () => {
            console.log('✅ Tipo de columna actualizado correctamente');

            if (this.editingColumn) {
              this.editingColumn.tipo_columna = tipo_columna;
            }

            const colIndex = this.columns.findIndex(c => c.id === idColumna);
            if (colIndex !== -1) {
              this.columns[colIndex].tipo_columna = tipo_columna;
            }

            this.cdr.detectChanges();
            alert('Tipo de columna actualizado correctamente ✅');
          },
          error: (e) => {
            console.error('❌ Error actualizando tipo_columna:', e);
            // Actualizado
            if (this.editingColumn) {
              this.editingColumn.tipo_columna = this.editingColumn.tipo_columna; // no lo cambia
            }

            alert(e?.error?.error || 'No se pudo actualizar el tipo de columna');
            this.loadColumns();
          },
        });
      }

      this.boardService.updateColumn(this.editingColumn.id, { nombre, color}).subscribe({
        next: () => {
      
          const colIndex = this.columns.findIndex(c => c.id === this.editingColumn!.id);
          if (colIndex !== -1) {
            this.columns[colIndex].nombre = nombre;
            this.columns[colIndex].color = color;
            this.columns[colIndex].tipo_columna = tipo_columna; //Actualizado
          }
          
   
          const allColIndex = this.allColumns.findIndex(c => c.id === this.editingColumn!.id);
          if (allColIndex !== -1) {
            this.allColumns[allColIndex].nombre = nombre;
            this.allColumns[allColIndex].color = color; 
            this.allColumns[allColIndex].tipo_columna = tipo_columna; //Actualizado
          }
          
          console.log('Columna actualizada');
          this.cdr.detectChanges();
          this.closeAddColumn();
        },
        error: (e) => {
          console.error('Error actualizando columna:', e);
          alert(e?.error?.error ?? 'No se pudo actualizar');
        }
      });
    } else {

      let nextPos = 1;
      
      if (this.columns && this.columns.length > 0) {
        const posiciones = this.columns.map(col => col.posicion || col.order || 0);
        const maxPos = Math.max(...posiciones);
        nextPos = maxPos + 1;
      }
      
      console.log('Creando columna - Pos:', nextPos, 'Color:', color);
      
      this.boardService.createColumn(this.board.id, nombre, nextPos, color, tipo_columna).subscribe({
        next: (newCol) => {
          console.log('Columna creada:', newCol);
          const columnaConColor = {
            ...newCol,
            color: color, 
            cards: []
          };
          
          this.columns.push(columnaConColor);
          this.board!.columns = [...this.columns];
          this.columnIds = this.columns.map(x => 'col-' + x.id);
          
          this.allColumns.push({
            id: newCol.id,
            nombre: newCol.nombre,
            color: color, 
            status: '0',
            posicion: newCol.posicion,
            cards: []
          });
          
          this.cdr.detectChanges();
          this.closeAddColumn();
        },
        error: (e) => {
          console.error('Error creando columna:', e);
          alert(e?.error?.error || 'No se pudo crear');
        }
      });
    }
  }

  onEditColumn(column: Column) {
    if (!this.isLeader) {
      alert('Solo el líder puede editar columnas');
      return;
    }
    this.editMode = true;
    this.editingColumn = column;
    this.colForm.reset({ nombre: column.nombre, color: column.color || this.colorPalette[0], tipo_columna: column.tipo_columna || 'normal' });
    this.colModalOpen = true;
  }

  onDeleteColumn(col: Column) {
    if (!this.board) return;
    if (!this.isLeader) {
      alert('Solo el líder puede eliminar columnas');
      return;
    }
    if (this.columns.length <= 1) {
      alert('No se puede eliminar la última columna');
      return;
    }
    if (col.cards && col.cards.length > 0) {
      alert(`La columna tiene ${col.cards.length} tarjeta(s). Muévelas primero.`);
      return;
    }
    if (!confirm(`¿Eliminar "${col.nombre}"?`)) return;

    this.boardService.deleteColumn(col.id).subscribe({
      next: () => {
        this.columns = this.columns.filter(c => c.id !== col.id);
        this.board!.columns = [...this.columns];
        this.columnIds = this.columns.map(x => 'col-' + x.id);
      },
      error: (e) => alert(e?.error?.error ?? 'No se pudo eliminar')
    });
  }

  closeAddColumn() { 
    this.colModalOpen = false;
    this.editMode = false;
    this.editingColumn = undefined;
  }

  isDuplicateColumnName(nombre: string): boolean {
    if (!nombre || typeof nombre !== 'string') return false;
    const nombreNormalizado = nombre.trim().toLowerCase();
    if (!nombreNormalizado) return false;
    const columnasParaValidar = this.allColumns.length > 0 ? this.allColumns : this.columns;

    if (this.editMode && this.editingColumn) {
      return columnasParaValidar.some(col => {
        const status = String(col.status ?? '0');
        return status === '0' && col.id !== this.editingColumn!.id && col.nombre?.toLowerCase() === nombreNormalizado;
      });
    }

    return columnasParaValidar.some(col => {
      const status = String(col.status ?? '0');
      return status === '0' && col.nombre?.toLowerCase() === nombreNormalizado;
    });
  }

  private loadProjectMembers() {
    if (!this.proyectoId) return;
    this.http.get<any>(`${environment.apiBase}/proyectos/${this.proyectoId}/miembros`).subscribe({
      next: (res) => {
        this.projectMembers = res?.miembros || res?.data || [];
        console.log('Miembros cargados:', this.projectMembers);
      },
      error: (e) => {
        console.error('Error cargando miembros:', e);
        this.projectMembers = [];
      }
    });
  }

  deleteProject() {
    if (!this.isLeader) {
      alert('Solo el líder puede eliminar el proyecto');
      return;
    }

    const confirmation = confirm(
      `¿ELIMINAR "${this.proyectoNombre}"?\n\n` +
      `Se eliminará:\n` +
      `• ${this.columns.length} columnas\n` +
      `• Todas las tarjetas\n` +
      `• Todos los comentarios\n\n` +
      `Escribe "ELIMINAR" para confirmar.`
    );

    if (!confirmation) return;

    const confirmText = prompt('Escribe "ELIMINAR":');
    if (confirmText !== 'ELIMINAR') {
      alert('Cancelado');
      return;
    }

    this.http.delete(`${environment.apiBase}/proyectos/${this.proyectoId}`).subscribe({
      next: () => {
        alert('Proyecto eliminado');
        this.router.navigate(['/workspace', this.workspaceId]);
      },
      error: (e) => {
        console.error('Error:', e);
        alert('Error al eliminar');
      }
    });
  }

  setActiveView(view: 'board' | 'dashboard' | 'settings') {
    if (view === 'settings' && !this.isLeader) {
      alert('No tienes permisos para acceder a Configuración');
      return;
    }
    this.activeView = view;
  }

  onProjectDeleted() {
    this.router.navigate(['/workspace', this.workspaceId]);
  }

  goBackToWorkspace(): void {
    if (this.workspaceId) {
      this.router.navigate(['/workspace', this.workspaceId]);
    } else {
      this.location.back();
    }
  }
  
}