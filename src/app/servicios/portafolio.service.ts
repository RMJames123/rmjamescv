import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core'; 
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { take, catchError, map, first } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { LanguageService } from './language.service';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class PortafolioService {
  private http = inject(HttpClient);
  private dbPortfolio = inject(AngularFireDatabase);
  private LangService = inject(LanguageService);
  private injector = inject(Injector);

  constructor() { }

  get Idioma(): string {
    return this.LangService.sIdioma || 'es';
  }

  private getData(path: string): Observable<any[]> {
    return this.dbPortfolio.list(path).valueChanges().pipe(
      map((items: any[]) => items ? items.filter(item => item && item.Idioma === this.Idioma) : []),
      catchError(err => { console.error(err); return of([]); })
    );
  }

  CargarPerfil(): Observable<any> { return this.getData('/Perfil'); }
  CargarFoto(): Observable<any> { return this.dbPortfolio.list('/Foto').valueChanges(); }
  CargarIdiomas(): Observable<any> { return this.http.get('https://rm-portafolio-default-rtdb.firebaseio.com/Idiomas.json'); }
  CargarMenu(): Observable<any> { return this.getData('/Menu'); }
  CargarSkill(): Observable<any> { return this.getData('/Skill'); }
  CargarExperiencia(): Observable<any> { return this.getData('/Experiencia'); }
  CargarEducacion(): Observable<any> { return this.getData('/Educacion'); }
  CargarCapacitaciones(): Observable<any> { return this.getData('/Capacitaciones'); }
  CargarTestimonios(): Observable<any> { return this.getData('/Testimonios'); }
  CargarContacto(): Observable<any> { return this.getData('/Contacto'); }
  CargarIconos(): Observable<any> { return this.dbPortfolio.list('/Iconos').valueChanges(); }

  private getMenuByBtnLang(btnLangKey: string): Observable<any> {
    const strBtnLang = `#${btnLangKey}_${this.Idioma}`;
    return this.dbPortfolio.list('/Menu').valueChanges().pipe(
      map((menu: any[]) => (menu || []).filter(m => m.BtnLang === strBtnLang))
    );
  }

  TituloPerfil(): Observable<any> { return this.getMenuByBtnLang('profile'); }
  TituloSkill(): Observable<any> { return this.getMenuByBtnLang('skills'); }
  TituloExperiencia(): Observable<any> { return this.getMenuByBtnLang('experience'); }
  TituloCapacitaciones(): Observable<any> { return this.getMenuByBtnLang('trainings'); }
  TituloTestimonios(): Observable<any> { return this.getMenuByBtnLang('testimonials'); }
  TituloContacto(): Observable<any> { return this.getMenuByBtnLang('contact'); }
  TituloEducacion(): Observable<any> { return this.getMenuByBtnLang('education'); }

  generarPDF() {
    Swal.fire({
      title: this.Idioma === 'English' ? 'Generating CV...' : 'Generando CV...',
      text: this.Idioma === 'English' ? 'Retrieving data...' : 'Recuperando datos...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    runInInjectionContext(this.injector, () => {
      const perfilObs = this.dbPortfolio.list('/Perfil').valueChanges().pipe(first());
      const fotoObs = this.dbPortfolio.list('/Foto').valueChanges().pipe(first());
      const experienciaObs = this.dbPortfolio.list('/Experiencia').valueChanges().pipe(first());
      const capacitacionesObs = this.dbPortfolio.list('/Capacitaciones').valueChanges().pipe(first());
      const educacionObs = this.dbPortfolio.list('/Educacion').valueChanges().pipe(first());
      const menuObs = this.dbPortfolio.list('/Menu').valueChanges().pipe(first()); // <-- NUEVO

      forkJoin({
        perfil: perfilObs,
        foto: fotoObs,
        experiencia: experienciaObs,
        capacitaciones: capacitacionesObs,
        educacion: educacionObs,
        menu: menuObs // <-- NUEVO
      }).subscribe({
        next: async (res: any) => {
          await this.procesarDocumento(res);
          Swal.close();
        },
        error: (err) => {
          console.error("Error en flujo:", err);
          Swal.fire('Error', 'Fallo de conexión con Firebase', 'error');
        }
      });
    });
  }

private async procesarDocumento(res: any) {
    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const getT = (key: string, def: string) => {
        const btnKey = `#${key}_${this.Idioma}`;
        const item = (res.menu || []).find((m: any) => m.BtnLang === btnKey);
        return (item ? item.Titulo : def).toUpperCase();
      };
      
      const p = (res.perfil || []).find((item: any) => item.Idioma === this.Idioma) || {};
      
      const experiencias = (res.experiencia || []).filter((item: any) => item.Idioma === this.Idioma).reverse();
      const capacitaciones = (res.capacitaciones || []).filter((item: any) => item.Idioma === this.Idioma).reverse();
      const educacion = (res.educacion || []).filter((item: any) => item.Idioma === this.Idioma).reverse();
      
      const fotoUrl = res.foto && res.foto[0] ? res.foto[0].Archivo : null;
      const COL1_W = 165, COL2_X = 185, COL3_X = 350; 
      const WIDTH_COL2 = 150, WIDTH_COL3 = pageWidth - COL3_X - 30;
      const cAzul = [60, 94, 150], cOcre = [184, 134, 11], cGris = [100, 100, 100];

      const dibujarSidebar = () => {
        doc.setFillColor(cAzul[0], cAzul[1], cAzul[2]);
        doc.rect(0, 0, COL1_W, pageHeight, 'F');
      };

      dibujarSidebar();

      if (fotoUrl) {
        try {
          const imgData = await this.getBase64ImageFromURL(fotoUrl);
          doc.addImage(imgData, 'JPEG', 17, 30, 130, 160);
        } catch (e) { console.error("Error foto"); }
      }

      // --- SOBRE MÍ, HEADER Y CONTACTO (Se mantiene igual) ---
      doc.setTextColor(cOcre[0], cOcre[1], cOcre[2]);
      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text(getT('profile', 'SOBRE MÍ'), 20, 215);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      const sobreMiLines = doc.splitTextToSize(p.sobreMi || p.Descripcion || '', 125);
      let ySide = 235;
      sobreMiLines.forEach((line: string) => { 
        if(ySide < pageHeight - 40) { doc.text(line, 20, ySide, {align:'justify'}); ySide += 12; }
      });

      doc.setTextColor(cOcre[0], cOcre[1], cOcre[2]);
      doc.setFontSize(18); doc.setFont("helvetica", "bold");
      const nomLines = doc.splitTextToSize((p.nombre || '').toUpperCase(), 200);
      doc.text(nomLines, COL2_X, 60);
      let yH = 65 + (nomLines.length * 18);
      doc.setTextColor(cGris[0], cGris[1], cGris[2]);
      doc.setFontSize(11); doc.setFont("helvetica", "normal");
      const funcLines = doc.splitTextToSize(p.funcion || '', 200);
      doc.text(funcLines, COL2_X, yH);
      yH += (funcLines.length * 14) + 5;
      doc.setFont("helvetica", "bold"); doc.text(p.titulo || '', COL2_X, yH);

      let yC = 55;
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      const dL = doc.splitTextToSize(p.direccion || '', WIDTH_COL3);
      doc.text(dL, pageWidth - 30, yC, { align: 'right' });
      yC += (dL.length * 12) + 5;
      doc.setTextColor(cOcre[0], cOcre[1], cOcre[2]);
      doc.text(p.telefono || '', pageWidth - 30, yC, { align: 'right' });
      yC += 15;
      doc.setTextColor(cAzul[0], cAzul[1], cAzul[2]);
      doc.text(p.email || '', pageWidth - 30, yC, { align: 'right' });

      // --- EXPERIENCIA LABORAL (Logrado e Intacto) ---
      let currentY = 185;
      doc.setTextColor(0, 0, 0); doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text(getT('experience', 'EXPERIENCIA LABORAL'), COL2_X, currentY - 8);
      doc.setDrawColor(cOcre[0], cOcre[1], cOcre[2]); doc.setLineWidth(1.5);
      doc.line(COL2_X, currentY, pageWidth - 30, currentY);
      currentY += 20;

      experiencias.forEach((exp: any, index: number) => {
        if (currentY > pageHeight - 60) { doc.addPage(); dibujarSidebar(); currentY = 50; }
        const startY = currentY;
        let leftY = startY;
        let rightY = startY;

        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        const linesEmp = doc.splitTextToSize((exp.Empresa || '').toUpperCase(), WIDTH_COL2);
        doc.text(linesEmp, COL2_X, leftY);
        leftY += (linesEmp.length * 11);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(cGris[0], cGris[1], cGris[2]);
        doc.text(exp.Fecha || '', COL2_X, leftY);
        leftY += 12;

        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
        const linesCargo = doc.splitTextToSize(exp.Cargo || '', WIDTH_COL3);
        doc.text(linesCargo, COL3_X, rightY);
        rightY += (linesCargo.length * 13);

        if (exp.Ubicacion || exp.Asignacion) {
          doc.setFontSize(9.5); doc.setFont("helvetica", "normal"); doc.setTextColor(cGris[0], cGris[1], cGris[2]);
          const uText = (exp.Asignacion ? exp.Asignacion + ' - ' : '') + (exp.Ubicacion || '');
          const linesUbi = doc.splitTextToSize(uText, WIDTH_COL3);
          doc.text(linesUbi, COL3_X, rightY);
          rightY += (linesUbi.length * 11) + 5;
        }

        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
        doc.text(this.Idioma === 'English' ? "Achievements:" : "Logros:", COL3_X, rightY);
        rightY += 12;

        const logros = exp.Logros || [];
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        logros.forEach((log: any) => {
          const dLog = doc.splitTextToSize(log.Descripcion || '', WIDTH_COL3 - 15);
          const hLog = (dLog.length * 10.5) + 3;
          if (rightY + hLog > pageHeight - 35) {
            doc.addPage(); dibujarSidebar(); 
            rightY = 50; leftY = 50; 
          }
          doc.text("•", COL3_X + 5, rightY); doc.text(dLog, COL3_X + 15, rightY);
          rightY += hLog;
        });

        const puntoMasBajo = Math.max(leftY, rightY);
        if (index < experiencias.length - 1) {
          const yLinea = puntoMasBajo + 8;
          if (yLinea > pageHeight - 20) { doc.addPage(); dibujarSidebar(); currentY = 50; }
          else {
            doc.setDrawColor(cOcre[0], cOcre[1], cOcre[2]); doc.setLineWidth(0.5);
            doc.line(COL2_X, yLinea, pageWidth - 30, yLinea);
            currentY = yLinea + 12;
          }
        } else { currentY = puntoMasBajo + 15; }
      });

      // --- SECCIONES FINALES CON UBICACIÓN Y FECHA (NUEVO AJUSTE) ---
      const dibujarSeccionCompleta = (titulo: string, data: any[]) => {
        if (data.length === 0) return;
        if (currentY > pageHeight - 80) { doc.addPage(); dibujarSidebar(); currentY = 50; }
        else { currentY += 20; }

        doc.setTextColor(0, 0, 0); doc.setFontSize(13); doc.setFont("helvetica", "bold");
        doc.text(titulo, COL2_X, currentY - 8);
        doc.setDrawColor(cOcre[0], cOcre[1], cOcre[2]); doc.setLineWidth(1.5);
        doc.line(COL2_X, currentY, pageWidth - 30, currentY);
        currentY += 20;

        data.forEach((item, idx) => {
          if (currentY > pageHeight - 60) { doc.addPage(); dibujarSidebar(); currentY = 50; }
          
          const sY = currentY;
          let lY = sY;
          let rY = sY;

          // Columna Izquierda: Institución (Negrita) + Ubicación (Gris) + Fecha (Gris)
          doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
          const lIns = doc.splitTextToSize((item.Institucion || '').toUpperCase(), WIDTH_COL2);
          doc.text(lIns, COL2_X, lY);
          lY += (lIns.length * 11);

          doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(cGris[0], cGris[1], cGris[2]);
          if (item.Ubicacion) {
            const lUbi = doc.splitTextToSize(item.Ubicacion, WIDTH_COL2);
            doc.text(lUbi, COL2_X, lY);
            lY += (lUbi.length * 11);
          }
          doc.text(item.Fecha || '', COL2_X, lY);
          lY += 12;

          // Columna Derecha: Título (Negrita)
          doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(0, 0, 0);
          const lTit = doc.splitTextToSize(item.Titulo || '', WIDTH_COL3);
          doc.text(lTit, COL3_X, rY);
          rY += (lTit.length * 12) + 5;

          // Suelo dinámico y línea divisoria
          const puntoFinal = Math.max(lY, rY);
          
          if (idx < data.length - 1) {
            const yL = puntoFinal + 8;
            if (yL > pageHeight - 20) { doc.addPage(); dibujarSidebar(); currentY = 50; }
            else {
              doc.setDrawColor(cOcre[0], cOcre[1], cOcre[2]); doc.setLineWidth(0.5);
              doc.line(COL2_X, yL, pageWidth - 30, yL);
              currentY = yL + 12;
            }
          } else { currentY = puntoFinal + 10; }
        });
      };

      dibujarSeccionCompleta(getT('trainings', 'CAPACITACIONES'), capacitaciones);
      dibujarSeccionCompleta(getT('education', 'EDUCACIÓN'), educacion);

      const blob = doc.output('blob');
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (error) { console.error("Error PDF:", error); }
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