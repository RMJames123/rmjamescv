import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { take, catchError, map } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { LanguageService } from './language.service';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class PortafolioService {
  // Inyección moderna de dependencias (Angular 17+)
  private http = inject(HttpClient);
  private dbPortfolio = inject(AngularFireDatabase);
  private LangService = inject(LanguageService);

  constructor() { }

  // Getter dinámico para obtener el idioma actual
  get Idioma(): string {
    return this.LangService.sIdioma || 'es';
  }

  /**
   * MÉTODO NÚCLEO: Carga datos de Firebase y filtra por idioma en el cliente.
   * Esto previene errores de contexto de inyección (NG0203).
   */
  private getData(path: string): Observable<any[]> {
    return this.dbPortfolio.list(path).valueChanges().pipe(
      map((items: any[]) => {
        // Filtramos por el campo 'Idioma' definido en Firebase
        return items.filter(item => item && item.Idioma === this.Idioma);
      }),
      catchError(err => {
        console.error(`Error cargando ruta ${path}:`, err);
        return of([]);
      })
    );
  }

  // --- MÉTODOS DE CARGA PARA COMPONENTES ---
  CargarIdiomas(): Observable<any> { 
    return this.http.get('https://rm-portafolio-default-rtdb.firebaseio.com/Idiomas.json'); 
  }

  CargarMenu(): Observable<any> { return this.getData('/Menu'); }
  CargarPerfil(): Observable<any> { return this.getData('/Perfil'); }
  CargarSkill(): Observable<any> { return this.getData('/Skill'); }
  CargarExperiencia(): Observable<any> { return this.getData('/Experiencia'); }
  CargarEducacion(): Observable<any> { return this.getData('/Educacion'); }
  CargarCapacitaciones(): Observable<any> { return this.getData('/Capacitaciones'); }
  CargarTestimonios(): Observable<any> { return this.getData('/Testimonios'); }
  CargarContacto(): Observable<any> { return this.getData('/Contacto'); }
  
  // Cargas globales (sin filtro de idioma)
  CargarFoto(): Observable<any> { return this.dbPortfolio.list('/Foto').valueChanges(); }
  CargarIconos(): Observable<any> { return this.dbPortfolio.list('/Iconos').valueChanges(); }

  /**
   * MÉTODO PARA TÍTULOS: Busca en el Menú la opción que corresponde a la sección.
   */
  private getMenuByBtnLang(btnLangKey: string): Observable<any> {
    const strBtnLang = `#${btnLangKey}_${this.Idioma}`;
    return this.dbPortfolio.list('/Menu').valueChanges().pipe(
      map((menu: any[]) => menu.filter(m => m.BtnLang === strBtnLang))
    );
  }

  TituloSkill(): Observable<any> { return this.getMenuByBtnLang('skills'); }
  TituloExperiencia(): Observable<any> { return this.getMenuByBtnLang('experience'); }
  TituloCapacitaciones(): Observable<any> { return this.getMenuByBtnLang('trainings'); }
  TituloTestimonios(): Observable<any> { return this.getMenuByBtnLang('testimonials'); }
  TituloContacto(): Observable<any> { return this.getMenuByBtnLang('contact'); }
  TituloEducacion(): Observable<any> { return this.getMenuByBtnLang('education'); }

  // --- GENERACIÓN DE CV (PDF) ---
  async generarPDF() {
    Swal.fire({
      title: 'Generando CV...',
      text: 'Consolidando información técnica...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    forkJoin({
      perfil: this.CargarPerfil().pipe(take(1)),
      experiencia: this.CargarExperiencia().pipe(take(1)),
      educacion: this.CargarEducacion().pipe(take(1)),
      skills: this.CargarSkill().pipe(take(1)),
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

          // Fondo Cabecera (Azul Portafolio)
          doc.setFillColor(33, 67, 128);
          doc.rect(0, 0, pageWidth, 100, 'F');

          // Renderizado de Foto circular
          if (fotoUrl) {
            try {
              const imgData = await this.getBase64ImageFromURL(fotoUrl);
              doc.setFillColor(255, 255, 255);
              doc.circle(75, 50, 35, 'F');
              doc.addImage(imgData, 'JPEG', 45, 20, 60, 60);
            } catch (e) { console.warn("Foto no disponible para PDF"); }
          }

          // Datos personales en cabecera
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.text(`${perfil?.Nombre || ''} ${perfil?.Apellido || ''}`, 140, 50);
          doc.setFontSize(11);
          doc.text(perfil?.Titulo2 || '', 140, 72);

          // Estructura lateral
          this.dibujarFondoLateral(doc);
          
          // --- COLUMNA IZQUIERDA (Skills) ---
          doc.setTextColor(33, 67, 128);
          doc.setFontSize(11); doc.setFont("helvetica", "bold");
          doc.text("HABILIDADES", 25, leftY);
          doc.setTextColor(60); doc.setFontSize(9); doc.setFont("helvetica", "normal");
          
          res.skills.forEach((s: any) => {
            leftY += 15;
            doc.text(`• ${s.Nombre || ''}`, 30, leftY);
          });

          // --- COLUMNA DERECHA (Experiencia) ---
          doc.setTextColor(33, 67, 128);
          doc.setFontSize(14); doc.setFont("helvetica", "bold");
          doc.text("EXPERIENCIA LABORAL", 200, rightY);
          doc.setDrawColor(255, 215, 0); doc.line(200, rightY + 5, 550, rightY + 5);

          rightY += 30;
          const experiencias = Array.isArray(res.experiencia) ? res.experiencia : Object.values(res.experiencia);
          
          [...experiencias].reverse().forEach((exp: any) => {
            if (rightY > 750) { doc.addPage(); this.dibujarFondoLateral(doc); rightY = 60; }

            doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0);
            doc.text(exp.Empresa || '', 200, rightY);
            
            rightY += 14;
            doc.setFontSize(9); doc.setTextColor(33, 67, 128);
            doc.text(`${exp.Cargo || ''} | ${exp.Fecha || ''}`, 200, rightY);

            rightY += 15;
            doc.setTextColor(0); doc.setFont("helvetica", "normal");

            if (exp.Logros) {
              exp.Logros.forEach((logro: any) => {
                const lineas = doc.splitTextToSize(`• ${logro.Descripcion}`, 340);
                doc.text(lineas, 200, rightY);
                rightY += (lineas.length * 11);
              });
            }
            rightY += 15;
          });

          // --- SECCIÓN EDUCACIÓN EN PDF ---
          if (rightY > 700) { doc.addPage(); this.dibujarFondoLateral(doc); rightY = 60; }
          doc.setTextColor(33, 67, 128); doc.setFontSize(14); doc.setFont("helvetica", "bold");
          doc.text("EDUCACIÓN", 200, rightY);
          doc.line(200, rightY + 5, 550, rightY + 5);
          rightY += 25;

          res.educacion.forEach((edu: any) => {
            doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0);
            doc.text(edu.Titulo || '', 200, rightY);
            rightY += 12;
            doc.setFont("helvetica", "normal"); doc.setFontSize(9);
            doc.text(`${edu.Institucion} | ${edu.Fecha}`, 200, rightY);
            rightY += 20;
          });

          doc.save(`CV_Raul_Jaramillo_${this.Idioma}.pdf`);
          Swal.close();

        } catch (error) {
          console.error("Error generando PDF:", error);
          Swal.fire('Error', 'No se pudo generar el documento', 'error');
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