import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Canvas, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { IssueMark, MarkPoint } from '@/types';

interface MarkedImageViewProps {
  imageUrl: string;
  marks: IssueMark[];
  width?: number;
  height?: number;
  mode?: 'aspectFill' | 'aspectFit';
  onClick?: () => void;
}

const MarkedImageView: React.FC<MarkedImageViewProps> = ({
  imageUrl,
  marks,
  width = 200,
  height = 200,
  mode = 'aspectFit',
  onClick
}) => {
  const [loaded, setLoaded] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!imageUrl) return;

    Taro.getImageInfo({
      src: imageUrl,
      success: (res) => {
        setImgNaturalSize({ width: res.width, height: res.height });
      },
      fail: () => {
        setImgNaturalSize({ width, height });
      }
    });
  }, [imageUrl, width, height]);

  useEffect(() => {
    if (!imageUrl || imgNaturalSize.width === 0) return;
    drawCanvas();
  }, [imageUrl, marks, width, height, mode, imgNaturalSize]);

  const calcImageDisplayRect = useCallback(() => {
    const imgRatio = imgNaturalSize.width / imgNaturalSize.height;
    const containerRatio = width / height;

    let displayWidth: number;
    let displayHeight: number;

    if (mode === 'aspectFill') {
      if (imgRatio > containerRatio) {
        displayHeight = height;
        displayWidth = height * imgRatio;
      } else {
        displayWidth = width;
        displayHeight = width / imgRatio;
      }
    } else {
      if (imgRatio > containerRatio) {
        displayWidth = width;
        displayHeight = width / imgRatio;
      } else {
        displayHeight = height;
        displayWidth = height * imgRatio;
      }
    }

    const offsetX = (width - displayWidth) / 2;
    const offsetY = (height - displayHeight) / 2;

    return { offsetX, offsetY, displayWidth, displayHeight };
  }, [imgNaturalSize, width, height, mode]);

  const percentToPixel = useCallback((pctPoint: MarkPoint, displayWidth: number, displayHeight: number): MarkPoint => {
    return {
      x: (pctPoint.x / 100) * displayWidth,
      y: (pctPoint.y / 100) * displayHeight
    };
  }, []);

  const drawCanvas = () => {
    const canvasId = `markedCanvas_${imageUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const query = Taro.createSelectorQuery();
    query.select(`#${canvasId}`).fields({ node: true, size: true });
    query.exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        setLoaded(true);
        return;
      }

      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = Taro.getSystemInfoSync().pixelRatio || 2;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const { offsetX, offsetY, displayWidth, displayHeight } = calcImageDisplayRect();

      const img = canvas.createImage();
      img.onload = () => {
        ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight);
        drawMarks(ctx, offsetX, offsetY, displayWidth, displayHeight);
        setLoaded(true);
      };
      img.onerror = () => {
        console.error('[MarkedImage] image load error:', imageUrl);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(offsetX, offsetY, displayWidth, displayHeight);
        ctx.fillStyle = '#999';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('加载失败', width / 2, height / 2);
        setLoaded(true);
      };
      img.src = imageUrl;
    });
  };

  const drawMarks = (ctx: any, offsetX: number, offsetY: number, displayWidth: number, displayHeight: number) => {
    if (!marks || marks.length === 0) return;

    const lineWidth = Math.max(2, Math.min(displayWidth, displayHeight) / 80);

    marks.forEach(mark => {
      if (!mark.points || mark.points.length < 1) return;

      const scaledPoints = mark.points.map(p => percentToPixel(p, displayWidth, displayHeight));

      ctx.strokeStyle = mark.color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (mark.type === 'circle' && scaledPoints.length >= 2) {
        const p1 = scaledPoints[0];
        const p2 = scaledPoints[1];
        const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        ctx.beginPath();
        ctx.arc(p1.x + offsetX, p1.y + offsetY, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (mark.type === 'rect' && scaledPoints.length >= 2) {
        const p1 = scaledPoints[0];
        const p2 = scaledPoints[1];
        ctx.beginPath();
        ctx.strokeRect(p1.x + offsetX, p1.y + offsetY, p2.x - p1.x, p2.y - p1.y);
        ctx.stroke();
      } else if (scaledPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(scaledPoints[0].x + offsetX, scaledPoints[0].y + offsetY);
        for (let i = 1; i < scaledPoints.length; i++) {
          ctx.lineTo(scaledPoints[i].x + offsetX, scaledPoints[i].y + offsetY);
        }
        ctx.stroke();
      }
    });
  };

  const canvasId = `markedCanvas_${imageUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const totalMarks = marks ? marks.length : 0;

  return (
    <View className={styles.container} onClick={onClick} style={{ width: width + 'px', height: height + 'px' }}>
      {!loaded && (
        <View className={styles.fallback}>
          <Image
            className={styles.fallbackImg}
            src={imageUrl}
            mode={mode}
            style={{ width: width + 'px', height: height + 'px' }}
          />
        </View>
      )}
      <Canvas
        id={canvasId}
        type="2d"
        style={{
          width: width + 'px',
          height: height + 'px',
          display: loaded ? 'block' : 'none'
        }}
        onClick={onClick}
      />
      {totalMarks > 0 && (
        <View className={styles.markCount}>
          <Text className={styles.markCountText}>{totalMarks} 处</Text>
        </View>
      )}
    </View>
  );
};

export default MarkedImageView;
