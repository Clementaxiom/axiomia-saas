'use client'

import { useState, useEffect } from 'react'
import { TableNode } from './TableNode'
import { ZoomIn, ZoomOut, Maximize2, Plus, X } from 'lucide-react'
import type { TableWithStatus, FloorPlanResponse } from '@/lib/types/database'

interface FloorPlanCanvasProps {
    restaurantId: string
    date: string
    serviceId: string
    shiftId?: string | null
    onTableClick?: (table: TableWithStatus) => void
    selectedTableId?: string | null
}

interface NewTableForm {
    tableNumber: string
    minCapacity: number
    maxCapacity: number
    shape: 'rectangle' | 'round' | 'square'
}

export function FloorPlanCanvas({
    restaurantId,
    date,
    serviceId,
    shiftId,
    onTableClick,
    selectedTableId,
}: FloorPlanCanvasProps) {
    const [data, setData] = useState<FloorPlanResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)

    // Add table modal
    const [showAddModal, setShowAddModal] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [newTable, setNewTable] = useState<NewTableForm>({
        tableNumber: '',
        minCapacity: 1,
        maxCapacity: 4,
        shape: 'rectangle',
    })

    const fetchFloorPlan = async () => {
        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                restaurantId,
                date,
                serviceId,
            })
            if (shiftId) params.append('shiftId', shiftId)

            const response = await fetch(`/api/plan?${params}`)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch floor plan')
            }

            setData(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (restaurantId && date && serviceId) {
            fetchFloorPlan()
        }
    }, [restaurantId, date, serviceId, shiftId])

    const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2))
    const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5))
    const handleZoomReset = () => setZoom(1)

    const handleAddTable = async () => {
        if (!newTable.tableNumber.trim()) return

        setIsAdding(true)
        try {
            const response = await fetch('/api/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId,
                    tableNumber: newTable.tableNumber,
                    minCapacity: newTable.minCapacity,
                    maxCapacity: newTable.maxCapacity,
                    shape: newTable.shape,
                    positionX: 100 + Math.random() * 200,
                    positionY: 100 + Math.random() * 200,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                alert(data.error || 'Erreur lors de la création')
                return
            }

            // Refresh floor plan
            await fetchFloorPlan()
            setShowAddModal(false)
            setNewTable({
                tableNumber: '',
                minCapacity: 1,
                maxCapacity: 4,
                shape: 'rectangle',
            })
        } catch (err) {
            console.error('Add table error:', err)
            alert('Erreur lors de la création de la table')
        } finally {
            setIsAdding(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px]" style={{ background: '#2a241e' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm" style={{ color: '#a69d90' }}>
                        Chargement du plan...
                    </span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[600px]" style={{ background: '#2a241e' }}>
                <div className="text-center">
                    <p className="font-medium" style={{ color: '#a63d40' }}>{error}</p>
                    <p className="text-sm mt-2" style={{ color: '#a69d90' }}>
                        Impossible de charger le plan de salle
                    </p>
                </div>
            </div>
        )
    }

    // Calculate stats
    const stats = {
        total: data?.tables?.length || 0,
        available: data?.tables?.filter((t) => t.status === 'available').length || 0,
        reserved: data?.tables?.filter((t) => t.status === 'reserved').length || 0,
        occupied: data?.tables?.filter((t) => t.status === 'occupied').length || 0,
    }

    return (
        <>
            <div className="flex flex-col h-full" style={{ background: '#1a1612' }}>
                {/* Header / Controls - Ty Refuge Style */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{
                        background: 'linear-gradient(180deg, #231e19, transparent)',
                        borderBottom: '1px solid rgba(201, 162, 39, 0.12)'
                    }}
                >
                    {/* Stats Legend */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded"
                                style={{
                                    background: 'rgba(201, 162, 39, 0.08)',
                                    border: '2px solid rgba(201, 162, 39, 0.3)'
                                }}
                            />
                            <span className="text-sm" style={{ color: '#a69d90' }}>
                                Libres: <strong style={{ color: '#c9a227' }}>{stats.available}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded"
                                style={{
                                    background: 'rgba(74, 124, 89, 0.15)',
                                    border: '2px solid #4a7c59'
                                }}
                            />
                            <span className="text-sm" style={{ color: '#a69d90' }}>
                                Réservées: <strong style={{ color: '#6ab07a' }}>{stats.reserved}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded"
                                style={{
                                    background: 'rgba(184, 115, 51, 0.2)',
                                    border: '2px solid #b87333'
                                }}
                            />
                            <span className="text-sm" style={{ color: '#a69d90' }}>
                                Occupées: <strong style={{ color: '#b87333' }}>{stats.occupied}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        {/* Add table button - Ty Refuge Primary Style */}
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5"
                            style={{
                                background: 'linear-gradient(135deg, #c9a227, #b87333)',
                                color: '#1a1612',
                                boxShadow: '0 4px 20px rgba(201, 162, 39, 0.3)',
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter une table
                        </button>

                        <div className="w-px h-6 mx-2" style={{ background: 'rgba(201, 162, 39, 0.25)' }} />

                        {/* Zoom Controls */}
                        <button
                            onClick={handleZoomOut}
                            className="p-2 rounded-lg transition-all duration-300"
                            style={{
                                background: '#2a241e',
                                border: '1px solid rgba(201, 162, 39, 0.12)',
                                color: '#a69d90'
                            }}
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center text-sm" style={{ color: '#a69d90' }}>
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 rounded-lg transition-all duration-300"
                            style={{
                                background: '#2a241e',
                                border: '1px solid rgba(201, 162, 39, 0.12)',
                                color: '#a69d90'
                            }}
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleZoomReset}
                            className="p-2 rounded-lg transition-all duration-300 ml-1"
                            style={{
                                background: '#2a241e',
                                border: '1px solid rgba(201, 162, 39, 0.12)',
                                color: '#a69d90'
                            }}
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 overflow-auto p-6" style={{ background: '#1a1612' }}>
                    <div
                        className="relative rounded-2xl"
                        style={{
                            width: `${800 * zoom}px`,
                            height: `${600 * zoom}px`,
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            minWidth: `${800}px`,
                            minHeight: `${600}px`,
                            background: '#2a241e',
                            border: '1px solid rgba(201, 162, 39, 0.12)',
                        }}
                    >
                        {/* Grid pattern background */}
                        <div
                            className="absolute inset-0 opacity-5 rounded-2xl"
                            style={{
                                backgroundImage: `
                linear-gradient(to right, rgba(201, 162, 39, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(201, 162, 39, 0.3) 1px, transparent 1px)
              `,
                                backgroundSize: '40px 40px',
                            }}
                        />

                        {/* Tables */}
                        {data?.tables?.map((table) => (
                            <TableNode
                                key={table.id}
                                table={table}
                                onClick={onTableClick}
                                isSelected={selectedTableId === table.id}
                            />
                        ))}

                        {/* Empty state */}
                        {(!data?.tables || data.tables.length === 0) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center" style={{ color: '#6b6358' }}>
                                    <p className="font-medium text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                        Aucune table configurée
                                    </p>
                                    <p className="text-sm mt-2">
                                        Cliquez sur "Ajouter une table" pour commencer
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Table Modal - Ty Refuge Style */}
            {showAddModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)'
                    }}
                >
                    <div
                        className="w-[420px] rounded-2xl overflow-hidden relative"
                        style={{
                            background: '#2a241e',
                            border: '1px solid rgba(201, 162, 39, 0.25)',
                            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6)',
                        }}
                    >
                        {/* Golden top accent */}
                        <div
                            className="absolute top-0 left-0 right-0 h-1"
                            style={{ background: 'linear-gradient(90deg, #c9a227, #b87333, #c9a227)' }}
                        />

                        {/* Header */}
                        <div className="flex justify-between items-start p-7 pb-5">
                            <div>
                                <h2
                                    className="text-2xl font-semibold"
                                    style={{
                                        fontFamily: "'Cormorant Garamond', serif",
                                        color: '#f5f0e8'
                                    }}
                                >
                                    Ajouter une table
                                </h2>
                                <p className="text-sm mt-1" style={{ color: '#a69d90' }}>
                                    Configurez les détails de la nouvelle table
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                                style={{
                                    background: '#231e19',
                                    border: '1px solid rgba(201, 162, 39, 0.12)',
                                    color: '#a69d90'
                                }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-7 pb-7 space-y-5">
                            {/* Table Number */}
                            <div>
                                <label
                                    className="block text-xs font-semibold uppercase tracking-wider mb-3"
                                    style={{ color: '#6b6358', letterSpacing: '0.15em' }}
                                >
                                    Numéro de table
                                </label>
                                <input
                                    type="text"
                                    placeholder="ex: T1, 12, VIP..."
                                    value={newTable.tableNumber}
                                    onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 focus:outline-none"
                                    style={{
                                        background: '#231e19',
                                        border: '1px solid rgba(201, 162, 39, 0.12)',
                                        color: '#f5f0e8',
                                    }}
                                />
                            </div>

                            {/* Capacities */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wider mb-3"
                                        style={{ color: '#6b6358', letterSpacing: '0.15em' }}
                                    >
                                        Capacité min
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={newTable.minCapacity}
                                        onChange={(e) => setNewTable({ ...newTable, minCapacity: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 focus:outline-none"
                                        style={{
                                            background: '#231e19',
                                            border: '1px solid rgba(201, 162, 39, 0.12)',
                                            color: '#f5f0e8',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wider mb-3"
                                        style={{ color: '#6b6358', letterSpacing: '0.15em' }}
                                    >
                                        Capacité max
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={newTable.maxCapacity}
                                        onChange={(e) => setNewTable({ ...newTable, maxCapacity: parseInt(e.target.value) || 4 })}
                                        className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 focus:outline-none"
                                        style={{
                                            background: '#231e19',
                                            border: '1px solid rgba(201, 162, 39, 0.12)',
                                            color: '#f5f0e8',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Shape */}
                            <div>
                                <label
                                    className="block text-xs font-semibold uppercase tracking-wider mb-3"
                                    style={{ color: '#6b6358', letterSpacing: '0.15em' }}
                                >
                                    Forme
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'rectangle', label: 'Rectangle' },
                                        { value: 'round', label: 'Ronde' },
                                        { value: 'square', label: 'Carrée' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setNewTable({ ...newTable, shape: option.value as any })}
                                            className="py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300"
                                            style={{
                                                background: newTable.shape === option.value
                                                    ? 'linear-gradient(135deg, rgba(201, 162, 39, 0.2), rgba(201, 162, 39, 0.1))'
                                                    : '#231e19',
                                                border: newTable.shape === option.value
                                                    ? '1px solid #c9a227'
                                                    : '1px solid rgba(201, 162, 39, 0.12)',
                                                color: newTable.shape === option.value ? '#c9a227' : '#a69d90',
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div
                                className="h-px my-6"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(201, 162, 39, 0.25), transparent)' }}
                            />

                            {/* Actions */}
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    disabled={isAdding}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
                                    style={{
                                        background: 'transparent',
                                        color: '#a69d90',
                                    }}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAddTable}
                                    disabled={!newTable.tableNumber.trim() || isAdding}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: 'linear-gradient(135deg, #c9a227, #b87333)',
                                        color: '#1a1612',
                                        boxShadow: '0 4px 20px rgba(201, 162, 39, 0.3)',
                                    }}
                                >
                                    {isAdding ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    Créer la table
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
