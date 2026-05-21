import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

interface Skill {
  key: string;
  label: string;
  value: number; // 0 to 1
  color: string;
}

interface RadarChartProps {
  skills: Skill[];
  size?: number;
  themeColor?: string;
}

export function RadarChart({ skills, size = 260, themeColor = COLORS.focus }: RadarChartProps) {
  const padding = 45;
  const chartSize = size - padding * 2;
  const center = size / 2;
  const radius = chartSize / 2;

  // 6 Skills corresponds to 6 vertices
  const totalSides = 6;
  
  // Calculate coordinates for a given index and value (0-1)
  const getCoordinates = (index: number, value: number) => {
    const angle = (index * 2 * Math.PI) / totalSides - Math.PI / 2;
    const r = radius * Math.min(1, Math.max(0.1, value)); // clamp minimum so the shape remains visible
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Coordinates for the data polygon
  const dataPoints = skills.map((skill, index) => getCoordinates(index, skill.value));
  const polygonPointsStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Concentric levels (0.25, 0.5, 0.75, 1.0)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="radarBg" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={themeColor} stopOpacity={0.02} />
            <Stop offset="100%" stopColor={themeColor} stopOpacity={0.08} />
          </RadialGradient>
        </Defs>

        {/* Concentric grid lines */}
        {gridLevels.map((level, levelIdx) => {
          const levelPoints = Array.from({ length: totalSides }).map((_, sideIdx) => {
            const coords = getCoordinates(sideIdx, level);
            return `${coords.x},${coords.y}`;
          }).join(' ');

          return (
            <Polygon
              key={`grid-${levelIdx}`}
              points={levelPoints}
              fill={level === 1.0 ? 'url(#radarBg)' : 'none'}
              stroke={level === 1.0 ? COLORS.border : '#E2E8F0'}
              strokeWidth={level === 1.0 ? 1.5 : 1}
              strokeDasharray={level === 1.0 ? undefined : '3,3'}
            />
          );
        })}

        {/* Axis lines and labels */}
        {skills.map((skill, index) => {
          const outerCoord = getCoordinates(index, 1.0);
          const angle = outerCoord.angle;
          
          // Position labels slightly further outside the grid boundaries
          const labelDist = radius + 22;
          const labelX = center + labelDist * Math.cos(angle);
          // Adjust vertical position to account for label height & alignment
          const labelY = center + labelDist * Math.sin(angle) + 4;

          // Determine text anchor point based on angle
          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          const cos = Math.cos(angle);
          if (cos > 0.15) {
            textAnchor = 'start';
          } else if (cos < -0.15) {
            textAnchor = 'end';
          }

          return (
            <G key={`axis-${skill.key}`}>
              {/* Spoke Line */}
              <Line
                x1={center}
                y1={center}
                x2={outerCoord.x}
                y2={outerCoord.y}
                stroke={COLORS.border}
                strokeWidth={1}
              />
              
              {/* Label */}
              <SvgText
                x={labelX}
                y={labelY}
                fontSize={10}
                fontFamily={FONTS.headingSemi}
                fill={COLORS.ink}
                textAnchor={textAnchor}
              >
                {skill.label}
              </SvgText>

              {/* Skill Value Percentage Badge */}
              <SvgText
                x={labelX}
                y={labelY + 12}
                fontSize={9}
                fontFamily={FONTS.body}
                fill={skill.color}
                textAnchor={textAnchor}
              >
                {Math.round(skill.value * 100)}%
              </SvgText>
            </G>
          );
        })}

        {/* Data polygon shape */}
        <Polygon
          points={polygonPointsStr}
          fill={themeColor}
          fillOpacity={0.25}
          stroke={themeColor}
          strokeWidth={3}
          strokeLinejoin="round"
        />

        {/* Glowing vertices circles */}
        {dataPoints.map((pt, index) => (
          <G key={`vertice-${index}`}>
            <Circle
              cx={pt.x}
              cy={pt.y}
              r={5}
              fill={skills[index].color}
              stroke={COLORS.white}
              strokeWidth={1.5}
            />
            <Circle
              cx={pt.x}
              cy={pt.y}
              r={9}
              fill={skills[index].color}
              fillOpacity={0.15}
            />
          </G>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
  },
});
