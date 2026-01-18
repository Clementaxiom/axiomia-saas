'use client'

import { useState, useEffect } from 'react'
import { TableNode } from './TableNode'
import { ZoomIn, ZoomOut, Maximize2, Plus } from 'lucide-react'
import { Modal, Button, Input, Select } from '@/components/ui'
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
            <div className="flex items-center justify-center h-[600px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                    <div className="spinner" />
                    <span className="text-sm text-[var(--color-text-muted)]">
                        Chargement du plan...
                    </span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[600px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
                <div className="text-center">
                    <p className="text-[var(--color-error)] font-medium">{error}</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-2">
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
            <div className="flex flex-col h-full">
                {/* Stats & Controls */}
                <div className="flex items-center justify-between p-4 bg-[var(--color-background)] border-b border-[var(--color-border)]">
                    {/* Stats */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-sm text-[var(--color-text-muted)]">
                                Libres: <strong className="text-[var(--color-text)]">{stats.available}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-sm text-[var(--color-text-muted)]">
                                Réservées: <strong className="text-[var(--color-text)]">{stats.reserved}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <span className="text-sm text-[var(--color-text-muted)]">
                                Occupées: <strong className="text-[var(--color-text)]">{stats.occupied}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        {/* Add table button */}
                        <Button
                            variant="accent"
                            size="sm"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => setShowAddModal(true)}
                        >
                            Ajouter une table
                        </Button>

                        <div className="w-px h-6 bg-[var(--color-border)] mx-2" />

                        {/* Zoom Controls */}
                        <button
                            onClick={handleZoomOut}
                            className="p-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center text-sm text-[var(--color-text-muted)]">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleZoomReset}
                            className="p-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors ml-2"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 overflow-auto bg-[var(--color-surface)] p-6">
                    <div
                        className="relative bg-white border border-[var(--color-border)] rounded-xl shadow-inner"
                        style={{
                            width: `${800 * zoom}px`,
                            height: `${600 * zoom}px`,
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            minWidth: `${800}px`,
                            minHeight: `${600}px`,
                        }}
                    >
                        {/* Grid pattern background */}
                        <div
                            className="absolute inset-0 opacity-5"
                            style={{
                                backgroundImage: `
                linear-gradient(to right, var(--color-border) 1px, transparent 1px),
                linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
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
                                <div className="text-center text-[var(--color-text-muted)]">
                                    <p className="font-medium">Aucune table configurée</p>
                                    <p className="text-sm mt-1">
                                        Cliquez sur "Ajouter une table" pour commencer
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Table Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Ajouter une table"
            >
                <div className="space-y-4">
                    <Input
                        label="Numéro de table"
                        placeholder="ex: T1, 12, VIP..."
                        value={newTable.tableNumber}
                        onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Capacité minimum"
                            type="number"
                            min={1}
                            value={newTable.minCapacity}
                            onChange={(e) => setNewTable({ ...newTable, minCapacity: parseInt(e.target.value) || 1 })}
                        />
                        <Input
                            label="Capacité maximum"
                            type="number"
                            min={1}
                            value={newTable.maxCapacity}
                            onChange={(e) => setNewTable({ ...newTable, maxCapacity: parseInt(e.target.value) || 4 })}
                        />
                    </div>

                    <Select
                        label="Forme"
                        value={newTable.shape}
                        onChange={(e) => setNewTable({ ...newTable, shape: e.target.value as any })}
                        options={[
                            { value: 'rectangle', label: 'Rectangle' },
                            { value: 'round', label: 'Ronde' },
                            { value: 'square', label: 'Carrée' },
                        ]}
                    />

                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowAddModal(false)}
                            disabled={isAdding}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="accent"
                            onClick={handleAddTable}
                            loading={isAdding}
                            disabled={!newTable.tableNumber.trim()}
                        >
                            Créer la table
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
