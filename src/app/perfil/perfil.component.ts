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

  perfil: any[] = [];
  urlFotoPerfil: string = './../../assets/img/Mi Foto.png'; // Foto inicial por defecto

  private cd = inject(ChangeDetectorRef);

  constructor(private datosPortafolio: PortafolioService) { }

  ngOnInit(): void {
    // 1. Cargamos los textos del perfil
    this.cargarDatosTexto();

    // 2. Cargamos la URL de la foto
    this.cargarImagenPerfil();
  }

descargarCV() {
    this.datosPortafolio.generarPDF();
  } 

  private cargarDatosTexto(): void {
    this.datosPortafolio.CargarPerfil().subscribe({
      next: (resp) => {
        this.perfil = resp;
        this.cd.detectChanges();
      },
      error: (err) => console.error("Error en textos:", err)
    });
  }

  private cargarImagenPerfil(): void {
    this.datosPortafolio.CargarFoto().subscribe({
      next: (resp) => {
        if (resp) {
          this.urlFotoPerfil = resp[0].Archivo;   
          this.cd.detectChanges();
        }
      },
      error: (err) => console.error("Error al cargar la foto:", err)
    });
  }
}