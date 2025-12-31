export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  public: {
    Tables: {
      account_lockout_status: {
        Row: {
          attempt_count: number;
          created_at: string;
          email: string;
          id: string;
          last_attempt_at: string;
          locked_until: string;
          updated_at: string;
        };
        Insert: {
          attempt_count?: number;
          created_at?: string;
          email: string;
          id?: string;
          last_attempt_at?: string;
          locked_until: string;
          updated_at?: string;
        };
        Update: {
          attempt_count?: number;
          created_at?: string;
          email?: string;
          id?: string;
          last_attempt_at?: string;
          locked_until?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      achievements: {
        Row: {
          auto_allocate: boolean | null;
          category: string;
          created_at: string;
          criteria: Json;
          description: string;
          icon_emoji: string | null;
          icon_url: string | null;
          id: string;
          is_active: boolean | null;
          max_progress: number | null;
          name: string;
          points: number | null;
          rarity: string;
          requirement_type: string | null;
          requirement_value: number | null;
          sort_order: number | null;
          updated_at: string;
        };
        Insert: {
          auto_allocate?: boolean | null;
          category: string;
          created_at?: string;
          criteria: Json;
          description: string;
          icon_emoji?: string | null;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_progress?: number | null;
          name: string;
          points?: number | null;
          rarity?: string;
          requirement_type?: string | null;
          requirement_value?: number | null;
          sort_order?: number | null;
          updated_at?: string;
        };
        Update: {
          auto_allocate?: boolean | null;
          category?: string;
          created_at?: string;
          criteria?: Json;
          description?: string;
          icon_emoji?: string | null;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_progress?: number | null;
          name?: string;
          points?: number | null;
          rarity?: string;
          requirement_type?: string | null;
          requirement_value?: number | null;
          sort_order?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_events: {
        Row: {
          created_at: string | null;
          description: string;
          device: string | null;
          event_type: string;
          id: string;
          ip_address: string | null;
          location: string | null;
          metadata: Json | null;
          user_agent: string | null;
          user_email: string | null;
          user_id: string | null;
          user_name: string | null;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          device?: string | null;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          location?: string | null;
          metadata?: Json | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          device?: string | null;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          location?: string | null;
          metadata?: Json | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      admin_family_pass_grants: {
        Row: {
          auto_renew: boolean;
          created_at: string;
          end_date: string;
          granted_at: string;
          granted_by: string;
          id: string;
          notes: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          start_date: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auto_renew?: boolean;
          created_at?: string;
          end_date: string;
          granted_at?: string;
          granted_by: string;
          id?: string;
          notes?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          start_date: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auto_renew?: boolean;
          created_at?: string;
          end_date?: string;
          granted_at?: string;
          granted_by?: string;
          id?: string;
          notes?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          start_date?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_family_pass_grants_granted_by_fkey';
            columns: ['granted_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'admin_family_pass_grants_revoked_by_fkey';
            columns: ['revoked_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'admin_family_pass_grants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      admin_settings: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_sensitive: boolean | null;
          setting_key: string;
          setting_type: string | null;
          setting_value: Json;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_sensitive?: boolean | null;
          setting_key: string;
          setting_type?: string | null;
          setting_value: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_sensitive?: boolean | null;
          setting_key?: string;
          setting_type?: string | null;
          setting_value?: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_settings_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_content_audit_log: {
        Row: {
          action: string;
          changed_at: string | null;
          changed_by: string | null;
          id: string;
          new_values: Json | null;
          old_values: Json | null;
          record_id: string;
          table_name: string;
        };
        Insert: {
          action: string;
          changed_at?: string | null;
          changed_by?: string | null;
          id?: string;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id: string;
          table_name: string;
        };
        Update: {
          action?: string;
          changed_at?: string | null;
          changed_by?: string | null;
          id?: string;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id?: string;
          table_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_content_audit_log_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_conversations: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          role: string;
          session_id: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          role: string;
          session_id?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          role?: string;
          session_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_conversations_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'ai_study_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_conversations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_generated_content: {
        Row: {
          content_type: string;
          created_at: string | null;
          generated_content: Json;
          id: string;
          instructor_id: string;
          model_used: string;
          published_at: string | null;
          source_content_id: string | null;
          source_content_type: string | null;
          status: string | null;
          tokens_used: number | null;
        };
        Insert: {
          content_type: string;
          created_at?: string | null;
          generated_content: Json;
          id?: string;
          instructor_id: string;
          model_used: string;
          published_at?: string | null;
          source_content_id?: string | null;
          source_content_type?: string | null;
          status?: string | null;
          tokens_used?: number | null;
        };
        Update: {
          content_type?: string;
          created_at?: string | null;
          generated_content?: Json;
          id?: string;
          instructor_id?: string;
          model_used?: string;
          published_at?: string | null;
          source_content_id?: string | null;
          source_content_type?: string | null;
          status?: string | null;
          tokens_used?: number | null;
        };
        Relationships: [];
      };
      ai_generated_learning_paths: {
        Row: {
          assessment_id: string | null;
          created_at: string | null;
          current_item_index: number | null;
          difficulty_end: string | null;
          difficulty_start: string | null;
          estimated_completion_weeks: number | null;
          estimated_total_hours: number | null;
          generated_by_ai: boolean | null;
          generation_algorithm: string | null;
          generation_metadata: Json | null;
          goal_id: string;
          id: string;
          is_active: boolean | null;
          is_custom_modified: boolean | null;
          items_completed: number | null;
          last_accessed_at: string | null;
          milestones_completed: number | null;
          path_description: string | null;
          path_title: string;
          progress_percentage: number | null;
          total_courses: number | null;
          total_events: number | null;
          total_exercises: number | null;
          total_items: number | null;
          total_milestones: number | null;
          total_quizzes: number | null;
          total_workshops: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          assessment_id?: string | null;
          created_at?: string | null;
          current_item_index?: number | null;
          difficulty_end?: string | null;
          difficulty_start?: string | null;
          estimated_completion_weeks?: number | null;
          estimated_total_hours?: number | null;
          generated_by_ai?: boolean | null;
          generation_algorithm?: string | null;
          generation_metadata?: Json | null;
          goal_id: string;
          id?: string;
          is_active?: boolean | null;
          is_custom_modified?: boolean | null;
          items_completed?: number | null;
          last_accessed_at?: string | null;
          milestones_completed?: number | null;
          path_description?: string | null;
          path_title: string;
          progress_percentage?: number | null;
          total_courses?: number | null;
          total_events?: number | null;
          total_exercises?: number | null;
          total_items?: number | null;
          total_milestones?: number | null;
          total_quizzes?: number | null;
          total_workshops?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          assessment_id?: string | null;
          created_at?: string | null;
          current_item_index?: number | null;
          difficulty_end?: string | null;
          difficulty_start?: string | null;
          estimated_completion_weeks?: number | null;
          estimated_total_hours?: number | null;
          generated_by_ai?: boolean | null;
          generation_algorithm?: string | null;
          generation_metadata?: Json | null;
          goal_id?: string;
          id?: string;
          is_active?: boolean | null;
          is_custom_modified?: boolean | null;
          items_completed?: number | null;
          last_accessed_at?: string | null;
          milestones_completed?: number | null;
          path_description?: string | null;
          path_title?: string;
          progress_percentage?: number | null;
          total_courses?: number | null;
          total_events?: number | null;
          total_exercises?: number | null;
          total_items?: number | null;
          total_milestones?: number | null;
          total_quizzes?: number | null;
          total_workshops?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_generated_learning_paths_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'user_ai_assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_generated_learning_paths_goal_id_fkey';
            columns: ['goal_id'];
            isOneToOne: false;
            referencedRelation: 'user_learning_goals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_generated_learning_paths_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_learning_insights: {
        Row: {
          category: string | null;
          confidence_score: number | null;
          created_at: string;
          data: Json | null;
          description: string;
          id: string;
          insight_type: string;
          title: string;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          confidence_score?: number | null;
          created_at?: string;
          data?: Json | null;
          description: string;
          id?: string;
          insight_type: string;
          title: string;
          user_id: string;
        };
        Update: {
          category?: string | null;
          confidence_score?: number | null;
          created_at?: string;
          data?: Json | null;
          description?: string;
          id?: string;
          insight_type?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_learning_insights_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_opportunity_assessments: {
        Row: {
          additional_ai_capabilities: string | null;
          ai_adoption_benefit_summary: string | null;
          ai_enhancement_description: string | null;
          company_id: string | null;
          company_mission: string | null;
          company_name: string;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string | null;
          current_ai_adoption_level: string | null;
          data_availability_rating: number | null;
          id: string;
          internal_ai_expertise: number | null;
          is_completed: boolean | null;
          overall_opportunity_rating: number | null;
          strategic_alignment_rating: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          additional_ai_capabilities?: string | null;
          ai_adoption_benefit_summary?: string | null;
          ai_enhancement_description?: string | null;
          company_id?: string | null;
          company_mission?: string | null;
          company_name: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          current_ai_adoption_level?: string | null;
          data_availability_rating?: number | null;
          id?: string;
          internal_ai_expertise?: number | null;
          is_completed?: boolean | null;
          overall_opportunity_rating?: number | null;
          strategic_alignment_rating?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          additional_ai_capabilities?: string | null;
          ai_adoption_benefit_summary?: string | null;
          ai_enhancement_description?: string | null;
          company_id?: string | null;
          company_mission?: string | null;
          company_name?: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          current_ai_adoption_level?: string | null;
          data_availability_rating?: number | null;
          id?: string;
          internal_ai_expertise?: number | null;
          is_completed?: boolean | null;
          overall_opportunity_rating?: number | null;
          strategic_alignment_rating?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_opportunity_assessments_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_opportunity_assessments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_performance_metrics: {
        Row: {
          created_at: string;
          id: string;
          metric_type: string;
          metric_value: Json;
          period_end: string;
          period_start: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metric_type: string;
          metric_value: Json;
          period_end: string;
          period_start: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          metric_type?: string;
          metric_value?: Json;
          period_end?: string;
          period_start?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_performance_metrics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_study_plans: {
        Row: {
          completion_percentage: number | null;
          created_at: string;
          description: string | null;
          end_date: string;
          id: string;
          plan_data: Json;
          start_date: string;
          status: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completion_percentage?: number | null;
          created_at?: string;
          description?: string | null;
          end_date: string;
          id?: string;
          plan_data: Json;
          start_date: string;
          status?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completion_percentage?: number | null;
          created_at?: string;
          description?: string | null;
          end_date?: string;
          id?: string;
          plan_data?: Json;
          start_date?: string;
          status?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_study_plans_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_study_recommendations: {
        Row: {
          created_at: string;
          description: string | null;
          expires_at: string | null;
          id: string;
          metadata: Json | null;
          priority: number | null;
          recommendation_type: string;
          related_assignment_id: string | null;
          related_course_id: number | null;
          status: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          metadata?: Json | null;
          priority?: number | null;
          recommendation_type: string;
          related_assignment_id?: string | null;
          related_course_id?: number | null;
          status?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          metadata?: Json | null;
          priority?: number | null;
          recommendation_type?: string;
          related_assignment_id?: string | null;
          related_course_id?: number | null;
          status?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_study_recommendations_related_course_id_fkey';
            columns: ['related_course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_study_recommendations_related_course_id_fkey';
            columns: ['related_course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_study_recommendations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_study_sessions: {
        Row: {
          context: Json | null;
          created_at: string;
          duration_minutes: number | null;
          ended_at: string | null;
          id: string;
          session_type: string;
          started_at: string;
          user_id: string;
        };
        Insert: {
          context?: Json | null;
          created_at?: string;
          duration_minutes?: number | null;
          ended_at?: string | null;
          id?: string;
          session_type: string;
          started_at?: string;
          user_id: string;
        };
        Update: {
          context?: Json | null;
          created_at?: string;
          duration_minutes?: number | null;
          ended_at?: string | null;
          id?: string;
          session_type?: string;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_study_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_system_prompts: {
        Row: {
          audience: string | null;
          category: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          key: string;
          name: string;
          prompt_template: string;
          updated_at: string | null;
          variables: Json | null;
          version: number | null;
        };
        Insert: {
          audience?: string | null;
          category: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key: string;
          name: string;
          prompt_template: string;
          updated_at?: string | null;
          variables?: Json | null;
          version?: number | null;
        };
        Update: {
          audience?: string | null;
          category?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key?: string;
          name?: string;
          prompt_template?: string;
          updated_at?: string | null;
          variables?: Json | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_system_prompts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_tools: {
        Row: {
          audience_suitability: string[] | null;
          category: string | null;
          created_at: string | null;
          description: string | null;
          difficulty_level: string | null;
          features: string[] | null;
          id: string;
          integration_options: string[] | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          logo_url: string | null;
          name: string;
          popularity_score: number | null;
          price_range: string | null;
          pricing_model: string | null;
          subcategory: string | null;
          updated_at: string | null;
          use_cases: string[] | null;
          user_rating: number | null;
          website_url: string | null;
        };
        Insert: {
          audience_suitability?: string[] | null;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          features?: string[] | null;
          id?: string;
          integration_options?: string[] | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          logo_url?: string | null;
          name: string;
          popularity_score?: number | null;
          price_range?: string | null;
          pricing_model?: string | null;
          subcategory?: string | null;
          updated_at?: string | null;
          use_cases?: string[] | null;
          user_rating?: number | null;
          website_url?: string | null;
        };
        Update: {
          audience_suitability?: string[] | null;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          features?: string[] | null;
          id?: string;
          integration_options?: string[] | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          logo_url?: string | null;
          name?: string;
          popularity_score?: number | null;
          price_range?: string | null;
          pricing_model?: string | null;
          subcategory?: string | null;
          updated_at?: string | null;
          use_cases?: string[] | null;
          user_rating?: number | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      aiborg_points_history: {
        Row: {
          description: string;
          earned_at: string;
          id: string;
          metadata: Json | null;
          points_earned: number;
          source_id: string | null;
          source_type: string;
          user_id: string;
        };
        Insert: {
          description: string;
          earned_at?: string;
          id?: string;
          metadata?: Json | null;
          points_earned: number;
          source_id?: string | null;
          source_type: string;
          user_id: string;
        };
        Update: {
          description?: string;
          earned_at?: string;
          id?: string;
          metadata?: Json | null;
          points_earned?: number;
          source_id?: string | null;
          source_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'aiborg_points_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      analytics_preferences: {
        Row: {
          auto_refresh_interval: number;
          chatbot_analytics_refresh: boolean;
          comparison_enabled: boolean | null;
          created_at: string;
          id: string;
          last_used_date_range: Json | null;
          learner_analytics_refresh: boolean;
          manager_dashboard_refresh: boolean;
          real_time_enabled: boolean;
          show_real_time_notifications: boolean;
          show_refresh_indicator: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auto_refresh_interval?: number;
          chatbot_analytics_refresh?: boolean;
          comparison_enabled?: boolean | null;
          created_at?: string;
          id?: string;
          last_used_date_range?: Json | null;
          learner_analytics_refresh?: boolean;
          manager_dashboard_refresh?: boolean;
          real_time_enabled?: boolean;
          show_real_time_notifications?: boolean;
          show_refresh_indicator?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auto_refresh_interval?: number;
          chatbot_analytics_refresh?: boolean;
          comparison_enabled?: boolean | null;
          created_at?: string;
          id?: string;
          last_used_date_range?: Json | null;
          learner_analytics_refresh?: boolean;
          manager_dashboard_refresh?: boolean;
          real_time_enabled?: boolean;
          show_real_time_notifications?: boolean;
          show_refresh_indicator?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      announcements: {
        Row: {
          audience: string | null;
          content: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          priority: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          audience?: string | null;
          content: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          priority?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          audience?: string | null;
          content?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          priority?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      api_keys: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          name: string;
          permissions: string[] | null;
          rate_limit: number | null;
          revoked_at: string | null;
          revoked_by: string | null;
          status: string;
          usage_count: number | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          name: string;
          permissions?: string[] | null;
          rate_limit?: number | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          status?: string;
          usage_count?: number | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          name?: string;
          permissions?: string[] | null;
          rate_limit?: number | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          status?: string;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'api_keys_revoked_by_fkey';
            columns: ['revoked_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      assessment_achievements: {
        Row: {
          badge_level: string | null;
          created_at: string | null;
          criteria_type: string | null;
          criteria_value: number | null;
          description: string | null;
          icon_url: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
        };
        Insert: {
          badge_level?: string | null;
          created_at?: string | null;
          criteria_type?: string | null;
          criteria_value?: number | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
        };
        Update: {
          badge_level?: string | null;
          created_at?: string | null;
          criteria_type?: string | null;
          criteria_value?: number | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
        };
        Relationships: [];
      };
      assessment_action_plans: {
        Row: {
          assessment_id: string | null;
          created_at: string | null;
          id: string;
          recommended_next_steps: string[];
        };
        Insert: {
          assessment_id?: string | null;
          created_at?: string | null;
          id?: string;
          recommended_next_steps: string[];
        };
        Update: {
          assessment_id?: string | null;
          created_at?: string | null;
          id?: string;
          recommended_next_steps?: string[];
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_action_plans_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_answer_performance: {
        Row: {
          answer_timestamp: string | null;
          assessment_id: string | null;
          created_at: string | null;
          estimated_ability_after: number | null;
          estimated_ability_before: number | null;
          id: string;
          is_correct: boolean;
          question_difficulty: number | null;
          question_id: string | null;
          time_spent_seconds: number | null;
        };
        Insert: {
          answer_timestamp?: string | null;
          assessment_id?: string | null;
          created_at?: string | null;
          estimated_ability_after?: number | null;
          estimated_ability_before?: number | null;
          id?: string;
          is_correct: boolean;
          question_difficulty?: number | null;
          question_id?: string | null;
          time_spent_seconds?: number | null;
        };
        Update: {
          answer_timestamp?: string | null;
          assessment_id?: string | null;
          created_at?: string | null;
          estimated_ability_after?: number | null;
          estimated_ability_before?: number | null;
          id?: string;
          is_correct?: boolean;
          question_difficulty?: number | null;
          question_id?: string | null;
          time_spent_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_answer_performance_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'user_ai_assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assessment_answer_performance_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_questions';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_benchmarks: {
        Row: {
          audience_type: string | null;
          average_score: number | null;
          category_id: string | null;
          id: string;
          last_calculated_at: string | null;
          median_score: number | null;
          percentile_25: number | null;
          percentile_75: number | null;
          percentile_90: number | null;
          sample_size: number | null;
        };
        Insert: {
          audience_type?: string | null;
          average_score?: number | null;
          category_id?: string | null;
          id?: string;
          last_calculated_at?: string | null;
          median_score?: number | null;
          percentile_25?: number | null;
          percentile_75?: number | null;
          percentile_90?: number | null;
          sample_size?: number | null;
        };
        Update: {
          audience_type?: string | null;
          average_score?: number | null;
          category_id?: string | null;
          id?: string;
          last_calculated_at?: string | null;
          median_score?: number | null;
          percentile_25?: number | null;
          percentile_75?: number | null;
          percentile_90?: number | null;
          sample_size?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_benchmarks_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_benefits: {
        Row: {
          ai_improvement: string;
          assessment_id: string | null;
          benefit_area: string;
          created_at: string | null;
          current_status: string;
          id: string;
          impact_rating: number | null;
        };
        Insert: {
          ai_improvement: string;
          assessment_id?: string | null;
          benefit_area: string;
          created_at?: string | null;
          current_status: string;
          id?: string;
          impact_rating?: number | null;
        };
        Update: {
          ai_improvement?: string;
          assessment_id?: string | null;
          benefit_area?: string;
          created_at?: string | null;
          current_status?: string;
          id?: string;
          impact_rating?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_benefits_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          icon: string | null;
          id: string;
          name: string;
          order_index: number | null;
          updated_at: string | null;
          weight: number | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          name: string;
          order_index?: number | null;
          updated_at?: string | null;
          weight?: number | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          name?: string;
          order_index?: number | null;
          updated_at?: string | null;
          weight?: number | null;
        };
        Relationships: [];
      };
      assessment_competitors: {
        Row: {
          advantage: string;
          ai_use_case: string;
          assessment_id: string | null;
          competitor_name: string;
          created_at: string | null;
          id: string;
          threat_level: number | null;
        };
        Insert: {
          advantage: string;
          ai_use_case: string;
          assessment_id?: string | null;
          competitor_name: string;
          created_at?: string | null;
          id?: string;
          threat_level?: number | null;
        };
        Update: {
          advantage?: string;
          ai_use_case?: string;
          assessment_id?: string | null;
          competitor_name?: string;
          created_at?: string | null;
          id?: string;
          threat_level?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_competitors_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_insights: {
        Row: {
          assessment_id: string | null;
          category_id: string | null;
          category_max_score: number | null;
          category_score: number | null;
          created_at: string | null;
          id: string;
          recommendations: string[] | null;
          strength_level: string | null;
        };
        Insert: {
          assessment_id?: string | null;
          category_id?: string | null;
          category_max_score?: number | null;
          category_score?: number | null;
          created_at?: string | null;
          id?: string;
          recommendations?: string[] | null;
          strength_level?: string | null;
        };
        Update: {
          assessment_id?: string | null;
          category_id?: string | null;
          category_max_score?: number | null;
          category_score?: number | null;
          created_at?: string | null;
          id?: string;
          recommendations?: string[] | null;
          strength_level?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_insights_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'user_ai_assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assessment_insights_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_pain_points: {
        Row: {
          ai_capability_to_address: string;
          assessment_id: string | null;
          created_at: string | null;
          current_impact: number | null;
          id: string;
          impact_after_ai: number | null;
          pain_point: string;
        };
        Insert: {
          ai_capability_to_address: string;
          assessment_id?: string | null;
          created_at?: string | null;
          current_impact?: number | null;
          id?: string;
          impact_after_ai?: number | null;
          pain_point: string;
        };
        Update: {
          ai_capability_to_address?: string;
          assessment_id?: string | null;
          created_at?: string | null;
          current_impact?: number | null;
          id?: string;
          impact_after_ai?: number | null;
          pain_point?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_pain_points_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_pairs: {
        Row: {
          completed_at: string | null;
          course_id: string | null;
          created_at: string | null;
          id: string;
          pair_type: string;
          post_assessment_id: string | null;
          pre_assessment_id: string;
          skill_id: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          course_id?: string | null;
          created_at?: string | null;
          id?: string;
          pair_type?: string;
          post_assessment_id?: string | null;
          pre_assessment_id: string;
          skill_id?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          course_id?: string | null;
          created_at?: string | null;
          id?: string;
          pair_type?: string;
          post_assessment_id?: string | null;
          pre_assessment_id?: string;
          skill_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      assessment_question_options: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_correct: boolean | null;
          option_text: string;
          option_value: string;
          order_index: number | null;
          points: number | null;
          question_id: string | null;
          tool_recommendations: string[] | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_correct?: boolean | null;
          option_text: string;
          option_value: string;
          order_index?: number | null;
          points?: number | null;
          question_id?: string | null;
          tool_recommendations?: string[] | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_correct?: boolean | null;
          option_text?: string;
          option_value?: string;
          order_index?: number | null;
          points?: number | null;
          question_id?: string | null;
          tool_recommendations?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_question_options_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_questions';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_question_pools: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          question_id: string;
          tool_id: string;
          updated_at: string | null;
          weight: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          question_id: string;
          tool_id: string;
          updated_at?: string | null;
          weight?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          question_id?: string;
          tool_id?: string;
          updated_at?: string | null;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_question_pools_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assessment_question_pools_tool_id_fkey';
            columns: ['tool_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_tools';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_questions: {
        Row: {
          audience_filters: string[] | null;
          category_id: string | null;
          cognitive_level: string | null;
          created_at: string | null;
          difficulty_level: string | null;
          help_text: string | null;
          id: string;
          irt_difficulty: number | null;
          is_active: boolean | null;
          order_index: number | null;
          points_value: number | null;
          prerequisite_concepts: string[] | null;
          question_text: string;
          question_type: string | null;
          recommended_experience_level: string | null;
          tags: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          audience_filters?: string[] | null;
          category_id?: string | null;
          cognitive_level?: string | null;
          created_at?: string | null;
          difficulty_level?: string | null;
          help_text?: string | null;
          id?: string;
          irt_difficulty?: number | null;
          is_active?: boolean | null;
          order_index?: number | null;
          points_value?: number | null;
          prerequisite_concepts?: string[] | null;
          question_text: string;
          question_type?: string | null;
          recommended_experience_level?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          audience_filters?: string[] | null;
          category_id?: string | null;
          cognitive_level?: string | null;
          created_at?: string | null;
          difficulty_level?: string | null;
          help_text?: string | null;
          id?: string;
          irt_difficulty?: number | null;
          is_active?: boolean | null;
          order_index?: number | null;
          points_value?: number | null;
          prerequisite_concepts?: string[] | null;
          question_text?: string;
          question_type?: string | null;
          recommended_experience_level?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_questions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_resources: {
        Row: {
          additional_requirements: string | null;
          assessment_id: string | null;
          created_at: string | null;
          id: string;
          is_available: boolean;
          resource_type: string;
        };
        Insert: {
          additional_requirements?: string | null;
          assessment_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_available: boolean;
          resource_type: string;
        };
        Update: {
          additional_requirements?: string | null;
          assessment_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_available?: boolean;
          resource_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_resources_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_risks: {
        Row: {
          assessment_id: string | null;
          created_at: string | null;
          id: string;
          impact_rating: number | null;
          likelihood: number | null;
          mitigation_strategy: string;
          risk_factor: string;
          specific_risk: string;
        };
        Insert: {
          assessment_id?: string | null;
          created_at?: string | null;
          id?: string;
          impact_rating?: number | null;
          likelihood?: number | null;
          mitigation_strategy: string;
          risk_factor: string;
          specific_risk: string;
        };
        Update: {
          assessment_id?: string | null;
          created_at?: string | null;
          id?: string;
          impact_rating?: number | null;
          likelihood?: number | null;
          mitigation_strategy?: string;
          risk_factor?: string;
          specific_risk?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_risks_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_stakeholders: {
        Row: {
          assessment_id: string | null;
          created_at: string | null;
          department: string;
          id: string;
          name: string;
          role: string;
          signature_date: string | null;
        };
        Insert: {
          assessment_id?: string | null;
          created_at?: string | null;
          department: string;
          id?: string;
          name: string;
          role: string;
          signature_date?: string | null;
        };
        Update: {
          assessment_id?: string | null;
          created_at?: string | null;
          department?: string;
          id?: string;
          name?: string;
          role?: string;
          signature_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_stakeholders_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      assessment_tool_attempts: {
        Row: {
          ability_estimate: number | null;
          ability_standard_error: number | null;
          assessment_id: string | null;
          attempt_number: number;
          completed_at: string | null;
          correct_answers: number | null;
          created_at: string | null;
          id: string;
          is_completed: boolean | null;
          max_possible_score: number | null;
          performance_by_category: Json | null;
          questions_answered: number | null;
          score_percentage: number | null;
          started_at: string | null;
          time_taken_seconds: number | null;
          tool_id: string;
          total_score: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          ability_estimate?: number | null;
          ability_standard_error?: number | null;
          assessment_id?: string | null;
          attempt_number?: number;
          completed_at?: string | null;
          correct_answers?: number | null;
          created_at?: string | null;
          id?: string;
          is_completed?: boolean | null;
          max_possible_score?: number | null;
          performance_by_category?: Json | null;
          questions_answered?: number | null;
          score_percentage?: number | null;
          started_at?: string | null;
          time_taken_seconds?: number | null;
          tool_id: string;
          total_score?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          ability_estimate?: number | null;
          ability_standard_error?: number | null;
          assessment_id?: string | null;
          attempt_number?: number;
          completed_at?: string | null;
          correct_answers?: number | null;
          created_at?: string | null;
          id?: string;
          is_completed?: boolean | null;
          max_possible_score?: number | null;
          performance_by_category?: Json | null;
          questions_answered?: number | null;
          score_percentage?: number | null;
          started_at?: string | null;
          time_taken_seconds?: number | null;
          tool_id?: string;
          total_score?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_tool_attempts_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'user_ai_assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assessment_tool_attempts_tool_id_fkey';
            columns: ['tool_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_tools';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assessment_tool_attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      assessment_tools: {
        Row: {
          category_type: string;
          created_at: string | null;
          description: string | null;
          difficulty_level: string | null;
          display_order: number | null;
          estimated_duration_minutes: number | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          min_questions_required: number | null;
          name: string;
          passing_score_percentage: number | null;
          slug: string;
          target_audiences: string[];
          total_questions_pool: number | null;
          updated_at: string | null;
        };
        Insert: {
          category_type: string;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          display_order?: number | null;
          estimated_duration_minutes?: number | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          min_questions_required?: number | null;
          name: string;
          passing_score_percentage?: number | null;
          slug: string;
          target_audiences?: string[];
          total_questions_pool?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category_type?: string;
          created_at?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          display_order?: number | null;
          estimated_duration_minutes?: number | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          min_questions_required?: number | null;
          name?: string;
          passing_score_percentage?: number | null;
          slug?: string;
          target_audiences?: string[];
          total_questions_pool?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      assessment_user_impacts: {
        Row: {
          ai_improvements: string;
          assessment_id: string | null;
          created_at: string | null;
          id: string;
          impact_rating: number | null;
          satisfaction_rating: number | null;
          user_group: string;
          user_pain_points: string;
        };
        Insert: {
          ai_improvements: string;
          assessment_id?: string | null;
          created_at?: string | null;
          id?: string;
          impact_rating?: number | null;
          satisfaction_rating?: number | null;
          user_group: string;
          user_pain_points: string;
        };
        Update: {
          ai_improvements?: string;
          assessment_id?: string | null;
          created_at?: string | null;
          id?: string;
          impact_rating?: number | null;
          satisfaction_rating?: number | null;
          user_group?: string;
          user_pain_points?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assessment_user_impacts_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      attendance_tickets: {
        Row: {
          badge_color: string;
          course_id: number | null;
          created_at: string;
          event_id: number | null;
          id: string;
          is_verified: boolean;
          issued_at: string;
          issued_by: string | null;
          legacy: boolean | null;
          location: string | null;
          notes: string | null;
          session_date: string;
          session_id: string | null;
          session_time: string | null;
          session_title: string;
          ticket_number: string;
          ticket_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          badge_color?: string;
          course_id?: number | null;
          created_at?: string;
          event_id?: number | null;
          id?: string;
          is_verified?: boolean;
          issued_at?: string;
          issued_by?: string | null;
          legacy?: boolean | null;
          location?: string | null;
          notes?: string | null;
          session_date: string;
          session_id?: string | null;
          session_time?: string | null;
          session_title: string;
          ticket_number: string;
          ticket_type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          badge_color?: string;
          course_id?: number | null;
          created_at?: string;
          event_id?: number | null;
          id?: string;
          is_verified?: boolean;
          issued_at?: string;
          issued_by?: string | null;
          legacy?: boolean | null;
          location?: string | null;
          notes?: string | null;
          session_date?: string;
          session_id?: string | null;
          session_time?: string | null;
          session_title?: string;
          ticket_number?: string;
          ticket_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attendance_tickets_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_tickets_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_tickets_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_tickets_issued_by_fkey';
            columns: ['issued_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'attendance_tickets_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'course_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_tickets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      background_jobs: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          created_by: string | null;
          error_message: string | null;
          id: string;
          metadata: Json | null;
          next_retry_at: string | null;
          processed_items: number | null;
          progress: number | null;
          retry_count: number | null;
          started_at: string | null;
          status: string | null;
          total_items: number | null;
          type: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          next_retry_at?: string | null;
          processed_items?: number | null;
          progress?: number | null;
          retry_count?: number | null;
          started_at?: string | null;
          status?: string | null;
          total_items?: number | null;
          type: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          next_retry_at?: string | null;
          processed_items?: number | null;
          progress?: number | null;
          retry_count?: number | null;
          started_at?: string | null;
          status?: string | null;
          total_items?: number | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'background_jobs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      blog_analytics: {
        Row: {
          avg_time_seconds: number | null;
          bounce_rate: number | null;
          comments: number | null;
          created_at: string | null;
          date: string;
          id: string;
          likes: number | null;
          post_id: string;
          shares: number | null;
          unique_visitors: number | null;
          views: number | null;
        };
        Insert: {
          avg_time_seconds?: number | null;
          bounce_rate?: number | null;
          comments?: number | null;
          created_at?: string | null;
          date: string;
          id?: string;
          likes?: number | null;
          post_id: string;
          shares?: number | null;
          unique_visitors?: number | null;
          views?: number | null;
        };
        Update: {
          avg_time_seconds?: number | null;
          bounce_rate?: number | null;
          comments?: number | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          likes?: number | null;
          post_id?: string;
          shares?: number | null;
          unique_visitors?: number | null;
          views?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_analytics_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_analytics_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_batch_jobs: {
        Row: {
          campaign_id: string | null;
          completed_at: string | null;
          completed_posts: number | null;
          created_at: string | null;
          created_by: string | null;
          error_log: Json[] | null;
          failed_posts: number | null;
          generation_params: Json | null;
          id: string;
          started_at: string | null;
          status: string | null;
          template_id: string | null;
          total_posts: number;
        };
        Insert: {
          campaign_id?: string | null;
          completed_at?: string | null;
          completed_posts?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          error_log?: Json[] | null;
          failed_posts?: number | null;
          generation_params?: Json | null;
          id?: string;
          started_at?: string | null;
          status?: string | null;
          template_id?: string | null;
          total_posts: number;
        };
        Update: {
          campaign_id?: string | null;
          completed_at?: string | null;
          completed_posts?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          error_log?: Json[] | null;
          failed_posts?: number | null;
          generation_params?: Json | null;
          id?: string;
          started_at?: string | null;
          status?: string | null;
          template_id?: string | null;
          total_posts?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_batch_jobs_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'blog_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_batch_jobs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'blog_batch_jobs_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'blog_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_bookmarks: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_bookmarks_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_bookmarks_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_bookmarks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      blog_campaigns: {
        Row: {
          actual_post_count: number | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          end_date: string | null;
          id: string;
          name: string;
          start_date: string | null;
          status: string | null;
          target_post_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          actual_post_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          name: string;
          start_date?: string | null;
          status?: string | null;
          target_post_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          actual_post_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          name?: string;
          start_date?: string | null;
          status?: string | null;
          target_post_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_campaigns_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      blog_categories: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          parent_id: string | null;
          post_count: number | null;
          slug: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          parent_id?: string | null;
          post_count?: number | null;
          slug: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          parent_id?: string | null;
          post_count?: number | null;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'blog_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_comments: {
        Row: {
          content: string;
          created_at: string | null;
          edited_at: string | null;
          flagged_count: number | null;
          id: string;
          ip_address: unknown;
          is_approved: boolean | null;
          is_edited: boolean | null;
          moderated_at: string | null;
          moderated_by: string | null;
          parent_id: string | null;
          post_id: string;
          status: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          edited_at?: string | null;
          flagged_count?: number | null;
          id?: string;
          ip_address?: unknown;
          is_approved?: boolean | null;
          is_edited?: boolean | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          parent_id?: string | null;
          post_id: string;
          status?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          edited_at?: string | null;
          flagged_count?: number | null;
          id?: string;
          ip_address?: unknown;
          is_approved?: boolean | null;
          is_edited?: boolean | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          parent_id?: string | null;
          post_id?: string;
          status?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_comments_moderated_by_fkey';
            columns: ['moderated_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'blog_comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'blog_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      blog_drafts: {
        Row: {
          author_id: string;
          category_id: string | null;
          content: string | null;
          created_at: string | null;
          excerpt: string | null;
          featured_image: string | null;
          id: string;
          is_auto_save: boolean | null;
          meta_description: string | null;
          meta_title: string | null;
          post_id: string | null;
          tags: Json | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          author_id: string;
          category_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          excerpt?: string | null;
          featured_image?: string | null;
          id?: string;
          is_auto_save?: boolean | null;
          meta_description?: string | null;
          meta_title?: string | null;
          post_id?: string | null;
          tags?: Json | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string;
          category_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          excerpt?: string | null;
          featured_image?: string | null;
          id?: string;
          is_auto_save?: boolean | null;
          meta_description?: string | null;
          meta_title?: string | null;
          post_id?: string | null;
          tags?: Json | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_drafts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'blog_drafts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'blog_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_drafts_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_drafts_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_likes: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      blog_media: {
        Row: {
          alt_text: string | null;
          caption: string | null;
          created_at: string | null;
          file_size: number;
          file_type: string;
          file_url: string;
          filename: string;
          height: number | null;
          id: string;
          is_featured: boolean | null;
          metadata: Json | null;
          original_filename: string;
          post_id: string | null;
          thumbnail_url: string | null;
          updated_at: string | null;
          uploaded_by: string | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          file_size: number;
          file_type: string;
          file_url: string;
          filename: string;
          height?: number | null;
          id?: string;
          is_featured?: boolean | null;
          metadata?: Json | null;
          original_filename: string;
          post_id?: string | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          file_size?: number;
          file_type?: string;
          file_url?: string;
          filename?: string;
          height?: number | null;
          id?: string;
          is_featured?: boolean | null;
          metadata?: Json | null;
          original_filename?: string;
          post_id?: string | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_media_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_media_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_media_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      blog_post_bookmarks: {
        Row: {
          created_at: string | null;
          id: string;
          notes: string | null;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_post_bookmarks_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_post_bookmarks_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_post_bookmarks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      blog_post_campaigns: {
        Row: {
          campaign_id: string;
          created_at: string | null;
          position_in_campaign: number | null;
          post_id: string;
        };
        Insert: {
          campaign_id: string;
          created_at?: string | null;
          position_in_campaign?: number | null;
          post_id: string;
        };
        Update: {
          campaign_id?: string;
          created_at?: string | null;
          position_in_campaign?: number | null;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_post_campaigns_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'blog_campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_post_campaigns_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_post_campaigns_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_post_likes: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_post_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_post_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_post_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      blog_post_revisions: {
        Row: {
          author_id: string | null;
          change_summary: string | null;
          content: string;
          created_at: string | null;
          excerpt: string | null;
          id: string;
          meta_description: string | null;
          meta_title: string | null;
          post_id: string;
          revision_number: number;
          title: string;
        };
        Insert: {
          author_id?: string | null;
          change_summary?: string | null;
          content: string;
          created_at?: string | null;
          excerpt?: string | null;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          post_id: string;
          revision_number: number;
          title: string;
        };
        Update: {
          author_id?: string | null;
          change_summary?: string | null;
          content?: string;
          created_at?: string | null;
          excerpt?: string | null;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          post_id?: string;
          revision_number?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_post_revisions_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'blog_post_revisions_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_post_revisions_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_post_tags: {
        Row: {
          created_at: string | null;
          post_id: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string | null;
          post_id: string;
          tag_id: string;
        };
        Update: {
          created_at?: string | null;
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_post_tags_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_post_tags_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_post_tags_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'blog_tags';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_posts: {
        Row: {
          allow_comments: boolean | null;
          author_id: string | null;
          bookmark_count: number | null;
          canonical_url: string | null;
          category: string | null;
          category_id: string | null;
          comment_count: number | null;
          content: string;
          created_at: string | null;
          custom_css: string | null;
          custom_js: string | null;
          excerpt: string | null;
          featured_image: string | null;
          id: string;
          is_featured: boolean | null;
          is_sticky: boolean | null;
          last_modified_by: string | null;
          like_count: number | null;
          meta_description: string | null;
          meta_title: string | null;
          og_description: string | null;
          og_image: string | null;
          og_title: string | null;
          published_at: string | null;
          reading_time: number | null;
          scheduled_for: string | null;
          seo_keywords: string | null;
          share_count: number | null;
          slug: string;
          status: string | null;
          tags: string[] | null;
          tenant_id: string | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          allow_comments?: boolean | null;
          author_id?: string | null;
          bookmark_count?: number | null;
          canonical_url?: string | null;
          category?: string | null;
          category_id?: string | null;
          comment_count?: number | null;
          content: string;
          created_at?: string | null;
          custom_css?: string | null;
          custom_js?: string | null;
          excerpt?: string | null;
          featured_image?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_sticky?: boolean | null;
          last_modified_by?: string | null;
          like_count?: number | null;
          meta_description?: string | null;
          meta_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          og_title?: string | null;
          published_at?: string | null;
          reading_time?: number | null;
          scheduled_for?: string | null;
          seo_keywords?: string | null;
          share_count?: number | null;
          slug: string;
          status?: string | null;
          tags?: string[] | null;
          tenant_id?: string | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          allow_comments?: boolean | null;
          author_id?: string | null;
          bookmark_count?: number | null;
          canonical_url?: string | null;
          category?: string | null;
          category_id?: string | null;
          comment_count?: number | null;
          content?: string;
          created_at?: string | null;
          custom_css?: string | null;
          custom_js?: string | null;
          excerpt?: string | null;
          featured_image?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_sticky?: boolean | null;
          last_modified_by?: string | null;
          like_count?: number | null;
          meta_description?: string | null;
          meta_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          og_title?: string | null;
          published_at?: string | null;
          reading_time?: number | null;
          scheduled_for?: string | null;
          seo_keywords?: string | null;
          share_count?: number | null;
          slug?: string;
          status?: string | null;
          tags?: string[] | null;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_posts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'blog_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_posts_last_modified_by_fkey';
            columns: ['last_modified_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'blog_posts_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_shares: {
        Row: {
          created_at: string | null;
          id: string;
          platform: string | null;
          post_id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          platform?: string | null;
          post_id: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          platform?: string | null;
          post_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_shares_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_shares_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'public_blog_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_shares_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      blog_tags: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          post_count: number | null;
          slug: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          post_count?: number | null;
          slug: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          post_count?: number | null;
          slug?: string;
        };
        Relationships: [];
      };
      blog_templates: {
        Row: {
          audience: string | null;
          category_id: string | null;
          created_at: string | null;
          created_by: string | null;
          default_tags: string[] | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          keywords: string | null;
          length: string | null;
          name: string;
          tone: string | null;
          topic_template: string;
          updated_at: string | null;
        };
        Insert: {
          audience?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_tags?: string[] | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          keywords?: string | null;
          length?: string | null;
          name: string;
          tone?: string | null;
          topic_template: string;
          updated_at?: string | null;
        };
        Update: {
          audience?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_tags?: string[] | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          keywords?: string | null;
          length?: string | null;
          name?: string;
          tone?: string | null;
          topic_template?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_templates_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'blog_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      bulk_operations: {
        Row: {
          action: string;
          completed_at: string | null;
          completed_count: number | null;
          created_at: string | null;
          created_by: string | null;
          error_log: Json | null;
          failed_count: number | null;
          id: string;
          item_count: number;
          metadata: Json | null;
          operation_type: string;
          progress: number | null;
          started_at: string | null;
          status: string;
        };
        Insert: {
          action: string;
          completed_at?: string | null;
          completed_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          error_log?: Json | null;
          failed_count?: number | null;
          id?: string;
          item_count?: number;
          metadata?: Json | null;
          operation_type: string;
          progress?: number | null;
          started_at?: string | null;
          status?: string;
        };
        Update: {
          action?: string;
          completed_at?: string | null;
          completed_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          error_log?: Json | null;
          failed_count?: number | null;
          id?: string;
          item_count?: number;
          metadata?: Json | null;
          operation_type?: string;
          progress?: number | null;
          started_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bulk_operations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      certificates: {
        Row: {
          certificate_number: string;
          certificate_url: string | null;
          course_id: number;
          created_at: string;
          final_score: number | null;
          grade: string | null;
          id: string;
          issued_date: string;
          metadata: Json | null;
          tenant_id: string | null;
          user_id: string;
          verification_code: string;
        };
        Insert: {
          certificate_number?: string;
          certificate_url?: string | null;
          course_id: number;
          created_at?: string;
          final_score?: number | null;
          grade?: string | null;
          id?: string;
          issued_date?: string;
          metadata?: Json | null;
          tenant_id?: string | null;
          user_id: string;
          verification_code?: string;
        };
        Update: {
          certificate_number?: string;
          certificate_url?: string | null;
          course_id?: number;
          created_at?: string;
          final_score?: number | null;
          grade?: string | null;
          id?: string;
          issued_date?: string;
          metadata?: Json | null;
          tenant_id?: string | null;
          user_id?: string;
          verification_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'certificates_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'certificates_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'certificates_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'certificates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      certification_controls: {
        Row: {
          category: string | null;
          certification_id: string | null;
          control_id: string;
          created_at: string | null;
          description: string | null;
          evidence_links: Json | null;
          evidence_notes: string | null;
          id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          certification_id?: string | null;
          control_id: string;
          created_at?: string | null;
          description?: string | null;
          evidence_links?: Json | null;
          evidence_notes?: string | null;
          id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          certification_id?: string | null;
          control_id?: string;
          created_at?: string | null;
          description?: string | null;
          evidence_links?: Json | null;
          evidence_notes?: string | null;
          id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'certification_controls_certification_id_fkey';
            columns: ['certification_id'];
            isOneToOne: false;
            referencedRelation: 'certifications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'certification_controls_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      certifications: {
        Row: {
          certification_type: string;
          certified_at: string | null;
          completed_controls: number | null;
          completion_percentage: number | null;
          created_at: string | null;
          description: string | null;
          expires_at: string | null;
          id: string;
          name: string;
          status: string | null;
          total_controls: number | null;
          updated_at: string | null;
        };
        Insert: {
          certification_type: string;
          certified_at?: string | null;
          completed_controls?: number | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          name: string;
          status?: string | null;
          total_controls?: number | null;
          updated_at?: string | null;
        };
        Update: {
          certification_type?: string;
          certified_at?: string | null;
          completed_controls?: number | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          name?: string;
          status?: string | null;
          total_controls?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      chatbot_conversations: {
        Row: {
          audience: string;
          created_at: string;
          ended_at: string | null;
          id: string;
          session_id: string;
          started_at: string;
          total_cost_usd: number | null;
          total_messages: number | null;
          total_tokens: number | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          audience: string;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          session_id: string;
          started_at?: string;
          total_cost_usd?: number | null;
          total_messages?: number | null;
          total_tokens?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          audience?: string;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          session_id?: string;
          started_at?: string;
          total_cost_usd?: number | null;
          total_messages?: number | null;
          total_tokens?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chatbot_conversations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      chatbot_cost_alerts: {
        Row: {
          alert_type: string;
          created_at: string;
          current_amount_usd: number | null;
          id: string;
          is_triggered: boolean | null;
          notification_sent: boolean | null;
          threshold_usd: number;
          triggered_at: string | null;
          updated_at: string;
        };
        Insert: {
          alert_type: string;
          created_at?: string;
          current_amount_usd?: number | null;
          id?: string;
          is_triggered?: boolean | null;
          notification_sent?: boolean | null;
          threshold_usd: number;
          triggered_at?: string | null;
          updated_at?: string;
        };
        Update: {
          alert_type?: string;
          created_at?: string;
          current_amount_usd?: number | null;
          id?: string;
          is_triggered?: boolean | null;
          notification_sent?: boolean | null;
          threshold_usd?: number;
          triggered_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      chatbot_daily_stats: {
        Row: {
          avg_cost_per_message_usd: number | null;
          avg_response_time_ms: number | null;
          business_messages: number | null;
          created_at: string;
          date: string;
          error_rate: number | null;
          id: string;
          p95_response_time_ms: number | null;
          p99_response_time_ms: number | null;
          primary_messages: number | null;
          professional_messages: number | null;
          secondary_messages: number | null;
          total_api_calls: number | null;
          total_completion_tokens: number | null;
          total_conversations: number | null;
          total_cost_usd: number | null;
          total_errors: number | null;
          total_fallbacks: number | null;
          total_messages: number | null;
          total_prompt_tokens: number | null;
          total_tokens: number | null;
          updated_at: string;
        };
        Insert: {
          avg_cost_per_message_usd?: number | null;
          avg_response_time_ms?: number | null;
          business_messages?: number | null;
          created_at?: string;
          date: string;
          error_rate?: number | null;
          id?: string;
          p95_response_time_ms?: number | null;
          p99_response_time_ms?: number | null;
          primary_messages?: number | null;
          professional_messages?: number | null;
          secondary_messages?: number | null;
          total_api_calls?: number | null;
          total_completion_tokens?: number | null;
          total_conversations?: number | null;
          total_cost_usd?: number | null;
          total_errors?: number | null;
          total_fallbacks?: number | null;
          total_messages?: number | null;
          total_prompt_tokens?: number | null;
          total_tokens?: number | null;
          updated_at?: string;
        };
        Update: {
          avg_cost_per_message_usd?: number | null;
          avg_response_time_ms?: number | null;
          business_messages?: number | null;
          created_at?: string;
          date?: string;
          error_rate?: number | null;
          id?: string;
          p95_response_time_ms?: number | null;
          p99_response_time_ms?: number | null;
          primary_messages?: number | null;
          professional_messages?: number | null;
          secondary_messages?: number | null;
          total_api_calls?: number | null;
          total_completion_tokens?: number | null;
          total_conversations?: number | null;
          total_cost_usd?: number | null;
          total_errors?: number | null;
          total_fallbacks?: number | null;
          total_messages?: number | null;
          total_prompt_tokens?: number | null;
          total_tokens?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      chatbot_messages: {
        Row: {
          audience: string;
          completion_tokens: number | null;
          content: string;
          conversation_id: string | null;
          cost_usd: number | null;
          created_at: string;
          error_message: string | null;
          id: string;
          is_error: boolean | null;
          is_fallback: boolean | null;
          model: string | null;
          prompt_tokens: number | null;
          response_time_ms: number | null;
          role: string;
          total_tokens: number | null;
        };
        Insert: {
          audience: string;
          completion_tokens?: number | null;
          content: string;
          conversation_id?: string | null;
          cost_usd?: number | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          is_error?: boolean | null;
          is_fallback?: boolean | null;
          model?: string | null;
          prompt_tokens?: number | null;
          response_time_ms?: number | null;
          role: string;
          total_tokens?: number | null;
        };
        Update: {
          audience?: string;
          completion_tokens?: number | null;
          content?: string;
          conversation_id?: string | null;
          cost_usd?: number | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          is_error?: boolean | null;
          is_fallback?: boolean | null;
          model?: string | null;
          prompt_tokens?: number | null;
          response_time_ms?: number | null;
          role?: string;
          total_tokens?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chatbot_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'chatbot_conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      classroom_presence: {
        Row: {
          created_at: string;
          current_position: string | null;
          id: string;
          is_active: boolean | null;
          joined_at: string;
          last_seen: string;
          metadata: Json | null;
          session_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_position?: string | null;
          id?: string;
          is_active?: boolean | null;
          joined_at?: string;
          last_seen?: string;
          metadata?: Json | null;
          session_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_position?: string | null;
          id?: string;
          is_active?: boolean | null;
          joined_at?: string;
          last_seen?: string;
          metadata?: Json | null;
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'classroom_presence_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'classroom_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'classroom_presence_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      classroom_progress_events: {
        Row: {
          created_at: string;
          event_data: Json | null;
          event_type: string;
          id: string;
          session_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          session_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'classroom_progress_events_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'classroom_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'classroom_progress_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      classroom_questions: {
        Row: {
          answer_text: string | null;
          answered_at: string | null;
          answered_by: string | null;
          created_at: string;
          id: string;
          is_pinned: boolean | null;
          is_resolved: boolean | null;
          priority: number | null;
          question_context: string | null;
          question_text: string;
          session_id: string;
          updated_at: string;
          upvotes: number | null;
          user_id: string;
        };
        Insert: {
          answer_text?: string | null;
          answered_at?: string | null;
          answered_by?: string | null;
          created_at?: string;
          id?: string;
          is_pinned?: boolean | null;
          is_resolved?: boolean | null;
          priority?: number | null;
          question_context?: string | null;
          question_text: string;
          session_id: string;
          updated_at?: string;
          upvotes?: number | null;
          user_id: string;
        };
        Update: {
          answer_text?: string | null;
          answered_at?: string | null;
          answered_by?: string | null;
          created_at?: string;
          id?: string;
          is_pinned?: boolean | null;
          is_resolved?: boolean | null;
          priority?: number | null;
          question_context?: string | null;
          question_text?: string;
          session_id?: string;
          updated_at?: string;
          upvotes?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'classroom_questions_answered_by_fkey';
            columns: ['answered_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'classroom_questions_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'classroom_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'classroom_questions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      classroom_sessions: {
        Row: {
          course_id: number;
          created_at: string;
          ended_at: string | null;
          id: string;
          instructor_id: string;
          is_active: boolean | null;
          lesson_id: string | null;
          lesson_title: string | null;
          review_requests_count: number | null;
          review_requests_sent_at: string | null;
          session_metadata: Json | null;
          started_at: string;
          updated_at: string;
        };
        Insert: {
          course_id: number;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          instructor_id: string;
          is_active?: boolean | null;
          lesson_id?: string | null;
          lesson_title?: string | null;
          review_requests_count?: number | null;
          review_requests_sent_at?: string | null;
          session_metadata?: Json | null;
          started_at?: string;
          updated_at?: string;
        };
        Update: {
          course_id?: number;
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          instructor_id?: string;
          is_active?: boolean | null;
          lesson_id?: string | null;
          lesson_title?: string | null;
          review_requests_count?: number | null;
          review_requests_sent_at?: string | null;
          session_metadata?: Json | null;
          started_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'classroom_sessions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'classroom_sessions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'classroom_sessions_instructor_id_fkey';
            columns: ['instructor_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      cms_content: {
        Row: {
          content_key: string;
          content_type: string;
          content_value: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          section_name: string;
          updated_at: string;
        };
        Insert: {
          content_key: string;
          content_type: string;
          content_value: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          section_name: string;
          updated_at?: string;
        };
        Update: {
          content_key?: string;
          content_type?: string;
          content_value?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          section_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_profiles: {
        Row: {
          address: string | null;
          company_name: string;
          company_size: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          industry: string | null;
          logo_url: string | null;
          phone: string | null;
          updated_at: string | null;
          user_id: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          company_name: string;
          company_size?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          industry?: string | null;
          logo_url?: string | null;
          phone?: string | null;
          updated_at?: string | null;
          user_id: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          company_name?: string;
          company_size?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          industry?: string | null;
          logo_url?: string | null;
          phone?: string | null;
          updated_at?: string | null;
          user_id?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'company_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      contact_messages: {
        Row: {
          audience: string;
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          responded_at: string | null;
          response_notes: string | null;
          status: string;
          subject: string | null;
        };
        Insert: {
          audience: string;
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          responded_at?: string | null;
          response_notes?: string | null;
          status?: string;
          subject?: string | null;
        };
        Update: {
          audience?: string;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          responded_at?: string | null;
          response_notes?: string | null;
          status?: string;
          subject?: string | null;
        };
        Relationships: [];
      };
      content_embeddings: {
        Row: {
          content: string;
          content_id: string;
          content_tokens: number | null;
          content_type: string;
          created_at: string | null;
          embedding: string | null;
          id: string;
          metadata: Json | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          content_id: string;
          content_tokens?: number | null;
          content_type: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          content_id?: string;
          content_tokens?: number | null;
          content_type?: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      content_gap_analysis: {
        Row: {
          acknowledged_at: string | null;
          analyzed_at: string | null;
          course_id: string;
          gaps_identified: Json;
          id: string;
          instructor_acknowledged: boolean | null;
          recommendations: Json;
        };
        Insert: {
          acknowledged_at?: string | null;
          analyzed_at?: string | null;
          course_id: string;
          gaps_identified: Json;
          id?: string;
          instructor_acknowledged?: boolean | null;
          recommendations: Json;
        };
        Update: {
          acknowledged_at?: string | null;
          analyzed_at?: string | null;
          course_id?: string;
          gaps_identified?: Json;
          id?: string;
          instructor_acknowledged?: boolean | null;
          recommendations?: Json;
        };
        Relationships: [];
      };
      content_templates: {
        Row: {
          category: string;
          content_type: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          key: string;
          name: string;
          templates: Json;
          updated_at: string | null;
          variables: Json | null;
        };
        Insert: {
          category: string;
          content_type: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key: string;
          name: string;
          templates: Json;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Update: {
          category?: string;
          content_type?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key?: string;
          name?: string;
          templates?: Json;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'content_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      content_views: {
        Row: {
          completion_status: string | null;
          content_id: string;
          content_type: string;
          course_id: number | null;
          created_at: string;
          duration_seconds: number | null;
          ended_at: string | null;
          id: string;
          metadata: Json | null;
          progress_percentage: number | null;
          started_at: string;
          user_id: string;
        };
        Insert: {
          completion_status?: string | null;
          content_id: string;
          content_type: string;
          course_id?: number | null;
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          metadata?: Json | null;
          progress_percentage?: number | null;
          started_at?: string;
          user_id: string;
        };
        Update: {
          completion_status?: string | null;
          content_id?: string;
          content_type?: string;
          course_id?: number | null;
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          metadata?: Json | null;
          progress_percentage?: number | null;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'content_views_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'content_views_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'content_views_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      course_audiences: {
        Row: {
          audience: string;
          course_id: number;
          created_at: string;
          id: number;
        };
        Insert: {
          audience: string;
          course_id: number;
          created_at?: string;
          id?: number;
        };
        Update: {
          audience?: string;
          course_id?: number;
          created_at?: string;
          id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'course_audiences_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_audiences_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
        ];
      };
      course_materials: {
        Row: {
          course_id: number;
          created_at: string;
          description: string | null;
          duration: number | null;
          file_size: number | null;
          file_url: string;
          id: string;
          is_active: boolean;
          material_type: string;
          sort_order: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          course_id: number;
          created_at?: string;
          description?: string | null;
          duration?: number | null;
          file_size?: number | null;
          file_url: string;
          id?: string;
          is_active?: boolean;
          material_type: string;
          sort_order?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          course_id?: number;
          created_at?: string;
          description?: string | null;
          duration?: number | null;
          file_size?: number | null;
          file_url?: string;
          id?: string;
          is_active?: boolean;
          material_type?: string;
          sort_order?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_sessions: {
        Row: {
          check_in_enabled: boolean | null;
          check_in_window_end: string | null;
          check_in_window_start: string | null;
          course_id: number;
          created_at: string | null;
          current_attendance: number | null;
          description: string | null;
          end_time: string;
          id: string;
          instructor_notes: string | null;
          location: string | null;
          max_capacity: number | null;
          meeting_url: string | null;
          session_date: string;
          session_number: number;
          session_type: string;
          start_time: string;
          status: string;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          check_in_enabled?: boolean | null;
          check_in_window_end?: string | null;
          check_in_window_start?: string | null;
          course_id: number;
          created_at?: string | null;
          current_attendance?: number | null;
          description?: string | null;
          end_time: string;
          id?: string;
          instructor_notes?: string | null;
          location?: string | null;
          max_capacity?: number | null;
          meeting_url?: string | null;
          session_date: string;
          session_number: number;
          session_type?: string;
          start_time: string;
          status?: string;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          check_in_enabled?: boolean | null;
          check_in_window_end?: string | null;
          check_in_window_start?: string | null;
          course_id?: number;
          created_at?: string | null;
          current_attendance?: number | null;
          description?: string | null;
          end_time?: string;
          id?: string;
          instructor_notes?: string | null;
          location?: string | null;
          max_capacity?: number | null;
          meeting_url?: string | null;
          session_date?: string;
          session_number?: number;
          session_type?: string;
          start_time?: string;
          status?: string;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'course_sessions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_sessions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
        ];
      };
      courses: {
        Row: {
          audience: string;
          audiences_migrated: boolean | null;
          category: string;
          created_at: string;
          currently_enrolling: boolean;
          description: string;
          display: boolean;
          duration: string;
          end_date: string | null;
          enrollment_count: number | null;
          features: string[];
          id: number;
          instructor_id: string | null;
          is_active: boolean;
          keywords: string[];
          level: string;
          max_capacity: number | null;
          mode: string;
          prerequisites: string | null;
          price: string;
          review_requests_count: number | null;
          review_requests_sent_at: string | null;
          sort_order: number | null;
          start_date: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          audience: string;
          audiences_migrated?: boolean | null;
          category: string;
          created_at?: string;
          currently_enrolling?: boolean;
          description: string;
          display?: boolean;
          duration: string;
          end_date?: string | null;
          enrollment_count?: number | null;
          features?: string[];
          id?: number;
          instructor_id?: string | null;
          is_active?: boolean;
          keywords?: string[];
          level: string;
          max_capacity?: number | null;
          mode?: string;
          prerequisites?: string | null;
          price: string;
          review_requests_count?: number | null;
          review_requests_sent_at?: string | null;
          sort_order?: number | null;
          start_date: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          audience?: string;
          audiences_migrated?: boolean | null;
          category?: string;
          created_at?: string;
          currently_enrolling?: boolean;
          description?: string;
          display?: boolean;
          duration?: string;
          end_date?: string | null;
          enrollment_count?: number | null;
          features?: string[];
          id?: number;
          instructor_id?: string | null;
          is_active?: boolean;
          keywords?: string[];
          level?: string;
          max_capacity?: number | null;
          mode?: string;
          prerequisites?: string | null;
          price?: string;
          review_requests_count?: number | null;
          review_requests_sent_at?: string | null;
          sort_order?: number | null;
          start_date?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_instructor_id_fkey';
            columns: ['instructor_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'courses_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      email_campaigns: {
        Row: {
          bounce_count: number | null;
          click_count: number | null;
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          name: string;
          open_count: number | null;
          recipient_count: number | null;
          recipient_segment: Json | null;
          recipient_type: string;
          scheduled_at: string | null;
          sent_at: string | null;
          sent_count: number | null;
          status: string;
          subject: string;
          template_id: string | null;
          unsubscribe_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          bounce_count?: number | null;
          click_count?: number | null;
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          name: string;
          open_count?: number | null;
          recipient_count?: number | null;
          recipient_segment?: Json | null;
          recipient_type?: string;
          scheduled_at?: string | null;
          sent_at?: string | null;
          sent_count?: number | null;
          status?: string;
          subject: string;
          template_id?: string | null;
          unsubscribe_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          bounce_count?: number | null;
          click_count?: number | null;
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          name?: string;
          open_count?: number | null;
          recipient_count?: number | null;
          recipient_segment?: Json | null;
          recipient_type?: string;
          scheduled_at?: string | null;
          sent_at?: string | null;
          sent_count?: number | null;
          status?: string;
          subject?: string;
          template_id?: string | null;
          unsubscribe_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_campaigns_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      engagement_metrics: {
        Row: {
          action_data: Json | null;
          action_type: string;
          created_at: string | null;
          id: string;
          page_path: string;
          session_id: string | null;
          timestamp: string | null;
          user_id: string | null;
        };
        Insert: {
          action_data?: Json | null;
          action_type: string;
          created_at?: string | null;
          id?: string;
          page_path: string;
          session_id?: string | null;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Update: {
          action_data?: Json | null;
          action_type?: string;
          created_at?: string | null;
          id?: string;
          page_path?: string;
          session_id?: string | null;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'engagement_metrics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      enrollments: {
        Row: {
          ai_insights: Json | null;
          course_id: number;
          created_at: string;
          enrolled_at: string;
          id: string;
          payment_amount: number | null;
          payment_status: string;
          tenant_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_insights?: Json | null;
          course_id: number;
          created_at?: string;
          enrolled_at?: string;
          id?: string;
          payment_amount?: number | null;
          payment_status?: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_insights?: Json | null;
          course_id?: number;
          created_at?: string;
          enrolled_at?: string;
          id?: string;
          payment_amount?: number | null;
          payment_status?: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'enrollments_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enrollments_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enrollments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enrollments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      event_photos: {
        Row: {
          created_at: string;
          display_order: number | null;
          event_id: number;
          id: string;
          photo_caption: string | null;
          photo_url: string;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          display_order?: number | null;
          event_id: number;
          id?: string;
          photo_caption?: string | null;
          photo_url: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          display_order?: number | null;
          event_id?: number;
          id?: string;
          photo_caption?: string | null;
          photo_url?: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'event_photos_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_photos_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      event_registrations: {
        Row: {
          attended_at: string | null;
          event_id: number | null;
          id: number;
          registered_at: string | null;
          registration_status: string | null;
          user_id: string | null;
        };
        Insert: {
          attended_at?: string | null;
          event_id?: number | null;
          id?: number;
          registered_at?: string | null;
          registration_status?: string | null;
          user_id?: string | null;
        };
        Update: {
          attended_at?: string | null;
          event_id?: number | null;
          id?: number;
          registered_at?: string | null;
          registration_status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'event_registrations_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_registrations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      event_reviews: {
        Row: {
          approved: boolean | null;
          comment: string | null;
          created_at: string | null;
          display: boolean | null;
          display_preference: string | null;
          event_date_attended: string | null;
          event_id: number | null;
          event_mode: string | null;
          helpful_count: number | null;
          id: number;
          rating: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          approved?: boolean | null;
          comment?: string | null;
          created_at?: string | null;
          display?: boolean | null;
          display_preference?: string | null;
          event_date_attended?: string | null;
          event_id?: number | null;
          event_mode?: string | null;
          helpful_count?: number | null;
          id?: number;
          rating: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          approved?: boolean | null;
          comment?: string | null;
          created_at?: string | null;
          display?: boolean | null;
          display_preference?: string | null;
          event_date_attended?: string | null;
          event_id?: number | null;
          event_mode?: string | null;
          helpful_count?: number | null;
          id?: number;
          rating?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'event_reviews_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      event_series_registrations: {
        Row: {
          auto_generate_tickets: boolean | null;
          created_at: string | null;
          event_id: number;
          id: string;
          notes: string | null;
          payment_amount: number | null;
          payment_method: string | null;
          payment_status: string | null;
          registered_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          auto_generate_tickets?: boolean | null;
          created_at?: string | null;
          event_id: number;
          id?: string;
          notes?: string | null;
          payment_amount?: number | null;
          payment_method?: string | null;
          payment_status?: string | null;
          registered_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          auto_generate_tickets?: boolean | null;
          created_at?: string | null;
          event_id?: number;
          id?: string;
          notes?: string | null;
          payment_amount?: number | null;
          payment_method?: string | null;
          payment_status?: string | null;
          registered_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_series_registrations_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_series_registrations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      event_session_tickets: {
        Row: {
          check_in_method: string | null;
          checked_in_at: string | null;
          checked_in_by: string | null;
          claimed_at: string | null;
          created_at: string | null;
          event_id: number;
          id: string;
          notes: string | null;
          qr_code: string;
          session_id: string;
          status: string | null;
          ticket_number: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          check_in_method?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          claimed_at?: string | null;
          created_at?: string | null;
          event_id: number;
          id?: string;
          notes?: string | null;
          qr_code: string;
          session_id: string;
          status?: string | null;
          ticket_number: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          check_in_method?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          claimed_at?: string | null;
          created_at?: string | null;
          event_id?: number;
          id?: string;
          notes?: string | null;
          qr_code?: string;
          session_id?: string;
          status?: string | null;
          ticket_number?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_session_tickets_checked_in_by_fkey';
            columns: ['checked_in_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'event_session_tickets_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_session_tickets_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'event_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_session_tickets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      event_sessions: {
        Row: {
          check_in_enabled: boolean | null;
          check_in_window_end: string | null;
          check_in_window_start: string | null;
          created_at: string | null;
          current_registrations: number | null;
          description: string | null;
          end_time: string;
          event_id: number;
          host_notes: string | null;
          id: string;
          location: string | null;
          max_capacity: number | null;
          meeting_url: string | null;
          session_date: string;
          session_number: number;
          session_type: string | null;
          start_time: string;
          status: string | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          check_in_enabled?: boolean | null;
          check_in_window_end?: string | null;
          check_in_window_start?: string | null;
          created_at?: string | null;
          current_registrations?: number | null;
          description?: string | null;
          end_time: string;
          event_id: number;
          host_notes?: string | null;
          id?: string;
          location?: string | null;
          max_capacity?: number | null;
          meeting_url?: string | null;
          session_date: string;
          session_number: number;
          session_type?: string | null;
          start_time: string;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          check_in_enabled?: boolean | null;
          check_in_window_end?: string | null;
          check_in_window_start?: string | null;
          created_at?: string | null;
          current_registrations?: number | null;
          description?: string | null;
          end_time?: string;
          event_id?: number;
          host_notes?: string | null;
          id?: string;
          location?: string | null;
          max_capacity?: number | null;
          meeting_url?: string | null;
          session_date?: string;
          session_number?: number;
          session_type?: string | null;
          start_time?: string;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'event_sessions_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          activities: string[];
          category: string;
          created_at: string;
          current_registrations: number | null;
          description: string;
          display: boolean;
          end_time: string;
          event_date: string;
          event_time: string | null;
          event_type: string | null;
          id: number;
          is_active: boolean;
          is_past: boolean;
          is_series: boolean | null;
          is_visible: boolean;
          location: string;
          max_capacity: number | null;
          meeting_url: string | null;
          price: number;
          recurrence_pattern: Json | null;
          registration_count: number | null;
          review_requests_count: number | null;
          review_requests_sent_at: string | null;
          series_name: string | null;
          start_time: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          activities?: string[];
          category?: string;
          created_at?: string;
          current_registrations?: number | null;
          description: string;
          display?: boolean;
          end_time: string;
          event_date: string;
          event_time?: string | null;
          event_type?: string | null;
          id?: number;
          is_active?: boolean;
          is_past?: boolean;
          is_series?: boolean | null;
          is_visible?: boolean;
          location: string;
          max_capacity?: number | null;
          meeting_url?: string | null;
          price: number;
          recurrence_pattern?: Json | null;
          registration_count?: number | null;
          review_requests_count?: number | null;
          review_requests_sent_at?: string | null;
          series_name?: string | null;
          start_time: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          activities?: string[];
          category?: string;
          created_at?: string;
          current_registrations?: number | null;
          description?: string;
          display?: boolean;
          end_time?: string;
          event_date?: string;
          event_time?: string | null;
          event_type?: string | null;
          id?: number;
          is_active?: boolean;
          is_past?: boolean;
          is_series?: boolean | null;
          is_visible?: boolean;
          location?: string;
          max_capacity?: number | null;
          meeting_url?: string | null;
          price?: number;
          recurrence_pattern?: Json | null;
          registration_count?: number | null;
          review_requests_count?: number | null;
          review_requests_sent_at?: string | null;
          series_name?: string | null;
          start_time?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      exercise_submissions: {
        Row: {
          auto_grade_results: Json | null;
          code_content: string | null;
          created_at: string;
          exercise_id: string;
          feedback: string | null;
          file_urls: string[] | null;
          graded_at: string | null;
          graded_by: string | null;
          id: string;
          passed: boolean | null;
          points_awarded: number | null;
          programming_language: string | null;
          score_earned: number | null;
          score_percentage: number | null;
          status: string | null;
          submission_text: string | null;
          submitted_at: string | null;
          tenant_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auto_grade_results?: Json | null;
          code_content?: string | null;
          created_at?: string;
          exercise_id: string;
          feedback?: string | null;
          file_urls?: string[] | null;
          graded_at?: string | null;
          graded_by?: string | null;
          id?: string;
          passed?: boolean | null;
          points_awarded?: number | null;
          programming_language?: string | null;
          score_earned?: number | null;
          score_percentage?: number | null;
          status?: string | null;
          submission_text?: string | null;
          submitted_at?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auto_grade_results?: Json | null;
          code_content?: string | null;
          created_at?: string;
          exercise_id?: string;
          feedback?: string | null;
          file_urls?: string[] | null;
          graded_at?: string | null;
          graded_by?: string | null;
          id?: string;
          passed?: boolean | null;
          points_awarded?: number | null;
          programming_language?: string | null;
          score_earned?: number | null;
          score_percentage?: number | null;
          status?: string | null;
          submission_text?: string | null;
          submitted_at?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercise_submissions_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exercise_submissions_graded_by_fkey';
            columns: ['graded_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'exercise_submissions_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exercise_submissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      exercises: {
        Row: {
          allowed_file_types: string[] | null;
          auto_grade: boolean | null;
          course_id: number;
          created_at: string;
          created_by: string | null;
          description: string;
          difficulty_level: string | null;
          estimated_time_minutes: number | null;
          id: string;
          instructions: string;
          is_published: boolean | null;
          max_file_size_mb: number | null;
          order_index: number | null;
          points_reward: number | null;
          rubric: Json | null;
          test_cases: Json | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          allowed_file_types?: string[] | null;
          auto_grade?: boolean | null;
          course_id: number;
          created_at?: string;
          created_by?: string | null;
          description: string;
          difficulty_level?: string | null;
          estimated_time_minutes?: number | null;
          id?: string;
          instructions: string;
          is_published?: boolean | null;
          max_file_size_mb?: number | null;
          order_index?: number | null;
          points_reward?: number | null;
          rubric?: Json | null;
          test_cases?: Json | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          allowed_file_types?: string[] | null;
          auto_grade?: boolean | null;
          course_id?: number;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          difficulty_level?: string | null;
          estimated_time_minutes?: number | null;
          id?: string;
          instructions?: string;
          is_published?: boolean | null;
          max_file_size_mb?: number | null;
          order_index?: number | null;
          points_reward?: number | null;
          rubric?: Json | null;
          test_cases?: Json | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercises_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exercises_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exercises_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      experiment_assignments: {
        Row: {
          assigned_at: string | null;
          assignment_reason: string | null;
          experiment_id: string | null;
          exposure_count: number | null;
          first_exposure_at: string | null;
          id: string;
          last_exposure_at: string | null;
          user_id: string;
          variant_id: string | null;
        };
        Insert: {
          assigned_at?: string | null;
          assignment_reason?: string | null;
          experiment_id?: string | null;
          exposure_count?: number | null;
          first_exposure_at?: string | null;
          id?: string;
          last_exposure_at?: string | null;
          user_id: string;
          variant_id?: string | null;
        };
        Update: {
          assigned_at?: string | null;
          assignment_reason?: string | null;
          experiment_id?: string | null;
          exposure_count?: number | null;
          first_exposure_at?: string | null;
          id?: string;
          last_exposure_at?: string | null;
          user_id?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'experiment_assignments_experiment_id_fkey';
            columns: ['experiment_id'];
            isOneToOne: false;
            referencedRelation: 'experiments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'experiment_assignments_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'experiment_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      experiment_events: {
        Row: {
          created_at: string | null;
          event_metadata: Json | null;
          event_name: string | null;
          event_type: string;
          event_value: number | null;
          experiment_id: string | null;
          id: string;
          user_id: string;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_metadata?: Json | null;
          event_name?: string | null;
          event_type: string;
          event_value?: number | null;
          experiment_id?: string | null;
          id?: string;
          user_id: string;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_metadata?: Json | null;
          event_name?: string | null;
          event_type?: string;
          event_value?: number | null;
          experiment_id?: string | null;
          id?: string;
          user_id?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'experiment_events_experiment_id_fkey';
            columns: ['experiment_id'];
            isOneToOne: false;
            referencedRelation: 'experiments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'experiment_events_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'experiment_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      experiment_metrics: {
        Row: {
          calculated_at: string | null;
          confidence_interval_lower: number | null;
          confidence_interval_upper: number | null;
          conversion_rate: number | null;
          converted_users: number | null;
          experiment_id: string | null;
          exposed_users: number | null;
          exposure_rate: number | null;
          id: string;
          is_significant: boolean | null;
          lift_vs_control: number | null;
          metric_mean: number | null;
          metric_median: number | null;
          metric_std_dev: number | null;
          p_value: number | null;
          total_users: number | null;
          variant_id: string | null;
        };
        Insert: {
          calculated_at?: string | null;
          confidence_interval_lower?: number | null;
          confidence_interval_upper?: number | null;
          conversion_rate?: number | null;
          converted_users?: number | null;
          experiment_id?: string | null;
          exposed_users?: number | null;
          exposure_rate?: number | null;
          id?: string;
          is_significant?: boolean | null;
          lift_vs_control?: number | null;
          metric_mean?: number | null;
          metric_median?: number | null;
          metric_std_dev?: number | null;
          p_value?: number | null;
          total_users?: number | null;
          variant_id?: string | null;
        };
        Update: {
          calculated_at?: string | null;
          confidence_interval_lower?: number | null;
          confidence_interval_upper?: number | null;
          conversion_rate?: number | null;
          converted_users?: number | null;
          experiment_id?: string | null;
          exposed_users?: number | null;
          exposure_rate?: number | null;
          id?: string;
          is_significant?: boolean | null;
          lift_vs_control?: number | null;
          metric_mean?: number | null;
          metric_median?: number | null;
          metric_std_dev?: number | null;
          p_value?: number | null;
          total_users?: number | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'experiment_metrics_experiment_id_fkey';
            columns: ['experiment_id'];
            isOneToOne: false;
            referencedRelation: 'experiments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'experiment_metrics_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'experiment_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      experiment_variants: {
        Row: {
          config: Json | null;
          created_at: string | null;
          description: string | null;
          experiment_id: string | null;
          id: string;
          is_control: boolean | null;
          name: string;
          weight: number | null;
        };
        Insert: {
          config?: Json | null;
          created_at?: string | null;
          description?: string | null;
          experiment_id?: string | null;
          id?: string;
          is_control?: boolean | null;
          name: string;
          weight?: number | null;
        };
        Update: {
          config?: Json | null;
          created_at?: string | null;
          description?: string | null;
          experiment_id?: string | null;
          id?: string;
          is_control?: boolean | null;
          name?: string;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'experiment_variants_experiment_id_fkey';
            columns: ['experiment_id'];
            isOneToOne: false;
            referencedRelation: 'experiments';
            referencedColumns: ['id'];
          },
        ];
      };
      experiments: {
        Row: {
          concluded_at: string | null;
          conclusion_notes: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          end_date: string | null;
          hypothesis: string | null;
          id: string;
          minimum_effect_size: number | null;
          minimum_sample_size: number | null;
          name: string;
          primary_metric: string;
          secondary_metrics: Json | null;
          start_date: string | null;
          status: string;
          target_audience: Json | null;
          traffic_percentage: number | null;
          updated_at: string | null;
          winner_variant_id: string | null;
        };
        Insert: {
          concluded_at?: string | null;
          conclusion_notes?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          hypothesis?: string | null;
          id?: string;
          minimum_effect_size?: number | null;
          minimum_sample_size?: number | null;
          name: string;
          primary_metric: string;
          secondary_metrics?: Json | null;
          start_date?: string | null;
          status?: string;
          target_audience?: Json | null;
          traffic_percentage?: number | null;
          updated_at?: string | null;
          winner_variant_id?: string | null;
        };
        Update: {
          concluded_at?: string | null;
          conclusion_notes?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          hypothesis?: string | null;
          id?: string;
          minimum_effect_size?: number | null;
          minimum_sample_size?: number | null;
          name?: string;
          primary_metric?: string;
          secondary_metrics?: Json | null;
          start_date?: string | null;
          status?: string;
          target_audience?: Json | null;
          traffic_percentage?: number | null;
          updated_at?: string | null;
          winner_variant_id?: string | null;
        };
        Relationships: [];
      };
      explanation_cache: {
        Row: {
          avg_rating: number | null;
          created_at: string | null;
          explanation_text: string;
          hit_count: number | null;
          id: string;
          learning_style: string | null;
          question_id: string;
          updated_at: string | null;
          wrong_answer_pattern: string;
        };
        Insert: {
          avg_rating?: number | null;
          created_at?: string | null;
          explanation_text: string;
          hit_count?: number | null;
          id?: string;
          learning_style?: string | null;
          question_id: string;
          updated_at?: string | null;
          wrong_answer_pattern: string;
        };
        Update: {
          avg_rating?: number | null;
          created_at?: string | null;
          explanation_text?: string;
          hit_count?: number | null;
          id?: string;
          learning_style?: string | null;
          question_id?: string;
          updated_at?: string | null;
          wrong_answer_pattern?: string;
        };
        Relationships: [];
      };
      failed_login_attempts: {
        Row: {
          attempted_at: string;
          created_at: string;
          email: string;
          id: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          attempted_at?: string;
          created_at?: string;
          email: string;
          id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          attempted_at?: string;
          created_at?: string;
          email?: string;
          id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          access_level: string;
          can_manage_subscription: boolean;
          courses_completed_count: number | null;
          courses_enrolled_count: number | null;
          created_at: string | null;
          events_attended: number | null;
          id: string;
          invitation_accepted_at: string | null;
          invitation_expires_at: string | null;
          invitation_reminders_sent: number | null;
          invitation_sent_at: string | null;
          invitation_token: string | null;
          last_login_at: string | null;
          member_age: number | null;
          member_date_of_birth: string | null;
          member_email: string;
          member_name: string;
          member_user_id: string | null;
          primary_user_id: string;
          relationship: Database['public']['Enums']['family_relationship'];
          removed_at: string | null;
          status: Database['public']['Enums']['family_member_status'];
          subscription_id: string;
          updated_at: string | null;
          vault_items_viewed: number | null;
        };
        Insert: {
          access_level?: string;
          can_manage_subscription?: boolean;
          courses_completed_count?: number | null;
          courses_enrolled_count?: number | null;
          created_at?: string | null;
          events_attended?: number | null;
          id?: string;
          invitation_accepted_at?: string | null;
          invitation_expires_at?: string | null;
          invitation_reminders_sent?: number | null;
          invitation_sent_at?: string | null;
          invitation_token?: string | null;
          last_login_at?: string | null;
          member_age?: number | null;
          member_date_of_birth?: string | null;
          member_email: string;
          member_name: string;
          member_user_id?: string | null;
          primary_user_id: string;
          relationship: Database['public']['Enums']['family_relationship'];
          removed_at?: string | null;
          status?: Database['public']['Enums']['family_member_status'];
          subscription_id: string;
          updated_at?: string | null;
          vault_items_viewed?: number | null;
        };
        Update: {
          access_level?: string;
          can_manage_subscription?: boolean;
          courses_completed_count?: number | null;
          courses_enrolled_count?: number | null;
          created_at?: string | null;
          events_attended?: number | null;
          id?: string;
          invitation_accepted_at?: string | null;
          invitation_expires_at?: string | null;
          invitation_reminders_sent?: number | null;
          invitation_sent_at?: string | null;
          invitation_token?: string | null;
          last_login_at?: string | null;
          member_age?: number | null;
          member_date_of_birth?: string | null;
          member_email?: string;
          member_name?: string;
          member_user_id?: string | null;
          primary_user_id?: string;
          relationship?: Database['public']['Enums']['family_relationship'];
          removed_at?: string | null;
          status?: Database['public']['Enums']['family_member_status'];
          subscription_id?: string;
          updated_at?: string | null;
          vault_items_viewed?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'family_members_member_user_id_fkey';
            columns: ['member_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'family_members_primary_user_id_fkey';
            columns: ['primary_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'family_members_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'membership_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      faqs: {
        Row: {
          answer: string;
          category: string;
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          is_active: boolean | null;
          not_helpful_count: number | null;
          question: string;
          sort_order: number | null;
          tags: string[] | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          answer: string;
          category?: string;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          not_helpful_count?: number | null;
          question: string;
          sort_order?: number | null;
          tags?: string[] | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          answer?: string;
          category?: string;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          not_helpful_count?: number | null;
          question?: string;
          sort_order?: number | null;
          tags?: string[] | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [];
      };
      grading_rubrics: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          criteria: Json;
          description: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          key: string;
          name: string;
          pass_score: number | null;
          strictness: number | null;
          subject_area: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          criteria: Json;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          key: string;
          name: string;
          pass_score?: number | null;
          strictness?: number | null;
          subject_area?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          criteria?: Json;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          key?: string;
          name?: string;
          pass_score?: number | null;
          strictness?: number | null;
          subject_area?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'grading_rubrics_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      homework_assignments: {
        Row: {
          allow_late_submission: boolean | null;
          allowed_file_types: string[] | null;
          course_id: number;
          created_at: string;
          created_by: string | null;
          description: string;
          due_date: string | null;
          id: string;
          instructions: string | null;
          is_published: boolean | null;
          late_penalty_per_day: number | null;
          max_file_size_mb: number | null;
          max_score: number | null;
          rubric: Json | null;
          tenant_id: string | null;
          title: string;
          updated_at: string;
          weight_percentage: number | null;
        };
        Insert: {
          allow_late_submission?: boolean | null;
          allowed_file_types?: string[] | null;
          course_id: number;
          created_at?: string;
          created_by?: string | null;
          description: string;
          due_date?: string | null;
          id?: string;
          instructions?: string | null;
          is_published?: boolean | null;
          late_penalty_per_day?: number | null;
          max_file_size_mb?: number | null;
          max_score?: number | null;
          rubric?: Json | null;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          weight_percentage?: number | null;
        };
        Update: {
          allow_late_submission?: boolean | null;
          allowed_file_types?: string[] | null;
          course_id?: number;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          due_date?: string | null;
          id?: string;
          instructions?: string | null;
          is_published?: boolean | null;
          late_penalty_per_day?: number | null;
          max_file_size_mb?: number | null;
          max_score?: number | null;
          rubric?: Json | null;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          weight_percentage?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'homework_assignments_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'homework_assignments_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'homework_assignments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'homework_assignments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      homework_submissions: {
        Row: {
          assignment_id: string;
          created_at: string;
          feedback: string | null;
          file_urls: string[] | null;
          graded_at: string | null;
          graded_by: string | null;
          id: string;
          is_late: boolean | null;
          peer_reviews: Json[] | null;
          score: number | null;
          status: string | null;
          submission_text: string | null;
          submitted_at: string | null;
          tenant_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assignment_id: string;
          created_at?: string;
          feedback?: string | null;
          file_urls?: string[] | null;
          graded_at?: string | null;
          graded_by?: string | null;
          id?: string;
          is_late?: boolean | null;
          peer_reviews?: Json[] | null;
          score?: number | null;
          status?: string | null;
          submission_text?: string | null;
          submitted_at?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assignment_id?: string;
          created_at?: string;
          feedback?: string | null;
          file_urls?: string[] | null;
          graded_at?: string | null;
          graded_by?: string | null;
          id?: string;
          is_late?: boolean | null;
          peer_reviews?: Json[] | null;
          score?: number | null;
          status?: string | null;
          submission_text?: string | null;
          submitted_at?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'homework_submissions_assignment_id_fkey';
            columns: ['assignment_id'];
            isOneToOne: false;
            referencedRelation: 'homework_assignments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'homework_submissions_graded_by_fkey';
            columns: ['graded_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'homework_submissions_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'homework_submissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      institutional_reports: {
        Row: {
          completed_at: string | null;
          course_ids: Json | null;
          created_at: string | null;
          date_range_end: string;
          date_range_start: string;
          error_message: string | null;
          file_size_bytes: number | null;
          file_url: string | null;
          format: string;
          id: string;
          include_comparisons: boolean | null;
          include_individual_data: boolean | null;
          include_recommendations: boolean | null;
          organization_id: string | null;
          report_type: string;
          requested_by: string;
          status: string;
          user_ids: Json | null;
        };
        Insert: {
          completed_at?: string | null;
          course_ids?: Json | null;
          created_at?: string | null;
          date_range_end: string;
          date_range_start: string;
          error_message?: string | null;
          file_size_bytes?: number | null;
          file_url?: string | null;
          format?: string;
          id?: string;
          include_comparisons?: boolean | null;
          include_individual_data?: boolean | null;
          include_recommendations?: boolean | null;
          organization_id?: string | null;
          report_type: string;
          requested_by: string;
          status?: string;
          user_ids?: Json | null;
        };
        Update: {
          completed_at?: string | null;
          course_ids?: Json | null;
          created_at?: string | null;
          date_range_end?: string;
          date_range_start?: string;
          error_message?: string | null;
          file_size_bytes?: number | null;
          file_url?: string | null;
          format?: string;
          id?: string;
          include_comparisons?: boolean | null;
          include_individual_data?: boolean | null;
          include_recommendations?: boolean | null;
          organization_id?: string | null;
          report_type?: string;
          requested_by?: string;
          status?: string;
          user_ids?: Json | null;
        };
        Relationships: [];
      };
      intervention_events: {
        Row: {
          acted_upon_at: string | null;
          created_at: string | null;
          delivered_at: string | null;
          id: string;
          intervention_type: string;
          message_content: string | null;
          message_template: string | null;
          opened_at: string | null;
          outcome: string | null;
          recipient_id: string | null;
          recipient_type: string;
          student_user_id: string;
          trigger_factors: Json | null;
          trigger_risk_score: number | null;
        };
        Insert: {
          acted_upon_at?: string | null;
          created_at?: string | null;
          delivered_at?: string | null;
          id?: string;
          intervention_type: string;
          message_content?: string | null;
          message_template?: string | null;
          opened_at?: string | null;
          outcome?: string | null;
          recipient_id?: string | null;
          recipient_type: string;
          student_user_id: string;
          trigger_factors?: Json | null;
          trigger_risk_score?: number | null;
        };
        Update: {
          acted_upon_at?: string | null;
          created_at?: string | null;
          delivered_at?: string | null;
          id?: string;
          intervention_type?: string;
          message_content?: string | null;
          message_template?: string | null;
          opened_at?: string | null;
          outcome?: string | null;
          recipient_id?: string | null;
          recipient_type?: string;
          student_user_id?: string;
          trigger_factors?: Json | null;
          trigger_risk_score?: number | null;
        };
        Relationships: [];
      };
      intervention_templates: {
        Row: {
          created_at: string | null;
          id: string;
          intervention_type: string;
          is_active: boolean | null;
          message_template: string;
          name: string;
          recipient_type: string;
          risk_level_trigger: string;
          subject_template: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          intervention_type: string;
          is_active?: boolean | null;
          message_template: string;
          name: string;
          recipient_type: string;
          risk_level_trigger: string;
          subject_template?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          intervention_type?: string;
          is_active?: boolean | null;
          message_template?: string;
          name?: string;
          recipient_type?: string;
          risk_level_trigger?: string;
          subject_template?: string | null;
        };
        Relationships: [];
      };
      kb_article_ratings: {
        Row: {
          article_id: string;
          created_at: string | null;
          feedback_text: string | null;
          id: string;
          is_helpful: boolean;
          user_id: string | null;
        };
        Insert: {
          article_id: string;
          created_at?: string | null;
          feedback_text?: string | null;
          id?: string;
          is_helpful: boolean;
          user_id?: string | null;
        };
        Update: {
          article_id?: string;
          created_at?: string | null;
          feedback_text?: string | null;
          id?: string;
          is_helpful?: boolean;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'kb_article_ratings_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'vault_content';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'kb_article_ratings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      learning_analytics: {
        Row: {
          course_id: number | null;
          created_at: string;
          id: string;
          metadata: Json | null;
          metric_date: string;
          metric_type: string;
          metric_value: number;
          user_id: string;
        };
        Insert: {
          course_id?: number | null;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          metric_date?: string;
          metric_type: string;
          metric_value: number;
          user_id: string;
        };
        Update: {
          course_id?: number | null;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          metric_date?: string;
          metric_type?: string;
          metric_value?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_analytics_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'learning_analytics_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'learning_analytics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      learning_improvement_metrics: {
        Row: {
          calculated_at: string | null;
          category_improvements: Json | null;
          confidence_level: number | null;
          days_between: number | null;
          effect_size: number | null;
          id: string;
          is_significant: boolean | null;
          normalized_gain: number | null;
          p_value: number | null;
          pair_id: string | null;
          percentage_improvement: number;
          post_score: number;
          pre_score: number;
          score_change: number;
          study_hours_between: number | null;
          user_id: string;
        };
        Insert: {
          calculated_at?: string | null;
          category_improvements?: Json | null;
          confidence_level?: number | null;
          days_between?: number | null;
          effect_size?: number | null;
          id?: string;
          is_significant?: boolean | null;
          normalized_gain?: number | null;
          p_value?: number | null;
          pair_id?: string | null;
          percentage_improvement: number;
          post_score: number;
          pre_score: number;
          score_change: number;
          study_hours_between?: number | null;
          user_id: string;
        };
        Update: {
          calculated_at?: string | null;
          category_improvements?: Json | null;
          confidence_level?: number | null;
          days_between?: number | null;
          effect_size?: number | null;
          id?: string;
          is_significant?: boolean | null;
          normalized_gain?: number | null;
          p_value?: number | null;
          pair_id?: string | null;
          percentage_improvement?: number;
          post_score?: number;
          pre_score?: number;
          score_change?: number;
          study_hours_between?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_improvement_metrics_pair_id_fkey';
            columns: ['pair_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_pairs';
            referencedColumns: ['id'];
          },
        ];
      };
      learning_outcomes_summary: {
        Row: {
          active_days: number | null;
          assessments_completed: number | null;
          avg_score: number | null;
          calculated_at: string | null;
          id: string;
          lessons_completed: number | null;
          new_levels_achieved: number | null;
          percentile_rank: number | null;
          period_end: string;
          period_start: string;
          period_type: string;
          score_improvement: number | null;
          skills_improved: number | null;
          skills_mastered: number | null;
          streak_days: number | null;
          total_study_hours: number | null;
          user_id: string;
          vs_previous_period_change: number | null;
        };
        Insert: {
          active_days?: number | null;
          assessments_completed?: number | null;
          avg_score?: number | null;
          calculated_at?: string | null;
          id?: string;
          lessons_completed?: number | null;
          new_levels_achieved?: number | null;
          percentile_rank?: number | null;
          period_end: string;
          period_start: string;
          period_type: string;
          score_improvement?: number | null;
          skills_improved?: number | null;
          skills_mastered?: number | null;
          streak_days?: number | null;
          total_study_hours?: number | null;
          user_id: string;
          vs_previous_period_change?: number | null;
        };
        Update: {
          active_days?: number | null;
          assessments_completed?: number | null;
          avg_score?: number | null;
          calculated_at?: string | null;
          id?: string;
          lessons_completed?: number | null;
          new_levels_achieved?: number | null;
          percentile_rank?: number | null;
          period_end?: string;
          period_start?: string;
          period_type?: string;
          score_improvement?: number | null;
          skills_improved?: number | null;
          skills_mastered?: number | null;
          streak_days?: number | null;
          total_study_hours?: number | null;
          user_id?: string;
          vs_previous_period_change?: number | null;
        };
        Relationships: [];
      };
      learning_path_items: {
        Row: {
          addresses_weaknesses: string[] | null;
          ai_learning_path_id: string;
          completed_at: string | null;
          confidence_score: number | null;
          created_at: string | null;
          difficulty_level: string | null;
          estimated_hours: number | null;
          id: string;
          irt_difficulty: number | null;
          is_required: boolean | null;
          item_description: string | null;
          item_id: string;
          item_title: string;
          item_type: string;
          order_index: number;
          prerequisites: string[] | null;
          reason_for_inclusion: string | null;
          skill_tags: string[] | null;
          started_at: string | null;
          status: string | null;
          time_spent_hours: number | null;
          updated_at: string | null;
          user_feedback: string | null;
          user_rating: number | null;
          week_number: number | null;
        };
        Insert: {
          addresses_weaknesses?: string[] | null;
          ai_learning_path_id: string;
          completed_at?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          difficulty_level?: string | null;
          estimated_hours?: number | null;
          id?: string;
          irt_difficulty?: number | null;
          is_required?: boolean | null;
          item_description?: string | null;
          item_id: string;
          item_title: string;
          item_type: string;
          order_index: number;
          prerequisites?: string[] | null;
          reason_for_inclusion?: string | null;
          skill_tags?: string[] | null;
          started_at?: string | null;
          status?: string | null;
          time_spent_hours?: number | null;
          updated_at?: string | null;
          user_feedback?: string | null;
          user_rating?: number | null;
          week_number?: number | null;
        };
        Update: {
          addresses_weaknesses?: string[] | null;
          ai_learning_path_id?: string;
          completed_at?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          difficulty_level?: string | null;
          estimated_hours?: number | null;
          id?: string;
          irt_difficulty?: number | null;
          is_required?: boolean | null;
          item_description?: string | null;
          item_id?: string;
          item_title?: string;
          item_type?: string;
          order_index?: number;
          prerequisites?: string[] | null;
          reason_for_inclusion?: string | null;
          skill_tags?: string[] | null;
          started_at?: string | null;
          status?: string | null;
          time_spent_hours?: number | null;
          updated_at?: string | null;
          user_feedback?: string | null;
          user_rating?: number | null;
          week_number?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_path_items_ai_learning_path_id_fkey';
            columns: ['ai_learning_path_id'];
            isOneToOne: false;
            referencedRelation: 'ai_generated_learning_paths';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'learning_path_items_ai_learning_path_id_fkey';
            columns: ['ai_learning_path_id'];
            isOneToOne: false;
            referencedRelation: 'user_active_learning_paths';
            referencedColumns: ['id'];
          },
        ];
      };
      learning_path_milestones: {
        Row: {
          ai_learning_path_id: string;
          completed_at: string | null;
          created_at: string | null;
          id: string;
          is_completed: boolean | null;
          milestone_description: string | null;
          milestone_order: number;
          milestone_title: string;
          minimum_completion_percentage: number | null;
          required_items_completed: string[] | null;
          reward_badge: string | null;
          reward_message: string | null;
          reward_points: number | null;
        };
        Insert: {
          ai_learning_path_id: string;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_completed?: boolean | null;
          milestone_description?: string | null;
          milestone_order: number;
          milestone_title: string;
          minimum_completion_percentage?: number | null;
          required_items_completed?: string[] | null;
          reward_badge?: string | null;
          reward_message?: string | null;
          reward_points?: number | null;
        };
        Update: {
          ai_learning_path_id?: string;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          is_completed?: boolean | null;
          milestone_description?: string | null;
          milestone_order?: number;
          milestone_title?: string;
          minimum_completion_percentage?: number | null;
          required_items_completed?: string[] | null;
          reward_badge?: string | null;
          reward_message?: string | null;
          reward_points?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_path_milestones_ai_learning_path_id_fkey';
            columns: ['ai_learning_path_id'];
            isOneToOne: false;
            referencedRelation: 'ai_generated_learning_paths';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'learning_path_milestones_ai_learning_path_id_fkey';
            columns: ['ai_learning_path_id'];
            isOneToOne: false;
            referencedRelation: 'user_active_learning_paths';
            referencedColumns: ['id'];
          },
        ];
      };
      lingo_achievements: {
        Row: {
          achievement_id: string;
          category: string;
          created_at: string | null;
          description: string;
          icon: string;
          id: string;
          is_active: boolean | null;
          name: string;
          points_value: number;
          requirement_type: string;
          requirement_value: number;
          tier: string;
        };
        Insert: {
          achievement_id: string;
          category: string;
          created_at?: string | null;
          description: string;
          icon: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          points_value?: number;
          requirement_type: string;
          requirement_value: number;
          tier: string;
        };
        Update: {
          achievement_id?: string;
          category?: string;
          created_at?: string | null;
          description?: string;
          icon?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          points_value?: number;
          requirement_type?: string;
          requirement_value?: number;
          tier?: string;
        };
        Relationships: [];
      };
      lingo_analytics: {
        Row: {
          created_at: string | null;
          event_data: Json | null;
          event_type: string;
          id: string;
          lesson_id: string | null;
          question_id: string | null;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          lesson_id?: string | null;
          question_id?: string | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          lesson_id?: string | null;
          question_id?: string | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lingo_analytics_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lingo_lesson_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lingo_analytics_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lingo_lessons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lingo_analytics_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'lingo_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lingo_analytics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      lingo_leaderboard: {
        Row: {
          avatar_url: string | null;
          display_name: string | null;
          id: string;
          lessons_completed: number;
          perfect_lessons: number;
          streak: number;
          total_xp: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          display_name?: string | null;
          id?: string;
          lessons_completed?: number;
          perfect_lessons?: number;
          streak?: number;
          total_xp?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          display_name?: string | null;
          id?: string;
          lessons_completed?: number;
          perfect_lessons?: number;
          streak?: number;
          total_xp?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lingo_leaderboard_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      lingo_lessons: {
        Row: {
          created_at: string | null;
          description: string;
          duration: string;
          id: string;
          is_active: boolean | null;
          lesson_id: string;
          question_count: number | null;
          skill: string;
          sort_order: number | null;
          title: string;
          updated_at: string | null;
          xp_reward: number;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          duration: string;
          id?: string;
          is_active?: boolean | null;
          lesson_id: string;
          question_count?: number | null;
          skill: string;
          sort_order?: number | null;
          title: string;
          updated_at?: string | null;
          xp_reward?: number;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          duration?: string;
          id?: string;
          is_active?: boolean | null;
          lesson_id?: string;
          question_count?: number | null;
          skill?: string;
          sort_order?: number | null;
          title?: string;
          updated_at?: string | null;
          xp_reward?: number;
        };
        Relationships: [];
      };
      lingo_notification_log: {
        Row: {
          body: string;
          channel: string;
          error_message: string | null;
          id: string;
          metadata: Json | null;
          notification_type: string;
          sent_at: string | null;
          status: string | null;
          title: string;
          user_id: string | null;
        };
        Insert: {
          body: string;
          channel: string;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          notification_type: string;
          sent_at?: string | null;
          status?: string | null;
          title: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          channel?: string;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          notification_type?: string;
          sent_at?: string | null;
          status?: string | null;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lingo_notification_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      lingo_notification_settings: {
        Row: {
          achievement_notifications: boolean | null;
          created_at: string | null;
          email_enabled: boolean | null;
          email_reminder_time: string | null;
          email_timezone: string | null;
          goal_reminder: boolean | null;
          id: string;
          last_notification_sent: string | null;
          notification_count: number | null;
          push_enabled: boolean | null;
          push_reminder_time: string | null;
          push_subscription: Json | null;
          streak_reminder: boolean | null;
          updated_at: string | null;
          user_id: string;
          weekly_summary: boolean | null;
        };
        Insert: {
          achievement_notifications?: boolean | null;
          created_at?: string | null;
          email_enabled?: boolean | null;
          email_reminder_time?: string | null;
          email_timezone?: string | null;
          goal_reminder?: boolean | null;
          id?: string;
          last_notification_sent?: string | null;
          notification_count?: number | null;
          push_enabled?: boolean | null;
          push_reminder_time?: string | null;
          push_subscription?: Json | null;
          streak_reminder?: boolean | null;
          updated_at?: string | null;
          user_id: string;
          weekly_summary?: boolean | null;
        };
        Update: {
          achievement_notifications?: boolean | null;
          created_at?: string | null;
          email_enabled?: boolean | null;
          email_reminder_time?: string | null;
          email_timezone?: string | null;
          goal_reminder?: boolean | null;
          id?: string;
          last_notification_sent?: string | null;
          notification_count?: number | null;
          push_enabled?: boolean | null;
          push_reminder_time?: string | null;
          push_subscription?: Json | null;
          streak_reminder?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
          weekly_summary?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lingo_notification_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      lingo_questions: {
        Row: {
          accepted_answers: string[] | null;
          answer: string | null;
          answers: Json | null;
          correct_answer: string | null;
          created_at: string | null;
          explanation: string | null;
          free_response_config: Json | null;
          hint: string | null;
          id: string;
          ideal_answer: string | null;
          lesson_id: string | null;
          matching_pairs: Json | null;
          options: Json | null;
          ordering_items: string[] | null;
          pairs: Json | null;
          pass_score: number | null;
          prompt: string;
          question_text: string | null;
          question_type: string | null;
          rubric: string | null;
          sort_order: number | null;
          steps: Json | null;
          strictness: number | null;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          accepted_answers?: string[] | null;
          answer?: string | null;
          answers?: Json | null;
          correct_answer?: string | null;
          created_at?: string | null;
          explanation?: string | null;
          free_response_config?: Json | null;
          hint?: string | null;
          id?: string;
          ideal_answer?: string | null;
          lesson_id?: string | null;
          matching_pairs?: Json | null;
          options?: Json | null;
          ordering_items?: string[] | null;
          pairs?: Json | null;
          pass_score?: number | null;
          prompt: string;
          question_text?: string | null;
          question_type?: string | null;
          rubric?: string | null;
          sort_order?: number | null;
          steps?: Json | null;
          strictness?: number | null;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          accepted_answers?: string[] | null;
          answer?: string | null;
          answers?: Json | null;
          correct_answer?: string | null;
          created_at?: string | null;
          explanation?: string | null;
          free_response_config?: Json | null;
          hint?: string | null;
          id?: string;
          ideal_answer?: string | null;
          lesson_id?: string | null;
          matching_pairs?: Json | null;
          options?: Json | null;
          ordering_items?: string[] | null;
          pairs?: Json | null;
          pass_score?: number | null;
          prompt?: string;
          question_text?: string | null;
          question_type?: string | null;
          rubric?: string | null;
          sort_order?: number | null;
          steps?: Json | null;
          strictness?: number | null;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lingo_questions_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lingo_lesson_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lingo_questions_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lingo_lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      lingo_user_achievements: {
        Row: {
          achievement_id: string;
          earned_at: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          earned_at?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          earned_at?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lingo_user_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            isOneToOne: false;
            referencedRelation: 'lingo_achievements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lingo_user_achievements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      lingo_user_progress: {
        Row: {
          created_at: string | null;
          daily_goal: number | null;
          hearts: number | null;
          id: string;
          last_session_date: string | null;
          lesson_progress: Json | null;
          streak: number | null;
          total_xp: number | null;
          updated_at: string | null;
          user_id: string | null;
          xp_today: number | null;
        };
        Insert: {
          created_at?: string | null;
          daily_goal?: number | null;
          hearts?: number | null;
          id?: string;
          last_session_date?: string | null;
          lesson_progress?: Json | null;
          streak?: number | null;
          total_xp?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          xp_today?: number | null;
        };
        Update: {
          created_at?: string | null;
          daily_goal?: number | null;
          hearts?: number | null;
          id?: string;
          last_session_date?: string | null;
          lesson_progress?: Json | null;
          streak?: number | null;
          total_xp?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          xp_today?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lingo_user_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      llm_response_cache: {
        Row: {
          cache_key: string;
          cost_usd: number | null;
          created_at: string | null;
          expires_at: string;
          hit_count: number | null;
          id: string;
          model: string;
          prompt_hash: string;
          response: string;
          tokens_used: number | null;
        };
        Insert: {
          cache_key: string;
          cost_usd?: number | null;
          created_at?: string | null;
          expires_at: string;
          hit_count?: number | null;
          id?: string;
          model: string;
          prompt_hash: string;
          response: string;
          tokens_used?: number | null;
        };
        Update: {
          cache_key?: string;
          cost_usd?: number | null;
          created_at?: string | null;
          expires_at?: string;
          hit_count?: number | null;
          id?: string;
          model?: string;
          prompt_hash?: string;
          response?: string;
          tokens_used?: number | null;
        };
        Relationships: [];
      };
      lti_grade_submissions: {
        Row: {
          activity_progress: string | null;
          created_at: string | null;
          grading_progress: string | null;
          id: string;
          lineitem_url: string | null;
          lti_user_id: string;
          platform_id: string;
          resource_link_id: string | null;
          score_given: number | null;
          score_maximum: number | null;
          submitted_at: string | null;
          sync_error: string | null;
          sync_status: string | null;
          synced_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          activity_progress?: string | null;
          created_at?: string | null;
          grading_progress?: string | null;
          id?: string;
          lineitem_url?: string | null;
          lti_user_id: string;
          platform_id: string;
          resource_link_id?: string | null;
          score_given?: number | null;
          score_maximum?: number | null;
          submitted_at?: string | null;
          sync_error?: string | null;
          sync_status?: string | null;
          synced_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          activity_progress?: string | null;
          created_at?: string | null;
          grading_progress?: string | null;
          id?: string;
          lineitem_url?: string | null;
          lti_user_id?: string;
          platform_id?: string;
          resource_link_id?: string | null;
          score_given?: number | null;
          score_maximum?: number | null;
          submitted_at?: string | null;
          sync_error?: string | null;
          sync_status?: string | null;
          synced_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lti_grade_submissions_platform_id_fkey';
            columns: ['platform_id'];
            isOneToOne: false;
            referencedRelation: 'lti_platforms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lti_grade_submissions_resource_link_id_fkey';
            columns: ['resource_link_id'];
            isOneToOne: false;
            referencedRelation: 'lti_resource_links';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lti_grade_submissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      lti_launches: {
        Row: {
          claims: Json;
          context_id: string | null;
          context_title: string | null;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          ip_address: unknown;
          launch_type: string;
          lti_user_id: string;
          message_type: string | null;
          platform_id: string;
          resource_link_id: string | null;
          roles: string[] | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          claims?: Json;
          context_id?: string | null;
          context_title?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          ip_address?: unknown;
          launch_type: string;
          lti_user_id: string;
          message_type?: string | null;
          platform_id: string;
          resource_link_id?: string | null;
          roles?: string[] | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          claims?: Json;
          context_id?: string | null;
          context_title?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          ip_address?: unknown;
          launch_type?: string;
          lti_user_id?: string;
          message_type?: string | null;
          platform_id?: string;
          resource_link_id?: string | null;
          roles?: string[] | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lti_launches_platform_id_fkey';
            columns: ['platform_id'];
            isOneToOne: false;
            referencedRelation: 'lti_platforms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lti_launches_resource_link_id_fkey';
            columns: ['resource_link_id'];
            isOneToOne: false;
            referencedRelation: 'lti_resource_links';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lti_launches_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      lti_nonces: {
        Row: {
          expires_at: string;
          id: string;
          nonce: string;
          platform_id: string | null;
          used_at: string | null;
        };
        Insert: {
          expires_at: string;
          id?: string;
          nonce: string;
          platform_id?: string | null;
          used_at?: string | null;
        };
        Update: {
          expires_at?: string;
          id?: string;
          nonce?: string;
          platform_id?: string | null;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lti_nonces_platform_id_fkey';
            columns: ['platform_id'];
            isOneToOne: false;
            referencedRelation: 'lti_platforms';
            referencedColumns: ['id'];
          },
        ];
      };
      lti_platforms: {
        Row: {
          auth_login_url: string;
          auth_token_url: string;
          client_id: string;
          created_at: string | null;
          created_by: string | null;
          deployment_id: string | null;
          id: string;
          is_active: boolean | null;
          issuer: string;
          jwks_url: string;
          name: string;
          platform_public_key: string | null;
          platform_type: string | null;
          settings: Json | null;
          tenant_id: string | null;
          tool_kid: string | null;
          tool_private_key: string;
          tool_public_key: string;
          updated_at: string | null;
        };
        Insert: {
          auth_login_url: string;
          auth_token_url: string;
          client_id: string;
          created_at?: string | null;
          created_by?: string | null;
          deployment_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          issuer: string;
          jwks_url: string;
          name: string;
          platform_public_key?: string | null;
          platform_type?: string | null;
          settings?: Json | null;
          tenant_id?: string | null;
          tool_kid?: string | null;
          tool_private_key: string;
          tool_public_key: string;
          updated_at?: string | null;
        };
        Update: {
          auth_login_url?: string;
          auth_token_url?: string;
          client_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          deployment_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          issuer?: string;
          jwks_url?: string;
          name?: string;
          platform_public_key?: string | null;
          platform_type?: string | null;
          settings?: Json | null;
          tenant_id?: string | null;
          tool_kid?: string | null;
          tool_private_key?: string;
          tool_public_key?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lti_platforms_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lti_platforms_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      lti_resource_links: {
        Row: {
          content_items: Json | null;
          context_id: string | null;
          context_label: string | null;
          context_title: string | null;
          course_id: number | null;
          created_at: string | null;
          id: string;
          lesson_id: number | null;
          platform_id: string;
          resource_link_id: string;
          updated_at: string | null;
        };
        Insert: {
          content_items?: Json | null;
          context_id?: string | null;
          context_label?: string | null;
          context_title?: string | null;
          course_id?: number | null;
          created_at?: string | null;
          id?: string;
          lesson_id?: number | null;
          platform_id: string;
          resource_link_id: string;
          updated_at?: string | null;
        };
        Update: {
          content_items?: Json | null;
          context_id?: string | null;
          context_label?: string | null;
          context_title?: string | null;
          course_id?: number | null;
          created_at?: string | null;
          id?: string;
          lesson_id?: number | null;
          platform_id?: string;
          resource_link_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lti_resource_links_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lti_resource_links_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lti_resource_links_platform_id_fkey';
            columns: ['platform_id'];
            isOneToOne: false;
            referencedRelation: 'lti_platforms';
            referencedColumns: ['id'];
          },
        ];
      };
      lti_user_mappings: {
        Row: {
          created_at: string | null;
          id: string;
          last_login_at: string | null;
          lti_email: string | null;
          lti_family_name: string | null;
          lti_given_name: string | null;
          lti_name: string | null;
          lti_picture: string | null;
          lti_user_id: string;
          platform_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_login_at?: string | null;
          lti_email?: string | null;
          lti_family_name?: string | null;
          lti_given_name?: string | null;
          lti_name?: string | null;
          lti_picture?: string | null;
          lti_user_id: string;
          platform_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_login_at?: string | null;
          lti_email?: string | null;
          lti_family_name?: string | null;
          lti_given_name?: string | null;
          lti_name?: string | null;
          lti_picture?: string | null;
          lti_user_id?: string;
          platform_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lti_user_mappings_platform_id_fkey';
            columns: ['platform_id'];
            isOneToOne: false;
            referencedRelation: 'lti_platforms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lti_user_mappings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      mastery_level_config: {
        Row: {
          badge_color: string | null;
          badge_icon: string | null;
          description: string | null;
          id: string;
          level_name: string;
          level_order: number;
          max_score: number;
          min_score: number;
          requirements: Json | null;
        };
        Insert: {
          badge_color?: string | null;
          badge_icon?: string | null;
          description?: string | null;
          id?: string;
          level_name: string;
          level_order: number;
          max_score: number;
          min_score: number;
          requirements?: Json | null;
        };
        Update: {
          badge_color?: string | null;
          badge_icon?: string | null;
          description?: string | null;
          id?: string;
          level_name?: string;
          level_order?: number;
          max_score?: number;
          min_score?: number;
          requirements?: Json | null;
        };
        Relationships: [];
      };
      mastery_progression: {
        Row: {
          avg_improvement_per_week: number | null;
          current_level: string;
          current_score: number | null;
          first_assessment_at: string | null;
          id: string;
          last_assessment_at: string | null;
          level_history: Json | null;
          level_progress: number | null;
          projected_next_level_days: number | null;
          skill_id: string;
          skill_name: string | null;
          time_at_current_level_days: number | null;
          total_practice_hours: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          avg_improvement_per_week?: number | null;
          current_level?: string;
          current_score?: number | null;
          first_assessment_at?: string | null;
          id?: string;
          last_assessment_at?: string | null;
          level_history?: Json | null;
          level_progress?: number | null;
          projected_next_level_days?: number | null;
          skill_id: string;
          skill_name?: string | null;
          time_at_current_level_days?: number | null;
          total_practice_hours?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          avg_improvement_per_week?: number | null;
          current_level?: string;
          current_score?: number | null;
          first_assessment_at?: string | null;
          id?: string;
          last_assessment_at?: string | null;
          level_history?: Json | null;
          level_progress?: number | null;
          projected_next_level_days?: number | null;
          skill_id?: string;
          skill_name?: string | null;
          time_at_current_level_days?: number | null;
          total_practice_hours?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      membership_plans: {
        Row: {
          billing_interval: string;
          created_at: string | null;
          currency: string;
          description: string;
          display_order: number | null;
          features: Json;
          id: string;
          includes_all_courses: boolean;
          includes_event_access: boolean;
          includes_vault_access: boolean;
          is_active: boolean;
          is_featured: boolean;
          max_family_members: number | null;
          name: string;
          price: number;
          slug: string;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          trial_days: number | null;
          updated_at: string | null;
        };
        Insert: {
          billing_interval: string;
          created_at?: string | null;
          currency?: string;
          description: string;
          display_order?: number | null;
          features?: Json;
          id?: string;
          includes_all_courses?: boolean;
          includes_event_access?: boolean;
          includes_vault_access?: boolean;
          is_active?: boolean;
          is_featured?: boolean;
          max_family_members?: number | null;
          name: string;
          price: number;
          slug: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Update: {
          billing_interval?: string;
          created_at?: string | null;
          currency?: string;
          description?: string;
          display_order?: number | null;
          features?: Json;
          id?: string;
          includes_all_courses?: boolean;
          includes_event_access?: boolean;
          includes_vault_access?: boolean;
          is_active?: boolean;
          is_featured?: boolean;
          max_family_members?: number | null;
          name?: string;
          price?: number;
          slug?: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      membership_subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          cancellation_feedback: string | null;
          cancellation_reason: string | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          metadata: Json | null;
          pause_reason: string | null;
          paused_at: string | null;
          payment_method_brand: string | null;
          payment_method_last4: string | null;
          plan_id: string;
          resume_at: string | null;
          status: Database['public']['Enums']['subscription_status'];
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_end: string | null;
          trial_start: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          cancellation_feedback?: string | null;
          cancellation_reason?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          metadata?: Json | null;
          pause_reason?: string | null;
          paused_at?: string | null;
          payment_method_brand?: string | null;
          payment_method_last4?: string | null;
          plan_id: string;
          resume_at?: string | null;
          status?: Database['public']['Enums']['subscription_status'];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          cancellation_feedback?: string | null;
          cancellation_reason?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          metadata?: Json | null;
          pause_reason?: string | null;
          paused_at?: string | null;
          payment_method_brand?: string | null;
          payment_method_last4?: string | null;
          plan_id?: string;
          resume_at?: string | null;
          status?: Database['public']['Enums']['subscription_status'];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'membership_subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'membership_plans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'membership_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      next_lesson_recommendations: {
        Row: {
          clicked_at: string | null;
          completed_at: string | null;
          content_type: string;
          context: string;
          created_at: string | null;
          dismissed_at: string | null;
          expires_at: string;
          factors: Json;
          id: string;
          recommendation_score: number;
          recommended_content_id: string;
          shown_at: string | null;
          user_id: string;
        };
        Insert: {
          clicked_at?: string | null;
          completed_at?: string | null;
          content_type: string;
          context: string;
          created_at?: string | null;
          dismissed_at?: string | null;
          expires_at: string;
          factors?: Json;
          id?: string;
          recommendation_score: number;
          recommended_content_id: string;
          shown_at?: string | null;
          user_id: string;
        };
        Update: {
          clicked_at?: string | null;
          completed_at?: string | null;
          content_type?: string;
          context?: string;
          created_at?: string | null;
          dismissed_at?: string | null;
          expires_at?: string;
          factors?: Json;
          id?: string;
          recommendation_score?: number;
          recommended_content_id?: string;
          shown_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          action_url: string | null;
          created_at: string;
          data: Json | null;
          id: string;
          is_read: boolean | null;
          message: string;
          read_at: string | null;
          tenant_id: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          created_at?: string;
          data?: Json | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          read_at?: string | null;
          tenant_id?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          created_at?: string;
          data?: Json | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          read_at?: string | null;
          tenant_id?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      page_views: {
        Row: {
          browser: string | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          device_type: string | null;
          duration_seconds: number | null;
          id: string;
          ip_address: unknown;
          metadata: Json | null;
          os: string | null;
          page_path: string;
          referrer: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          browser?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          device_type?: string | null;
          duration_seconds?: number | null;
          id?: string;
          ip_address?: unknown;
          metadata?: Json | null;
          os?: string | null;
          page_path: string;
          referrer?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          browser?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          device_type?: string | null;
          duration_seconds?: number | null;
          id?: string;
          ip_address?: unknown;
          metadata?: Json | null;
          os?: string | null;
          page_path?: string;
          referrer?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'page_views_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      path_generation_logs: {
        Row: {
          ai_learning_path_id: string | null;
          algorithm_version: string | null;
          computation_time_ms: number | null;
          content_diversity_score: number | null;
          created_at: string | null;
          difficulty_progression_score: number | null;
          error_message: string | null;
          generation_timestamp: string | null;
          id: string;
          input_assessment_scores: Json | null;
          input_goals: Json | null;
          input_preferences: Json | null;
          items_generated: number | null;
          success: boolean | null;
          user_id: string;
        };
        Insert: {
          ai_learning_path_id?: string | null;
          algorithm_version?: string | null;
          computation_time_ms?: number | null;
          content_diversity_score?: number | null;
          created_at?: string | null;
          difficulty_progression_score?: number | null;
          error_message?: string | null;
          generation_timestamp?: string | null;
          id?: string;
          input_assessment_scores?: Json | null;
          input_goals?: Json | null;
          input_preferences?: Json | null;
          items_generated?: number | null;
          success?: boolean | null;
          user_id: string;
        };
        Update: {
          ai_learning_path_id?: string | null;
          algorithm_version?: string | null;
          computation_time_ms?: number | null;
          content_diversity_score?: number | null;
          created_at?: string | null;
          difficulty_progression_score?: number | null;
          error_message?: string | null;
          generation_timestamp?: string | null;
          id?: string;
          input_assessment_scores?: Json | null;
          input_goals?: Json | null;
          input_preferences?: Json | null;
          items_generated?: number | null;
          success?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'path_generation_logs_ai_learning_path_id_fkey';
            columns: ['ai_learning_path_id'];
            isOneToOne: false;
            referencedRelation: 'ai_generated_learning_paths';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'path_generation_logs_ai_learning_path_id_fkey';
            columns: ['ai_learning_path_id'];
            isOneToOne: false;
            referencedRelation: 'user_active_learning_paths';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'path_generation_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      profiles: {
        Row: {
          ai_learning_profile: Json | null;
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          preferences: Json | null;
          preferred_language: string | null;
          role: string | null;
          tenant_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_learning_profile?: Json | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          preferences?: Json | null;
          preferred_language?: string | null;
          role?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_learning_profile?: Json | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          preferences?: Json | null;
          preferred_language?: string | null;
          role?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      question_upvotes: {
        Row: {
          created_at: string;
          id: string;
          question_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          question_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          question_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'question_upvotes_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'classroom_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'question_upvotes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      quiz_attempts: {
        Row: {
          answers: Json | null;
          attempt_number: number | null;
          completed_at: string | null;
          created_at: string;
          id: string;
          passed: boolean | null;
          points_awarded: number | null;
          quiz_id: string;
          score_earned: number | null;
          score_percentage: number | null;
          started_at: string;
          tenant_id: string | null;
          time_spent_seconds: number | null;
          user_id: string;
        };
        Insert: {
          answers?: Json | null;
          attempt_number?: number | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          passed?: boolean | null;
          points_awarded?: number | null;
          quiz_id: string;
          score_earned?: number | null;
          score_percentage?: number | null;
          started_at?: string;
          tenant_id?: string | null;
          time_spent_seconds?: number | null;
          user_id: string;
        };
        Update: {
          answers?: Json | null;
          attempt_number?: number | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          passed?: boolean | null;
          points_awarded?: number | null;
          quiz_id?: string;
          score_earned?: number | null;
          score_percentage?: number | null;
          started_at?: string;
          tenant_id?: string | null;
          time_spent_seconds?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_attempts_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quiz_attempts_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quiz_attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      quiz_question_options: {
        Row: {
          id: string;
          is_correct: boolean | null;
          option_text: string;
          order_index: number | null;
          question_id: string;
        };
        Insert: {
          id?: string;
          is_correct?: boolean | null;
          option_text: string;
          order_index?: number | null;
          question_id: string;
        };
        Update: {
          id?: string;
          is_correct?: boolean | null;
          option_text?: string;
          order_index?: number | null;
          question_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_question_options_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'quiz_questions';
            referencedColumns: ['id'];
          },
        ];
      };
      quiz_questions: {
        Row: {
          created_at: string;
          explanation: string | null;
          id: string;
          order_index: number | null;
          points_value: number | null;
          question_text: string;
          question_type: string;
          quiz_id: string;
        };
        Insert: {
          created_at?: string;
          explanation?: string | null;
          id?: string;
          order_index?: number | null;
          points_value?: number | null;
          question_text: string;
          question_type: string;
          quiz_id: string;
        };
        Update: {
          created_at?: string;
          explanation?: string | null;
          id?: string;
          order_index?: number | null;
          points_value?: number | null;
          question_text?: string;
          question_type?: string;
          quiz_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_questions_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          },
        ];
      };
      quizzes: {
        Row: {
          course_id: number;
          created_at: string;
          created_by: string | null;
          description: string | null;
          difficulty_level: string | null;
          id: string;
          instructions: string | null;
          is_published: boolean | null;
          max_attempts: number | null;
          order_index: number | null;
          passing_score_percentage: number | null;
          points_reward: number | null;
          time_limit_minutes: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          course_id: number;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          id?: string;
          instructions?: string | null;
          is_published?: boolean | null;
          max_attempts?: number | null;
          order_index?: number | null;
          passing_score_percentage?: number | null;
          points_reward?: number | null;
          time_limit_minutes?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          course_id?: number;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          difficulty_level?: string | null;
          id?: string;
          instructions?: string | null;
          is_published?: boolean | null;
          max_attempts?: number | null;
          order_index?: number | null;
          passing_score_percentage?: number | null;
          points_reward?: number | null;
          time_limit_minutes?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quizzes_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quizzes_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quizzes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      rag_query_analytics: {
        Row: {
          created_at: string | null;
          id: string;
          query_embedding: string | null;
          query_text: string;
          results_count: number | null;
          search_latency_ms: number | null;
          top_result_similarity: number | null;
          top_result_type: string | null;
          total_latency_ms: number | null;
          user_feedback: string | null;
          user_id: string | null;
          was_helpful: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          query_embedding?: string | null;
          query_text: string;
          results_count?: number | null;
          search_latency_ms?: number | null;
          top_result_similarity?: number | null;
          top_result_type?: string | null;
          total_latency_ms?: number | null;
          user_feedback?: string | null;
          user_id?: string | null;
          was_helpful?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          query_embedding?: string | null;
          query_text?: string;
          results_count?: number | null;
          search_latency_ms?: number | null;
          top_result_similarity?: number | null;
          top_result_type?: string | null;
          total_latency_ms?: number | null;
          user_feedback?: string | null;
          user_id?: string | null;
          was_helpful?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'rag_query_analytics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      review_requests: {
        Row: {
          created_at: string | null;
          custom_message: string | null;
          id: string;
          last_reminder_sent_at: string | null;
          notification_id: string | null;
          reminder_count: number | null;
          requested_at: string | null;
          responded_at: string | null;
          review_id: string | null;
          session_date: string | null;
          session_id: string;
          session_title: string | null;
          session_type: string;
          status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          custom_message?: string | null;
          id?: string;
          last_reminder_sent_at?: string | null;
          notification_id?: string | null;
          reminder_count?: number | null;
          requested_at?: string | null;
          responded_at?: string | null;
          review_id?: string | null;
          session_date?: string | null;
          session_id: string;
          session_title?: string | null;
          session_type: string;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          custom_message?: string | null;
          id?: string;
          last_reminder_sent_at?: string | null;
          notification_id?: string | null;
          reminder_count?: number | null;
          requested_at?: string | null;
          responded_at?: string | null;
          review_id?: string | null;
          session_date?: string | null;
          session_id?: string;
          session_title?: string | null;
          session_type?: string;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_review_requests_notification_id';
            columns: ['notification_id'];
            isOneToOne: false;
            referencedRelation: 'notifications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_review_requests_review_id';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'reviews';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      reviews: {
        Row: {
          approved: boolean;
          course_id: number | null;
          course_mode: string | null;
          course_period: string | null;
          created_at: string;
          display: boolean;
          display_name_option: string;
          id: string;
          rating: number;
          review_type: string;
          tenant_id: string | null;
          updated_at: string;
          user_id: string;
          video_review_url: string | null;
          voice_review_url: string | null;
          written_review: string | null;
        };
        Insert: {
          approved?: boolean;
          course_id?: number | null;
          course_mode?: string | null;
          course_period?: string | null;
          created_at?: string;
          display?: boolean;
          display_name_option?: string;
          id?: string;
          rating: number;
          review_type?: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id: string;
          video_review_url?: string | null;
          voice_review_url?: string | null;
          written_review?: string | null;
        };
        Update: {
          approved?: boolean;
          course_id?: number | null;
          course_mode?: string | null;
          course_period?: string | null;
          created_at?: string;
          display?: boolean;
          display_name_option?: string;
          id?: string;
          rating?: number;
          review_type?: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string;
          video_review_url?: string | null;
          voice_review_url?: string | null;
          written_review?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      security_audit_log: {
        Row: {
          action: string | null;
          created_at: string;
          email: string | null;
          event_type: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          resource: string | null;
          timestamp: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action?: string | null;
          created_at?: string;
          email?: string | null;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          resource?: string | null;
          timestamp?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string | null;
          created_at?: string;
          email?: string | null;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          resource?: string | null;
          timestamp?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'security_audit_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      session_attendance: {
        Row: {
          check_in_time: string | null;
          check_out_time: string | null;
          created_at: string | null;
          duration_minutes: number | null;
          id: string;
          instructor_notes: string | null;
          marked_by: string | null;
          participation_score: number | null;
          session_id: string;
          status: string;
          ticket_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          check_in_time?: string | null;
          check_out_time?: string | null;
          created_at?: string | null;
          duration_minutes?: number | null;
          id?: string;
          instructor_notes?: string | null;
          marked_by?: string | null;
          participation_score?: number | null;
          session_id: string;
          status?: string;
          ticket_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          check_in_time?: string | null;
          check_out_time?: string | null;
          created_at?: string | null;
          duration_minutes?: number | null;
          id?: string;
          instructor_notes?: string | null;
          marked_by?: string | null;
          participation_score?: number | null;
          session_id?: string;
          status?: string;
          ticket_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'session_attendance_marked_by_fkey';
            columns: ['marked_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'session_attendance_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'course_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_attendance_ticket_id_fkey';
            columns: ['ticket_id'];
            isOneToOne: false;
            referencedRelation: 'session_tickets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_attendance_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      session_tickets: {
        Row: {
          check_in_method: string | null;
          checked_in_at: string | null;
          checked_in_by: string | null;
          claimed_at: string | null;
          course_id: number;
          created_at: string | null;
          id: string;
          notes: string | null;
          qr_code: string;
          session_id: string;
          status: string;
          ticket_number: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          check_in_method?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          claimed_at?: string | null;
          course_id: number;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          qr_code: string;
          session_id: string;
          status?: string;
          ticket_number?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          check_in_method?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          claimed_at?: string | null;
          course_id?: number;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          qr_code?: string;
          session_id?: string;
          status?: string;
          ticket_number?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'session_tickets_checked_in_by_fkey';
            columns: ['checked_in_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'session_tickets_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_tickets_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_tickets_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'course_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_tickets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      shared_content: {
        Row: {
          content_data: Json;
          content_type: string | null;
          course_id: number | null;
          created_at: string;
          description: string | null;
          id: string;
          owner_id: string;
          tags: string[] | null;
          tenant_id: string | null;
          title: string;
          updated_at: string;
          visibility: string | null;
        };
        Insert: {
          content_data: Json;
          content_type?: string | null;
          course_id?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          owner_id: string;
          tags?: string[] | null;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
          visibility?: string | null;
        };
        Update: {
          content_data?: Json;
          content_type?: string | null;
          course_id?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          owner_id?: string;
          tags?: string[] | null;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shared_content_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shared_content_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shared_content_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'shared_content_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      sme_nurturing_analytics: {
        Row: {
          created_at: string | null;
          email_id: string;
          event_timestamp: string | null;
          event_type: string;
          id: string;
          ip_address: unknown;
          link_clicked: string | null;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string | null;
          email_id: string;
          event_timestamp?: string | null;
          event_type: string;
          id?: string;
          ip_address?: unknown;
          link_clicked?: string | null;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string | null;
          email_id?: string;
          event_timestamp?: string | null;
          event_type?: string;
          id?: string;
          ip_address?: unknown;
          link_clicked?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sme_nurturing_analytics_email_id_fkey';
            columns: ['email_id'];
            isOneToOne: false;
            referencedRelation: 'sme_nurturing_emails';
            referencedColumns: ['id'];
          },
        ];
      };
      sme_nurturing_campaigns: {
        Row: {
          assessment_id: string;
          campaign_status: string | null;
          company_email: string;
          created_at: string | null;
          emails_opened: number | null;
          emails_sent: number | null;
          id: string;
          links_clicked: number | null;
          next_email_scheduled_at: string | null;
          start_date: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          assessment_id: string;
          campaign_status?: string | null;
          company_email: string;
          created_at?: string | null;
          emails_opened?: number | null;
          emails_sent?: number | null;
          id?: string;
          links_clicked?: number | null;
          next_email_scheduled_at?: string | null;
          start_date?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          assessment_id?: string;
          campaign_status?: string | null;
          company_email?: string;
          created_at?: string | null;
          emails_opened?: number | null;
          emails_sent?: number | null;
          id?: string;
          links_clicked?: number | null;
          next_email_scheduled_at?: string | null;
          start_date?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sme_nurturing_campaigns_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: true;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sme_nurturing_campaigns_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      sme_nurturing_emails: {
        Row: {
          campaign_id: string;
          clicked_at: string | null;
          created_at: string | null;
          email_body: string;
          email_type: string;
          id: string;
          opened_at: string | null;
          scheduled_days_after_start: number;
          sent_at: string | null;
          sequence_number: number;
          status: string | null;
          subject_line: string;
        };
        Insert: {
          campaign_id: string;
          clicked_at?: string | null;
          created_at?: string | null;
          email_body: string;
          email_type: string;
          id?: string;
          opened_at?: string | null;
          scheduled_days_after_start: number;
          sent_at?: string | null;
          sequence_number: number;
          status?: string | null;
          subject_line: string;
        };
        Update: {
          campaign_id?: string;
          clicked_at?: string | null;
          created_at?: string | null;
          email_body?: string;
          email_type?: string;
          id?: string;
          opened_at?: string | null;
          scheduled_days_after_start?: number;
          sent_at?: string | null;
          sequence_number?: number;
          status?: string | null;
          subject_line?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sme_nurturing_emails_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'sme_nurturing_campaigns';
            referencedColumns: ['id'];
          },
        ];
      };
      sme_roadmap_items: {
        Row: {
          assessment_id: string;
          created_at: string | null;
          dependencies: string[] | null;
          description: string;
          estimated_cost_usd: number | null;
          estimated_weeks: number;
          id: string;
          phase: string;
          phase_order: number;
          priority: string;
          required_resources: string[] | null;
          success_metrics: string[] | null;
          title: string;
        };
        Insert: {
          assessment_id: string;
          created_at?: string | null;
          dependencies?: string[] | null;
          description: string;
          estimated_cost_usd?: number | null;
          estimated_weeks: number;
          id?: string;
          phase: string;
          phase_order: number;
          priority: string;
          required_resources?: string[] | null;
          success_metrics?: string[] | null;
          title: string;
        };
        Update: {
          assessment_id?: string;
          created_at?: string | null;
          dependencies?: string[] | null;
          description?: string;
          estimated_cost_usd?: number | null;
          estimated_weeks?: number;
          id?: string;
          phase?: string;
          phase_order?: number;
          priority?: string;
          required_resources?: string[] | null;
          success_metrics?: string[] | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sme_roadmap_items_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      sme_roadmap_milestones: {
        Row: {
          assessment_id: string;
          created_at: string | null;
          deliverables: string[] | null;
          id: string;
          milestone_name: string;
          target_week: number;
          validation_criteria: string[] | null;
        };
        Insert: {
          assessment_id: string;
          created_at?: string | null;
          deliverables?: string[] | null;
          id?: string;
          milestone_name: string;
          target_week: number;
          validation_criteria?: string[] | null;
        };
        Update: {
          assessment_id?: string;
          created_at?: string | null;
          deliverables?: string[] | null;
          id?: string;
          milestone_name?: string;
          target_week?: number;
          validation_criteria?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sme_roadmap_milestones_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      sme_roadmap_phases: {
        Row: {
          assessment_id: string;
          completion_criteria: string[] | null;
          created_at: string | null;
          duration_weeks: number;
          id: string;
          phase: string;
          start_week: number;
          total_cost_usd: number | null;
        };
        Insert: {
          assessment_id: string;
          completion_criteria?: string[] | null;
          created_at?: string | null;
          duration_weeks: number;
          id?: string;
          phase: string;
          start_week: number;
          total_cost_usd?: number | null;
        };
        Update: {
          assessment_id?: string;
          completion_criteria?: string[] | null;
          created_at?: string | null;
          duration_weeks?: number;
          id?: string;
          phase?: string;
          start_week?: number;
          total_cost_usd?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sme_roadmap_phases_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      sme_roi_benefit_breakdown: {
        Row: {
          annual_value_usd: number;
          assessment_id: string;
          assumptions: string[] | null;
          benefit_name: string;
          category: string;
          confidence_level: string;
          created_at: string | null;
          id: string;
        };
        Insert: {
          annual_value_usd: number;
          assessment_id: string;
          assumptions?: string[] | null;
          benefit_name: string;
          category: string;
          confidence_level: string;
          created_at?: string | null;
          id?: string;
        };
        Update: {
          annual_value_usd?: number;
          assessment_id?: string;
          assumptions?: string[] | null;
          benefit_name?: string;
          category?: string;
          confidence_level?: string;
          created_at?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sme_roi_benefit_breakdown_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      sme_roi_cost_breakdown: {
        Row: {
          annual_cost_usd: number | null;
          assessment_id: string;
          category: string;
          created_at: string | null;
          id: string;
          item_name: string;
          notes: string | null;
          one_time_cost_usd: number | null;
        };
        Insert: {
          annual_cost_usd?: number | null;
          assessment_id: string;
          category: string;
          created_at?: string | null;
          id?: string;
          item_name: string;
          notes?: string | null;
          one_time_cost_usd?: number | null;
        };
        Update: {
          annual_cost_usd?: number | null;
          assessment_id?: string;
          category?: string;
          created_at?: string | null;
          id?: string;
          item_name?: string;
          notes?: string | null;
          one_time_cost_usd?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sme_roi_cost_breakdown_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      sme_roi_summary: {
        Row: {
          assessment_id: string;
          created_at: string | null;
          id: string;
          net_present_value_usd: number | null;
          payback_months: number;
          risk_adjusted_roi_percent: number | null;
          three_year_roi_percent: number;
          total_annual_benefit_usd: number;
          total_investment_usd: number;
        };
        Insert: {
          assessment_id: string;
          created_at?: string | null;
          id?: string;
          net_present_value_usd?: number | null;
          payback_months: number;
          risk_adjusted_roi_percent?: number | null;
          three_year_roi_percent: number;
          total_annual_benefit_usd: number;
          total_investment_usd: number;
        };
        Update: {
          assessment_id?: string;
          created_at?: string | null;
          id?: string;
          net_present_value_usd?: number | null;
          payback_months?: number;
          risk_adjusted_roi_percent?: number | null;
          three_year_roi_percent?: number;
          total_annual_benefit_usd?: number;
          total_investment_usd?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'sme_roi_summary_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: true;
            referencedRelation: 'ai_opportunity_assessments';
            referencedColumns: ['id'];
          },
        ];
      };
      student_risk_scores: {
        Row: {
          calculated_at: string | null;
          id: string;
          predicted_outcome: string | null;
          recommended_interventions: Json | null;
          risk_factors: Json;
          risk_level: string;
          risk_score: number;
          user_id: string;
          valid_until: string;
        };
        Insert: {
          calculated_at?: string | null;
          id?: string;
          predicted_outcome?: string | null;
          recommended_interventions?: Json | null;
          risk_factors?: Json;
          risk_level: string;
          risk_score: number;
          user_id: string;
          valid_until: string;
        };
        Update: {
          calculated_at?: string | null;
          id?: string;
          predicted_outcome?: string | null;
          recommended_interventions?: Json | null;
          risk_factors?: Json;
          risk_level?: string;
          risk_score?: number;
          user_id?: string;
          valid_until?: string;
        };
        Relationships: [];
      };
      survey_answers: {
        Row: {
          answer_value: Json;
          created_at: string | null;
          id: string;
          question_id: string | null;
          response_id: string | null;
        };
        Insert: {
          answer_value: Json;
          created_at?: string | null;
          id?: string;
          question_id?: string | null;
          response_id?: string | null;
        };
        Update: {
          answer_value?: Json;
          created_at?: string | null;
          id?: string;
          question_id?: string | null;
          response_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_answers_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'survey_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'survey_answers_response_id_fkey';
            columns: ['response_id'];
            isOneToOne: false;
            referencedRelation: 'survey_responses';
            referencedColumns: ['id'];
          },
        ];
      };
      survey_questions: {
        Row: {
          created_at: string | null;
          id: string;
          is_required: boolean | null;
          metadata: Json | null;
          options: Json | null;
          order_index: number;
          question_text: string;
          question_type: Database['public']['Enums']['survey_question_type'];
          survey_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_required?: boolean | null;
          metadata?: Json | null;
          options?: Json | null;
          order_index: number;
          question_text: string;
          question_type: Database['public']['Enums']['survey_question_type'];
          survey_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_required?: boolean | null;
          metadata?: Json | null;
          options?: Json | null;
          order_index?: number;
          question_text?: string;
          question_type?: Database['public']['Enums']['survey_question_type'];
          survey_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_questions_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'survey_analytics';
            referencedColumns: ['survey_id'];
          },
          {
            foreignKeyName: 'survey_questions_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
        ];
      };
      survey_responses: {
        Row: {
          completed_at: string | null;
          id: string;
          ip_hash: string | null;
          is_complete: boolean | null;
          metadata: Json | null;
          respondent_category: Database['public']['Enums']['audience_category'];
          respondent_email: string | null;
          respondent_id: string | null;
          started_at: string | null;
          survey_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          id?: string;
          ip_hash?: string | null;
          is_complete?: boolean | null;
          metadata?: Json | null;
          respondent_category: Database['public']['Enums']['audience_category'];
          respondent_email?: string | null;
          respondent_id?: string | null;
          started_at?: string | null;
          survey_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          id?: string;
          ip_hash?: string | null;
          is_complete?: boolean | null;
          metadata?: Json | null;
          respondent_category?: Database['public']['Enums']['audience_category'];
          respondent_email?: string | null;
          respondent_id?: string | null;
          started_at?: string | null;
          survey_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_responses_respondent_id_fkey';
            columns: ['respondent_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'survey_responses_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'survey_analytics';
            referencedColumns: ['survey_id'];
          },
          {
            foreignKeyName: 'survey_responses_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
        ];
      };
      survey_templates: {
        Row: {
          category: Database['public']['Enums']['audience_category'] | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_system: boolean | null;
          name: string;
          questions: Json;
        };
        Insert: {
          category?: Database['public']['Enums']['audience_category'] | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean | null;
          name: string;
          questions: Json;
        };
        Update: {
          category?: Database['public']['Enums']['audience_category'] | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean | null;
          name?: string;
          questions?: Json;
        };
        Relationships: [];
      };
      surveys: {
        Row: {
          allow_anonymous: boolean | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          max_responses: number | null;
          show_results_publicly: boolean | null;
          starts_at: string | null;
          status: Database['public']['Enums']['survey_status'] | null;
          target_category: Database['public']['Enums']['audience_category'] | null;
          tenant_id: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          allow_anonymous?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          max_responses?: number | null;
          show_results_publicly?: boolean | null;
          starts_at?: string | null;
          status?: Database['public']['Enums']['survey_status'] | null;
          target_category?: Database['public']['Enums']['audience_category'] | null;
          tenant_id?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          allow_anonymous?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          max_responses?: number | null;
          show_results_publicly?: boolean | null;
          starts_at?: string | null;
          status?: Database['public']['Enums']['survey_status'] | null;
          target_category?: Database['public']['Enums']['audience_category'] | null;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'surveys_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'surveys_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      system_health_metrics: {
        Row: {
          details: Json | null;
          error_message: string | null;
          id: string;
          metric_name: string;
          metric_type: string;
          recorded_at: string | null;
          response_time_ms: number | null;
          status: string;
          value: number | null;
        };
        Insert: {
          details?: Json | null;
          error_message?: string | null;
          id?: string;
          metric_name: string;
          metric_type: string;
          recorded_at?: string | null;
          response_time_ms?: number | null;
          status: string;
          value?: number | null;
        };
        Update: {
          details?: Json | null;
          error_message?: string | null;
          id?: string;
          metric_name?: string;
          metric_type?: string;
          recorded_at?: string | null;
          response_time_ms?: number | null;
          status?: string;
          value?: number | null;
        };
        Relationships: [];
      };
      tenant_domains: {
        Row: {
          created_at: string | null;
          domain: string;
          id: string;
          is_primary: boolean | null;
          is_verified: boolean | null;
          ssl_certificate: string | null;
          ssl_certificate_expires_at: string | null;
          ssl_enabled: boolean | null;
          tenant_id: string;
          verification_method: string | null;
          verification_token: string | null;
          verified_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          domain: string;
          id?: string;
          is_primary?: boolean | null;
          is_verified?: boolean | null;
          ssl_certificate?: string | null;
          ssl_certificate_expires_at?: string | null;
          ssl_enabled?: boolean | null;
          tenant_id: string;
          verification_method?: string | null;
          verification_token?: string | null;
          verified_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          domain?: string;
          id?: string;
          is_primary?: boolean | null;
          is_verified?: boolean | null;
          ssl_certificate?: string | null;
          ssl_certificate_expires_at?: string | null;
          ssl_enabled?: boolean | null;
          tenant_id?: string;
          verification_method?: string | null;
          verification_token?: string | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_domains_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenant_email_templates: {
        Row: {
          available_variables: string[] | null;
          created_at: string | null;
          html_body: string;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          name: string;
          subject: string;
          template_type: string;
          tenant_id: string;
          text_body: string | null;
          updated_at: string | null;
        };
        Insert: {
          available_variables?: string[] | null;
          created_at?: string | null;
          html_body: string;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name: string;
          subject: string;
          template_type: string;
          tenant_id: string;
          text_body?: string | null;
          updated_at?: string | null;
        };
        Update: {
          available_variables?: string[] | null;
          created_at?: string | null;
          html_body?: string;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name?: string;
          subject?: string;
          template_type?: string;
          tenant_id?: string;
          text_body?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_email_templates_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenant_members: {
        Row: {
          custom_permissions: Json | null;
          department: string | null;
          id: string;
          invitation_expires_at: string | null;
          invitation_token: string | null;
          invited_by: string | null;
          job_title: string | null;
          joined_at: string | null;
          last_active_at: string | null;
          role: string | null;
          status: string | null;
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          custom_permissions?: Json | null;
          department?: string | null;
          id?: string;
          invitation_expires_at?: string | null;
          invitation_token?: string | null;
          invited_by?: string | null;
          job_title?: string | null;
          joined_at?: string | null;
          last_active_at?: string | null;
          role?: string | null;
          status?: string | null;
          tenant_id: string;
          user_id: string;
        };
        Update: {
          custom_permissions?: Json | null;
          department?: string | null;
          id?: string;
          invitation_expires_at?: string | null;
          invitation_token?: string | null;
          invited_by?: string | null;
          job_title?: string | null;
          joined_at?: string | null;
          last_active_at?: string | null;
          role?: string | null;
          status?: string | null;
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_members_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'tenant_members_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tenant_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      tenant_pricing_models: {
        Row: {
          annual_fee: number | null;
          created_at: string | null;
          currency: string | null;
          custom_pricing_rules: Json | null;
          effective_from: string | null;
          effective_until: string | null;
          id: string;
          is_active: boolean | null;
          model_type: string;
          monthly_fee: number | null;
          price_per_course: number | null;
          price_per_user_annual: number | null;
          price_per_user_monthly: number | null;
          tenant_id: string;
          volume_discounts: Json | null;
        };
        Insert: {
          annual_fee?: number | null;
          created_at?: string | null;
          currency?: string | null;
          custom_pricing_rules?: Json | null;
          effective_from?: string | null;
          effective_until?: string | null;
          id?: string;
          is_active?: boolean | null;
          model_type: string;
          monthly_fee?: number | null;
          price_per_course?: number | null;
          price_per_user_annual?: number | null;
          price_per_user_monthly?: number | null;
          tenant_id: string;
          volume_discounts?: Json | null;
        };
        Update: {
          annual_fee?: number | null;
          created_at?: string | null;
          currency?: string | null;
          custom_pricing_rules?: Json | null;
          effective_from?: string | null;
          effective_until?: string | null;
          id?: string;
          is_active?: boolean | null;
          model_type?: string;
          monthly_fee?: number | null;
          price_per_course?: number | null;
          price_per_user_annual?: number | null;
          price_per_user_monthly?: number | null;
          tenant_id?: string;
          volume_discounts?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_pricing_models_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenants: {
        Row: {
          accent_color: string | null;
          admin_email: string | null;
          admin_phone: string | null;
          background_color: string | null;
          billing_email: string | null;
          created_at: string | null;
          current_courses: number | null;
          current_storage_mb: number | null;
          current_users: number | null;
          custom_css: string | null;
          custom_domain: string | null;
          custom_footer_text: string | null;
          custom_welcome_message: string | null;
          description: string | null;
          display_name: string;
          domain_verification_token: string | null;
          domain_verified: boolean | null;
          favicon_url: string | null;
          features: Json | null;
          font_family: string | null;
          id: string;
          integrations: Json | null;
          last_active_at: string | null;
          logo_url: string | null;
          max_courses: number | null;
          max_storage_gb: number | null;
          max_users: number | null;
          name: string;
          owner_id: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          settings: Json | null;
          show_powered_by: boolean | null;
          slug: string;
          status: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subdomain: string | null;
          subscription_end_date: string | null;
          subscription_start_date: string | null;
          support_email: string | null;
          text_color: string | null;
          theme_mode: string | null;
          tier: string | null;
          trial_ends_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          accent_color?: string | null;
          admin_email?: string | null;
          admin_phone?: string | null;
          background_color?: string | null;
          billing_email?: string | null;
          created_at?: string | null;
          current_courses?: number | null;
          current_storage_mb?: number | null;
          current_users?: number | null;
          custom_css?: string | null;
          custom_domain?: string | null;
          custom_footer_text?: string | null;
          custom_welcome_message?: string | null;
          description?: string | null;
          display_name: string;
          domain_verification_token?: string | null;
          domain_verified?: boolean | null;
          favicon_url?: string | null;
          features?: Json | null;
          font_family?: string | null;
          id?: string;
          integrations?: Json | null;
          last_active_at?: string | null;
          logo_url?: string | null;
          max_courses?: number | null;
          max_storage_gb?: number | null;
          max_users?: number | null;
          name: string;
          owner_id?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          settings?: Json | null;
          show_powered_by?: boolean | null;
          slug: string;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subdomain?: string | null;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          support_email?: string | null;
          text_color?: string | null;
          theme_mode?: string | null;
          tier?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          accent_color?: string | null;
          admin_email?: string | null;
          admin_phone?: string | null;
          background_color?: string | null;
          billing_email?: string | null;
          created_at?: string | null;
          current_courses?: number | null;
          current_storage_mb?: number | null;
          current_users?: number | null;
          custom_css?: string | null;
          custom_domain?: string | null;
          custom_footer_text?: string | null;
          custom_welcome_message?: string | null;
          description?: string | null;
          display_name?: string;
          domain_verification_token?: string | null;
          domain_verified?: boolean | null;
          favicon_url?: string | null;
          features?: Json | null;
          font_family?: string | null;
          id?: string;
          integrations?: Json | null;
          last_active_at?: string | null;
          logo_url?: string | null;
          max_courses?: number | null;
          max_storage_gb?: number | null;
          max_users?: number | null;
          name?: string;
          owner_id?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          settings?: Json | null;
          show_powered_by?: boolean | null;
          slug?: string;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subdomain?: string | null;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          support_email?: string | null;
          text_color?: string | null;
          theme_mode?: string | null;
          tier?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tenants_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          awarded_by: string | null;
          earned_at: string;
          evidence: Json | null;
          id: string;
          is_featured: boolean | null;
          tenant_id: string | null;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          awarded_by?: string | null;
          earned_at?: string;
          evidence?: Json | null;
          id?: string;
          is_featured?: boolean | null;
          tenant_id?: string | null;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          awarded_by?: string | null;
          earned_at?: string;
          evidence?: Json | null;
          id?: string;
          is_featured?: boolean | null;
          tenant_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            isOneToOne: false;
            referencedRelation: 'achievements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_achievements_awarded_by_fkey';
            columns: ['awarded_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_achievements_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_achievements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_ai_assessments: {
        Row: {
          ability_standard_error: number | null;
          audience_type: string | null;
          augmentation_level: string | null;
          completed_at: string | null;
          completion_time_seconds: number | null;
          created_at: string | null;
          current_ability_estimate: number | null;
          id: string;
          is_adaptive: boolean | null;
          is_complete: boolean | null;
          max_possible_score: number | null;
          profiling_data: Json | null;
          questions_answered_count: number | null;
          started_at: string | null;
          tool_id: string | null;
          total_score: number | null;
          user_id: string | null;
        };
        Insert: {
          ability_standard_error?: number | null;
          audience_type?: string | null;
          augmentation_level?: string | null;
          completed_at?: string | null;
          completion_time_seconds?: number | null;
          created_at?: string | null;
          current_ability_estimate?: number | null;
          id?: string;
          is_adaptive?: boolean | null;
          is_complete?: boolean | null;
          max_possible_score?: number | null;
          profiling_data?: Json | null;
          questions_answered_count?: number | null;
          started_at?: string | null;
          tool_id?: string | null;
          total_score?: number | null;
          user_id?: string | null;
        };
        Update: {
          ability_standard_error?: number | null;
          audience_type?: string | null;
          augmentation_level?: string | null;
          completed_at?: string | null;
          completion_time_seconds?: number | null;
          created_at?: string | null;
          current_ability_estimate?: number | null;
          id?: string;
          is_adaptive?: boolean | null;
          is_complete?: boolean | null;
          max_possible_score?: number | null;
          profiling_data?: Json | null;
          questions_answered_count?: number | null;
          started_at?: string | null;
          tool_id?: string | null;
          total_score?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_ai_assessments_tool_id_fkey';
            columns: ['tool_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_tools';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_ai_assessments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_ai_tool_stack: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          notes: string | null;
          proficiency_level: string | null;
          started_using_date: string | null;
          tool_id: string | null;
          updated_at: string | null;
          usage_frequency: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          notes?: string | null;
          proficiency_level?: string | null;
          started_using_date?: string | null;
          tool_id?: string | null;
          updated_at?: string | null;
          usage_frequency?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          notes?: string | null;
          proficiency_level?: string | null;
          started_using_date?: string | null;
          tool_id?: string | null;
          updated_at?: string | null;
          usage_frequency?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_ai_tool_stack_tool_id_fkey';
            columns: ['tool_id'];
            isOneToOne: false;
            referencedRelation: 'ai_tools';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_ai_tool_stack_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_aiborg_points: {
        Row: {
          created_at: string;
          last_activity_date: string | null;
          level: number | null;
          level_progress: number | null;
          points_this_month: number | null;
          points_this_week: number | null;
          rank: string | null;
          streak_days: number | null;
          total_points: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          last_activity_date?: string | null;
          level?: number | null;
          level_progress?: number | null;
          points_this_month?: number | null;
          points_this_week?: number | null;
          rank?: string | null;
          streak_days?: number | null;
          total_points?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          last_activity_date?: string | null;
          level?: number | null;
          level_progress?: number | null;
          points_this_month?: number | null;
          points_this_week?: number | null;
          rank?: string | null;
          streak_days?: number | null;
          total_points?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_aiborg_points_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_assessment_achievements: {
        Row: {
          achievement_id: string | null;
          assessment_id: string | null;
          earned_at: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          achievement_id?: string | null;
          assessment_id?: string | null;
          earned_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          achievement_id?: string | null;
          assessment_id?: string | null;
          earned_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_assessment_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_achievements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_assessment_achievements_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'user_ai_assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_assessment_achievements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_assessment_answers: {
        Row: {
          answered_at: string | null;
          assessment_id: string | null;
          id: string;
          question_id: string | null;
          score_earned: number | null;
          selected_options: string[] | null;
          text_answer: string | null;
        };
        Insert: {
          answered_at?: string | null;
          assessment_id?: string | null;
          id?: string;
          question_id?: string | null;
          score_earned?: number | null;
          selected_options?: string[] | null;
          text_answer?: string | null;
        };
        Update: {
          answered_at?: string | null;
          assessment_id?: string | null;
          id?: string;
          question_id?: string | null;
          score_earned?: number | null;
          selected_options?: string[] | null;
          text_answer?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_assessment_answers_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'user_ai_assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_assessment_answers_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'assessment_questions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_learning_goals: {
        Row: {
          assessment_id: string | null;
          completed_at: string | null;
          created_at: string | null;
          current_augmentation_level: string | null;
          current_irt_ability: number | null;
          current_status: string | null;
          estimated_weeks: number | null;
          focus_category_ids: string[] | null;
          focus_skills: string[] | null;
          goal_description: string | null;
          goal_title: string;
          hours_per_week: number | null;
          id: string;
          include_events: boolean | null;
          include_workshops: boolean | null;
          preferred_learning_style: string | null;
          started_at: string | null;
          target_augmentation_level: string;
          target_completion_date: string | null;
          target_irt_ability: number | null;
          tenant_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          assessment_id?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          current_augmentation_level?: string | null;
          current_irt_ability?: number | null;
          current_status?: string | null;
          estimated_weeks?: number | null;
          focus_category_ids?: string[] | null;
          focus_skills?: string[] | null;
          goal_description?: string | null;
          goal_title: string;
          hours_per_week?: number | null;
          id?: string;
          include_events?: boolean | null;
          include_workshops?: boolean | null;
          preferred_learning_style?: string | null;
          started_at?: string | null;
          target_augmentation_level: string;
          target_completion_date?: string | null;
          target_irt_ability?: number | null;
          tenant_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          assessment_id?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          current_augmentation_level?: string | null;
          current_irt_ability?: number | null;
          current_status?: string | null;
          estimated_weeks?: number | null;
          focus_category_ids?: string[] | null;
          focus_skills?: string[] | null;
          goal_description?: string | null;
          goal_title?: string;
          hours_per_week?: number | null;
          id?: string;
          include_events?: boolean | null;
          include_workshops?: boolean | null;
          preferred_learning_style?: string | null;
          started_at?: string | null;
          target_augmentation_level?: string;
          target_completion_date?: string | null;
          target_irt_ability?: number | null;
          tenant_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_learning_goals_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'user_ai_assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_learning_goals_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_learning_goals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_progress: {
        Row: {
          completed_at: string | null;
          course_id: number;
          created_at: string;
          current_position: string | null;
          id: string;
          last_accessed: string | null;
          module_id: string | null;
          notes: string | null;
          progress_percentage: number | null;
          tenant_id: string | null;
          time_spent_minutes: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          course_id: number;
          created_at?: string;
          current_position?: string | null;
          id?: string;
          last_accessed?: string | null;
          module_id?: string | null;
          notes?: string | null;
          progress_percentage?: number | null;
          tenant_id?: string | null;
          time_spent_minutes?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          course_id?: number;
          created_at?: string;
          current_position?: string | null;
          id?: string;
          last_accessed?: string | null;
          module_id?: string | null;
          notes?: string | null;
          progress_percentage?: number | null;
          tenant_id?: string | null;
          time_spent_minutes?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_progress_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_progress_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_progress_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_resource_allocations: {
        Row: {
          allocated_at: string;
          allocated_by: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          last_accessed_at: string | null;
          notes: string | null;
          resource_id: string;
          updated_at: string;
          user_id: string;
          view_count: number;
          viewed_at: string | null;
        };
        Insert: {
          allocated_at?: string;
          allocated_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          last_accessed_at?: string | null;
          notes?: string | null;
          resource_id: string;
          updated_at?: string;
          user_id: string;
          view_count?: number;
          viewed_at?: string | null;
        };
        Update: {
          allocated_at?: string;
          allocated_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          last_accessed_at?: string | null;
          notes?: string | null;
          resource_id?: string;
          updated_at?: string;
          user_id?: string;
          view_count?: number;
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_resource_allocations_allocated_by_fkey';
            columns: ['allocated_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_resource_allocations_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'user_resources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_resource_allocations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_resources: {
        Row: {
          category: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          duration: number | null;
          file_size: number | null;
          file_url: string | null;
          id: string;
          is_active: boolean;
          resource_type: string;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          duration?: number | null;
          file_size?: number | null;
          file_url?: string | null;
          id?: string;
          is_active?: boolean;
          resource_type: string;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          duration?: number | null;
          file_size?: number | null;
          file_url?: string | null;
          id?: string;
          is_active?: boolean;
          resource_type?: string;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_resources_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_vault_bookmarks: {
        Row: {
          content_id: string;
          created_at: string | null;
          id: string;
          notes: string | null;
          user_id: string;
        };
        Insert: {
          content_id: string;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          content_id?: string;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_vault_bookmarks_content_id_fkey';
            columns: ['content_id'];
            isOneToOne: false;
            referencedRelation: 'vault_content';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_vault_bookmarks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      vault_content: {
        Row: {
          author_avatar_url: string | null;
          author_bio: string | null;
          author_name: string | null;
          average_rating: number | null;
          bookmark_count: number | null;
          category: string;
          content: string | null;
          content_type: Database['public']['Enums']['vault_content_type'];
          created_at: string | null;
          description: string;
          difficulty_level: string | null;
          download_count: number | null;
          duration_minutes: number | null;
          excerpt: string | null;
          featured_order: number | null;
          file_size_mb: number | null;
          id: string;
          is_knowledge_base: boolean | null;
          is_premium: boolean;
          is_published: boolean;
          kb_category: string | null;
          kb_difficulty: string | null;
          meta_description: string | null;
          meta_title: string | null;
          metadata: Json | null;
          published_at: string | null;
          rating_count: number | null;
          required_plan_tier: number | null;
          slug: string;
          status: string | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
          url: string | null;
          view_count: number | null;
        };
        Insert: {
          author_avatar_url?: string | null;
          author_bio?: string | null;
          author_name?: string | null;
          average_rating?: number | null;
          bookmark_count?: number | null;
          category: string;
          content?: string | null;
          content_type: Database['public']['Enums']['vault_content_type'];
          created_at?: string | null;
          description: string;
          difficulty_level?: string | null;
          download_count?: number | null;
          duration_minutes?: number | null;
          excerpt?: string | null;
          featured_order?: number | null;
          file_size_mb?: number | null;
          id?: string;
          is_knowledge_base?: boolean | null;
          is_premium?: boolean;
          is_published?: boolean;
          kb_category?: string | null;
          kb_difficulty?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          metadata?: Json | null;
          published_at?: string | null;
          rating_count?: number | null;
          required_plan_tier?: number | null;
          slug: string;
          status?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
          url?: string | null;
          view_count?: number | null;
        };
        Update: {
          author_avatar_url?: string | null;
          author_bio?: string | null;
          author_name?: string | null;
          average_rating?: number | null;
          bookmark_count?: number | null;
          category?: string;
          content?: string | null;
          content_type?: Database['public']['Enums']['vault_content_type'];
          created_at?: string | null;
          description?: string;
          difficulty_level?: string | null;
          download_count?: number | null;
          duration_minutes?: number | null;
          excerpt?: string | null;
          featured_order?: number | null;
          file_size_mb?: number | null;
          id?: string;
          is_knowledge_base?: boolean | null;
          is_premium?: boolean;
          is_published?: boolean;
          kb_category?: string | null;
          kb_difficulty?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          metadata?: Json | null;
          published_at?: string | null;
          rating_count?: number | null;
          required_plan_tier?: number | null;
          slug?: string;
          status?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
          url?: string | null;
          view_count?: number | null;
        };
        Relationships: [];
      };
      vault_content_access_log: {
        Row: {
          accessed_at: string | null;
          action_type: string;
          completed: boolean | null;
          content_id: string;
          id: string;
          subscription_id: string | null;
          user_id: string;
          watch_percentage: number | null;
        };
        Insert: {
          accessed_at?: string | null;
          action_type: string;
          completed?: boolean | null;
          content_id: string;
          id?: string;
          subscription_id?: string | null;
          user_id: string;
          watch_percentage?: number | null;
        };
        Update: {
          accessed_at?: string | null;
          action_type?: string;
          completed?: boolean | null;
          content_id?: string;
          id?: string;
          subscription_id?: string | null;
          user_id?: string;
          watch_percentage?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vault_content_access_log_content_id_fkey';
            columns: ['content_id'];
            isOneToOne: false;
            referencedRelation: 'vault_content';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vault_content_access_log_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'membership_subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vault_content_access_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      vault_subscribers: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          is_active: boolean | null;
          last_verified_at: string | null;
          metadata: Json | null;
          subscription_end_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          is_active?: boolean | null;
          last_verified_at?: string | null;
          metadata?: Json | null;
          subscription_end_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          is_active?: boolean | null;
          last_verified_at?: string | null;
          metadata?: Json | null;
          subscription_end_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      vault_subscription_claims: {
        Row: {
          admin_notes: string | null;
          created_at: string | null;
          declaration_accepted: boolean;
          family_members: Json | null;
          family_pass_grant_id: string | null;
          id: string;
          metadata: Json | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          updated_at: string | null;
          user_email: string;
          user_id: string | null;
          user_name: string;
          vault_email: string;
          vault_subscription_end_date: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          created_at?: string | null;
          declaration_accepted?: boolean;
          family_members?: Json | null;
          family_pass_grant_id?: string | null;
          id?: string;
          metadata?: Json | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string | null;
          user_email: string;
          user_id?: string | null;
          user_name: string;
          vault_email: string;
          vault_subscription_end_date?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string | null;
          declaration_accepted?: boolean;
          family_members?: Json | null;
          family_pass_grant_id?: string | null;
          id?: string;
          metadata?: Json | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string | null;
          user_email?: string;
          user_id?: string | null;
          user_name?: string;
          vault_email?: string;
          vault_subscription_end_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vault_subscription_claims_family_pass_grant_id_fkey';
            columns: ['family_pass_grant_id'];
            isOneToOne: false;
            referencedRelation: 'admin_family_pass_grants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vault_subscription_claims_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'vault_subscription_claims_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      webhook_deliveries: {
        Row: {
          attempts: number | null;
          created_at: string | null;
          duration: number | null;
          error_message: string | null;
          event: string;
          id: string;
          next_retry: string | null;
          request_body: string | null;
          request_headers: Json | null;
          response_body: string | null;
          response_headers: Json | null;
          status: string;
          status_code: number | null;
          webhook_id: string;
        };
        Insert: {
          attempts?: number | null;
          created_at?: string | null;
          duration?: number | null;
          error_message?: string | null;
          event: string;
          id?: string;
          next_retry?: string | null;
          request_body?: string | null;
          request_headers?: Json | null;
          response_body?: string | null;
          response_headers?: Json | null;
          status?: string;
          status_code?: number | null;
          webhook_id: string;
        };
        Update: {
          attempts?: number | null;
          created_at?: string | null;
          duration?: number | null;
          error_message?: string | null;
          event?: string;
          id?: string;
          next_retry?: string | null;
          request_body?: string | null;
          request_headers?: Json | null;
          response_body?: string | null;
          response_headers?: Json | null;
          status?: string;
          status_code?: number | null;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_deliveries_webhook_id_fkey';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      webhooks: {
        Row: {
          consecutive_failures: number | null;
          created_at: string | null;
          created_by: string | null;
          events: string[];
          failure_count: number | null;
          id: string;
          last_triggered: string | null;
          max_retries: number | null;
          name: string;
          retry_enabled: boolean | null;
          secret: string;
          status: string;
          success_count: number | null;
          timeout_seconds: number | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          consecutive_failures?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          events: string[];
          failure_count?: number | null;
          id?: string;
          last_triggered?: string | null;
          max_retries?: number | null;
          name: string;
          retry_enabled?: boolean | null;
          secret: string;
          status?: string;
          success_count?: number | null;
          timeout_seconds?: number | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          consecutive_failures?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          events?: string[];
          failure_count?: number | null;
          id?: string;
          last_triggered?: string | null;
          max_retries?: number | null;
          name?: string;
          retry_enabled?: boolean | null;
          secret?: string;
          status?: string;
          success_count?: number | null;
          timeout_seconds?: number | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhooks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      workshop_groups: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          name: string;
          workshop_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          workshop_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          workshop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workshop_groups_workshop_id_fkey';
            columns: ['workshop_id'];
            isOneToOne: false;
            referencedRelation: 'workshops';
            referencedColumns: ['id'];
          },
        ];
      };
      workshop_messages: {
        Row: {
          created_at: string;
          file_url: string | null;
          group_id: string | null;
          id: string;
          message: string;
          message_type: string | null;
          user_id: string;
          workshop_id: string;
        };
        Insert: {
          created_at?: string;
          file_url?: string | null;
          group_id?: string | null;
          id?: string;
          message: string;
          message_type?: string | null;
          user_id: string;
          workshop_id: string;
        };
        Update: {
          created_at?: string;
          file_url?: string | null;
          group_id?: string | null;
          id?: string;
          message?: string;
          message_type?: string | null;
          user_id?: string;
          workshop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workshop_messages_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'workshop_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workshop_messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'workshop_messages_workshop_id_fkey';
            columns: ['workshop_id'];
            isOneToOne: false;
            referencedRelation: 'workshops';
            referencedColumns: ['id'];
          },
        ];
      };
      workshop_participants: {
        Row: {
          completed: boolean | null;
          feedback_given: string | null;
          group_id: string | null;
          id: string;
          joined_at: string;
          points_earned: number | null;
          role: string | null;
          user_id: string;
          workshop_id: string;
        };
        Insert: {
          completed?: boolean | null;
          feedback_given?: string | null;
          group_id?: string | null;
          id?: string;
          joined_at?: string;
          points_earned?: number | null;
          role?: string | null;
          user_id: string;
          workshop_id: string;
        };
        Update: {
          completed?: boolean | null;
          feedback_given?: string | null;
          group_id?: string | null;
          id?: string;
          joined_at?: string;
          points_earned?: number | null;
          role?: string | null;
          user_id?: string;
          workshop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workshop_participants_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'workshop_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workshop_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'workshop_participants_workshop_id_fkey';
            columns: ['workshop_id'];
            isOneToOne: false;
            referencedRelation: 'workshops';
            referencedColumns: ['id'];
          },
        ];
      };
      workshop_submissions: {
        Row: {
          attachments: string[] | null;
          content: string;
          group_id: string;
          id: string;
          phase: string;
          reviewed: boolean | null;
          reviewer_feedback: string | null;
          submitted_at: string;
          submitted_by: string | null;
          workshop_id: string;
        };
        Insert: {
          attachments?: string[] | null;
          content: string;
          group_id: string;
          id?: string;
          phase: string;
          reviewed?: boolean | null;
          reviewer_feedback?: string | null;
          submitted_at?: string;
          submitted_by?: string | null;
          workshop_id: string;
        };
        Update: {
          attachments?: string[] | null;
          content?: string;
          group_id?: string;
          id?: string;
          phase?: string;
          reviewed?: boolean | null;
          reviewer_feedback?: string | null;
          submitted_at?: string;
          submitted_by?: string | null;
          workshop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workshop_submissions_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'workshop_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workshop_submissions_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'workshop_submissions_workshop_id_fkey';
            columns: ['workshop_id'];
            isOneToOne: false;
            referencedRelation: 'workshops';
            referencedColumns: ['id'];
          },
        ];
      };
      workshops: {
        Row: {
          course_id: number;
          created_at: string;
          created_by: string | null;
          current_phase: string | null;
          description: string;
          duration_minutes: number | null;
          facilitator_id: string | null;
          id: string;
          is_published: boolean | null;
          leader_bonus_points: number | null;
          max_group_size: number | null;
          max_participants: number | null;
          min_group_size: number | null;
          objectives: string[] | null;
          phase_start_time: string | null;
          points_reward: number | null;
          problem_statement: string | null;
          scheduled_date: string;
          tenant_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          course_id: number;
          created_at?: string;
          created_by?: string | null;
          current_phase?: string | null;
          description: string;
          duration_minutes?: number | null;
          facilitator_id?: string | null;
          id?: string;
          is_published?: boolean | null;
          leader_bonus_points?: number | null;
          max_group_size?: number | null;
          max_participants?: number | null;
          min_group_size?: number | null;
          objectives?: string[] | null;
          phase_start_time?: string | null;
          points_reward?: number | null;
          problem_statement?: string | null;
          scheduled_date: string;
          tenant_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          course_id?: number;
          created_at?: string;
          created_by?: string | null;
          current_phase?: string | null;
          description?: string;
          duration_minutes?: number | null;
          facilitator_id?: string | null;
          id?: string;
          is_published?: boolean | null;
          leader_bonus_points?: number | null;
          max_group_size?: number | null;
          max_participants?: number | null;
          min_group_size?: number | null;
          objectives?: string[] | null;
          phase_start_time?: string | null;
          points_reward?: number | null;
          problem_statement?: string | null;
          scheduled_date?: string;
          tenant_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workshops_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workshops_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses_with_audiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workshops_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'workshops_facilitator_id_fkey';
            columns: ['facilitator_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'workshops_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      wrong_answer_explanations: {
        Row: {
          cache_key: string | null;
          correct_answer: Json;
          created_at: string | null;
          explanation_style: string;
          explanation_text: string;
          id: string;
          model_used: string;
          question_id: string;
          question_type: string;
          rating: number | null;
          tokens_used: number | null;
          user_answer: Json;
          user_id: string;
        };
        Insert: {
          cache_key?: string | null;
          correct_answer: Json;
          created_at?: string | null;
          explanation_style: string;
          explanation_text: string;
          id?: string;
          model_used: string;
          question_id: string;
          question_type: string;
          rating?: number | null;
          tokens_used?: number | null;
          user_answer: Json;
          user_id: string;
        };
        Update: {
          cache_key?: string | null;
          correct_answer?: Json;
          created_at?: string | null;
          explanation_style?: string;
          explanation_text?: string;
          id?: string;
          model_used?: string;
          question_id?: string;
          question_type?: string;
          rating?: number | null;
          tokens_used?: number | null;
          user_answer?: Json;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      courses_with_audiences: {
        Row: {
          audience: string | null;
          audiences: string[] | null;
          audiences_migrated: boolean | null;
          category: string | null;
          created_at: string | null;
          currently_enrolling: boolean | null;
          description: string | null;
          display: boolean | null;
          duration: string | null;
          end_date: string | null;
          enrollment_count: number | null;
          features: string[] | null;
          id: number | null;
          is_active: boolean | null;
          keywords: string[] | null;
          level: string | null;
          max_capacity: number | null;
          mode: string | null;
          prerequisites: string | null;
          price: string | null;
          sort_order: number | null;
          start_date: string | null;
          title: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      embeddable_content: {
        Row: {
          content: string | null;
          content_id: string | null;
          content_type: string | null;
          metadata: Json | null;
          title: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      engagement_analytics: {
        Row: {
          action_count: number | null;
          action_type: string | null;
          hour: string | null;
          page_path: string | null;
          unique_sessions: number | null;
          unique_users: number | null;
        };
        Relationships: [];
      };
      lingo_daily_stats: {
        Row: {
          date: string | null;
          lessons_completed: number | null;
          lessons_started: number | null;
          questions_answered: number | null;
          total_xp_earned: number | null;
          unique_users: number | null;
        };
        Relationships: [];
      };
      lingo_leaderboard_view: {
        Row: {
          avatar_url: string | null;
          display_name: string | null;
          lessons_completed: number | null;
          perfect_lessons: number | null;
          rank: number | null;
          score: number | null;
          streak: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lingo_leaderboard_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      lingo_lesson_stats: {
        Row: {
          completions: number | null;
          id: string | null;
          lesson_id: string | null;
          question_count: number | null;
          skill: string | null;
          starts: number | null;
          title: string | null;
          xp_reward: number | null;
        };
        Relationships: [];
      };
      page_view_analytics: {
        Row: {
          avg_duration_seconds: number | null;
          date: string | null;
          desktop_views: number | null;
          mobile_views: number | null;
          page_path: string | null;
          tablet_views: number | null;
          total_views: number | null;
          unique_sessions: number | null;
          unique_users: number | null;
        };
        Relationships: [];
      };
      public_blog_posts: {
        Row: {
          allow_comments: boolean | null;
          author_avatar: string | null;
          author_id: string | null;
          author_name: string | null;
          category_color: string | null;
          category_id: string | null;
          category_name: string | null;
          category_slug: string | null;
          comment_count: number | null;
          content: string | null;
          created_at: string | null;
          excerpt: string | null;
          featured_image: string | null;
          id: string | null;
          is_featured: boolean | null;
          like_count: number | null;
          meta_description: string | null;
          meta_title: string | null;
          published_at: string | null;
          reading_time: number | null;
          scheduled_for: string | null;
          share_count: number | null;
          slug: string | null;
          status: string | null;
          tags: Json[] | null;
          title: string | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_posts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'blog_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      review_request_stats: {
        Row: {
          avg_response_hours: number | null;
          completed_count: number | null;
          dismissed_count: number | null;
          first_request_sent: string | null;
          last_response_received: string | null;
          pending_count: number | null;
          response_rate_pct: number | null;
          session_date: string | null;
          session_id: string | null;
          session_title: string | null;
          session_type: string | null;
          total_requests: number | null;
        };
        Relationships: [];
      };
      survey_analytics: {
        Row: {
          avg_completion_seconds: number | null;
          career_changer_responses: number | null;
          completed_responses: number | null;
          entrepreneur_responses: number | null;
          first_response_at: string | null;
          last_response_at: string | null;
          professional_responses: number | null;
          status: Database['public']['Enums']['survey_status'] | null;
          student_responses: number | null;
          survey_id: string | null;
          target_category: Database['public']['Enums']['audience_category'] | null;
          title: string | null;
          total_responses: number | null;
        };
        Relationships: [];
      };
      user_active_learning_paths: {
        Row: {
          assessment_id: string | null;
          available_items: number | null;
          completed_items: number | null;
          created_at: string | null;
          current_item_index: number | null;
          difficulty_end: string | null;
          difficulty_start: string | null;
          estimated_completion_weeks: number | null;
          estimated_total_hours: number | null;
          focus_skills: string[] | null;
          generated_by_ai: boolean | null;
          generation_algorithm: string | null;
          generation_metadata: Json | null;
          goal_id: string | null;
          goal_title: string | null;
          id: string | null;
          is_active: boolean | null;
          is_custom_modified: boolean | null;
          items_completed: number | null;
          last_accessed_at: string | null;
          milestones_completed: number | null;
          path_description: string | null;
          path_title: string | null;
          progress_percentage: number | null;
          target_augmentation_level: string | null;
          total_courses: number | null;
          total_events: number | null;
          total_exercises: number | null;
          total_items: number | null;
          total_milestones: number | null;
          total_path_items: number | null;
          total_quizzes: number | null;
          total_workshops: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_generated_learning_paths_assessment_id_fkey';
            columns: ['assessment_id'];
            isOneToOne: false;
            referencedRelation: 'user_ai_assessments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_generated_learning_paths_goal_id_fkey';
            columns: ['goal_id'];
            isOneToOne: false;
            referencedRelation: 'user_learning_goals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_generated_learning_paths_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_dashboard';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_dashboard: {
        Row: {
          certificates_earned: number | null;
          current_streak: number | null;
          display_name: string | null;
          email: string | null;
          enrolled_courses: number | null;
          pending_assignments: number | null;
          role: string | null;
          total_achievements: number | null;
          unread_notifications: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_family_invitation: {
        Args: { p_invitation_token: string };
        Returns: string;
      };
      add_course_audience: {
        Args: { p_audience: string; p_course_id: number };
        Returns: undefined;
      };
      add_family_member: {
        Args: {
          p_access_level?: string;
          p_member_age: number;
          p_member_email: string;
          p_member_name: string;
          p_relationship: string;
          p_subscription_id: string;
        };
        Returns: string;
      };
      approve_vault_claim: {
        Args: {
          p_admin_notes?: string;
          p_admin_user_id: string;
          p_claim_id: string;
          p_grant_end_date: string;
        };
        Returns: string;
      };
      auto_revoke_expired_grants: { Args: never; Returns: number };
      award_aiborg_points: {
        Args: {
          p_description: string;
          p_points: number;
          p_source_id: string;
          p_source_type: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      backfill_session_tickets_for_course: {
        Args: { p_course_id: number };
        Returns: number;
      };
      calculate_ability_estimate: {
        Args: { p_assessment_id: string };
        Returns: {
          ability_estimate: number;
          confidence: number;
          standard_error: number;
        }[];
      };
      calculate_chatbot_message_cost: {
        Args: {
          p_completion_tokens: number;
          p_model: string;
          p_prompt_tokens: number;
        };
        Returns: number;
      };
      calculate_effect_size: {
        Args: { pooled_std: number; post_mean: number; pre_mean: number };
        Returns: number;
      };
      calculate_family_savings: {
        Args: {
          p_courses_per_member?: number;
          p_months?: number;
          p_num_members?: number;
        };
        Returns: {
          annual_savings: number;
          family_pass_cost: number;
          individual_cost: number;
          monthly_savings: number;
          roi_percentage: number;
        }[];
      };
      calculate_normalized_gain: {
        Args: { max_score?: number; post_score: number; pre_score: number };
        Returns: number;
      };
      calculate_reading_time: { Args: { content: string }; Returns: number };
      can_check_in_to_session: {
        Args: { p_session_id: string; p_user_id: string };
        Returns: {
          can_check_in: boolean;
          reason: string;
          ticket_id: string;
        }[];
      };
      check_account_lockout: { Args: { p_email: string }; Returns: Json };
      check_admin_family_pass_access: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      check_membership_access: { Args: { p_user_id: string }; Returns: boolean };
      check_realtime_enabled: { Args: { table_name: string }; Returns: boolean };
      check_tenant_limit: {
        Args: {
          p_increment?: number;
          p_limit_type: string;
          p_tenant_id: string;
        };
        Returns: boolean;
      };
      check_vault_subscription_status: {
        Args: { p_email: string };
        Returns: {
          has_approved_claim: boolean;
          has_pending_claim: boolean;
          is_active: boolean;
          subscription_end_date: string;
        }[];
      };
      cleanup_expired_llm_cache: { Args: never; Returns: number };
      cleanup_expired_lti_nonces: { Args: never; Returns: number };
      cleanup_old_security_records: { Args: never; Returns: undefined };
      cleanup_test_courses: { Args: never; Returns: undefined };
      cleanup_test_users: { Args: never; Returns: undefined };
      clear_failed_login_attempts: {
        Args: { p_email: string };
        Returns: undefined;
      };
      create_ai_study_session: {
        Args: { p_context?: Json; p_session_type: string; p_user_id: string };
        Returns: string;
      };
      create_tenant_invitation: {
        Args: {
          p_email?: string;
          p_expires_in_days?: number;
          p_invited_by: string;
          p_role?: string;
          p_tenant_id: string;
        };
        Returns: {
          expires_at: string;
          invitation_token: string;
          invitation_url: string;
        }[];
      };
      estimate_reading_time: { Args: { p_content: string }; Returns: number };
      extract_toc_from_markdown: { Args: { p_content: string }; Returns: Json };
      find_or_create_lti_user: {
        Args: {
          p_email: string;
          p_family_name?: string;
          p_given_name?: string;
          p_lti_user_id: string;
          p_name: string;
          p_picture?: string;
          p_platform_id: string;
        };
        Returns: string;
      };
      find_similar_content: {
        Args: {
          content_type_filter?: string;
          limit_count?: number;
          min_similarity?: number;
          query_embedding: string;
        };
        Returns: {
          content_id: string;
          content_type: string;
          difficulty_level: string;
          similarity: number;
          tags: string[];
          title: string;
        }[];
      };
      generate_event_ticket_number: { Args: never; Returns: string };
      generate_session_ticket_number: { Args: never; Returns: string };
      generate_slug: { Args: { title: string }; Returns: string };
      generate_ticket_number: { Args: never; Returns: string };
      generate_ticket_qr_code: {
        Args: { p_session_id: string; p_ticket_id: string; p_user_id: string };
        Returns: string;
      };
      get_active_students_count: {
        Args: { session_uuid: string };
        Returns: number;
      };
      get_active_subscription: {
        Args: { p_user_id: string };
        Returns: {
          cancel_at_period_end: boolean;
          current_period_end: string;
          includes_all_courses: boolean;
          includes_event_access: boolean;
          includes_vault_access: boolean;
          max_family_members: number;
          plan_name: string;
          status: Database['public']['Enums']['subscription_status'];
          subscription_id: string;
          trial_end: string;
        }[];
      };
      get_article_rating_stats: {
        Args: { p_article_id: string };
        Returns: {
          helpful_percentage: number;
          helpful_votes: number;
          total_votes: number;
          unhelpful_votes: number;
        }[];
      };
      get_assessment_tools_for_audience: {
        Args: { p_audience: string };
        Returns: {
          category_type: string;
          description: string;
          difficulty_level: string;
          display_order: number;
          estimated_duration_minutes: number;
          icon: string;
          id: string;
          name: string;
          slug: string;
        }[];
      };
      get_attempt_history: {
        Args: { p_tool_id: string; p_user_id: string };
        Returns: {
          ability_estimate: number;
          attempt_id: string;
          attempt_number: number;
          completed_at: string;
          improvement_from_previous: number;
          score_percentage: number;
          time_taken_seconds: number;
        }[];
      };
      get_chatbot_cost_summary: {
        Args: { p_end_date?: string; p_start_date?: string };
        Returns: {
          avg_cost_per_message: number;
          error_rate: number;
          period: string;
          total_cost_usd: number;
          total_messages: number;
          total_tokens: number;
        }[];
      };
      get_combined_membership_status: {
        Args: { p_user_id: string };
        Returns: {
          expires_at: string;
          has_access: boolean;
          source: string;
        }[];
      };
      get_course_attendance_report: {
        Args: { p_course_id: number };
        Returns: {
          attendance_rate: number;
          attended: number;
          excused: number;
          late: number;
          missed: number;
          total_sessions: number;
          user_id: string;
          user_name: string;
        }[];
      };
      get_course_audiences: { Args: { p_course_id: number }; Returns: string[] };
      get_course_session_stats: {
        Args: { p_course_id: number };
        Returns: {
          avg_attendance: number;
          cancelled_sessions: number;
          completed_sessions: number;
          total_sessions: number;
          upcoming_sessions: number;
        }[];
      };
      get_current_user_role: { Args: never; Returns: string };
      get_last_used_date_range: {
        Args: { target_user_id: string };
        Returns: Json;
      };
      get_latest_attempt_for_tool: {
        Args: { p_tool_id: string; p_user_id: string };
        Returns: {
          ability_estimate: number;
          attempt_id: string;
          attempt_number: number;
          completed_at: string;
          is_completed: boolean;
          score_percentage: number;
        }[];
      };
      get_mastery_level: { Args: { score: number }; Returns: string };
      get_next_adaptive_question: {
        Args: {
          p_answered_questions?: string[];
          p_assessment_id: string;
          p_category_id?: string;
          p_current_ability?: number;
        };
        Returns: {
          category_name: string;
          difficulty_level: string;
          irt_difficulty: number;
          options: Json;
          question_id: string;
          question_text: string;
          question_type: string;
        }[];
      };
      get_pending_claims_count: { Args: never; Returns: number };
      get_recommended_questions: {
        Args: {
          p_audience_type: string;
          p_experience_level?: string;
          p_goals?: string[];
          p_limit?: number;
        };
        Returns: {
          category_name: string;
          difficulty_level: string;
          question_id: string;
          question_text: string;
          relevance_score: number;
        }[];
      };
      get_session_attendance_list: {
        Args: { p_session_id: string };
        Returns: {
          check_in_time: string;
          duration_minutes: number;
          instructor_notes: string;
          participation_score: number;
          status: string;
          ticket_number: string;
          user_email: string;
          user_id: string;
          user_name: string;
        }[];
      };
      get_subscription_family_members: {
        Args: { p_subscription_id: string };
        Returns: {
          courses_completed_count: number;
          courses_enrolled_count: number;
          created_at: string;
          events_attended: number;
          last_login_at: string;
          member_age: number;
          member_email: string;
          member_id: string;
          member_name: string;
          relationship: Database['public']['Enums']['family_relationship'];
          status: Database['public']['Enums']['family_member_status'];
          vault_items_viewed: number;
        }[];
      };
      get_template_usage_count: {
        Args: { template_uuid: string };
        Returns: number;
      };
      get_tenant_branding: { Args: { p_tenant_id: string }; Returns: Json };
      get_tenant_by_domain: {
        Args: { domain_name: string };
        Returns: {
          domain: string;
          id: string;
          logo_url: string;
          metadata: Json;
          name: string;
          primary_color: string;
          secondary_color: string;
        }[];
      };
      get_tenant_usage_stats: { Args: { p_tenant_id: string }; Returns: Json };
      get_tickets_by_type: {
        Args: { p_type: string; p_user_id: string };
        Returns: number;
      };
      get_top_questions: {
        Args: { limit_count?: number; session_uuid: string };
        Returns: {
          created_at: string;
          id: string;
          is_pinned: boolean;
          priority: number;
          question_text: string;
          upvotes: number;
          user_id: string;
        }[];
      };
      get_upcoming_course_sessions: {
        Args: { p_course_id: number; p_limit?: number };
        Returns: {
          course_id: number;
          current_attendance: number;
          end_time: string;
          id: string;
          location: string;
          max_capacity: number;
          meeting_url: string;
          session_date: string;
          session_number: number;
          start_time: string;
          status: string;
          title: string;
        }[];
      };
      get_user_company_id: { Args: { p_user_id: string }; Returns: string };
      get_user_course_tickets: {
        Args: {
          p_course_id: number;
          p_include_past?: boolean;
          p_user_id: string;
        };
        Returns: {
          check_in_method: string;
          checked_in_at: string;
          id: string;
          qr_code: string;
          session_date: string;
          session_id: string;
          session_title: string;
          start_time: string;
          status: string;
          ticket_number: string;
        }[];
      };
      get_user_level: {
        Args: { p_total_points: number };
        Returns: {
          level: number;
          max_points: number;
          min_points: number;
          next_level_points: number;
          rank: string;
        }[];
      };
      get_user_pending_review_requests: {
        Args: { p_user_id: string };
        Returns: {
          custom_message: string;
          notification_id: string;
          request_id: string;
          requested_at: string;
          session_date: string;
          session_title: string;
          session_type: string;
        }[];
      };
      get_user_resource_count: { Args: { p_user_id: string }; Returns: number };
      get_user_risk_level: {
        Args: { p_user_id: string };
        Returns: {
          factors: Json;
          risk_level: string;
          risk_score: number;
        }[];
      };
      get_user_session_stats: {
        Args: { p_course_id: number; p_user_id: string };
        Returns: {
          attendance_rate: number;
          attended_sessions: number;
          cancelled_sessions: number;
          missed_sessions: number;
          total_sessions: number;
        }[];
      };
      get_user_study_context: { Args: { p_user_id: string }; Returns: Json };
      get_user_tenant_id: { Args: never; Returns: string };
      get_user_ticket_count: { Args: { p_user_id: string }; Returns: number };
      get_user_ticket_stats: {
        Args: { p_user_id: string };
        Returns: {
          course_session_tickets: number;
          event_tickets: number;
          total_tickets: number;
          verified_tickets: number;
        }[];
      };
      get_user_vault_stats: {
        Args: { p_user_id: string };
        Returns: {
          hours_watched: number;
          total_bookmarks: number;
          total_downloads: number;
          total_views: number;
          unique_content_viewed: number;
        }[];
      };
      get_users_needing_streak_reminder: {
        Args: never;
        Returns: {
          email: string;
          email_enabled: boolean;
          last_session_date: string;
          push_enabled: boolean;
          push_subscription: Json;
          streak: number;
          user_id: string;
        }[];
      };
      grade_quiz_attempt: {
        Args: { p_attempt_id: string };
        Returns: {
          passed: boolean;
          points_awarded: number;
          score_earned: number;
          score_percentage: number;
        }[];
      };
      grant_admin_family_pass: {
        Args: {
          p_auto_renew?: boolean;
          p_end_date: string;
          p_notes?: string;
          p_start_date: string;
          p_user_id: string;
        };
        Returns: string;
      };
      increment: {
        Args: { column_name: string; row_id: string; table_name: string };
        Returns: undefined;
      };
      insert_contact_message_simple: {
        Args: {
          p_audience: string;
          p_email: string;
          p_message: string;
          p_name: string;
          p_subject: string;
        };
        Returns: Json;
      };
      is_admin: { Args: { user_id: string }; Returns: boolean };
      is_admin_role: { Args: never; Returns: boolean };
      is_tenant_admin: { Args: { p_tenant_id?: string }; Returns: boolean };
      log_activity_event: {
        Args: { p_description: string; p_event_type: string; p_metadata?: Json };
        Returns: string;
      };
      log_vault_content_access: {
        Args: {
          p_action_type: string;
          p_content_id: string;
          p_watch_percentage?: number;
        };
        Returns: undefined;
      };
      mark_inactive_presence: { Args: never; Returns: undefined };
      mark_missed_sessions: { Args: never; Returns: number };
      record_adaptive_answer: {
        Args: {
          p_assessment_id: string;
          p_question_id: string;
          p_selected_options: string[];
          p_time_spent?: number;
        };
        Returns: {
          is_correct: boolean;
          new_ability_estimate: number;
          new_standard_error: number;
          points_earned: number;
        }[];
      };
      record_failed_login_attempt: {
        Args: { p_email: string; p_ip_address?: string; p_user_agent?: string };
        Returns: Json;
      };
      reject_vault_claim: {
        Args: {
          p_admin_notes?: string;
          p_admin_user_id: string;
          p_claim_id: string;
          p_rejection_reason: string;
        };
        Returns: boolean;
      };
      remove_course_audience: {
        Args: { p_audience: string; p_course_id: number };
        Returns: undefined;
      };
      remove_family_member: {
        Args: { p_member_id: string };
        Returns: undefined;
      };
      revoke_admin_family_pass: {
        Args: { p_grant_id: string; p_reason?: string };
        Returns: undefined;
      };
      save_last_used_date_range: {
        Args: {
          end_date: string;
          preset_value: string;
          start_date: string;
          target_user_id: string;
        };
        Returns: undefined;
      };
      search_content_by_similarity: {
        Args: {
          filter_content_type?: string;
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
        };
        Returns: {
          content: string;
          content_id: string;
          content_type: string;
          id: string;
          metadata: Json;
          similarity: number;
          title: string;
        }[];
      };
      set_course_audiences: {
        Args: { p_audiences: string[]; p_course_id: number };
        Returns: undefined;
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      submit_vault_claim: {
        Args: {
          p_family_members?: Json;
          p_metadata?: Json;
          p_user_email: string;
          p_user_id: string;
          p_user_name: string;
          p_vault_email: string;
          p_vault_subscription_end_date: string;
        };
        Returns: string;
      };
      sync_family_member_stats: {
        Args: { p_member_user_id: string };
        Returns: undefined;
      };
      sync_stripe_cancellations_to_admin_grants: {
        Args: never;
        Returns: number;
      };
      toggle_comparison_mode: {
        Args: { enabled: boolean; target_user_id: string };
        Returns: undefined;
      };
      track_resource_view: {
        Args: { p_resource_id: string; p_user_id: string };
        Returns: undefined;
      };
      trigger_webhooks: {
        Args: { p_event: string; p_payload: Json };
        Returns: number;
      };
      update_admin_family_pass_dates: {
        Args: { p_end_date: string; p_grant_id: string; p_start_date: string };
        Returns: undefined;
      };
      update_notification_sent: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      update_subscription_status: {
        Args: {
          p_canceled_at?: string;
          p_current_period_end?: string;
          p_current_period_start?: string;
          p_status: string;
          p_stripe_subscription_id: string;
        };
        Returns: undefined;
      };
      validate_date_range_json: { Args: { date_range: Json }; Returns: boolean };
      validate_lti_nonce: {
        Args: {
          p_expiry_minutes?: number;
          p_nonce: string;
          p_platform_id: string;
        };
        Returns: boolean;
      };
      validate_ticket_qr_code: {
        Args: { p_qr_code: string };
        Returns: {
          message: string;
          session_id: string;
          status: string;
          ticket_id: string;
          user_id: string;
          valid: boolean;
        }[];
      };
      verify_tenant_domain: {
        Args: { p_domain: string; p_verification_token: string };
        Returns: boolean;
      };
    };
    Enums: {
      audience_category: 'professional' | 'student' | 'entrepreneur' | 'career_changer';
      family_member_status:
        | 'pending_invitation'
        | 'invitation_sent'
        | 'active'
        | 'inactive'
        | 'removed';
      family_relationship:
        | 'self'
        | 'spouse'
        | 'partner'
        | 'child'
        | 'parent'
        | 'grandparent'
        | 'grandchild'
        | 'sibling'
        | 'other';
      subscription_status:
        | 'trialing'
        | 'active'
        | 'past_due'
        | 'canceled'
        | 'unpaid'
        | 'paused'
        | 'incomplete'
        | 'incomplete_expired';
      survey_question_type: 'single_choice' | 'multiple_choice' | 'rating' | 'text' | 'ranking';
      survey_status: 'draft' | 'active' | 'paused' | 'completed';
      vault_content_type:
        | 'video'
        | 'article'
        | 'worksheet'
        | 'template'
        | 'tool'
        | 'webinar'
        | 'case_study'
        | 'guide';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      audience_category: ['professional', 'student', 'entrepreneur', 'career_changer'],
      family_member_status: [
        'pending_invitation',
        'invitation_sent',
        'active',
        'inactive',
        'removed',
      ],
      family_relationship: [
        'self',
        'spouse',
        'partner',
        'child',
        'parent',
        'grandparent',
        'grandchild',
        'sibling',
        'other',
      ],
      subscription_status: [
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused',
        'incomplete',
        'incomplete_expired',
      ],
      survey_question_type: ['single_choice', 'multiple_choice', 'rating', 'text', 'ranking'],
      survey_status: ['draft', 'active', 'paused', 'completed'],
      vault_content_type: [
        'video',
        'article',
        'worksheet',
        'template',
        'tool',
        'webinar',
        'case_study',
        'guide',
      ],
    },
  },
} as const;
