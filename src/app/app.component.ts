import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Añade esto
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
    CommonModule, // Añade esto primero
    NavbarComponent,
    PerfilComponent,
    ExperienciaComponent,
    SkillComponent,
    CapacitacionesComponent,
    ContactoComponent,
    TestimoniosComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Mi primera página Web';
}