import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root'
})
export class PortafolioService {
   private menuRef: any;
   private perfilRef: any;
   private skillRef: any;
   private experienciaRef: any;
   private educacionRef: any;
   private capacitacionesRef: any;
   private testimoniosRef: any;
   private contactoRef: any;




  // Obtenemos el idioma actual del servicio de idiomas
  get Idioma(): string {
    return this.LangService.sIdioma;
  }

  constructor(
    private http: HttpClient,
    private dbPortfolio: AngularFireDatabase,
    private LangService: LanguageService
  ) { 

    this.menuRef = this.dbPortfolio.list('/Menu', ref => this.applyFilters(ref));
    this.perfilRef = this.dbPortfolio.list('/Perfil', ref => this.applyFilters(ref));
    this.skillRef = this.dbPortfolio.list('/Skill', ref => this.applyFilters(ref));
    this.experienciaRef = this.dbPortfolio.list('/Experiencia', ref => this.applyFilters(ref));
    this.educacionRef = this.dbPortfolio.list('/Educacion', ref => this.applyFilters(ref));
    this.capacitacionesRef = this.dbPortfolio.list('/Capacitaciones', ref => this.applyFilters(ref));
    this.testimoniosRef = this.dbPortfolio.list('/Testimonios', ref => this.applyFilters(ref));

  }

  
  private applyFilters(ref: any, filterPath: string = 'Idioma') {
    return ref.orderByChild(filterPath).equalTo(this.Idioma);
  }

  // --- MÉTODOS DE CARGA ---

  CargarIdiomas(): Observable<any> {
    return this.http.get('https://rm-portafolio-default-rtdb.firebaseio.com/Idiomas.json');
  }

  CargarMenu(): Observable<any> {
    return this.menuRef.valueChanges();
  }

  CargarPerfil(): Observable<any> {
    return this.perfilRef.valueChanges();
  }

  CargarSkill(): Observable<any> {
    return this.skillRef.valueChanges();
  }

  CargarExperiencia(): Observable<any> {
    return this.experienciaRef.valueChanges();
  }

  CargarEducacion(): Observable<any> {
    return this.educacionRef.valueChanges();
  }

  CargarCapacitaciones(): Observable<any> {
    return this.capacitacionesRef.valueChanges();
  }

  CargarTestimonios(): Observable<any> {
    return this.testimoniosRef.valueChanges();
  }

  CargarContacto(): Observable<any> {
    return this.contactoRef.valueChanges();
  }

  // --- MÉTODOS DE TÍTULOS (MENÚ DINÁMICO) ---

  private getMenuByBtnLang(btnLangKey: string): Observable<any> {
    const strBtnLang = `#${btnLangKey}_${this.Idioma}`;
    return this.dbPortfolio.list('/Menu', 
      ref => ref.orderByChild('BtnLang').equalTo(strBtnLang)).valueChanges();
  }

  TituloSkill(): Observable<any> {
    return this.getMenuByBtnLang('skills');
  }

  TituloExperiencia(): Observable<any> {
    return this.getMenuByBtnLang('experience');
  }

  TituloCapacitaciones(): Observable<any> {
    return this.getMenuByBtnLang('trainings');
  }

  TituloTestimonios(): Observable<any> {
    return this.getMenuByBtnLang('testimonials');
  }

  TituloContacto(): Observable<any> {
    return this.getMenuByBtnLang('contact');
  }


}