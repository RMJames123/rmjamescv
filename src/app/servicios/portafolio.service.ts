import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { LanguageService } from './language.service';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

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
  private iconosRef: any;
  private fotoRef: any;

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
    this.contactoRef = this.dbPortfolio.list('/Contacto', ref => this.applyFilters(ref));
    this.iconosRef = this.dbPortfolio.list('/Iconos');
    this.fotoRef = this.dbPortfolio.list('/Foto');
  }

  private applyFilters(ref: any, filterPath: string = 'Idioma') {
    return ref.orderByChild(filterPath).equalTo(this.Idioma);
  }

  // --- MÉTODOS DE CARGA (Para la Web) ---
  CargarIdiomas(): Observable<any> { return this.http.get('https://rm-portafolio-default-rtdb.firebaseio.com/Idiomas.json'); }
  CargarMenu(): Observable<any> { return this.menuRef.valueChanges(); }
  CargarPerfil(): Observable<any> { return this.perfilRef.valueChanges(); }
  CargarSkill(): Observable<any> { return this.skillRef.valueChanges(); }
  CargarExperiencia(): Observable<any> { return this.experienciaRef.valueChanges(); }
  CargarEducacion(): Observable<any> { return this.educacionRef.valueChanges(); }
  CargarCapacitaciones(): Observable<any> { return this.capacitacionesRef.valueChanges(); }
  CargarTestimonios(): Observable<any> { return this.testimoniosRef.valueChanges(); }
  CargarContacto(): Observable<any> { return this.contactoRef.valueChanges(); }
  CargarFoto(): Observable<any> { return this.fotoRef.valueChanges(); }
  CargarIconos(): Observable<any> { return this.iconosRef.valueChanges(); }

  // --- MÉTODOS DE TÍTULOS (Para la Web) ---
  private getMenuByBtnLang(btnLangKey: string): Observable<any> {
    const strBtnLang = `#${btnLangKey}_${this.Idioma}`;
    return this.dbPortfolio.list('/Menu', ref => ref.orderByChild('BtnLang').equalTo(strBtnLang)).valueChanges();
  }

  TituloSkill(): Observable<any> { return this.getMenuByBtnLang('skills'); }
  TituloExperiencia(): Observable<any> { return this.getMenuByBtnLang('experience'); }
  TituloCapacitaciones(): Observable<any> { return this.getMenuByBtnLang('trainings'); }
  TituloTestimonios(): Observable<any> { return this.getMenuByBtnLang('testimonials'); }
  TituloContacto(): Observable<any> { return this.getMenuByBtnLang('contact'); }

  // --- GENERACIÓN DE PDF ---
  async generarPDF() {
    Swal.fire({
      title: 'Generando CV...',
      text: 'Consolidando información técnica...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    // Para el PDF usamos take(1) para que el forkJoin se complete
    forkJoin({
      perfil: this.CargarPerfil().pipe(take(1)),
      experiencia: this.CargarExperiencia().pipe(take(1)),
      educacion: this.CargarEducacion().pipe(take(1)),
      skills: this.CargarSkill().pipe(take(1)),
      capacitaciones: this.CargarCapacitaciones().pipe(take(1)),
      foto: this.CargarFoto().pipe(take(1))
    }).subscribe({
      next: async (res) => {
        try {
          const doc = new jsPDF('p', 'pt', 'a4');
          const pageWidth = doc.internal.pageSize.getWidth();
          let leftY = 130;
          let rightY = 130;

          const perfil = res.perfil[0];
          const fotoUrl = res.foto[0]?.Archivo;
          const experiencias = res.experiencia;
          const educacion = res.educacion;
          const skills = res.skills;
          const capacitaciones = res.capacitaciones;

          // --- DISEÑO PDF ---
          doc.setFillColor(33, 67, 128);
          doc.rect(0, 0, pageWidth, 100, 'F');

          if (fotoUrl) {
            try {
              const imgData = await this.getBase64ImageFromURL(fotoUrl);
              doc.setFillColor(255, 255, 255);
              doc.circle(75, 50, 35, 'F');
              doc.addImage(imgData, 'JPEG', 45, 20, 60, 60);
            } catch (e) { console.warn("Error foto..."); }
          }

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.text(`${perfil?.Nombre || 'RAUL'} ${perfil?.Apellido || 'JARAMILLO'}`, 140, 50);
          doc.setFontSize(11);
          doc.text(perfil?.Titulo2 || 'Consultor SAP Sr.', 140, 72);

          this.dibujarFondoLateral(doc);
          
          // Skills en PDF
          doc.setTextColor(33, 67, 128);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text("HABILIDADES", 25, leftY);
          doc.setTextColor(60);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          skills.forEach((s: any) => {
            leftY += 15;
            doc.text(`• ${s.Nombre || ''}`, 30, leftY);
          });

          // Experiencia en PDF
          doc.setTextColor(33, 67, 128);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("EXPERIENCIA LABORAL", 200, rightY);
          doc.setDrawColor(255, 215, 0);
          doc.line(200, rightY + 5, 550, rightY + 5);

          rightY += 30;
          const listaExp = Object.values(experiencias);
          [...listaExp].reverse().forEach((exp: any) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(exp.Empresa || '', 200, rightY);
            
            rightY += 14;
            doc.setFontSize(9);
            doc.setTextColor(33, 67, 128);
            doc.text(`${exp.Cargo || ''} | ${exp.Fecha || ''}`, 200, rightY);

            rightY += 15;
            doc.setTextColor(0);
            doc.setFont("helvetica", "normal");

            if (exp.Logros && Array.isArray(exp.Logros)) {
              exp.Logros.forEach((logro: any) => {
                const textoLogro = `• ${logro.Descripcion || ''}`;
                const lineas = doc.splitTextToSize(textoLogro, 340);
                doc.text(lineas, 200, rightY);
                rightY += (lineas.length * 11);
                if (rightY > 780) { doc.addPage(); this.dibujarFondoLateral(doc); rightY = 60; }
              });
            }
            rightY += 15;
          });

          // Guardar PDF
          const fileName = `CV_Raul_Jaramillo_${this.Idioma}.pdf`;
          if ('showSaveFilePicker' in window && window.isSecureContext) {
            try {
              const handle = await (window as any).showSaveFilePicker({
                suggestedName: fileName,
                types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
              });
              const writable = await handle.createWritable();
              await writable.write(doc.output('blob'));
              await writable.close();
              Swal.close();
              Swal.fire('¡Éxito!', 'Guardado', 'success');
            } catch (err) { 
                            if ((err as any).name !== 'AbortError') throw err; 
                            Swal.close(); 
                          }
          } else {
            doc.save(fileName);
            Swal.close();
          }

        } catch (error) {
          console.error(error);
          Swal.fire('Error', 'No se pudo generar el PDF', 'error');
        }
      }
    });
  }

  private dibujarFondoLateral(doc: jsPDF) {
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 100, 180, 742, 'F');
  }

  private async getBase64ImageFromURL(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}