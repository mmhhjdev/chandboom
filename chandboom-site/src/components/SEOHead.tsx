import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  keywords?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  structuredData?: Record<string, any>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalPath,
  keywords,
  image,
  imageAlt,
  imageWidth,
  imageHeight,
  structuredData,
}) => {
  useEffect(() => {
    // Static JSON-LD written at build time would duplicate the one set here after client navigation.
    document.querySelectorAll('script[type="application/ld+json"][data-seo-static]').forEach((node) => node.remove());

    // 1. Update Title
    document.title = title;

    // 2. Helper to set or create meta tag
    const setMetaTag = (attribute: string, key: string, content: string) => {
      let meta = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, key);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMetaTag('name', 'description', description);
    if (keywords) setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    setMetaTag('property', 'og:type', canonicalPath.startsWith('/articles/') ? 'article' : 'website');
    if (image) { setMetaTag('property', 'og:image', image); setMetaTag('name', 'twitter:card', 'summary_large_image'); setMetaTag('name', 'twitter:image', image); }
    if (image && imageAlt) { setMetaTag('property', 'og:image:alt', imageAlt); setMetaTag('name', 'twitter:image:alt', imageAlt); }
    if (image && imageWidth && imageHeight) { setMetaTag('property', 'og:image:width', String(imageWidth)); setMetaTag('property', 'og:image:height', String(imageHeight)); }
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', `https://chandboom.ir${canonicalPath}`);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    // 3. Update Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `https://chandboom.ir${canonicalPath}`;

    // 4. Inject or update JSON-LD structured data
    let jsonLdScript = document.getElementById('page-jsonld-schema') as HTMLScriptElement | null;
    if (structuredData) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'page-jsonld-schema';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(structuredData);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    return () => {
      if (jsonLdScript) {
        jsonLdScript.remove();
      }
    };
  }, [title, description, canonicalPath, keywords, image, imageAlt, imageWidth, imageHeight, structuredData]);

  return null;
};
