'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  /** Called with the full reordered array immediately after a drag completes (optimistic — list already re-rendered). */
  onReorder: (items: T[]) => void;
  children: (item: T, dragHandle: React.ReactNode) => React.ReactNode;
}

/**
 * Generic drag-to-reorder list. Renders each item via the `children` render prop,
 * passing a drag-handle element to place wherever fits the row's layout.
 * Persistence (calling an API to save the new order) is the caller's job via `onReorder`.
 */
export function SortableList<T>({ items, getId, onReorder, children }: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => getId(item) === active.id);
    const newIndex = items.findIndex((item) => getId(item) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(getId)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableRow key={getId(item)} id={getId(item)}>
            {(dragHandle) => children(item, dragHandle)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      title="Drag to reorder"
      className="flex flex-none cursor-grab items-center justify-center text-slate-300 hover:text-slate-500 active:cursor-grabbing touch-none"
      style={{ width: 20 }}
    >
      <GripVertical size={16} />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  );
}
