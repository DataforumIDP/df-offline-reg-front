import { useMemo, useCallback, useEffect, useState } from 'react'
import { Dialog, Text, Loader } from '@gravity-ui/uikit'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Zone } from '@/services/api/zones'
import type { SchemeField } from '@/hooks/queries/useSchemeQueries'
import styles from './AccessRulesModal.module.css'

interface AccessRulesModalProps {
  open: boolean
  onClose: () => void
  zones: Zone[]
  rulesField: SchemeField | null
  onCreateRule: (zoneId: number, listItem: string) => Promise<void>
  onDeleteRule: (zoneId: number, ruleId: number) => Promise<void>
  isLoading?: boolean
}

interface EdgeData {
  ruleId: number
  zoneId: number
  [key: string]: unknown
}

// Кастомный узел для элементов списка (слева)
const ListItemNode = ({ data }: { data: { label: string } }) => (
  <div className={styles.listItemNode}>
    <div className={styles.nodeLabel}>{data.label}</div>
    <Handle type="source" position={Position.Right} className={styles.handleRight} />
  </div>
)

// Кастомный узел для зон (справа)
const ZoneNode = ({ data }: { data: { label: string; free: boolean } }) => (
  <div className={`${styles.zoneNode} ${data.free ? styles.zoneFree : styles.zoneRestricted}`}>
    <Handle type="target" position={Position.Left} className={styles.handleLeft} />
    <div className={styles.nodeLabel}>{data.label}</div>
  </div>
)

const nodeTypes = {
  listItem: ListItemNode,
  zone: ZoneNode,
}

const AccessRulesModal = ({
  open,
  onClose,
  zones,
  rulesField,
  onCreateRule,
  onDeleteRule,
  isLoading,
}: AccessRulesModalProps) => {
  // DEBUG
  console.log('=== AccessRulesModal DEBUG ===')
  console.log('open:', open)
  console.log('zones:', zones)
  console.log('rulesField:', rulesField)
  console.log('rulesField?.config:', rulesField?.config)
  console.log('listSettings:', rulesField?.config?.listSettings)
  console.log('items:', rulesField?.config?.listSettings?.items)

  // Получаем элементы списка из rulesField
  const listItems = useMemo(() => {
    if (!rulesField?.config.listSettings?.items) return []
    return rulesField.config.listSettings.items.map(item => item.value)
  }, [rulesField])

  // Зоны с ограниченным доступом (free: false)
  const restrictedZones = useMemo(() => {
    return zones.filter(z => !z.free)
  }, [zones])

  console.log('listItems:', listItems)
  console.log('restrictedZones:', restrictedZones)

  // Создаём узлы для графа
  const initialNodes = useMemo<Node[]>(() => {
    const nodes: Node[] = []

    // Узлы списка (слева)
    listItems.forEach((item, index) => {
      nodes.push({
        id: `list-${item}`,
        type: 'listItem',
        position: { x: 50, y: 30 + index * 60 },
        data: { label: item },
        sourcePosition: Position.Right,
      })
    })

    // Узлы зон (справа)
    restrictedZones.forEach((zone, index) => {
      nodes.push({
        id: `zone-${zone.id}`,
        type: 'zone',
        position: { x: 350, y: 30 + index * 60 },
        data: { label: zone.name, free: zone.free },
        targetPosition: Position.Left,
      })
    })

    return nodes
  }, [listItems, restrictedZones])

  // Создаём связи из существующих правил
  const initialEdges = useMemo<Edge[]>(() => {
    const edges: Edge[] = []

    restrictedZones.forEach(zone => {
      zone.rules.forEach(rule => {
        edges.push({
          id: `edge-${zone.id}-${rule.id}`,
          source: `list-${rule.listItem}`,
          target: `zone-${zone.id}`,
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#4caf50', strokeWidth: 2 },
          data: { ruleId: rule.id, zoneId: zone.id },
        })
      })
    })

    return edges
  }, [restrictedZones])

  console.log('initialNodes:', initialNodes)
  console.log('initialEdges:', initialEdges)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  console.log('nodes state:', nodes)
  console.log('edges state:', edges)

  // Обновляем состояние при открытии модалки или изменении данных
  useEffect(() => {
    console.log('useEffect triggered, open:', open, 'initialNodes.length:', initialNodes.length)
    if (open) {
      setNodes(initialNodes)
      setEdges(initialEdges)
    }
  }, [open, initialNodes, initialEdges, setNodes, setEdges])

  // Обработка создания нового соединения
  const onConnect = useCallback(
    async (params: any) => {
      const sourceId = params.source as string
      const targetId = params.target as string

      if (!sourceId.startsWith('list-') || !targetId.startsWith('zone-')) {
        return
      }

      const listItem = sourceId.replace('list-', '')
      const zoneId = parseInt(targetId.replace('zone-', ''))

      // Проверяем, нет ли уже такого правила
      const zone = restrictedZones.find(z => z.id === zoneId)
      if (zone?.rules.some(r => r.listItem === listItem)) {
        return
      }

      await onCreateRule(zoneId, listItem)
    },
    [restrictedZones, onCreateRule]
  )

  // Обработка удаления связи
  const onEdgeClick = useCallback(
    async (_event: React.MouseEvent, edge: Edge) => {
      const data = edge.data as EdgeData | undefined
      if (data?.ruleId && data?.zoneId) {
        await onDeleteRule(data.zoneId, data.ruleId)
      }
    },
    [onDeleteRule]
  )

  const hasData = listItems.length > 0 && restrictedZones.length > 0

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="l"
    >
      <Dialog.Header caption="Настройки доступа" />
      <Dialog.Body>
        <div className={styles.container}>
          {isLoading ? (
            <div className={styles.loading}>
              <Loader size="l" />
            </div>
          ) : !hasData ? (
            <div className={styles.empty}>
              {listItems.length === 0 && (
                <Text variant="body-1" color="secondary">
                  В ключевом поле нет элементов списка
                </Text>
              )}
              {restrictedZones.length === 0 && (
                <Text variant="body-1" color="secondary">
                  Нет зон с ограниченным доступом (free: false)
                </Text>
              )}
            </div>
          ) : (
            <>
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#e3f2fd' }} />
                  <Text variant="caption-1">Элементы списка</Text>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#ffebee' }} />
                  <Text variant="caption-1">Зоны с ограниченным доступом</Text>
                </div>
                <Text variant="caption-1" color="secondary">
                  Потяните от элемента к зоне для создания правила. Клик по линии — удаление.
                </Text>
              </div>
              <div className={styles.graphContainer} style={{ width: '100%', height: '500px' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onEdgeClick={onEdgeClick}
                  nodeTypes={nodeTypes}
                  proOptions={{ hideAttribution: true }}
                  nodesDraggable={true}
                  nodesConnectable={true}
                  elementsSelectable={true}
                  style={{ width: '100%', height: '100%' }}
                  minZoom={0.5}
                  maxZoom={2}
                  onInit={(instance: ReactFlowInstance) => {
                    setTimeout(() => {
                      instance.fitView({ padding: 0.3 })
                    }, 50)
                  }}
                >
                  <Background />
                </ReactFlow>
              </div>
            </>
          )}
        </div>
      </Dialog.Body>
      <Dialog.Footer
        onClickButtonApply={onClose}
        textButtonApply="Готово"
      />
    </Dialog>
  )
}

export default AccessRulesModal
