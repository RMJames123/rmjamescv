import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importante para el *ngFor del carrusel
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-educacion',
  standalone: true, // Modo Angular 21
  imports: [CommonModule], // Habilita directivas como *ngFor y *ngIf
  templateUrl: './educacion.component.html',
  styleUrls: ['./educacion.component.css']
})
export class EducacionComponent implements OnInit {

  educacion: any[] = [];

  constructor(private datosPortafolio: PortafolioService) { }

  ngOnInit(): void {
    this.datosPortafolio.CargarEducacion().subscribe(resp => {
      this.educacion = resp;
    });
  }

}