// src/features/projects/components/ProjectFilters.js

import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../styles/ThemeContext';
import {
  PROJECT_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  DUE_FILTER_OPTIONS,
  SORT_OPTIONS,
} from '../constants/projectConstants';

const STATUS_FILTERS = [
  { label: 'Todos', value: 'all' },
  ...PROJECT_STATUS_OPTIONS,
];

const PRIORITY_FILTERS = [
  { label: 'Todas', value: 'all' },
  ...PRIORITY_OPTIONS,
];

function FilterChip({ label, selected, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.projectLight : colors.surface,
          borderColor: selected ? colors.project : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: selected ? colors.project : colors.textSecondary,
            fontWeight: selected ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProjectFilters({
  searchQuery = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusChange,
  priorityFilter = 'all',
  onPriorityChange,
  dueFilter = 'all',
  onDueFilterChange,
  sortBy = 'created_desc',
  onSortChange,
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* BARRA DE BÚSQUEDA */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="search-outline" size={19} color={colors.textSecondary} />

        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Buscar proyecto por nombre o descripción..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
        />

        {!!searchQuery && (
          <Pressable onPress={() => onSearchChange?.('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* FILTRO DE ESTADO */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterTitle, { color: colors.text }]}>Estado</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        >
          {STATUS_FILTERS.map(option => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={statusFilter === option.value}
              onPress={() => onStatusChange?.(option.value)}
              colors={colors}
            />
          ))}
        </ScrollView>
      </View>

      {/* FILTRO DE PRIORIDAD */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterTitle, { color: colors.text }]}>Prioridad</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        >
          {PRIORITY_FILTERS.map(option => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={priorityFilter === option.value}
              onPress={() => onPriorityChange?.(option.value)}
              colors={colors}
            />
          ))}
        </ScrollView>
      </View>

      {/* FILTRO DE VENCIMIENTO */}
      {onDueFilterChange && (
        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>Vencimiento</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          >
            {DUE_FILTER_OPTIONS.map(option => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={dueFilter === option.value}
                onPress={() => onDueFilterChange?.(option.value)}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ORDENAR POR */}
      {onSortChange && (
        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>
            Ordenar por
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          >
            {SORT_OPTIONS.map(option => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={sortBy === option.value}
                onPress={() => onSortChange?.(option.value)}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  searchContainer: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterSection: {
    gap: 8,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipList: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
  },
});
