import React, { useState, useEffect, useCallback } from 'react';
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
  const [marks, setMarks] = useState<IssueMark[]>(initialMarks);
  const [currentTool, setCurrentTool] = useState<string>('freehand');
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<MarkPoint[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

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
            const imgRatio = imgRes.width / imgRes.height;
            let displayWidth = maxWidth;
            let displayHeight = maxWidth / imgRatio;

            if (displayHeight > maxHeight) {
              displayHeight = maxHeight;
              displayWidth = maxHeight * imgRatio;
            }

            setImgSize({ width: displayWidth, height: displayHeight });
            setCanvasSize({ width: displayWidth, height: displayHeight });
            setImageLoaded(true);
          },
          fail: (err) => {
            console.error('[ImageMarker] getImageInfo error:', err);
            setCanvasSize({ width: maxWidth, height: maxWidth * 0.75 });
            setImageLoaded(true);
          }
        });
      }
    });
  }, [imageUrl]);

  useEffect(() => {
    if (imageLoaded && canvasSize.width > 0) {
      redrawCanvas();
    }
  }, [marks, imageLoaded, canvasSize, currentPoints]);

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

      const img = canvas.createImage();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
        drawAllMarks(ctx);
        drawCurrentPath(ctx);
      };
      img.onerror = () => {
        console.error('[ImageMarker] image load error');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
        drawAllMarks(ctx);
        drawCurrentPath(ctx);
      };
      img.src = imageUrl;
    });
  }, [canvasSize, imageUrl, marks, currentPoints]);

  const drawAllMarks = (ctx: any) => {
    marks.forEach(mark => {
      ctx.strokeStyle = mark.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (mark.type === 'circle' && mark.points.length >= 2) {
        const p1 = mark.points[0];
        const p2 = mark.points[1];
        const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (mark.type === 'rect' && mark.points.length >= 2) {
        const p1 = mark.points[0];
        const p2 = mark.points[1];
        ctx.beginPath();
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.stroke();
      } else if (mark.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(mark.points[0].x, mark.points[0].y);
        for (let i = 1; i < mark.points.length; i++) {
          ctx.lineTo(mark.points[i].x, mark.points[i].y);
        }
        ctx.stroke();
      }
    });
  };

  const drawCurrentPath = (ctx: any) => {
    if (currentPoints.length < 1) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'circle' && currentPoints.length >= 2) {
      const p1 = currentPoints[0];
      const p2 = currentPoints[currentPoints.length - 1];
      const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (currentTool === 'rect' && currentPoints.length >= 2) {
      const p1 = currentPoints[0];
      const p2 = currentPoints[currentPoints.length - 1];
      ctx.beginPath();
      ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      ctx.stroke();
    } else if (currentTool === 'freehand' && currentPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
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
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          resolve({
            x: Math.max(0, Math.min(x, canvasSize.width)),
            y: Math.max(0, Math.min(y, canvasSize.height))
          });
        } else {
          resolve({ x: touch.clientX, y: touch.clientY });
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
      setCurrentPoints([currentPoints[0], pos]);
    }
  };

  const handleTouchEnd = async (e: any) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    let points = currentPoints;
    if (points.length < 2) {
      setCurrentPoints([]);
      return;
    }

    let markType: 'circle' | 'rect' | 'text' = 'circle';
    if (currentTool === 'rect') {
      markType = 'rect';
    } else if (currentTool === 'freehand') {
      markType = 'circle';
    }

    if (currentTool === 'freehand' || currentTool === 'circle' || currentTool === 'rect') {
      const newMark: IssueMark = {
        id: `mark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: markType,
        points: points,
        color: currentColor
      };

      setMarks(prev => [...prev, newMark]);
    }

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
                ref={canvasRef}
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
