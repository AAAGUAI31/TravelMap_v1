import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { transformGeoData, GeoFeature, Coordinate, Ring } from '../utils/mapUtils';

// 省份类型定义
interface Province {
  id: string;
  name: string;
  visited: boolean;
}

interface TooltipProps {
  $x: number;
  $y: number;
}

const MapContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
`;

const MapPath = styled.path<{ $visited: boolean }>`
  fill: ${props => props.$visited ? '#4CAF50' : '#e0e0e0'};
  stroke: #999;
  stroke-width: 0.5;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    fill: ${props => props.$visited ? '#45a049' : '#d5d5d5'};
    stroke: #666;
    stroke-width: 1;
    filter: brightness(1.05);
  }
`;

const Tooltip = styled.div<TooltipProps>`
  position: absolute;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  pointer-events: none;
  transform: translate(-50%, -100%);
  margin-top: -8px;
  z-index: 1000;
  opacity: 0;
  animation: fadeIn 0.2s ease forwards;

  @keyframes fadeIn {
    to {
      opacity: 1;
      margin-top: -12px;
    }
  }
`;

const VisitedList = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 4px;
`;

const VisitedTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VisitedItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const VisitedBadge = styled.span`
  padding: 0.5rem 1rem;
  background: #4CAF50;
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

const Stats = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ChinaMap: React.FC = () => {
  const [visitedProvinces, setVisitedProvinces] = useState<Record<string, Province>>({});
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ show: boolean; x: number; y: number; content: string }>({
    show: false,
    x: 0,
    y: 0,
    content: ''
  });

  useEffect(() => {
    // 加载地图数据
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('网络响应不正确');
        }
        return response.json();
      })
      .then(data => {
        console.log('原始地图数据:', data);
        const transformedData = transformGeoData(data);
        console.log('转换后的地图数据:', transformedData);
        setMapData(transformedData);
        setLoading(false);
      })
      .catch(err => {
        console.error('加载地图数据失败:', err);
        setError(err.message || '加载地图数据失败');
        setLoading(false);
      });

    // 加载已访问省份数据
    const savedProvinces = localStorage.getItem('visitedProvinces');
    if (savedProvinces) {
      setVisitedProvinces(JSON.parse(savedProvinces));
    }
  }, []);

  const handleProvinceClick = (provinceId: string, provinceName: string) => {
    const updatedProvinces = {
      ...visitedProvinces,
      [provinceId]: {
        id: provinceId,
        name: provinceName,
        visited: !visitedProvinces[provinceId]?.visited
      }
    };
    setVisitedProvinces(updatedProvinces);
    localStorage.setItem('visitedProvinces', JSON.stringify(updatedProvinces));
  };

  const handleMouseMove = (e: React.MouseEvent, provinceName: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltip({
      show: true,
      x,
      y,
      content: provinceName
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, show: false }));
  };

  const getVisitedProvinces = () => {
    return Object.values(visitedProvinces).filter(province => province.visited);
  };

  const getStatistics = () => {
    const visited = getVisitedProvinces().length;
    const total = mapData ? mapData.features.length : 0;
    const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
    return { visited, total, percentage };
  };

  const stats = getStatistics();

  const generatePath = (coordinates: [number, number][]): string => {
    if (coordinates.length === 0) return '';
    
    const [startX, startY] = coordinates[0];
    let path = `M${startX},${startY}`;
    
    for (let i = 1; i < coordinates.length; i++) {
      const [x, y] = coordinates[i];
      path += `L${x},${y}`;
    }
    
    return path + 'Z';
  };

  if (loading) {
    return <div>正在加载地图数据...</div>;
  }

  if (error) {
    return <div>加载地图数据失败，请刷新页面重试</div>;
  }

  return (
    <>
      <MapContainer>
        <svg 
          viewBox="0 0 900 900"
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            width: '100%',
            height: 'auto',
            background: '#f8f8f8',
            borderRadius: '4px'
          }}
        >
          {mapData && mapData.features && mapData.features.map((feature: GeoFeature) => {
            console.log(`渲染省份: ${feature.properties.name}`, {
              type: feature.geometry.type,
              coordinates: feature.geometry.coordinates
            });

            let pathData = '';
            
            if (feature.geometry.type === 'Polygon') {
              // 处理单个多边形
              const coordinates = feature.geometry.coordinates as [number, number][][];
              pathData = coordinates
                .map(ring => generatePath(ring))
                .filter(Boolean)
                .join(' ');
            } else if (feature.geometry.type === 'MultiPolygon') {
              // 处理多个多边形
              const coordinates = feature.geometry.coordinates as [number, number][][][];
              pathData = coordinates
                .map(polygon => 
                  polygon
                    .map(ring => generatePath(ring))
                    .filter(Boolean)
                    .join(' ')
                )
                .filter(Boolean)
                .join(' ');
            }

            if (!pathData) {
              console.warn(`无效的路径数据: ${feature.properties.name}`);
              return null;
            }

            console.log(`生成的路径数据 [${feature.properties.name}]:`, pathData);

            return (
              <MapPath
                key={feature.properties.adcode}
                d={pathData}
                $visited={visitedProvinces[feature.properties.adcode]?.visited || false}
                onClick={() => handleProvinceClick(
                  feature.properties.adcode,
                  feature.properties.name
                )}
                onMouseMove={(e) => handleMouseMove(e, feature.properties.name)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </svg>
        {tooltip.show && (
          <Tooltip $x={tooltip.x} $y={tooltip.y}>
            {tooltip.content}
          </Tooltip>
        )}
      </MapContainer>
      
      <Stats>
        <StatItem>
          <span>已访问省份数量：</span>
          <span>{stats.visited}</span>
        </StatItem>
        <StatItem>
          <span>总省份数量：</span>
          <span>{stats.total}</span>
        </StatItem>
        <StatItem>
          <span>完成度：</span>
          <span>{stats.percentage}%</span>
        </StatItem>
      </Stats>

      <VisitedList>
        <VisitedTitle>
          已去过的地方
          <span>（{getVisitedProvinces().length} 个省份）</span>
        </VisitedTitle>
        <VisitedItems>
          {getVisitedProvinces().map(province => (
            <VisitedBadge 
              key={province.id}
              onClick={() => handleProvinceClick(province.id, province.name)}
            >
              {province.name}
            </VisitedBadge>
          ))}
        </VisitedItems>
      </VisitedList>
    </>
  );
};

export default ChinaMap; 