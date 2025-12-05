// Database types for Django-compatible schema
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
            auth_user: {
                Row: {
                    id: number
                    password: string
                    last_login: string | null
                    is_superuser: boolean
                    username: string
                    first_name: string
                    last_name: string
                    email: string
                    is_staff: boolean
                    is_active: boolean
                    date_joined: string
                }
                Insert: {
                    id?: number
                    password: string
                    last_login?: string | null
                    is_superuser?: boolean
                    username: string
                    first_name?: string
                    last_name?: string
                    email?: string
                    is_staff?: boolean
                    is_active?: boolean
                    date_joined?: string
                }
                Update: {
                    id?: number
                    password?: string
                    last_login?: string | null
                    is_superuser?: boolean
                    username?: string
                    first_name?: string
                    last_name?: string
                    email?: string
                    is_staff?: boolean
                    is_active?: boolean
                    date_joined?: string
                }
            }
            employees_employee: {
                Row: {
                    id: number
                    hire_date: string | null
                    job_title: string | null
                    user_id: number
                }
                Insert: {
                    id?: number
                    hire_date?: string | null
                    job_title?: string | null
                    user_id: number
                }
                Update: {
                    id?: number
                    hire_date?: string | null
                    job_title?: string | null
                    user_id?: number
                }
            }
            customers_customer: {
                Row: {
                    id: number
                    name: string
                }
                Insert: {
                    id?: number
                    name: string
                }
                Update: {
                    id?: number
                    name?: string
                }
            }
            projects_project: {
                Row: {
                    id: number
                    name: string
                    customer_id: number
                }
                Insert: {
                    id?: number
                    name: string
                    customer_id: number
                }
                Update: {
                    id?: number
                    name?: string
                    customer_id?: number
                }
            }
            timesheets_timesheet: {
                Row: {
                    id: number
                    day: string
                    permits_hours: number
                    illness: boolean
                    holiday: boolean
                    employee_id: number
                }
                Insert: {
                    id?: number
                    day: string
                    permits_hours?: number
                    illness?: boolean
                    holiday?: boolean
                    employee_id: number
                }
                Update: {
                    id?: number
                    day?: string
                    permits_hours?: number
                    illness?: boolean
                    holiday?: boolean
                    employee_id?: number
                }
            }
            timesheets_timework: {
                Row: {
                    id: number
                    hours: number
                    project_id: number | null
                    timesheet_id: number
                }
                Insert: {
                    id?: number
                    hours: number
                    project_id?: number | null
                    timesheet_id: number
                }
                Update: {
                    id?: number
                    hours?: number
                    project_id?: number | null
                    timesheet_id?: number
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
