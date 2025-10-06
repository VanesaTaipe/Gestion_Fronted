import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { from } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { Board, Column } from '../../models/board.model';
import { BoardService } from '../../services/board.service';
import { ColumnComponent } from '../column/column.component';
import { HeaderComponent } from '../header/header.component';
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, ColumnComponent, HeaderComponent, CdkDropList, CdkDrag, ReactiveFormsModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
})
export class BoardComponent {
  board?: Board;
  dropListIds: string[] = [];
  private snapshotCols: Column[] = [];
  private location=inject(Location) ;
  private route=inject(ActivatedRoute)
   projectId?: number;
  workspaceId?: number;
  

  // ===== modal para crear columna =====
  colModalOpen = false;
  colForm!: FormGroup;
  colorPalette = [
    'bg-teal-200','bg-blue-200','bg-amber-200','bg-lime-200','bg-rose-200',
    'bg-cyan-200','bg-purple-200','bg-orange-200','bg-emerald-200','bg-pink-200'
  ];

  constructor(private boardService: BoardService, private fb: FormBuilder,
    private cdr:ChangeDetectorRef,
    private router:Router) {
    this.colForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      color: [this.colorPalette[0], Validators.required],
    });
  }

  ngOnInit() {
    // Obtener IDs de la ruta
    this.route.params.subscribe(params => {
      this.projectId = +params['projectId'];
      this.workspaceId = +params['workspaceId'];
      
      console.log('📋 Cargando tablero para proyecto:', this.projectId);
      this.route.queryParams.subscribe(params => {
      const projectName = params['projectName'];
      console.log('📋 Proyecto:', projectName);
    })
      this.loadBoard();
    });
  }

  private loadBoard() {
  if (!this.projectId) {
    console.error('No hay projectId');
    return;
  }

  console.log('🔍 Intentando cargar board para proyecto:', this.projectId);

  this.boardService.getBoard(this.projectId).subscribe({
    next: (data) => {
      console.log('📊 Datos recibidos del board:', data);
      this.board = data;
      
      if (!this.board.columns || this.board.columns.length === 0) {
        console.log('🆕 Sin columnas, creando por defecto...');
        this.createDefaultColumns();
      } else {
        console.log('✅ Board tiene columnas:', this.board.columns.length);
        this.board.columns
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .forEach((c, i) => (c.order = i + 1));
        this.dropListIds = this.board.columns.map(c => 'col-' + c.id);
      }
    },
    error: (e) => {
      console.error('❌ Error completo:', e);
      console.log('Status:', e.status);
      console.log('Message:', e.message);
      
      if (e.status === 404) {
        console.log('🆕 Proyecto no existe en board, creando...');
        this.createBoardWithDefaultColumns();
      }
    }
  });
}

  private createDefaultColumns() {
  if (!this.board) {
    console.error('❌ No hay board');
    return;
  }

  console.log('🔧 Creando columnas para board:', this.board.id);
  this.board.columns = [];

  const defaultColumns = [
    { title: 'Backlog', color: 'bg-teal-200' },
    { title: 'Por Hacer', color: 'bg-blue-200' },
    { title: 'En Desarrollo', color: 'bg-amber-200' },
    { title: 'Hecho', color: 'bg-lime-200' }
  ];

  from(defaultColumns).pipe(
    concatMap((col, index) => {
      console.log(`📝 Creando columna ${index + 1}:`, col.title);
      return this.boardService.createColumn(this.board!.id, col.title, index + 1).pipe(
        map((response: any) => {
          console.log('📦 Respuesta backend:', response);
          
          const newCol: Column = {
            id: response.id || response.id_columna || response.data?.id_columna,
            title: response.title || response.nombre || response.data?.nombre || col.title,
            color: col.color,
            order: response.order || response.posicion || response.data?.posicion || (index + 1),
            cards: []
          };
          
          console.log('✅ Columna mapeada:', newCol);
          return newCol;
        })
      );
    })
  ).subscribe({
    next: (newCol: Column) => {
      console.log('➕ Agregando columna:', newCol.title);
      
      // ✅ AGREGAR directamente al board
      this.board!.columns = [...this.board!.columns, newCol];
      this.dropListIds = this.board!.columns.map(x => 'col-' + x.id);
      this.cdr.detectChanges();
      
      console.log('📊 Total columnas:', this.board!.columns.length);
    },
    complete: () => {
      console.log('✅ PROCESO COMPLETO');
      console.log('🎯 Columnas finales:', this.board!.columns);
      this.cdr.detectChanges();
    },
    error: (e) => {
      console.error('❌ Error:', e);
    }
  });
}
  private createBoardWithDefaultColumns() {
  this.route.queryParams.subscribe(params => {
    const projectName = params['projectName'] || `Proyecto ${this.projectId}`;
    
    this.boardService.createBoard(this.projectId!, projectName).subscribe({
      next: (newBoard) => {
        this.board = newBoard;
        this.board.columns=[]
        this.createDefaultColumns();
      },
      error: () => {
        this.board = this.defaultBoard();
        this.board = {
        id: this.projectId || 1,
        name: projectName,
        columns: [] 
      };
      this.createDefaultColumns();
      }
    });
  });
}

  private defaultBoard(): Board {
    return {
      id: this.projectId || 1,
      name: `Tablero Proyecto ${this.projectId}`,
      columns: []
    };
  }

  // ===== DnD columnas =====
  dropColumn(event: CdkDragDrop<Column[]>) {
    if (!this.board?.columns) return;

    this.snapshotCols = this.board.columns.map(c => ({ ...c })); // rollback snapshot

    const arr = [...event.container.data];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);

    arr.forEach((c, i) => (c.order = i + 1));
    this.board.columns = arr; // optimistic UI

    from(arr)
      .pipe(concatMap(c => this.boardService.updateColumnPosition(c.id, c.order!)))
      .subscribe({
        next: () => {},
        error: () => { this.board!.columns = this.snapshotCols; } // rollback
      });
  }

  trackByColId = (_: number, c: Column) => c.id;

  persistReorder() {
    // hook opcional para futuras persistencias
  }

  // ===== modal: nueva columna =====
  openAddColumn() {
    this.colForm.reset({ nombre: '', color: this.colorPalette[0] });
    this.colModalOpen = true;
  }
  closeAddColumn() { this.colModalOpen = false; }

  // crear columna
  submitAddColumn() {
    if (!this.board) return;
    if (this.colForm.invalid) { this.colForm.markAllAsTouched(); return; }

    const nombre = (this.colForm.value.nombre as string).trim();
    const color  = this.colForm.value.color as string;
    const nextPos = (this.board.columns?.length ?? 0) + 1;

    this.boardService.createColumn(this.board.id, nombre, nextPos).subscribe({
      next: (newCol) => {
        // aplicar color elegido (solo visual)
        newCol.color = color;
        this.board!.columns.push(newCol);
        this.dropListIds = this.board!.columns.map(x => 'col-' + x.id);
        this.closeAddColumn();
      },
      error: (e) => {
        alert(e?.error?.error ?? 'No se pudo crear la columna');
      }
    });
  }

  // ===== eliminar columna =====
  onDeleteColumn(col: Column) {
    if (!this.board) return;
    if (!confirm(`¿Eliminar la columna "${col.title}"?`)) return;

    this.boardService.deleteColumn(col.id).subscribe({
      next: () => {
        this.board!.columns = this.board!.columns
          .filter(c => c.id !== col.id)
          .map((c, i) => ({ ...c, order: i + 1 }));
        this.dropListIds = this.board!.columns.map(x => 'col-' + x.id);

        from(this.board!.columns)
          .pipe(concatMap(c => this.boardService.updateColumnPosition(c.id, c.order!)))
          .subscribe();
      },
      error: (e) => alert(e?.error?.error ?? 'No se pudo eliminar la columna')
    });
  }

  goBackToWorkspace(): void {
  if (this.workspaceId) {
    // Navegar al detalle del workspace (donde están los proyectos)
    this.router.navigate(['/workspace', this.workspaceId]);
  } else {
    // Fallback: volver atrás en el historial
    this.location.back();
  }
}

}
