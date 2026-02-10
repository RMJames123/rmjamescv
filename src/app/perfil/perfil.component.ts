import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { PortafolioService } from '../servicios/portafolio.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {

  // Definimos la variable para los datos del perfil
  perfil: any[] = [];

// Inyectamos el detector de cambios
  private cd = inject(ChangeDetectorRef);

  // Mantenemos la inyección en el constructor para asegurar el Injection Context en Angular 21
  constructor(private datosPortafolio: PortafolioService) { }

  ngOnInit(): void {
  
    this.datosPortafolio.CargarPerfil().subscribe({
      next: (resp) => {
        this.perfil = resp;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar el perfil en Angular 21:", err);
      }
    });
  }

}