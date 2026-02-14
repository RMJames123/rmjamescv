import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortafolioService } from './servicios/portafolio.service';

// Importaciones de tus componentes
import { NavbarComponent } from './navbar/navbar.component';
import { PerfilComponent } from './perfil/perfil.component';
import { ExperienciaComponent } from './experiencia/experiencia.component';
import { SkillComponent } from './skill/skill.component';
import { CapacitacionesComponent } from './capacitaciones/capacitaciones.component';
import { ContactoComponent } from './contacto/contacto.component';
import { TestimoniosComponent } from './testimonios/testimonios.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    PerfilComponent,
    ExperienciaComponent,
    SkillComponent,
    NavbarComponent
//    CapacitacionesComponent,
//    ContactoComponent,
//    TestimoniosComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Raúl Jaramillo Mesones';
  private datosIconos = inject(PortafolioService);

  constructor() {
    console.log("🚀 Angular está vivo. Iniciando configuración de identidad...");
  }

  ngOnInit(): void {
    this.datosIconos.CargarIconos().subscribe(data => {
      if (data && data.length > 0) {
        const config = data[0];
        console.log("✅ Datos de configuración procesados:", config.AppNombre);
        this.actualizarIdentidadVisual(config);
      }
    });
  }

  private transformarLinkDrive(url: string): string {
    if (!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|id=(.+?)(&|$)/);
    const id = match ? (match[1] || match[2]) : '';
    return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
  }

private actualizarIdentidadVisual(config: any): void {
  const t = new Date().getTime();

  // FUNCIÓN AUXILIAR: Decide si usar '?' o '&' según la URL
  const limpiarUrl = (url: string) => {
    if (!url) return '';
    const linkTransformado = this.transformarLinkDrive(url);
    // Si la URL ya tiene un '?', usamos '&', de lo contrario usamos '?'
    const conector = linkTransformado.includes('?') ? '&' : '?';
    return `${linkTransformado}${conector}v=${t}`;
  };

  // 1. Preparamos las URLs correctamente
  const img16 = limpiarUrl(config.Icono16);
  const img32 = limpiarUrl(config.Icono32);
  const img192 = limpiarUrl(config.Icono192);
  const img512 = limpiarUrl(config.Icono512);

  // 2. Inyectamos los Favicons (Esto cambiará la pestaña)
  this.reemplazarEtiquetaLink('app-favicon', img32, 'image/png');
  this.reemplazarEtiquetaLink('fav-32', img32, 'image/png');
  this.reemplazarEtiquetaLink('fav-16', img16, 'image/png');
  this.reemplazarEtiquetaLink('apple-icon', img192, 'image/png');

  // 3. MANIFIESTO: Configuración para PWA / Móvil
  try {
    const myManifest = {
      "name": config.AppNombre,
      "short_name": "RJ Portfolio",
      "theme_color": config.ThemeColor || "#007bff",
      "icons": [
        { "src": img192, "sizes": "192x192", "type": "image/png" },
        { "src": img512, "sizes": "512x512", "type": "image/png" }
      ],
      "display": "standalone",
      "background_color": "#ffffff",
      "start_url": "/",
      "scope": "/" 
    };

    const stringManifest = JSON.stringify(myManifest);
    const blob = new Blob([stringManifest], { type: 'application/manifest+json' });
    const manifestURL = URL.createObjectURL(blob);
    
    const manifestLink = document.querySelector('#main-manifest') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.setAttribute('crossorigin', 'use-credentials');
      manifestLink.href = manifestURL;
    }
  } catch (e) {
    console.warn("⚠️ No se pudo cargar el manifiesto dinámico.");
  }
}
  // Función de ayuda para eliminar el link viejo y poner uno nuevo (fuerza el cambio de icono)
  private reemplazarEtiquetaLink(id: string, url: string, type: string) {
  // Intentamos obtener el elemento
  let link = document.getElementById(id) as HTMLLinkElement;
  
  // Si no existe, lo creamos
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    document.head.appendChild(link);
  }

  link.rel = id === 'apple-icon' ? 'apple-touch-icon' : 'icon';
  link.type = type;
  link.href = url;
  link.setAttribute('crossorigin', 'anonymous');
}
}