import React from 'react';
import type { BlogArticle } from '../data/articles';

interface ArticleCoverProps {
  article: BlogArticle;
  /** Above-the-fold image on the article page: eager + high priority. */
  priority?: boolean;
  /** Rendered width hint so the browser downloads the right variant. */
  sizes?: string;
  className?: string;
}

/**
 * 16:9 cover with WebP (800w / 1200w) and JPG fallback.
 * Width and height are set so the page does not shift while the image loads (CLS).
 */
export const ArticleCover: React.FC<ArticleCoverProps> = ({
  article,
  priority = false,
  sizes = '(max-width: 640px) 100vw, 768px',
  className = '',
}) => {
  if (!article.coverImage) return null;
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={`${article.coverWebp800} 800w, ${article.coverWebp} 1200w`}
        sizes={sizes}
      />
      <img
        src={article.coverImage}
        alt={article.coverAlt}
        width={article.coverWidth}
        height={article.coverHeight}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={`aspect-video w-full object-cover ${className}`}
      />
    </picture>
  );
};
