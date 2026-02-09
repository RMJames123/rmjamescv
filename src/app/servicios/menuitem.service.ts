import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MenuitemService {

  // Arreglo para almacenar las opciones del menú
  MenuOpciones: any[] = [];

  constructor() { }

  /**
   * Busca y retorna la configuración de un botón específico.
   * @param boton El nombre o ID del botón a buscar.
   */
  selecciona_opcion(boton: string): any {
    // CORRECCIÓN: Se usa '===' para comparar. 
    // Antes tenías 'x.Boton = boton', lo que sobreescribía el valor de todos los botones.
    return this.MenuOpciones.find(x => x.Boton === boton);
  }

  /**
   * MÉTODO PARA ROL MAESTRO (GOD MODE)
   * Si el usuario tiene acceso total, podríamos forzar que todas 
   * las opciones del menú estén visibles o habilitadas.
   */
  habilitarTodoParaAdmin() {
    this.MenuOpciones.forEach(opcion => {
      opcion.Visible = true;
      opcion.Habilitado = true;
    });
  }
}