import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Recomendado incluirlo siempre en standalone
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-perfil',
  standalone: true, // Actualizado para Angular 21
  imports: [CommonModule], 
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {

  perfil: any[] = [];

  constructor(private datosPortafolio: PortafolioService) { }

  ngOnInit(): void {
    this.datosPortafolio.CargarPerfil().subscribe(resp => {
      this.perfil = resp;
    });
  }

}