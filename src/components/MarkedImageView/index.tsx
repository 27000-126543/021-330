import React, { useEffect, useState } from 'react';
import { View, Text, Canvas, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { IssueMark } from '@/types';

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
  mode = 'aspectFill',
  onClick
}) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    drawCanvas();
  }, [imageUrl, marks, width, height]);

  const drawCanvas = () => {
    const query = Taro.createSelectorQuery();
    query.select(`#markedCanvas_${imageUrl.replace(/[^a-zA-Z0-9]/g, '_')}`).fields({ node: true, size: true });
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

      const img = canvas.createImage();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        drawMarks(ctx);
        setLoaded(true);
      };
      img.onerror = () => {
        console.error('[MarkedImage] image load error:', imageUrl);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#999';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('加载失败', width / 2, height / 2);
        setLoaded(true);
      };
      img.src = imageUrl;
    });
  };

  const drawMarks = (ctx: any) => {
    if (!marks || marks.length === 0) return;

    marks.forEach(mark => {
      if (!mark.points || mark.points.length < 1) return;

      const scaleX = width / 100;
      const scaleY = height / 100;

      const scaledPoints = mark.points.map(p => ({
        x: (p.x / 100) * width,
        y: (p.y / 100) * height
      }));

      ctx.strokeStyle = mark.color;
      ctx.lineWidth = Math.max(2, width / 80);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (mark.type === 'circle' && scaledPoints.length >= 2) {
        const p1 = scaledPoints[0];
        const p2 = scaledPoints[1];
        const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (mark.type === 'rect' && scaledPoints.length >= 2) {
        const p1 = scaledPoints[0];
        const p2 = scaledPoints[1];
        ctx.beginPath();
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.stroke();
      } else if (scaledPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
        for (let i = 1; i < scaledPoints.length; i++) {
          ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
        }
        ctx.stroke();
      }
    });
  };

  return (
    <View className={styles.container} onClick={onClick}>
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
        id={`markedCanvas_${imageUrl.replace(/[^a-zA-Z0-9]/g, '_')}`}
        type="2d"
        style={{
          width: width + 'px',
          height: height + 'px',
          display: loaded ? 'block' : 'none'
        }}
        onClick={onClick}
      />
      {marks && marks.length > 0 && (
        <View className={styles.markCount}>
          <Text className={styles.markCountText}>{marks.length} 处标注</Text>
        </View>
      )}
    </View>
  );
};

export default MarkedImageView;
