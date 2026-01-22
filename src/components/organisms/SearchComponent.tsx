// Пример использования useDebounce для поиска

import { useState, useEffect } from 'react'
import { useDebounce } from '@hooks/useDebounce'
import { Card, TextInput, Text, Flex } from '@gravity-ui/uikit'

interface SearchResult {
  id: string
  title: string
}

const SearchComponent = () => {
  const [searchInput, setSearchInput] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Использование useDebounce для отложенного поиска
  const debouncedSearchTerm = useDebounce(searchInput, 500)

  // Выполнение поиска при изменении debounced значения
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      // Имитация API запроса
      await new Promise((resolve) => setTimeout(resolve, 300))

      const mockResults: SearchResult[] = [
        { id: '1', title: `Результат для "${query}"` },
        { id: '2', title: `Поиск "${query}"` },
        { id: '3', title: `Найдено "${query}"` },
      ]

      setResults(mockResults)
    } finally {
      setIsSearching(false)
    }
  }

  // Эффект для выполнения поиска при изменении debouncedSearchTerm
  useEffect(() => {
    performSearch(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  return (
    <Card view="raised" style={{ padding: '24px', maxWidth: 500, margin: '0 auto' }}>
      <Text variant="header-2" style={{ marginBottom: '16px', display: 'block' }}>
        Поиск с Debounce
      </Text>

      <TextInput
        placeholder="Введите поисковый запрос..."
        value={searchInput}
        onUpdate={setSearchInput}
        disabled={isSearching}
        size="l"
      />

      {isSearching && (
        <Text variant="body-2" color="secondary" style={{ marginTop: '16px' }}>
          Поиск...
        </Text>
      )}

      {results.length > 0 && (
        <Flex direction="column" gap="2" style={{ marginTop: '16px' }}>
          {results.map((result) => (
            <Card key={result.id} view="outlined" style={{ padding: '12px' }}>
              <Text>{result.title}</Text>
            </Card>
          ))}
        </Flex>
      )}

      {searchInput && results.length === 0 && !isSearching && (
        <Text variant="body-2" color="secondary" style={{ marginTop: '16px' }}>
          Ничего не найдено
        </Text>
      )}
    </Card>
  )
}

export default SearchComponent
