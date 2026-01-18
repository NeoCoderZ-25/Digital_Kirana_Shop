export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string
          address_type: string | null
          city: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          label: string
          landmark: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          pincode: string | null
          state: string | null
          user_id: string
        }
        Insert: {
          address: string
          address_type?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          user_id: string
        }
        Update: {
          address?: string
          address_type?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          discount_amount: number
          id: string
          order_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_amount: number | null
          per_user_limit: number | null
          usage_limit: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          id: string
          lifetime_earned: number | null
          lifetime_spent: number | null
          tier: string | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          lifetime_earned?: number | null
          lifetime_spent?: number | null
          tier?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          lifetime_earned?: number | null
          lifetime_spent?: number | null
          tier?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loyalty_rules: {
        Row: {
          created_at: string
          currency_per_point: number | null
          id: string
          is_active: boolean | null
          min_points_to_convert: number | null
          name: string
          points_per_currency: number | null
          return_window_minutes: number | null
          rule_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_per_point?: number | null
          id?: string
          is_active?: boolean | null
          min_points_to_convert?: number | null
          name: string
          points_per_currency?: number | null
          return_window_minutes?: number | null
          rule_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_per_point?: number | null
          id?: string
          is_active?: boolean | null
          min_points_to_convert?: number | null
          name?: string
          points_per_currency?: number | null
          return_window_minutes?: number | null
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_settings: {
        Row: {
          id: string
          is_active: boolean | null
          max_redeem_percentage: number | null
          min_redeem_points: number | null
          point_value: number | null
          points_per_rupee: number | null
          referral_bonus: number | null
          signup_bonus: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          max_redeem_percentage?: number | null
          min_redeem_points?: number | null
          point_value?: number | null
          points_per_rupee?: number | null
          referral_bonus?: number | null
          signup_bonus?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          max_redeem_percentage?: number | null
          min_redeem_points?: number | null
          point_value?: number | null
          points_per_rupee?: number | null
          referral_bonus?: number | null
          signup_bonus?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          quantity?: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          admin_reply: string | null
          created_at: string | null
          id: string
          order_id: string
          updated_at: string | null
          user_note: string | null
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string | null
          id?: string
          order_id: string
          updated_at?: string | null
          user_note?: string | null
        }
        Update: {
          admin_reply?: string | null
          created_at?: string | null
          id?: string
          order_id?: string
          updated_at?: string | null
          user_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          assigned_delivery_boy: string | null
          can_return_until: string | null
          cancel_reason: string | null
          coupon_discount: number | null
          coupon_id: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_accepted_at: string | null
          delivery_started_at: string | null
          id: string
          payment_method: string
          payment_status: string
          points_discount: number | null
          points_earned: number | null
          points_used: number | null
          return_status: string | null
          scheduled_delivery: string | null
          status: string
          total_price: number
          updated_at: string | null
          user_id: string
          wallet_payment: number | null
        }
        Insert: {
          address_id?: string | null
          assigned_delivery_boy?: string | null
          can_return_until?: string | null
          cancel_reason?: string | null
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_accepted_at?: string | null
          delivery_started_at?: string | null
          id?: string
          payment_method?: string
          payment_status?: string
          points_discount?: number | null
          points_earned?: number | null
          points_used?: number | null
          return_status?: string | null
          scheduled_delivery?: string | null
          status?: string
          total_price: number
          updated_at?: string | null
          user_id: string
          wallet_payment?: number | null
        }
        Update: {
          address_id?: string | null
          assigned_delivery_boy?: string | null
          can_return_until?: string | null
          cancel_reason?: string | null
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_accepted_at?: string | null
          delivery_started_at?: string | null
          id?: string
          payment_method?: string
          payment_status?: string
          points_discount?: number | null
          points_earned?: number | null
          points_used?: number | null
          return_status?: string | null
          scheduled_delivery?: string | null
          status?: string
          total_price?: number
          updated_at?: string | null
          user_id?: string
          wallet_payment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_qr_codes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          qr_image_url: string | null
          upi_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          qr_image_url?: string | null
          upi_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          qr_image_url?: string | null
          upi_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          extra_price: number | null
          id: string
          in_stock: boolean | null
          name: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          extra_price?: number | null
          id?: string
          in_stock?: boolean | null
          name: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          extra_price?: number | null
          id?: string
          in_stock?: boolean | null
          name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          is_featured: boolean | null
          loyalty_points: number | null
          name: string
          order_count: number | null
          price: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          is_featured?: boolean | null
          loyalty_points?: number | null
          name: string
          order_count?: number | null
          price: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          is_featured?: boolean | null
          loyalty_points?: number | null
          name?: string
          order_count?: number | null
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          phone: string | null
          preferred_language: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      review_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          review_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          review_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "delivery_boy"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "delivery_boy"],
    },
  },
} as const
