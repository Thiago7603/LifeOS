import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES_LIST } from '../constants/habitConstants';

export default function HabitStatsPanel({
  statistics,
  colors,
  categoriesList = CATEGORIES_LIST,
}) {
  const dailyActivity = statistics?.dailyActivity || [];
  const categoryDistribution = statistics?.categoryDistribution || [];

  return (
    <View style={[styles.monthlyCard, { backgroundColor: colors.surface }]}>
      <View style={styles.monthlyHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={[styles.monthlyTitle, { color: colors.text }]}>
            Consistencia Mensual
          </Text>
        </View>
        <Text style={[styles.monthlySub, { color: colors.textSecondary }]}>
          Últimos 28 días
        </Text>
      </View>

      {/* Grilla heatmap */}
      <View style={styles.heatmapGrid}>
        {dailyActivity.map((item) => (
          <View
            key={item.date}
            style={[
              styles.heatmapCell,
              {
                backgroundColor:
                  item.count === 0
                    ? colors.surfaceSecondary
                    : item.count === 1
                      ? colors.successLight
                      : colors.success,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.heatmapFooter}>
        <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
          Menos activo
        </Text>
        <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
          Consistente
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Distribución por áreas */}
      <View style={styles.distributionRow}>
        <Text style={[styles.distTitle, { color: colors.text }]}>
          Distribución por áreas
        </Text>
        <Text style={[styles.distPillars, { color: colors.textSecondary }]}>
          Últimos 28 días
        </Text>
      </View>

      {categoriesList.map((cat) => {
        const item = categoryDistribution.find(
          (entry) => entry.category === cat
        );
        const percentage = item?.percentage || 0;
        const count = item?.count || 0;

        return (
          <View key={cat} style={styles.pillarItem}>
            <View style={styles.pillarLabelRow}>
              <Text style={[styles.pillarName, { color: colors.text }]}>{cat}</Text>
              <Text style={[styles.pillarPerc, { color: colors.textSecondary }]}>
                {percentage}% ({count})
              </Text>
            </View>

            <View
              style={[
                styles.pillarBarBg,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <View
                style={[
                  styles.pillarBarFill,
                  {
                    width: `${percentage}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  monthlyCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthlyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  monthlySub: {
    fontSize: 12,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  heatmapCell: {
    width: 28,
    height: 22,
    borderRadius: 4,
  },
  heatmapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 10,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  distTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  distPillars: {
    fontSize: 12,
  },
  pillarItem: {
    marginBottom: 10,
  },
  pillarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pillarName: {
    fontSize: 12,
    fontWeight: '500',
  },
  pillarPerc: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pillarBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  pillarBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

