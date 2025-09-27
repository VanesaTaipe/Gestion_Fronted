import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Board } from '../models/board.model';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  constructor(private http: HttpClient) {}

  getBoard(): Observable<Board> {
    // 👇 Ojo: la ruta debe incluir "assets/"
    return this.http.get<Board>('assets/board.json');
  }
}
