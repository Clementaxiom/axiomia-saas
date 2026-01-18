// Database types matching Supabase schema

export type UserRole = 'super_admin' | 'restaurant_admin' | 'staff'
export type ReservationStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
export type ReservationSource = 'voice' | 'manual' | 'online' | 'walk_in'
export type ServiceType = 'lunch' | 'dinner'
export type TableShape = 'rectangle' | 'circle' | 'square'

export interface Restaurant {
    id: string
    name: string
    slug: string
    logo_url: string | null
    created_at: string
    updated_at: string
}

export interface RestaurantSettings {
    id: string
    restaurant_id: string
    primary_color: string
    primary_hover_color: string
    accent_color: string
    background_color: string
    surface_color: string
    text_color: string
    text_muted_color: string
    border_color: string
    font_display: string
    font_body: string
    module_dashboard: boolean
    module_floor_plan: boolean
    module_planning: boolean
    module_reservations: boolean
    enable_table_merge: boolean
    default_reservation_duration: number
    max_party_size: number
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    email: string
    full_name: string | null
    role: UserRole
    restaurant_id: string | null
    is_super_admin: boolean
    created_at: string
    updated_at: string
}

export interface Room {
    id: string
    restaurant_id: string
    name: string
    sort_order: number
    created_at: string
}

export interface Table {
    id: string
    restaurant_id: string
    room_id: string | null
    table_number: string
    min_capacity: number
    max_capacity: number
    position_x: number
    position_y: number
    width: number
    height: number
    shape: TableShape
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface TableMergeRule {
    id: string
    restaurant_id: string
    table_a_id: string
    table_b_id: string
    created_at: string
}

export interface Service {
    id: string
    restaurant_id: string
    name: string
    type: ServiceType
    start_time: string
    end_time: string
    is_active: boolean
    created_at: string
}

export interface Shift {
    id: string
    service_id: string
    name: string
    start_time: string
    end_time: string
    max_covers: number | null
    sort_order: number
    created_at: string
}

export interface TableLink {
    id: string
    restaurant_id: string
    primary_table_id: string
    secondary_table_id: string
    link_date: string
    service_id: string
    shift_id: string
    combined_capacity: number
    created_at: string
    created_by: string | null
}

export interface Reservation {
    id: string
    restaurant_id: string
    reservation_date: string
    service_id: string | null
    shift_id: string | null
    reservation_time: string
    customer_name: string
    customer_phone: string | null
    customer_email: string | null
    party_size: number
    table_id: string | null
    table_link_id: string | null
    status: ReservationStatus
    source: ReservationSource
    notes: string | null
    internal_notes: string | null
    duration_minutes: number
    created_at: string
    updated_at: string
    created_by: string | null
}

// Extended types with relations
export interface TableWithRoom extends Table {
    room: Room | null
}

export interface TableWithStatus extends Table {
    status: 'available' | 'reserved' | 'occupied'
    reservation: Reservation | null
    isLinked: boolean
    linkInfo: TableLink | null
}

export interface ReservationWithRelations extends Reservation {
    table: Table | null
    service: Service | null
    shift: Shift | null
}

export interface RestaurantWithSettings extends Restaurant {
    settings: RestaurantSettings | null
}

// API Response types
export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
}

export interface AvailabilityOption {
    type: 'single' | 'merged'
    tableId?: string
    tableIds?: string[]
    tableNumber: string
    capacity: {
        min: number
        max: number
    }
    recommendation: 'optimal' | 'tight' | 'spacious'
}

export interface AvailabilityResponse {
    date: string
    serviceId: string
    shiftId: string | null
    partySize: number
    availableOptions: AvailabilityOption[]
    totalAvailable: number
}

export interface FloorPlanResponse {
    tables: TableWithStatus[]
    links: TableLink[]
    reservations: Reservation[]
    context: {
        date: string
        serviceId: string
        shiftId: string | null
    }
}
