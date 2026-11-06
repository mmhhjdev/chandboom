const TEHRAN = 'Asia/Tehran';

const persianDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: TEHRAN,
});

/** Formats an ISO date (YYYY-MM-DD) as a Persian calendar date. */
export const formatArticleDate = (isoDate: string): string =>
  persianDate.format(new Date(`${isoDate}T12:00:00Z`));

/** Converts ASCII digits to Persian digits for display. */
export const toPersianDigits = (value: number | string): string =>
  String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export const readingTimeLabel = (minutes: number): string =>
  `${toPersianDigits(minutes)} دقیقه مطالعه`;

/** Turns a heading into a stable in-page anchor id (ASCII index based, safe for any text). */
export const sectionAnchor = (index: number): string => `section-${index + 1}`;
