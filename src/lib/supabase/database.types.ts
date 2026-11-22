export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Tipos de la base de datos (generados de Supabase). Regenerar cuando cambie el esquema. */
export type Database = {
  public: {
    Tables: {
      logros_usuario: {
        Row: { desbloqueado_en: string; juego: string; logro: string; usuario_id: string };
        Insert: { desbloqueado_en?: string; juego: string; logro: string; usuario_id: string };
        Update: { desbloqueado_en?: string; juego?: string; logro?: string; usuario_id?: string };
        Relationships: [];
      };
      minijuego_intentos: {
        Row: {
          cortes: number;
          creado_en: string;
          exposicion: number;
          id: number;
          minijuego: string;
          pico: number;
          segundos: number;
          usuario_id: string;
          veredicto: string;
        };
        Insert: {
          cortes?: number;
          creado_en?: string;
          exposicion: number;
          id?: never;
          minijuego: string;
          pico: number;
          segundos: number;
          usuario_id: string;
          veredicto: string;
        };
        Update: {
          cortes?: number;
          creado_en?: string;
          exposicion?: number;
          id?: never;
          minijuego?: string;
          pico?: number;
          segundos?: number;
          usuario_id?: string;
          veredicto?: string;
        };
        Relationships: [];
      };
      partidas: {
        Row: { actualizado_en: string; estado: Json; juego: string; usuario_id: string; version: number };
        Insert: { actualizado_en?: string; estado: Json; juego: string; usuario_id: string; version?: number };
        Update: { actualizado_en?: string; estado?: Json; juego?: string; usuario_id?: string; version?: number };
        Relationships: [];
      };
      perfiles: {
        Row: { actualizado_en: string; apodo: string; creado_en: string; id: string };
        Insert: { actualizado_en?: string; apodo?: string; creado_en?: string; id: string };
        Update: { actualizado_en?: string; apodo?: string; creado_en?: string; id?: string };
        Relationships: [];
      };
      records: {
        Row: { actualizado_en: string; apodo: string; juego: string; metrica: string; usuario_id: string; valor: number };
        Insert: { actualizado_en?: string; apodo: string; juego: string; metrica: string; usuario_id: string; valor: number };
        Update: { actualizado_en?: string; apodo?: string; juego?: string; metrica?: string; usuario_id?: string; valor?: number };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
