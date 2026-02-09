import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root' // Esto hace que el servicio esté disponible en toda la app Standalone
})
export class PortafolioService {

  // Obtenemos el idioma actual del servicio de idiomas
  get Idioma(): string {
    return this.LangService.sIdioma;
  }

  constructor(
    private http: HttpClient,
    private dbPortfolio: AngularFireDatabase,
    private LangService: LanguageService
  ) { }

  /**
   * MÉTODO PARA ROL MAESTRO (GOD MODE)
   * Aquí podrías implementar la lógica para ignorar filtros de idioma 
   * si el usuario tiene acceso total.
   */
  private applyFilters(ref: any, filterPath: string = 'Idioma') {
    // Si quisiéramos implementar el "Acceso Total", preguntaríamos aquí:
    // if (this.userHasGodMode) return ref; 
    return this.Idioma ? ref.orderByChild(filterPath).equalTo(this.Idioma) : ref;
  }

  CargarIdiomas(): Observable<any> {
    return this.http.get('https://rm-portafolio-default-rtdb.firebaseio.com/Idiomas.json');
  }

  CargarMenu(): Observable<any> {
    return this.dbPortfolio.list('/Menu', ref => this.applyFilters(ref)).valueChanges();
  }

  CargarPerfil(): Observable<any> {
    return this.dbPortfolio.list('/Perfil', ref => this.applyFilters(ref)).valueChanges();
  }

  CargarSkill(): Observable<any> {
    return this.dbPortfolio.list('/Skill', ref => this.applyFilters(ref)).valueChanges();
  }

  TituloSkill(): Observable<any> {
    const strBtnLang = `#skills_${this.Idioma}`;
    return this.dbPortfolio.list('/Menu', 
      ref => ref.orderByChild('BtnLang').equalTo(strBtnLang)).valueChanges();
  }

  CargarExperiencia(): Observable<any> {
    return this.dbPortfolio.list('/Experiencia', ref => this.applyFilters(ref)).valueChanges();
  }

  TituloExperiencia(): Observable<any> {
    const strBtnLang = `#experience_${this.Idioma}`;
    return this.dbPortfolio.list('/Menu', 
      ref => ref.orderByChild('BtnLang').equalTo(strBtnLang)).valueChanges();
  }

  CargarEducacion(): Observable<any> {
    return this.dbPortfolio.list('/Educacion', ref => this.applyFilters(ref)).valueChanges();
  }

  CargarCapacitaciones(): Observable<any> {
    return this.dbPortfolio.list('/Capacitaciones', ref => this.applyFilters(ref)).valueChanges();
  }

  TituloCapacitaciones(): Observable<any> {
    const strBtnLang = `#trainings_${this.Idioma}`;
    return this.dbPortfolio.list('/Menu', 
      ref => ref.orderByChild('BtnLang').equalTo(strBtnLang)).valueChanges();
  }

  CargarTestimonios(): Observable<any> {
    return this.dbPortfolio.list('/Testimonios', ref => this.applyFilters(ref)).valueChanges();
  }

  TituloTestimonios(): Observable<any> {
    const strBtnLang = `#testimonials_${this.Idioma}`;
    return this.dbPortfolio.list('/Menu', 
      ref => ref.orderByChild('BtnLang').equalTo(strBtnLang)).valueChanges();
  }

  CargarContacto(): Observable<any> {
    return this.dbPortfolio.list('/Contacto', ref => this.applyFilters(ref)).valueChanges();
  }

  TituloContacto(): Observable<any> {
    const strBtnLang = `#contact_${this.Idioma}`;
    return this.dbPortfolio.list('/Menu', 
      ref => ref.orderByChild('BtnLang').equalTo(strBtnLang)).valueChanges();
  }
}