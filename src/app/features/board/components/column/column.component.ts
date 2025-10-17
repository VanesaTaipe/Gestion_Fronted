import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule, FormControl } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Column, Card } from '../../models/board.model';
import { TaskService } from '../../services/task.service';
import { CardComponent } from '../card/card.component';
import { CardDetailModalComponent } from '../card/card-detail.component';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, map, Observable, startWith } from 'rxjs';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CdkDropList, CdkDrag, CardComponent, CardDetailModalComponent],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.css']
})
export class ColumnComponent {
  @Input() column!: Column;
  @Input() proyectoId!: number;
  @Input() connectedDropLists: string[] = [];
  
  @Output() cardsChanged = new EventEmitter<void>();
  @Output() editColumn = new EventEmitter<Column>();
  @Output() deleteColumn = new EventEmitter<Column>();

  showModal = false;
  menuOpen = false;
  creating = false;
  form!: FormGroup;
   showCardDetail = false;
  selectedCard: Card | null = null;
  selectedFiles: File[] = [];
  imageUrls: string[] = [];
  imageUrlInput = '';
  previewUrls: string[] = [];
   projectMembers: any[] = [];
  filteredMembers$!: Observable<any[]>;
  searchControl = new FormControl('');
  isSearchingUsers = false;
  selectedMember: any = null;
  private api = environment.apiBase;
  totalComentarios: number = 0;

  constructor(
    private fb: FormBuilder,
    private taskSvc: TaskService,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      descripcion: [''],
      assignee: [''],
       assigneeName: [''],
      fecha_vencimiento: [''],
      prioridad: ['', Validators.required]
    });
  }
  ngOnInit() {
    this.loadProjectMembers();
    this.setupMemberSearch();
  }
  loadProjectMembers() {
    this.http.get(`${this.api}/proyectos/${this.proyectoId}/miembros`)
      .subscribe({
        next: (res: any) => {
          console.log('Miembros del proyecto:', res);
          this.projectMembers = res.miembros || res.data || [];
          if (this.projectMembers.length > 0) {
          this.searchControl.setValue(''); // Trigger para mostrar todos
        }
        },
        error: (err) => {
          console.error('Error cargando miembros:', err);
          this.projectMembers = [];
        }
      });
  }
getUserInitial(card: Card): string {
  const name = card.asignado_a || 'U';
  return name.charAt(0).toUpperCase();
}
getPriorityLabel(priority?: string): string {
  switch(priority) {
    case 'alta': return 'Alta';
    case 'media': return 'Media';
    case 'baja': return 'Baja';
    default: return 'N/A';
  }
}
getCommentCount(card: Card): number {
  return card.comentarios?.length || 0;
}
   setupMemberSearch() {
    this.filteredMembers$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(searchTerm => {
        if (typeof searchTerm !== 'string') {
          return [];
        }
        
        // Filtrar solo usuarios que ya pertenecen al proyecto
        if (!searchTerm) {
          return this.projectMembers.slice(0, 5); 
        }
        
        const filtered = this.projectMembers.filter(member =>
          member.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return filtered.slice(0, 5); // Limitar a 5 resultados
      })
    );
  }
    selectMember(member: any) {
      this.selectedMember = member;
      this.searchControl.setValue(member.nombre);
      this.form.patchValue({
        assignee: member.id_usuario,
        assigneeName: member.nombre
      });
    }

    clearMember() {
      this.selectedMember = null;
      this.searchControl.setValue('');
      this.form.patchValue({
        assignee: '',
        assigneeName: ''
      });
    }
  
  // ===== Menú de tres puntos =====
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative') || target.closest('button')) {
      if (!target.closest('.absolute')) {
        this.menuOpen = false;
      }
    }
  }

  editColumnAction() {
    this.menuOpen = false;
    this.editColumn.emit(this.column);
  }

  deleteColumnAction() {
    this.menuOpen = false;
    this.deleteColumn.emit(this.column);
  }

  // Total de imágenes (archivos + URLs)
  getTotalImages(): number {
    return this.selectedFiles.length + this.imageUrls.length;
  }

  // Agregar URL de imagen
  addImageUrl() {
    const url = this.imageUrlInput.trim();
    if (url && this.getTotalImages() < 3) {
      // Validar que sea una URL válida
      try {
        new URL(url);
        this.imageUrls.push(url);
        this.previewUrls.push(url);
        this.imageUrlInput = '';
      } catch {
        alert('Por favor ingresa una URL válida');
      }
    }
  }

  // Manejar selección de archivos
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      // Limitar a 3 imágenes totales
      const availableSlots = 3 - this.getTotalImages();
      const filesToAdd = files.slice(0, availableSlots);
      
      filesToAdd.forEach(file => {
        // Validar que sea imagen
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} no es una imagen válida`);
          return;
        }
        
        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} es muy grande (máximo 5MB)`);
          return;
        }
        
        this.selectedFiles.push(file);
        
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
      
      // Limpiar el input
      input.value = '';
    }
  }

  removeImage(index: number) {
    // Determinar si es archivo o URL
    if (index < this.selectedFiles.length) {
      // Es un archivo
      this.selectedFiles.splice(index, 1);
    } else {
      // Es una URL
      const urlIndex = index - this.selectedFiles.length;
      this.imageUrls.splice(urlIndex, 1);
    }
    this.previewUrls.splice(index, 1);
  }

  // ===== Drag & Drop de tarjetas =====
  drop(event: CdkDragDrop<Card[]>) {
  // Verificar que estamos arrastrando tarjetas, no columnas
  if (!event.container.data || !Array.isArray(event.container.data)) {
    console.warn('Drop event no contiene datos de tarjetas');
    return;
  }

  const mismaLista = event.previousContainer === event.container;

  if (mismaLista) {
    // ===== MISMA COLUMNA: Solo reordenar =====
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    const items = event.container.data.map((c, i) => ({ id: c.id, position: i + 1 }));
    
    this.taskSvc.reorderCard(this.column.id, items).subscribe({
      next: () => this.cardsChanged.emit(),
      error: (e) => {
        console.error('No se pudo reordenar', e);
        // Revertir el cambio visual
        moveItemInArray(event.container.data, event.currentIndex, event.previousIndex);
      },
    });
  } else {
    // ===== COLUMNA DIFERENTE: Mover y reordenar =====
    const previo = event.previousContainer.data;
    const actual = event.container.data;
    
    // Verificar que ambos arrays existen
    if (!previo || !actual) {
      console.warn('Arrays de tarjetas no válidos');
      return;
    }

    // Guardar estado anterior por si necesitamos revertir
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    // Verificar que los índices son válidos
    if (previousIndex < 0 || currentIndex < 0) {
      console.warn('Índices no válidos');
      return;
    }

    // Mover visualmente primero
    transferArrayItem(previo, actual, previousIndex, currentIndex);

    const movido = actual[currentIndex];
    
    // Verificar que la tarjeta movida existe
    if (!movido || !movido.id) {
      console.error('Tarjeta movida no válida');
      // Revertir
      transferArrayItem(actual, previo, currentIndex, previousIndex);
      return;
    }

    const nuevaColumnaId = this.column.id;
    const nuevaPosicion = currentIndex + 1;

    // Llamar al endpoint individual de move
    this.taskSvc.moveCard(movido.id, nuevaColumnaId, nuevaPosicion).subscribe({
      next: () => {
        // Después de mover exitosamente, reordenar ambas columnas
        
        // 1. Reordenar la columna destino
        const actualItems = actual.map((c, i) => ({ id: c.id, position: i + 1 }));
        this.taskSvc.reorderCard(nuevaColumnaId, actualItems).subscribe({
          error: (e) => console.error('Error al reordenar columna destino:', e)
        });

        // 2. Reordenar la columna origen (si tiene tarjetas)
        if (previo.length > 0) {
          const prevItems = previo.map((c, i) => ({ id: c.id, position: i + 1 }));
          const prevColId = this.getColumnIdFromContainer(event.previousContainer);
          
          this.taskSvc.reorderCard(prevColId, prevItems).subscribe({
            error: (e) => console.error('Error al reordenar columna origen:', e)
          });
        }

        this.cardsChanged.emit();
      },
      error: (e) => {
        console.error('No se pudo mover la tarjeta:', e);
        // Revertir el cambio visual
        transferArrayItem(actual, previo, currentIndex, previousIndex);
        alert('Error al mover la tarjeta. Por favor, intenta de nuevo.');
      },
    });
  }
}

// Método auxiliar para obtener el ID de columna del contenedor
private getColumnIdFromContainer(container: any): number {
  // Intenta obtener el ID del atributo del contenedor
  const idStr = (container.id || '').replace('col-', '');
  const id = Number(idStr);
  return isNaN(id) ? this.column.id : id;
}

  trackById = (_: number, card: Card) => card.id;

  // ===== Modal de crear tarea =====
  AbrirTarea() {
    if (this.column.cards && this.column.cards.length >= 10) {
    return;
  }
    this.closeCardDetail()
    this.form.reset({
      titulo: '',
      descripcion: '',
      assignee: '',
      fecha_vencimiento: '',
      prioridad: ''
    });
    this.selectedFiles = [];
    this.imageUrls = [];
    this.imageUrlInput = '';
    this.previewUrls = [];
    this.selectedMember = null; 
    this.searchControl.setValue(''); 
    this.showModal = true;
  }

  cerrarTarea() {
    this.showModal = false;
    this.creating = false;
    this.selectedFiles = [];
    this.imageUrls = [];
    this.imageUrlInput = '';
    this.selectedMember = null;
    this.previewUrls = [];
    this.searchControl.setValue(''); 
  }

  crearTareaBD() {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      if (!this.form.value.prioridad) {
        const prioridadControl = this.form.get('prioridad');
        prioridadControl?.markAsTouched();
      }
      return;
    }
    if (this.column.cards && this.column.cards.length >= 10) {
    alert('Esta columna ya tiene 10 tareas (límite máximo).');
    return;
  }

     this.creating = true;
    const titulo = (this.form.value.titulo as string).trim();
    const descripcion = (this.form.value.descripcion as string)?.trim() || '';
    const fecha = this.form.value.fecha_vencimiento || null;
    const prioridad = this.form.value.prioridad;
    const idAsignado = this.form.value.assignee;
    const nombreAsignado = this.form.value.assigneeName || '';

    if (!prioridad) {
      alert('Por favor selecciona una prioridad');
      this.creating = false;
      return;
    }

    console.log('Creando tarea con:', { 
      titulo, 
      descripcion, 
      prioridad, 
      fecha,
      archivos: this.selectedFiles.length,
      urls: this.imageUrls.length
    });

    this.taskSvc.createCard({
      id_proyecto: this.proyectoId,
      id_columna: this.column.id,
      titulo: titulo,
      descripcion: descripcion,
      due_at: fecha,
      prioridad: prioridad,
      id_asignado: idAsignado,
      id_creador: 1,
      position: 0,
      images: this.selectedFiles,
      imageUrls: this.imageUrls 
    }).subscribe({
      next: (newCard) => {
        console.log('Tarea creada exitosamente:', newCard);
        
        const cardForDisplay = {
          ...newCard,
          title: newCard.title,
          asignado_a:nombreAsignado,
          fecha_vencimiento: fecha,
          images: [...this.previewUrls]
        };
        
        this.column.cards.push(cardForDisplay); 
        this.cardsChanged.emit();
        this.cerrarTarea();
      },
      error: (e) => {
        console.error('Error al crear tarjeta:', e);
        
        let errorMsg = 'No se pudo crear la tarjeta';
        
        if (e.error?.error) {
          errorMsg = e.error.error;
        } else if (e.status === 400) {
          errorMsg = 'Error en los datos enviados. Verifica que todos los campos obligatorios estén completos.';
        } else if (e.status === 422) {
          errorMsg = 'Ya existe una tarea con este nombre en la misma columna.';
        }
        
        alert(`Error: ${errorMsg}`);
        this.creating = false;
      }
    });
  }
  // Abrir modal de detalle
  openCardDetail(card: Card) {
  console.log('Abriendo modal para tarjeta:', card);
  
  this.showModal = false;

  this.selectedCard = { 
    ...card,
    comentarios: card.comentarios || [],
    asignado_a: card.asignado_a || 'Sin asignar',
    images: card.images || []
  };
  
  this.showCardDetail = true;
  
  console.log('Modal de detalle visible:', this.showCardDetail);
  console.log('Modal de crear oculto:', !this.showModal);
}

  // Cerrar modal de detalle
  closeCardDetail() {
    this.showCardDetail = false;
    this.selectedCard = null;
  }
  onCardUpdated(updatedCard: Card) {
    console.log('Tarjeta actualizada:', updatedCard);
    
    // Actualizar en el backend
    this.taskSvc.updateCard(updatedCard).subscribe({
      next: () => {
        // Actualizar en la lista local
        const index = this.column.cards.findIndex(c => c.id === updatedCard.id);
        if (index !== -1) {
          this.column.cards[index] = { ...updatedCard };
        }
        this.cardsChanged.emit();
      },
      error: (e) => {
        console.error('Error al actualizar tarjeta:', e);
        alert('No se pudo actualizar la tarjeta');
      }
    });
  }
  onCardDeleted(cardId: number) {
    this.taskSvc.deleteCard(cardId).subscribe({
      next: () => {
        const index = this.column.cards.findIndex(c => c.id === cardId);
        if (index !== -1) {
          this.column.cards.splice(index, 1);
        }
        this.cardsChanged.emit();
        this.closeCardDetail();
      },
      error: (e) => {
        console.error('Error al eliminar tarjeta:', e);
        alert('No se pudo eliminar la tarjeta');
      }
    });
  }

  // Eliminar tarjeta desde el botón en la card
  deleteCardFromColumn(card: Card) {
    this.taskSvc.deleteCard(card.id).subscribe({
      next: () => {
        const index = this.column.cards.findIndex(c => c.id === card.id);
        if (index !== -1) {
          this.column.cards.splice(index, 1);
        }
        this.cardsChanged.emit();
      },
      error: (e) => {
        console.error('Error al eliminar:', e);
        alert('No se pudo eliminar la tarjeta');
      }
    });
  }
  
}