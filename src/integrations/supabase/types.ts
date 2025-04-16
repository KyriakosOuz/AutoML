export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          changed_data: Json | null
          id: number
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          changed_data?: Json | null
          id?: number
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          changed_data?: Json | null
          id?: number
          table_name?: string
        }
        Relationships: []
      }
      columns: {
        Row: {
          column_name: string
          created_at: string
          data_type: string | null
          dataset_id: string
          id: number
          is_target: boolean | null
          unique_values_count: number | null
        }
        Insert: {
          column_name: string
          created_at?: string
          data_type?: string | null
          dataset_id: string
          id?: number
          is_target?: boolean | null
          unique_values_count?: number | null
        }
        Update: {
          column_name?: string
          created_at?: string
          data_type?: string | null
          dataset_id?: string
          id?: number
          is_target?: boolean | null
          unique_values_count?: number | null
        }
        Relationships: []
      }
      dataset_insights: {
        Row: {
          created_at: string
          dataset_id: string
          id: number
          insight_data: Json | null
          insight_type: string | null
        }
        Insert: {
          created_at?: string
          dataset_id: string
          id?: number
          insight_data?: Json | null
          insight_type?: string | null
        }
        Update: {
          created_at?: string
          dataset_id?: string
          id?: number
          insight_data?: Json | null
          insight_type?: string | null
        }
        Relationships: []
      }
      datasets: {
        Row: {
          columns_to_keep: Json | null
          created_at: string | null
          custom_missing_value: string | null
          file_url: string
          has_custom_missing: boolean | null
          id: string
          missing_values_handled: boolean | null
          original_file_url: string | null
          original_filename: string | null
          overview: Json | null
          pre_feature_importance_file_url: string | null
          stage: string | null
          target_column: string | null
          upload_date: string | null
          user_id: string | null
        }
        Insert: {
          columns_to_keep?: Json | null
          created_at?: string | null
          custom_missing_value?: string | null
          file_url: string
          has_custom_missing?: boolean | null
          id?: string
          missing_values_handled?: boolean | null
          original_file_url?: string | null
          original_filename?: string | null
          overview?: Json | null
          pre_feature_importance_file_url?: string | null
          stage?: string | null
          target_column?: string | null
          upload_date?: string | null
          user_id?: string | null
        }
        Update: {
          columns_to_keep?: Json | null
          created_at?: string | null
          custom_missing_value?: string | null
          file_url?: string
          has_custom_missing?: boolean | null
          id?: string
          missing_values_handled?: boolean | null
          original_file_url?: string | null
          original_filename?: string | null
          overview?: Json | null
          pre_feature_importance_file_url?: string | null
          stage?: string | null
          target_column?: string | null
          upload_date?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      experiment_files: {
        Row: {
          created_at: string | null
          experiment_id: string | null
          file_type: string | null
          file_url: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          experiment_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          experiment_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_files_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          algorithm_choice: string | null
          auto_train: boolean | null
          auto_tune: boolean | null
          automl_engine: string | null
          columns_to_keep: Json | null
          completed_at: string | null
          created_at: string | null
          dataset_id: string | null
          error_message: string | null
          experiment_id: string | null
          experiment_name: string | null
          hyperparameters: Json | null
          id: string
          metrics: Json | null
          problem_type: string | null
          results_directory: string | null
          status: string | null
          target_column: string | null
          task_type: string | null
          training_results: Json | null
          user_id: string | null
          version: number | null
          visualization_options: Json | null
        }
        Insert: {
          algorithm_choice?: string | null
          auto_train?: boolean | null
          auto_tune?: boolean | null
          automl_engine?: string | null
          columns_to_keep?: Json | null
          completed_at?: string | null
          created_at?: string | null
          dataset_id?: string | null
          error_message?: string | null
          experiment_id?: string | null
          experiment_name?: string | null
          hyperparameters?: Json | null
          id?: string
          metrics?: Json | null
          problem_type?: string | null
          results_directory?: string | null
          status?: string | null
          target_column?: string | null
          task_type?: string | null
          training_results?: Json | null
          user_id?: string | null
          version?: number | null
          visualization_options?: Json | null
        }
        Update: {
          algorithm_choice?: string | null
          auto_train?: boolean | null
          auto_tune?: boolean | null
          automl_engine?: string | null
          columns_to_keep?: Json | null
          completed_at?: string | null
          created_at?: string | null
          dataset_id?: string | null
          error_message?: string | null
          experiment_id?: string | null
          experiment_name?: string | null
          hyperparameters?: Json | null
          id?: string
          metrics?: Json | null
          problem_type?: string | null
          results_directory?: string | null
          status?: string | null
          target_column?: string | null
          task_type?: string | null
          training_results?: Json | null
          user_id?: string | null
          version?: number | null
          visualization_options?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          additional_results: Json | null
          created_at: string | null
          experiment_id: string | null
          id: string
          model_file_url: string | null
          report_file_url: string | null
        }
        Insert: {
          additional_results?: Json | null
          created_at?: string | null
          experiment_id?: string | null
          id?: string
          model_file_url?: string | null
          report_file_url?: string | null
        }
        Update: {
          additional_results?: Json | null
          created_at?: string | null
          experiment_id?: string | null
          id?: string
          model_file_url?: string | null
          report_file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: true
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_comparisons: {
        Row: {
          created_at: string | null
          experiment_ids: string[]
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          experiment_ids: string[]
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          experiment_ids?: string[]
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          hashed_password: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          hashed_password?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          hashed_password?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_dataset: {
        Args: {
          p_user_id: string
          p_file_url: string
          p_original_filename: string
          p_has_custom_missing?: boolean
          p_custom_missing_value?: string
        }
        Returns: {
          id: string
        }[]
      }
      create_experiment: {
        Args: {
          p_dataset_id: string
          p_user_id: string
          p_target_column: string
          p_problem_type: string
          p_algorithm_choice: string
          p_auto_train: boolean
          p_auto_tune: boolean
          p_hyperparameters: Json
          p_visualization_options: Json
          p_experiment_name: string
        }
        Returns: {
          id: string
          created_at: string
          experiment_name: string
        }[]
      }
      process_dataset_overview: {
        Args: { p_dataset_id: string }
        Returns: undefined
      }
      store_experiment_file: {
        Args: {
          p_experiment_id: string
          p_file_url: string
          p_file_type: string
        }
        Returns: {
          id: string
          experiment_id: string
          file_url: string
          file_type: string
          created_at: string
        }[]
      }
      store_model_results: {
        Args: {
          p_experiment_id: string
          p_model_file_url: string
          p_report_file_url: string
          p_additional_results: Json
        }
        Returns: {
          id: string
          experiment_id: string
          model_file_url: string
          report_file_url: string
          additional_results: Json
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
