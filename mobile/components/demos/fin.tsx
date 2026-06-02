import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineGraph } from 'react-native-graph';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

Dimensions.get('window');

const stockData = [
  { value: 12450, date: new Date('2024-01-01') },
  { value: 12680, date: new Date('2024-01-02') },
  { value: 12520, date: new Date('2024-01-03') },
  { value: 12890, date: new Date('2024-01-04') },
  { value: 13100, date: new Date('2024-01-05') },
  { value: 12950, date: new Date('2024-01-06') },
  { value: 13300, date: new Date('2024-01-07') },
  { value: 13180, date: new Date('2024-01-08') },
  { value: 13450, date: new Date('2024-01-09') },
  { value: 13620, date: new Date('2024-01-10') },
];

const cryptoData = [
  { value: 42000, date: new Date('2024-01-01') },
  { value: 43500, date: new Date('2024-01-02') },
  { value: 41200, date: new Date('2024-01-03') },
  { value: 44800, date: new Date('2024-01-04') },
  { value: 46500, date: new Date('2024-01-05') },
  { value: 45200, date: new Date('2024-01-06') },
  { value: 47800, date: new Date('2024-01-07') },
  { value: 49200, date: new Date('2024-01-08') },
  { value: 48500, date: new Date('2024-01-09') },
  { value: 51000, date: new Date('2024-01-10') },
];

const portfolioData = [
  { value: 85000, date: new Date('2024-01-01') },
  { value: 87500, date: new Date('2024-01-02') },
  { value: 86800, date: new Date('2024-01-03') },
  { value: 89200, date: new Date('2024-01-04') },
  { value: 91500, date: new Date('2024-01-05') },
  { value: 90200, date: new Date('2024-01-06') },
  { value: 93800, date: new Date('2024-01-07') },
  { value: 95200, date: new Date('2024-01-08') },
  { value: 97500, date: new Date('2024-01-09') },
  { value: 99800, date: new Date('2024-01-10') },
];

const volatileData = [
  { value: 150, date: new Date('2024-01-01') },
  { value: 220, date: new Date('2024-01-02') },
  { value: 180, date: new Date('2024-01-03') },
  { value: 350, date: new Date('2024-01-04') },
  { value: 290, date: new Date('2024-01-05') },
  { value: 420, date: new Date('2024-01-06') },
  { value: 310, date: new Date('2024-01-07') },
  { value: 380, date: new Date('2024-01-08') },
  { value: 450, date: new Date('2024-01-09') },
  { value: 520, date: new Date('2024-01-10') },
];

const FinancialScreen = () => {
  const [selectedStock, setSelectedStock] = useState<number | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<number | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null);
  const [selectedVolatile, setSelectedVolatile] = useState<number | null>(null);

  const stockOpacity = useSharedValue(1);
  const cryptoOpacity = useSharedValue(1);
  const portfolioOpacity = useSharedValue(1);
  const volatileOpacity = useSharedValue(1);

  const stockStyle = useAnimatedStyle(() => ({
    opacity: stockOpacity.value,
  }));

  const cryptoStyle = useAnimatedStyle(() => ({
    opacity: cryptoOpacity.value,
  }));

  const portfolioStyle = useAnimatedStyle(() => ({
    opacity: portfolioOpacity.value,
  }));

  const volatileStyle = useAnimatedStyle(() => ({
    opacity: volatileOpacity.value,
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Financial Charts</Text>

      <Animated.View style={[styles.chartContainer, stockStyle]}>
        <View style={styles.header}>
          <Text style={styles.chartTitle}>Stock Performance</Text>
          <Text style={styles.price}>${selectedStock?.toLocaleString() ?? '13,620'}</Text>
        </View>
        <LineGraph
          style={styles.graph}
          points={stockData}
          animated
          color="#888888"
          lineThickness={2}
          gradientFillColors={['#88888805', '#88888802', '#88888800']}
          enablePanGesture
          panGestureDelay={0}
          onGestureStart={() => {
            stockOpacity.value = withSpring(0.8);
          }}
          onPointSelected={(point) => {
            setSelectedStock(point.value);
          }}
          onGestureEnd={() => {
            stockOpacity.value = withSpring(1);
            setSelectedStock(null);
          }}
        />
        <Text style={styles.label}>Last 10 days</Text>
      </Animated.View>

      <Animated.View style={[styles.chartContainer, cryptoStyle]}>
        <View style={styles.header}>
          <Text style={styles.chartTitle}>Bitcoin (BTC)</Text>
          <Text style={styles.price}>${selectedCrypto?.toLocaleString() ?? '51,000'}</Text>
        </View>
        <LineGraph
          style={styles.graph}
          points={cryptoData}
          animated
          color="#999999"
          lineThickness={2}
          gradientFillColors={['#99999904', '#99999901', '#99999900']}
          enablePanGesture
          panGestureDelay={0}
          onGestureStart={() => {
            cryptoOpacity.value = withSpring(0.8);
          }}
          onPointSelected={(point) => {
            setSelectedCrypto(point.value);
          }}
          onGestureEnd={() => {
            cryptoOpacity.value = withSpring(1);
            setSelectedCrypto(null);
          }}
        />
        <Text style={styles.label}>Last 10 days</Text>
      </Animated.View>

      <Animated.View style={[styles.chartContainer, portfolioStyle]}>
        <View style={styles.header}>
          <Text style={styles.chartTitle}>Portfolio Value</Text>
          <Text style={styles.price}>${selectedPortfolio?.toLocaleString() ?? '99,800'}</Text>
        </View>
        <LineGraph
          style={styles.graph}
          points={portfolioData}
          animated
          color="#777777"
          lineThickness={2}
          gradientFillColors={['#77777704', '#77777701', '#77777700']}
          enablePanGesture
          panGestureDelay={0}
          onGestureStart={() => {
            portfolioOpacity.value = withSpring(0.8);
          }}
          onPointSelected={(point) => {
            setSelectedPortfolio(point.value);
          }}
          onGestureEnd={() => {
            portfolioOpacity.value = withSpring(1);
            setSelectedPortfolio(null);
          }}
        />
        <Text style={styles.label}>Last 10 days</Text>
      </Animated.View>

      <Animated.View style={[styles.chartContainer, volatileStyle]}>
        <View style={styles.header}>
          <Text style={styles.chartTitle}>Altcoin</Text>
          <Text style={styles.price}>${selectedVolatile?.toLocaleString() ?? '520'}</Text>
        </View>
        <LineGraph
          style={styles.graph}
          points={volatileData}
          animated
          color="#AAAAAA"
          lineThickness={2}
          gradientFillColors={['#AAAAAA05', '#AAAAAA02', '#AAAAAA00']}
          enablePanGesture
          panGestureDelay={0}
          onGestureStart={() => {
            volatileOpacity.value = withSpring(0.8);
          }}
          onPointSelected={(point) => {
            setSelectedVolatile(point.value);
          }}
          onGestureEnd={() => {
            volatileOpacity.value = withSpring(1);
            setSelectedVolatile(null);
          }}
        />
        <Text style={styles.label}>Last 10 days</Text>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginTop: 60,
    marginBottom: 24,
  },
  chartContainer: {
    marginBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  graph: {
    width: '100%',
    height: 180,
  },
  label: {
    fontSize: 10,
    color: '#999999',
    marginTop: 8,
  },
});

export default FinancialScreen;
