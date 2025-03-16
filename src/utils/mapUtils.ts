export interface GeoFeature {
  type: string;
  properties: {
    name: string;
    adcode: string;
    center: [number, number];
    centroid: [number, number];
    childrenNum: number;
    level: string;
    parent: { adcode: number };
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

// 定义坐标点类型
export type Coordinate = [number, number];
export type Ring = Coordinate[];
export type Polygon = Ring[];
export type MultiPolygon = Polygon[];

interface Bounds {
  minLng: number; // 最小经度
  maxLng: number; // 最大经度
  minLat: number; // 最小纬度
  maxLat: number; // 最大纬度
}

export function transformGeoData(data: any) {
  if (!data || !data.features || !Array.isArray(data.features)) {
    console.error('无效的地图数据格式:', data);
    return null;
  }

  try {
    console.log('处理地图数据，特征数量:', data.features.length);
    
    // 首先检查数据格式
    data.features.forEach((feature: GeoFeature, index: number) => {
      console.log(`特征 ${index}:`, {
        name: feature.properties.name,
        coordLength: feature.geometry.coordinates.length,
        type: feature.geometry.type
      });
    });

    // 中国大陆的地理范围（粗略值）
    const CHINA_BOUNDS: Bounds = {
      minLng: 73,   // 最西端
      maxLng: 135,  // 最东端
      minLat: 18,   // 最南端
      maxLat: 53    // 最北端
    };

    // 计算转换参数
    const lngRange = CHINA_BOUNDS.maxLng - CHINA_BOUNDS.minLng;
    const latRange = CHINA_BOUNDS.maxLat - CHINA_BOUNDS.minLat;

    // SVG 视图框的范围（保留边距）
    const SVG_PADDING = 50;
    const SVG_WIDTH = 900;
    const SVG_HEIGHT = 900;
    const EFFECTIVE_WIDTH = SVG_WIDTH - 2 * SVG_PADDING;
    const EFFECTIVE_HEIGHT = SVG_HEIGHT - 2 * SVG_PADDING;

    // 计算宽高比，确保地图不变形
    const mapAspectRatio = lngRange / latRange;
    const svgAspectRatio = EFFECTIVE_WIDTH / EFFECTIVE_HEIGHT;

    let scale: number;
    let offsetX: number;
    let offsetY: number;

    if (mapAspectRatio > svgAspectRatio) {
      // 地图比 SVG 更宽，以宽度为准
      scale = EFFECTIVE_WIDTH / lngRange;
      offsetX = SVG_PADDING;
      offsetY = (SVG_HEIGHT - (latRange * scale)) / 2;
    } else {
      // 地图比 SVG 更高，以高度为准
      scale = EFFECTIVE_HEIGHT / latRange;
      offsetX = (SVG_WIDTH - (lngRange * scale)) / 2;
      offsetY = SVG_PADDING;
    }

    console.log('转换参数:', {
      scale,
      offsetX,
      offsetY,
      mapAspectRatio,
      svgAspectRatio
    });

    // 转换坐标
    const transformedFeatures = data.features.map((feature: GeoFeature) => {
      const transformCoordinate = (coord: number[]): [number, number] => {
        if (!Array.isArray(coord) || coord.length < 2) {
          console.warn('无效的坐标:', coord);
          return [0, 0];
        }

        const [lng, lat] = coord;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          console.warn('坐标包含非数字值:', coord);
          return [0, 0];
        }

        // 转换经纬度到 SVG 坐标
        const x = offsetX + ((lng - CHINA_BOUNDS.minLng) * scale);
        const y = SVG_HEIGHT - (offsetY + ((lat - CHINA_BOUNDS.minLat) * scale));

        return [
          Number(x.toFixed(2)),
          Number(y.toFixed(2))
        ];
      };

      const transformRing = (ring: number[][]): [number, number][] => {
        if (!Array.isArray(ring)) return [];
        return ring.map(transformCoordinate);
      };

      const transformPolygon = (polygon: number[][][]): [number, number][][] => {
        if (!Array.isArray(polygon)) return [];
        return polygon.map(transformRing);
      };

      let transformedCoordinates;
      if (feature.geometry.type === 'Polygon') {
        transformedCoordinates = transformPolygon(feature.geometry.coordinates as number[][][]);
      } else if (feature.geometry.type === 'MultiPolygon') {
        transformedCoordinates = (feature.geometry.coordinates as number[][][][]).map(transformPolygon);
      } else {
        console.warn(`不支持的几何类型 ${feature.geometry.type} for ${feature.properties.name}`);
        return feature;
      }

      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: transformedCoordinates
        }
      };
    });

    console.log('转换完成，特征数量:', transformedFeatures.length);

    return {
      type: data.type,
      features: transformedFeatures
    };
  } catch (error) {
    console.error('转换地图数据时出错:', error);
    return null;
  }
} 