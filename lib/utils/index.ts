import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs)
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

export function formatTime(time: string): string {
    // Assumes time is in HH:MM:SS format
    return time.substring(0, 5)
}

export function formatDateTime(date: Date | string, time: string): string {
    return `${formatDate(date)} à ${formatTime(time)}`
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'confirmed':
            return 'bg-blue-100 text-blue-800'
        case 'seated':
            return 'bg-green-100 text-green-800'
        case 'completed':
            return 'bg-gray-100 text-gray-800'
        case 'cancelled':
            return 'bg-red-100 text-red-800'
        case 'no_show':
            return 'bg-orange-100 text-orange-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

export function getTableStatusColor(status: string): string {
    switch (status) {
        case 'available':
            return 'bg-emerald-500'
        case 'reserved':
            return 'bg-amber-500'
        case 'occupied':
            return 'bg-rose-500'
        default:
            return 'bg-gray-500'
    }
}

export function getSourceLabel(source: string): string {
    switch (source) {
        case 'voice':
            return 'Téléphone'
        case 'manual':
            return 'Manuel'
        case 'online':
            return 'En ligne'
        case 'walk_in':
            return 'Sans réservation'
        default:
            return source
    }
}

export function getStatusLabel(status: string): string {
    switch (status) {
        case 'confirmed':
            return 'Confirmée'
        case 'seated':
            return 'Installé'
        case 'completed':
            return 'Terminée'
        case 'cancelled':
            return 'Annulée'
        case 'no_show':
            return 'No-show'
        default:
            return status
    }
}
