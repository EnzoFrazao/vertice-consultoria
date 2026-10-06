export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: number;
          ip_address: unknown;
          new_values: Json | null;
          old_values: Json | null;
          record_id: string | null;
          schema_name: string;
          table_name: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          ip_address?: unknown;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id?: string | null;
          schema_name: string;
          table_name: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          ip_address?: unknown;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id?: string | null;
          schema_name?: string;
          table_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      case_documents: {
        Row: {
          case_id: string;
          created_at: string;
          document_type_id: string;
          id: string;
          label: string;
          required: boolean;
          status: string;
          updated_at: string;
        };
        Insert: {
          case_id: string;
          created_at?: string;
          document_type_id: string;
          id?: string;
          label: string;
          required?: boolean;
          status?: string;
          updated_at?: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          document_type_id?: string;
          id?: string;
          label?: string;
          required?: boolean;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "consulting_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_documents_document_type_id_fkey";
            columns: ["document_type_id"];
            isOneToOne: false;
            referencedRelation: "document_types";
            referencedColumns: ["id"];
          }
        ];
      };
      case_events: {
        Row: {
          actor_id: string | null;
          actor_role_snapshot: string | null;
          case_id: string;
          created_at: string;
          description: string | null;
          id: string;
          metadata: Json;
          title: string;
          type: string;
        };
        Insert: {
          actor_id?: string | null;
          actor_role_snapshot?: string | null;
          case_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json;
          title: string;
          type: string;
        };
        Update: {
          actor_id?: string | null;
          actor_role_snapshot?: string | null;
          case_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_events_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "consulting_cases";
            referencedColumns: ["id"];
          }
        ];
      };
      case_messages: {
        Row: {
          body: string;
          case_id: string;
          created_at: string;
          id: string;
          message_type: string;
          metadata: Json;
          sender_id: string | null;
        };
        Insert: {
          body: string;
          case_id: string;
          created_at?: string;
          id?: string;
          message_type?: string;
          metadata?: Json;
          sender_id?: string | null;
        };
        Update: {
          body?: string;
          case_id?: string;
          created_at?: string;
          id?: string;
          message_type?: string;
          metadata?: Json;
          sender_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "consulting_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      case_status_history: {
        Row: {
          case_id: string;
          changed_by: string | null;
          created_at: string;
          from_phase: string | null;
          from_waiting_on: string | null;
          id: string;
          reason: string | null;
          to_phase: string;
          to_waiting_on: string | null;
        };
        Insert: {
          case_id: string;
          changed_by?: string | null;
          created_at?: string;
          from_phase?: string | null;
          from_waiting_on?: string | null;
          id?: string;
          reason?: string | null;
          to_phase: string;
          to_waiting_on?: string | null;
        };
        Update: {
          case_id?: string;
          changed_by?: string | null;
          created_at?: string;
          from_phase?: string | null;
          from_waiting_on?: string | null;
          id?: string;
          reason?: string | null;
          to_phase?: string;
          to_waiting_on?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "case_status_history_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "consulting_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      consulting_cases: {
        Row: {
          client_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          lock_version: number;
          objective: string;
          opened_at: string;
          phase: string;
          property_id: string;
          protocol: string;
          service_id: string;
          updated_at: string;
          waiting_on: string | null;
          waiting_reason: string | null;
        };
        Insert: {
          client_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          lock_version?: number;
          objective: string;
          opened_at?: string;
          phase?: string;
          property_id: string;
          protocol: string;
          service_id: string;
          updated_at?: string;
          waiting_on?: string | null;
          waiting_reason?: string | null;
        };
        Update: {
          client_id?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          lock_version?: number;
          objective?: string;
          opened_at?: string;
          phase?: string;
          property_id?: string;
          protocol?: string;
          service_id?: string;
          updated_at?: string;
          waiting_on?: string | null;
          waiting_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consulting_cases_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consulting_cases_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consulting_cases_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      document_reviews: {
        Row: {
          created_at: string;
          decision: string;
          document_version_id: string;
          id: string;
          reason: string | null;
          reviewer_id: string;
        };
        Insert: {
          created_at?: string;
          decision: string;
          document_version_id: string;
          id?: string;
          reason?: string | null;
          reviewer_id: string;
        };
        Update: {
          created_at?: string;
          decision?: string;
          document_version_id?: string;
          id?: string;
          reason?: string | null;
          reviewer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_reviews_document_version_id_fkey";
            columns: ["document_version_id"];
            isOneToOne: false;
            referencedRelation: "document_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      document_types: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_versions: {
        Row: {
          case_document_id: string;
          deleted_at: string | null;
          id: string;
          malware_scan_status: string;
          malware_scanned_at: string | null;
          mime_type: string;
          original_filename: string;
          sha256: string;
          size_bytes: number;
          storage_disk: string;
          storage_key: string;
          submitted_at: string;
          submitted_by: string;
          version_number: number;
        };
        Insert: {
          case_document_id: string;
          deleted_at?: string | null;
          id?: string;
          malware_scan_status?: string;
          malware_scanned_at?: string | null;
          mime_type: string;
          original_filename: string;
          sha256: string;
          size_bytes: number;
          storage_disk?: string;
          storage_key: string;
          submitted_at?: string;
          submitted_by: string;
          version_number: number;
        };
        Update: {
          case_document_id?: string;
          deleted_at?: string | null;
          id?: string;
          malware_scan_status?: string;
          malware_scanned_at?: string | null;
          mime_type?: string;
          original_filename?: string;
          sha256?: string;
          size_bytes?: number;
          storage_disk?: string;
          storage_key?: string;
          submitted_at?: string;
          submitted_by?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_versions_case_document_id_fkey";
            columns: ["case_document_id"];
            isOneToOne: false;
            referencedRelation: "case_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_versions_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notification_deliveries: {
        Row: {
          attempted_at: string | null;
          channel: string;
          created_at: string;
          delivered_at: string | null;
          error_message: string | null;
          id: string;
          notification_id: string;
          provider_message_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          attempted_at?: string | null;
          channel: string;
          created_at?: string;
          delivered_at?: string | null;
          error_message?: string | null;
          id?: string;
          notification_id: string;
          provider_message_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          attempted_at?: string | null;
          channel?: string;
          created_at?: string;
          delivered_at?: string | null;
          error_message?: string | null;
          id?: string;
          notification_id?: string;
          provider_message_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          case_document_id: string | null;
          case_id: string | null;
          created_at: string;
          data: Json;
          id: string;
          message: string;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          case_document_id?: string | null;
          case_id?: string | null;
          created_at?: string;
          data?: Json;
          id?: string;
          message: string;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          case_document_id?: string | null;
          case_id?: string | null;
          created_at?: string;
          data?: Json;
          id?: string;
          message?: string;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_case_document_id_fkey";
            columns: ["case_document_id"];
            isOneToOne: false;
            referencedRelation: "case_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "consulting_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          cpf_encrypted: string | null;
          cpf_hash: string | null;
          created_at: string;
          disabled_at: string | null;
          email: string;
          email_verified_at: string | null;
          id: string;
          name: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          cpf_encrypted?: string | null;
          cpf_hash?: string | null;
          created_at?: string;
          disabled_at?: string | null;
          email: string;
          email_verified_at?: string | null;
          id: string;
          name: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          cpf_encrypted?: string | null;
          cpf_hash?: string | null;
          created_at?: string;
          disabled_at?: string | null;
          email?: string;
          email_verified_at?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          city: string;
          complement: string | null;
          created_at: string;
          created_by: string;
          id: string;
          iptu_number: string | null;
          neighborhood: string;
          notes: string | null;
          number: string;
          postal_code: string;
          registration_number: string | null;
          registry_office: string | null;
          state: string;
          street: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          city: string;
          complement?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          iptu_number?: string | null;
          neighborhood: string;
          notes?: string | null;
          number: string;
          postal_code: string;
          registration_number?: string | null;
          registry_office?: string | null;
          state: string;
          street: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          city?: string;
          complement?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          iptu_number?: string | null;
          neighborhood?: string;
          notes?: string | null;
          number?: string;
          postal_code?: string;
          registration_number?: string | null;
          registry_office?: string | null;
          state?: string;
          street?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      property_parties: {
        Row: {
          cpf_encrypted: string | null;
          cpf_hash: string | null;
          created_at: string;
          id: string;
          name: string;
          property_id: string;
          relation_type: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          cpf_encrypted?: string | null;
          cpf_hash?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          property_id: string;
          relation_type: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          cpf_encrypted?: string | null;
          cpf_hash?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          property_id?: string;
          relation_type?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_parties_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_parties_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      roles: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      service_categories: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_document_requirements: {
        Row: {
          created_at: string;
          display_order: number;
          document_type_id: string;
          instructions: string | null;
          required: boolean;
          service_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          document_type_id: string;
          instructions?: string | null;
          required?: boolean;
          service_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          document_type_id?: string;
          instructions?: string | null;
          required?: boolean;
          service_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_document_requirements_document_type_id_fkey";
            columns: ["document_type_id"];
            isOneToOne: false;
            referencedRelation: "document_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_document_requirements_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      services: {
        Row: {
          active: boolean;
          category_id: string;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          category_id: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          category_id?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "service_categories";
            referencedColumns: ["id"];
          }
        ];
      };
      user_addresses: {
        Row: {
          city: string;
          complement: string | null;
          created_at: string;
          id: string;
          is_primary: boolean;
          kind: string;
          neighborhood: string;
          number: string;
          postal_code: string;
          state: string;
          street: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          city: string;
          complement?: string | null;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          kind: string;
          neighborhood: string;
          number: string;
          postal_code: string;
          state: string;
          street: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          city?: string;
          complement?: string | null;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          kind?: string;
          neighborhood?: string;
          number?: string;
          postal_code?: string;
          state?: string;
          street?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          role_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {}
  },
  public: {
    Enums: {}
  }
} as const;
