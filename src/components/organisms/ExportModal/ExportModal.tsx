import { useState } from 'react'
import { Modal, Button, TextInput, Text, Select, Loader, Checkbox } from '@gravity-ui/uikit'
import { useSchemeQuery, SchemeField } from '@/hooks/queries/useSchemeQueries'
import { fetchExportExcel, ParticipantsQuery } from '@/services/api/participants'
import { saveAs } from 'file-saver'
import styles from './ExportModal.module.css'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  projectId: number
  projectTitle: string
}

const ExportModal = ({ open, onClose, projectId, projectTitle }: ExportModalProps) => {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string | string[]>>({})
  const [isExporting, setIsExporting] = useState(false)

  // Используем существующий хук для схемы
  const { data: schemeData, isLoading: isLoadingScheme } = useSchemeQuery(String(projectId))

  // Фильтруемые поля - list и text (кроме id, img, code)
  const filterableFields = schemeData?.fields?.filter(
    field => ['list', 'text'].includes(field.config.type)
  ) || []

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
        delete newFilters[key]
      } else {
        newFilters[key] = value
      }
      return newFilters
    })
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params: ParticipantsQuery = {}
      if (search.trim()) {
        params.search = search.trim()
      }
      if (Object.keys(filters).length > 0) {
        params.filters = filters
      }

      const blob = await fetchExportExcel(projectId, params)
      const filename = `participants_${projectTitle}_${new Date().toISOString().split('T')[0]}.xlsx`
      saveAs(blob, filename)
      onClose()
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleReset = () => {
    setSearch('')
    setFilters({})
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.modal}>
        <Text variant="header-1" className={styles.title}>
          Выгрузка участников
        </Text>

        {isLoadingScheme ? (
          <div className={styles.loader}>
            <Loader size="m" />
          </div>
        ) : (
          <>
            <div className={styles.searchSection}>
              <Text variant="subheader-1">Поиск</Text>
              <TextInput
                value={search}
                onUpdate={setSearch}
                placeholder="Поиск по всем полям..."
                size="l"
              />
            </div>

            {filterableFields.length > 0 && (
              <div className={styles.filtersSection}>
                <Text variant="subheader-1">Фильтры по полям</Text>
                <div className={styles.filtersList}>
                  {filterableFields.map(field => (
                    <FilterField
                      key={field.id}
                      field={field}
                      value={filters[field.key]}
                      onChange={value => handleFilterChange(field.key, value)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <Button view="flat" size="l" onClick={handleReset}>
                Сбросить
              </Button>
              <Button view="flat" size="l" onClick={onClose}>
                Отмена
              </Button>
              <Button
                view="action"
                size="l"
                onClick={handleExport}
                loading={isExporting}
              >
                Выгрузить
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

interface FilterFieldProps {
  field: SchemeField
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
}

const FilterField = ({ field, value, onChange }: FilterFieldProps) => {
  const { config } = field

  // Для текстовых полей - простой ввод
  if (config.type === 'text') {
    return (
      <div className={styles.filterField}>
        <Text variant="body-2">{field.label}</Text>
        <TextInput
          value={typeof value === 'string' ? value : ''}
          onUpdate={val => onChange(val)}
          placeholder={`Фильтр по ${field.label.toLowerCase()}...`}
          size="m"
        />
      </div>
    )
  }

  // Для списков
  if (config.type === 'list' && config.listSettings?.items) {
    const items = config.listSettings.items
    const isMultiple = config.listSettings.multiple

    const selectOptions = items.map(item => ({
      value: item.value,
      content: item.value,
    }))

    if (isMultiple) {
      const selectedValues = Array.isArray(value) ? value : []
      
      return (
        <div className={styles.filterField}>
          <Text variant="body-2">{field.label}</Text>
          <div className={styles.checkboxGroup}>
            {items.map(item => (
              <Checkbox
                key={item.value}
                checked={selectedValues.includes(item.value)}
                onUpdate={checked => {
                  if (checked) {
                    onChange([...selectedValues, item.value])
                  } else {
                    onChange(selectedValues.filter(v => v !== item.value))
                  }
                }}
              >
                {item.value}
              </Checkbox>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className={styles.filterField}>
        <Text variant="body-2">{field.label}</Text>
        <Select
          value={value ? [String(value)] : []}
          onUpdate={vals => onChange(vals[0] || '')}
          options={[{ value: '', content: 'Все' }, ...selectOptions]}
          size="m"
          width="max"
        />
      </div>
    )
  }

  return null
}

export default ExportModal
