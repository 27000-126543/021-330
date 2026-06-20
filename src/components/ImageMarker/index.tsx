import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { IssueMark, MarkPoint } from '@/types';

interface ImageMarkerProps {
  imageUrl: string;
  onSave: (marks: IssueMark[]) => void;
  onCancel: () => void;
  initialMarks?: IssueMark[];
}

const COLORS = ['#F53F3F', '#FF7D00', '#165DFF', '#00B42A', '#722ED1'];
const TOOLS = [
  { key: 'freehand', label: '自由圈' },
  { key: 'circle', label: '圆形' },
  { key: 'rect', label: '矩形' }
];

const ImageMarker: React.FC<ImageMarkerProps> = ({ imageUrl, onSave, onCancel, initialMarks = [] }) => {
  const [marks, setMarks] = useState<IssueMark[]>([]);
  const [currentTool, setCurrentTool] = useState<string>('freehand');
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<MarkPoint[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgDisplaySize, setImgDisplaySize] = useState({ width: 0, height: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const query = Taro.createSelectorQuery();
    query.select('#markerContainer').boundingClientRect();
    query.exec((res) => {
      if (res[0]) {
        const maxWidth = res[0].width;
        const maxHeight = Math.min(maxWidth * 1.33, Taro.getSystemInfoSync().windowHeight * 0.6);
        setCanvasSize({ width: maxWidth, height: maxHeight });

        Taro.getImageInfo({
          src: imageUrl,
          success: (imgRes) => {
            setImgNaturalSize({ width: imgRes.width, height: imgRes.height });

            const imgRatio = imgRes.width / imgRes.height;
            let displayWidth = maxWidth;
            let displayHeight = maxWidth / imgRatio;

            if (displayHeight > maxHeight) {
              displayHeight = maxHeight;
              displayWidth = maxHeight * imgRatio;
            }

            setImgDisplaySize({ width: displayWidth, height: displayHeight });
            setImageLoaded(true);
          },
          fail: (err) => {
            console.error('[ImageMarker] getImageInfo error:', err);
            setImgDisplaySize({ width: maxWidth, height: maxWidth * 0.75 });
            setImgNaturalSize({ width: maxWidth, height: maxWidth * 0.75 });
            setImageLoaded(true);
          }
        });
      }
    });
  }, [imageUrl]);

  const percentToPixel = useCallback((pctPoint: MarkPoint): MarkPoint => {
    return {
      x: (pctPoint.x / 100) * imgDisplaySize.width,
      y: (pctPoint.y / 100) * imgDisplaySize.height
    };
  }, [imgDisplaySize]);

  const pixelToPercent = useCallback((pixelPoint: MarkPoint): MarkPoint => {
    if (imgDisplaySize.width === 0 || imgDisplaySize.height === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: (pixelPoint.x / imgDisplaySize.width) * 100,
      y: (pixelPoint.y / imgDisplaySize.height) * 100
    };
  }, [imgDisplaySize]);

  const displayMarks = useMemo(() => {
    return marks.map(mark => ({
      ...mark,
      points: mark.points.map(p => percentToPixel(p))
    }));
  }, [marks, percentToPixel]);

  const displayCurrentPoints = useMemo(() => {
    return currentPoints.map(p => percentToPixel(p));
  }, [currentPoints, percentToPixel]);

  useEffect(() => {
    if (imageLoaded && initialMarks.length > 0 && marks.length === 0) {
      setMarks(initialMarks);
    }
  }, [imageLoaded, initialMarks, marks.length]);

  useEffect(() => {
    if (imageLoaded && canvasSize.width > 0) {
      redrawCanvas();
    }
  }, [displayMarks, imageLoaded, canvasSize, displayCurrentPoints]);

  const redrawCanvas = useCallback(() => {
    const query = Taro.createSelectorQuery();
    query.select('#markCanvas').fields({ node: true, size: true });
    query.exec((res) => {
      if (!res || !res[0]) return;
      const canvas = res[0].node;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = Taro.getSystemInfoSync().pixelRatio || 2;

      canvas.width = canvasSize.width * dpr;
      canvas.height = canvasSize.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

      const offsetX = (canvasSize.width - imgDisplaySize.width) / 2;
      const offsetY = (canvasSize.height - imgDisplaySize.height) / 2;

      const img = canvas.createImage();
      img.onload = () => {
        ctx.drawImage(img, offsetX, offsetY, imgDisplaySize.width, imgDisplaySize.height);
        drawAllMarks(ctx, offsetX, offsetY);
        drawCurrentPath(ctx, offsetX, offsetY);
      };
      img.onerror = () => {
        console.error('[ImageMarker] image load error');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(offsetX, offsetY, imgDisplaySize.width, imgDisplaySize.height);
        drawAllMarks(ctx, offsetX, offsetY);
        drawCurrentPath(ctx, offsetX, offsetY);
      };
      img.src = imageUrl;
    });
  }, [canvasSize, imageUrl, displayMarks, displayCurrentPoints, imgDisplaySize]);

  const drawAllMarks = (ctx: any, offsetX: number, offsetY: number) => {
    displayMarks.forEach(mark => {
      ctx.strokeStyle = mark.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (mark.type === 'circle' && mark.points.length >= 2) {
        const p1 = mark.points[0];
        const p2 = mark.points[1];
        const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        ctx.beginPath();
        ctx.arc(p1.x + offsetX, p1.y + offsetY, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (mark.type === 'rect' && mark.points.length >= 2) {
        const p1 = mark.points[0];
        const p2 = mark.points[1];
        ctx.beginPath();
        ctx.strokeRect(p1.x + offsetX, p1.y + offsetY, p2.x - p1.x, p2.y - p1.y);
        ctx.stroke();
      } else if (mark.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(mark.points[0].x + offsetX, mark.points[0].y + offsetY);
        for (let i = 1; i < mark.points.length; i++) {
          ctx.lineTo(mark.points[i].x + offsetX, mark.points[i].y + offsetY);
        }
        ctx.stroke();
      }
    });
  };

  const drawCurrentPath = (ctx: any, offsetX: number, offsetY: number) => {
    if (displayCurrentPoints.length < 1) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'circle' && displayCurrentPoints.length >= 2) {
      const p1 = displayCurrentPoints[0];
      const p2 = displayCurrentPoints[displayCurrentPoints.length - 1];
      const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      ctx.beginPath();
      ctx.arc(p1.x + offsetX, p1.y + offsetY, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (currentTool === 'rect' && displayCurrentPoints.length >= 2) {
      const p1 = displayCurrentPoints[0];
      const p2 = displayCurrentPoints[displayCurrentPoints.length - 1];
      ctx.beginPath();
      ctx.strokeRect(p1.x + offsetX, p1.y + offsetY, p2.x - p1.x, p2.y - p1.y);
      ctx.stroke();
    } else if (currentTool === 'freehand' && displayCurrentPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(displayCurrentPoints[0].x + offsetX, displayCurrentPoints[0].y + offsetY);
      for (let i = 1; i < displayCurrentPoints.length; i++) {
        ctx.lineTo(displayCurrentPoints[i].x + offsetX, displayCurrentPoints[i].y + offsetY);
      }
      ctx.stroke();
    }
  };

  const getPosition = (e: any): Promise<MarkPoint | null> => {
    return new Promise((resolve) => {
      const touches = e.touches || e.changedTouches;
      if (!touches || touches.length === 0) {
        resolve(null);
        return;
      }

      const touch = touches[0];
      const query = Taro.createSelectorQuery();
      query.select('#markCanvas').boundingClientRect();

      query.exec((res) => {
        if (res && res[0]) {
          const rect = res[0];
          const offsetX = (canvasSize.width - imgDisplaySize.width) / 2;
          const offsetY = (canvasSize.height - imgDisplaySize.height) / 2;

          let x = touch.clientX - rect.left - offsetX;
          let y = touch.clientY - rect.top - offsetY;

          x = Math.max(0, Math.min(x, imgDisplaySize.width));
          y = Math.max(0, Math.min(y, imgDisplaySize.height));

          const pctPoint = pixelToPercent({ x, y });
          resolve(pctPoint);
        } else {
          resolve({ x: 0, y: 0 });
        }
      });
    });
  };

  const handleTouchStart = async (e: any) => {
    e.preventDefault();
    const pos = await getPosition(e);
    if (!pos) return;

    setIsDrawing(true);
    setCurrentPoints([pos]);
  };

  const handleTouchMove = async (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();

    const pos = await getPosition(e);
    if (!pos) return;

    if (currentTool === 'freehand') {
      setCurrentPoints(prev => [...prev, pos]);
    } else {
      setCurrentPoints(prev => [prev[0], pos]);
    }
  };

  const handleTouchEnd = async (e: any) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPoints.length < 2) {
      setCurrentPoints([]);
      return;
    }

    let markType: IssueMark['type'] = 'freehand';
    if (currentTool === 'circle') {
      markType = 'circle';
    } else if (currentTool === 'rect') {
      markType = 'rect';
    } else if (currentTool === 'freehand') {
      markType = 'freehand';
    }

    const newMark: IssueMark = {
      id: `mark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: markType,
      points: currentPoints,
      color: currentColor
    };

    setMarks(prev => [...prev, newMark]);
    setCurrentPoints([]);
  };

  const handleUndo = () => {
    if (marks.length > 0) {
      setMarks(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    Taro.showModal({
      title: '确认清除',
      content: '确定要清除所有标注吗？',
      success: (res) => {
        if (res.confirm) {
          setMarks([]);
        }
      }
    });
  };

  const handleSave = () => {
    onSave(marks);
    console.log('[ImageMarker] saved marks:', marks.length);
  };

  return (
    <View className={styles.mask} onClick={onCancel}>
      <View className={styles.container} onClick={e => e.stopPropagation()} id="markerContainer">
        <View className={styles.header}>
          <Text className={styles.title}>在照片上标注问题位置</Text>
          <View className={styles.headerActions}>
            <View className={styles.headerBtn} onClick={handleUndo}>
              <Text>↶ 撤销</Text>
            </View>
            <View className={styles.headerBtn} onClick={handleClear}>
              <Text>清除</Text>
            </View>
          </View>
        </View>

        <View className={styles.canvasWrap}>
          {!imageLoaded && (
            <View className={styles.loading}>
              <Text>加载图片中...</Text>
            </View>
          )}
          {imageLoaded && (
            <View
              className={styles.canvasBox}
              style={{ width: canvasSize.width + 'px', height: canvasSize.height + 'px' }}
            >
              <Canvas
                id="markCanvas"
                type="2d"
                style={{ width: canvasSize.width + 'px', height: canvasSize.height + 'px' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              />
            </View>
          )}
        </View>

        <View className={styles.toolbar}>
          <View className={styles.toolSection}>
            <Text className={styles.toolLabel}>工具</Text>
            <View className={styles.tools}>
              {TOOLS.map(tool => (
                <View
                  key={tool.key}
                  className={classnames(styles.toolBtn, currentTool === tool.key && styles.active)}
                  onClick={() => setCurrentTool(tool.key)}
                >
                  <Text>{tool.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.toolSection}>
            <Text className={styles.toolLabel}>颜色</Text>
            <View className={styles.colors}>
              {COLORS.map(color => (
                <View
                  key={color}
                  className={classnames(styles.colorBtn, currentColor === color && styles.colorActive)}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                />
              ))}
            </View>
          </View>
        </View>

        <View className={styles.footer}>
          <View className={styles.cancelBtn} onClick={onCancel}>
            <Text>取消</Text>
          </View>
          <View className={styles.saveBtn} onClick={handleSave}>
            <Text>完成标注 ({marks.length})</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ImageMarker;
