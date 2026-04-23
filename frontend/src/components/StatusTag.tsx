import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

// Accept both web-style and mobile-style status values
type Status = 'healthy' | 'warning' | 'critical' | 'info' | 'watch' | 'at-risk';

interface StatusTagProps {
  status: Status;
}

const BAR_HEIGHTS = [6, 10, 14];

// Map mobile status values to web status values
function mapStatus(status: Status): keyof typeof Colors.statusBars {
  switch (status) {
    case 'watch':
      return 'warning';
    case 'at-risk':
      return 'critical';
    default:
      return status as keyof typeof Colors.statusBars;
  }
}

export function StatusTag({ status }: StatusTagProps) {
  const mappedStatus = mapStatus(status);
  const colors = Colors.statusBars[mappedStatus] || Colors.statusBars.info;

  return (
    <View style={styles.container}>
      {BAR_HEIGHTS.map((height, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height,
              backgroundColor: colors[index],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1.5,
    height: 14,
  },
  bar: {
    width: 4,
    borderRadius: 1,
  },
});
