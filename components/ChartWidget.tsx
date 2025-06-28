import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { TrendingUp, Calendar, Maximize2, X, ChartBar as BarChart3, Flame, Leaf, Zap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ChartData {
  date: string;
  calories: number;
  fitness_score: number;
  eco_score: number;
  combined_score: number;
}

interface ChartWidgetProps {
  onPress?: () => void;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ onPress }) => {
  const { theme, isDark } = useTheme();
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'calories' | 'fitness' | 'eco'>('all');

  useEffect(() => {
    fetchChartData();
  }, [timeframe]);

  const fetchChartData = async () => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const endDate = new Date();
      const startDate = new Date();
      
      if (timeframe === 'weekly') {
        startDate.setDate(endDate.getDate() - 7);
      } else {
        startDate.setDate(endDate.getDate() - 30);
      }

      // Fetch daily scores and meals data
      const { data: scoresData } = await supabase
        .from('daily_scores')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      const { data: mealsData } = await supabase
        .from('meals')
        .select('calories, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Process data for chart
      const processedData: ChartData[] = [];
      const daysToShow = timeframe === 'weekly' ? 7 : 30;

      for (let i = 0; i < daysToShow; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        const dayScores = scoresData?.find(score => score.date === dateStr);
        const dayMeals = mealsData?.filter(meal => 
          meal.created_at.startsWith(dateStr)
        ) || [];

        const totalCalories = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

        processedData.push({
          date: dateStr,
          calories: totalCalories,
          fitness_score: dayScores?.fitness_score || 0,
          eco_score: dayScores?.eco_score || 0,
          combined_score: dayScores?.combined_score || 0,
        });
      }

      setChartData(processedData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string, index: number, total: number) => {
    const date = new Date(dateStr);
    
    if (timeframe === 'weekly') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      // For monthly view, show fewer labels to avoid overlap
      if (total > 15 && index % 3 !== 0) return '';
      return date.getDate().toString();
    }
  };

  // Custom SVG Chart Component
  const CustomChart = ({ width, height, isModal = false }: { width: number; height: number; isModal?: boolean }) => {
    if (chartData.length === 0) return null;

    const padding = { 
      left: 60, 
      top: 30, 
      right: 30, 
      bottom: isModal ? 60 : 50 
    };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Get data based on selected metric
    const getDataSets = () => {
      const dataSets = [];
      
      if (selectedMetric === 'all' || selectedMetric === 'calories') {
        dataSets.push({
          data: chartData.map(item => item.calories / 10), // Scale down calories
          color: theme.colors.error,
          name: 'Calories (÷10)',
          icon: Flame,
        });
      }
      
      if (selectedMetric === 'all' || selectedMetric === 'fitness') {
        dataSets.push({
          data: chartData.map(item => item.fitness_score),
          color: theme.colors.secondary,
          name: 'Fitness Score',
          icon: Zap,
        });
      }
      
      if (selectedMetric === 'all' || selectedMetric === 'eco') {
        dataSets.push({
          data: chartData.map(item => item.eco_score),
          color: theme.colors.success,
          name: 'Eco Score',
          icon: Leaf,
        });
      }

      return dataSets;
    };

    const dataSets = getDataSets();
    const allValues = dataSets.flatMap(set => set.data);
    
    // Better axis scaling
    let maxValue = Math.max(...allValues, 100);
    let minValue = Math.min(...allValues, 0);
    
    // Round to nice numbers
    maxValue = Math.ceil(maxValue / 10) * 10;
    minValue = Math.floor(minValue / 10) * 10;
    
    // Ensure minimum range
    if (maxValue - minValue < 20) {
      maxValue = minValue + 20;
    }

    // Create path for each data set
    const createPath = (data: number[]) => {
      if (data.length === 0) return '';
      
      const points = data.map((value, index) => {
        const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
        const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
        return { x, y };
      });

      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
      
      return path;
    };

    // Grid lines
    const gridLines = [];
    const numGridLines = 4;
    for (let i = 0; i <= numGridLines; i++) {
      const y = padding.top + (i / numGridLines) * chartHeight;
      gridLines.push(
        <Line
          key={`grid-${i}`}
          x1={padding.left}
          y1={y}
          x2={padding.left + chartWidth}
          y2={y}
          stroke={theme.colors.border}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }

    // Y-axis labels with better spacing
    const yLabels = [];
    for (let i = 0; i <= numGridLines; i++) {
      const value = maxValue - (i / numGridLines) * (maxValue - minValue);
      const y = padding.top + (i / numGridLines) * chartHeight;
      yLabels.push(
        <SvgText
          key={`y-label-${i}`}
          x={padding.left - 15}
          y={y + 5}
          fontSize={11}
          fill={theme.colors.textSecondary}
          textAnchor="end"
          fontWeight="500"
        >
          {Math.round(value)}
        </SvgText>
      );
    }

    // X-axis labels with better spacing
    const xLabels = chartData.map((item, index) => {
      const label = formatDate(item.date, index, chartData.length);
      if (!label) return null;
      
      const x = padding.left + (index / Math.max(chartData.length - 1, 1)) * chartWidth;
      return (
        <SvgText
          key={`x-label-${index}`}
          x={x}
          y={height - 15}
          fontSize={10}
          fill={theme.colors.textSecondary}
          textAnchor="middle"
          fontWeight="500"
        >
          {label}
        </SvgText>
      );
    }).filter(Boolean);

    return (
      <View style={styles.chartContainer}>
        <Svg width={width} height={height}>
          {/* Grid lines */}
          {gridLines}
          
          {/* Y-axis */}
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke={theme.colors.border}
            strokeWidth={2}
          />
          
          {/* X-axis */}
          <Line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke={theme.colors.border}
            strokeWidth={2}
          />
          
          {/* Y-axis labels */}
          {yLabels}
          
          {/* X-axis labels */}
          {xLabels}
          
          {/* Data lines */}
          {dataSets.map((dataSet, index) => (
            <G key={index}>
              <Path
                d={createPath(dataSet.data)}
                stroke={dataSet.color}
                strokeWidth={isModal ? 3 : 2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {dataSet.data.map((value, pointIndex) => {
                const x = padding.left + (pointIndex / Math.max(dataSet.data.length - 1, 1)) * chartWidth;
                const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
                return (
                  <Circle
                    key={`point-${index}-${pointIndex}`}
                    cx={x}
                    cy={y}
                    r={isModal ? 5 : 4}
                    fill={dataSet.color}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                );
              })}
            </G>
          ))}
        </Svg>

        {/* Legend */}
        <View style={styles.legend}>
          {dataSets.map((dataSet, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: dataSet.color }]} />
              <dataSet.icon size={14} color={dataSet.color} />
              <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                {dataSet.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const MetricButton = ({ 
    metric, 
    label, 
    icon: Icon, 
    color 
  }: { 
    metric: typeof selectedMetric; 
    label: string; 
    icon: any; 
    color: string; 
  }) => (
    <TouchableOpacity
      style={[
        styles.metricButton,
        { 
          backgroundColor: selectedMetric === metric ? `${color}20` : theme.colors.surface,
          borderColor: selectedMetric === metric ? color : theme.colors.border,
        }
      ]}
      onPress={() => setSelectedMetric(metric)}
    >
      <Icon size={16} color={selectedMetric === metric ? color : theme.colors.textSecondary} />
      <Text style={[
        styles.metricButtonText,
        { 
          color: selectedMetric === metric ? color : theme.colors.textSecondary,
          fontWeight: selectedMetric === metric ? '700' : '500'
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ChartContent = ({ isModal = false }: { isModal?: boolean }) => {
    const chartWidth = isModal ? screenWidth - 40 : screenWidth - 80;
    const chartHeight = isModal ? 350 : 200;

    return (
      <View style={[styles.chartContainer, isModal && styles.modalChartContainer]}>
        {isLoading ? (
          <View style={[styles.loadingContainer, { height: chartHeight }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading chart data...
            </Text>
          </View>
        ) : chartData.length === 0 ? (
          <View style={[styles.loadingContainer, { height: chartHeight }]}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              No data available
            </Text>
          </View>
        ) : (
          <CustomChart width={chartWidth} height={chartHeight} isModal={isModal} />
        )}
      </View>
    );
  };

  return (
    <>
      <View style={[styles.widget, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC']}
          style={styles.widgetGradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIcon, { backgroundColor: `${theme.colors.info}20` }]}>
                <BarChart3 size={20} color={theme.colors.info} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.colors.text }]}>Progress Chart</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  {timeframe === 'weekly' ? 'Last 7 days' : 'Last 30 days'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.expandButton, { backgroundColor: `${theme.colors.accent}20` }]}
              onPress={() => setShowModal(true)}
            >
              <Maximize2 size={16} color={theme.colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Timeframe Toggle */}
          <View style={styles.timeframeToggle}>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                timeframe === 'weekly' && [styles.activeTimeframe, { backgroundColor: theme.colors.primary }]
              ]}
              onPress={() => setTimeframe('weekly')}
            >
              <Text style={[
                styles.timeframeText,
                { color: timeframe === 'weekly' ? '#FFFFFF' : theme.colors.textSecondary }
              ]}>
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                timeframe === 'monthly' && [styles.activeTimeframe, { backgroundColor: theme.colors.primary }]
              ]}
              onPress={() => setTimeframe('monthly')}
            >
              <Text style={[
                styles.timeframeText,
                { color: timeframe === 'monthly' ? '#FFFFFF' : theme.colors.textSecondary }
              ]}>
                Monthly
              </Text>
            </TouchableOpacity>
          </View>

          {/* Metric Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricFilter}>
            <View style={styles.metricFilterContent}>
              <MetricButton metric="all" label="All" icon={TrendingUp} color={theme.colors.primary} />
              <MetricButton metric="calories" label="Calories" icon={Flame} color={theme.colors.error} />
              <MetricButton metric="fitness" label="Fitness" icon={Zap} color={theme.colors.secondary} />
              <MetricButton metric="eco" label="Eco" icon={Leaf} color={theme.colors.success} />
            </View>
          </ScrollView>

          {/* Chart */}
          <ChartContent />
        </LinearGradient>
      </View>

      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Progress Chart</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Timeframe Toggle */}
            <View style={styles.modalTimeframeToggle}>
              <TouchableOpacity
                style={[
                  styles.modalTimeframeButton,
                  timeframe === 'weekly' && [styles.activeTimeframe, { backgroundColor: theme.colors.primary }]
                ]}
                onPress={() => setTimeframe('weekly')}
              >
                <Calendar size={16} color={timeframe === 'weekly' ? '#FFFFFF' : theme.colors.textSecondary} />
                <Text style={[
                  styles.modalTimeframeText,
                  { color: timeframe === 'weekly' ? '#FFFFFF' : theme.colors.textSecondary }
                ]}>
                  Weekly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalTimeframeButton,
                  timeframe === 'monthly' && [styles.activeTimeframe, { backgroundColor: theme.colors.primary }]
                ]}
                onPress={() => setTimeframe('monthly')}
              >
                <Calendar size={16} color={timeframe === 'monthly' ? '#FFFFFF' : theme.colors.textSecondary} />
                <Text style={[
                  styles.modalTimeframeText,
                  { color: timeframe === 'monthly' ? '#FFFFFF' : theme.colors.textSecondary }
                ]}>
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>

            {/* Metric Filter */}
            <View style={styles.modalMetricFilter}>
              <MetricButton metric="all" label="All Metrics" icon={TrendingUp} color={theme.colors.primary} />
              <MetricButton metric="calories" label="Calories" icon={Flame} color={theme.colors.error} />
              <MetricButton metric="fitness" label="Fitness Score" icon={Zap} color={theme.colors.secondary} />
              <MetricButton metric="eco" label="Eco Score" icon={Leaf} color={theme.colors.success} />
            </View>

            {/* Chart */}
            <View style={[styles.modalChartWrapper, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <ChartContent isModal={true} />
            </View>

            {/* Stats Summary */}
            {!isLoading && chartData.length > 0 && (
              <View style={styles.statsSection}>
                <Text style={[styles.statsTitle, { color: theme.colors.text }]}>Summary</Text>
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statValue, { color: theme.colors.error }]}>
                      {Math.round(chartData.reduce((sum, item) => sum + item.calories, 0) / chartData.length)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Avg Calories</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
                      {Math.round(chartData.reduce((sum, item) => sum + item.fitness_score, 0) / chartData.length)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Avg Fitness</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.statValue, { color: theme.colors.success }]}>
                      {Math.round(chartData.reduce((sum, item) => sum + item.eco_score, 0) / chartData.length)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Avg Eco</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  widget: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: 8,
  },
  widgetGradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeframeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTimeframe: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricFilter: {
    marginBottom: 16,
  },
  metricFilterContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  metricButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },
  modalChartContainer: {
    marginVertical: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalTimeframeToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modalTimeframeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalTimeframeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalMetricFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  modalChartWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    padding: 16,
  },
  statsSection: {
    marginTop: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChartWidget;