// Database types generated from Supabase schema
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            clients: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    phone: string | null
                    vat_number: string | null
                    address: string | null
                    notes: string | null
                    status: 'ACTIVE' | 'INACTIVE'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    vat_number?: string | null
                    address?: string | null
                    notes?: string | null
                    status?: 'ACTIVE' | 'INACTIVE'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    vat_number?: string | null
                    address?: string | null
                    notes?: string | null
                    status?: 'ACTIVE' | 'INACTIVE'
                    created_at?: string
                    updated_at?: string
                }
            }
            users: {
                Row: {
                    id: string
                    email: string
                    name: string
                    role: 'ADMIN' | 'COLLABORATOR'
                    avatar: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    name: string
                    role: 'ADMIN' | 'COLLABORATOR'
                    avatar?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    role?: 'ADMIN' | 'COLLABORATOR'
                    avatar?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    name: string
                    client: string
                    client_id: string
                    color: string
                    status: 'ACTIVE' | 'ARCHIVED'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    client?: string
                    client_id: string
                    color: string
                    status?: 'ACTIVE' | 'ARCHIVED'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    client?: string
                    client_id?: string
                    color?: string
                    status?: 'ACTIVE' | 'ARCHIVED'
                    created_at?: string
                    updated_at?: string
                }
            }
            timesheet_entries: {
                Row: {
                    id: string
                    user_id: string
                    project_id: string
                    date: string
                    hours: number
                    description: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    project_id: string
                    date: string
                    hours: number
                    description: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    project_id?: string
                    date?: string
                    hours?: number
                    description?: string
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
