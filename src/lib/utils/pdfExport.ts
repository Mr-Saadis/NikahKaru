import { jsPDF } from 'jspdf';
import { filterAndFormatReleaseFields } from './formatReleaseFields';
import { useReferenceDataStore } from '@/lib/stores/reference-data-store';
import { PreferenceService } from '@/lib/services/preference-service';
import { ProfileService } from '@/lib/services/profile-service';
import { getProfileGroups } from '@/components/requests/utils';
import type { RequestItem } from '@/components/requests/types';
import {
  formatBilingualValue,
  getBilingualFieldLabel,
  getBilingualSectionTitle,
  isMeaningfulFieldValue,
  resolveExplicitUrduFromProfile,
  type BilingualText,
} from './pdfBilingual';

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const PX_PER_MM = 10; // 2100 x 2970 px (~254 DPI)
const PT_TO_MM = 0.352778;

const MARGIN_X = 16;
const CONTENT_W = PAGE_W_MM - MARGIN_X * 2; // 178mm
const COL_GAP = 10;
const COL_W = (CONTENT_W - COL_GAP) / 2; // 84mm each
const HEADER_RULE_Y = 29;
const FOOTER_RULE_Y = 281;
const FOOTER_TEXT_Y = 286;
const MAX_BODY_Y = 275;

const COLORS = {
  bg: '#FAF8F5',
  primary: '#17382E', // Deep Forest Green matching nikah_icon.png
  sage: '#8F9E82', // Muted Sage Olive matching nikah_icon.png
  ink: '#142821',
  muted: '#757068',
  rule: '#E4DDD1',
  ruleDark: '#C9BFA9',
  goldMuted: '#9A8458',
};

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';

function mm(val: number): number {
  return val * PX_PER_MM;
}

function pt(sizePt: number): number {
  return sizePt * PT_TO_MM * PX_PER_MM;
}

function fontEn(sizePt: number, weight: 400 | 500 | 600 | 700 = 500): string {
  return `${weight} ${pt(sizePt).toFixed(2)}px "Plus Jakarta Sans", "Segoe UI", sans-serif`;
}

function fontDisplay(sizePt: number, weight: 600 | 700 = 700): string {
  return `${weight} ${pt(sizePt).toFixed(2)}px "Cormorant Garamond", Georgia, serif`;
}

function fontUr(
  sizePt: number,
  weight: 400 | 500 | 600 | 700 = 600,
  style: 'normal' | 'italic' = 'normal'
): string {
  const amiriWeight = weight >= 600 ? 700 : 400;
  return `${style} ${amiriWeight} ${pt(sizePt * 1.12).toFixed(2)}px "AmiriPDF", "Amiri", "Tahoma", sans-serif`;
}

const LOCAL_URDU_FONT_FACES: Array<{
  url: string;
  weight: string;
  style: string;
}> = [
  { url: '/fonts/Amiri-Regular.ttf', weight: '400', style: 'normal' },
  { url: '/fonts/Amiri-Bold.ttf', weight: '700', style: 'normal' },
  { url: '/fonts/Amiri-Italic.ttf', weight: '400', style: 'italic' },
  { url: '/fonts/Amiri-BoldItalic.ttf', weight: '700', style: 'italic' },
];

let fontsReadyPromise: Promise<void> | null = null;
async function ensurePdfFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined') return;
  if (!fontsReadyPromise) {
    fontsReadyPromise = (async () => {
      const loadLocalAmiri = async () => {
        if (typeof FontFace === 'undefined') return;
        await Promise.allSettled(
          LOCAL_URDU_FONT_FACES.map(async (spec) => {
            const face = new FontFace('AmiriPDF', `url("${spec.url}")`, {
              weight: spec.weight,
              style: spec.style,
            });
            const loaded = await face.load();
            document.fonts.add(loaded);
          })
        );
      };

      const loadGoogleFonts = async () => {
        const existing = document.querySelector(`link[href="${FONT_URL}"]`) as HTMLLinkElement | null;
        const linkEl =
          existing ||
          (() => {
            const el = document.createElement('link');
            el.rel = 'stylesheet';
            el.href = FONT_URL;
            document.head.appendChild(el);
            return el;
          })();

        await new Promise<void>((resolve) => {
          if (linkEl.sheet) {
            resolve();
            return;
          }
          linkEl.addEventListener('load', () => resolve(), { once: true });
          linkEl.addEventListener('error', () => resolve(), { once: true });
        });
      };

      await Promise.race([
        Promise.allSettled([loadLocalAmiri(), loadGoogleFonts()]).then(async () => {
          await Promise.allSettled([
            document.fonts.load('700 24px "Cormorant Garamond"'),
            document.fonts.load('600 24px "Plus Jakarta Sans"'),
            document.fonts.load('400 24px "AmiriPDF"'),
            document.fonts.load('700 24px "AmiriPDF"'),
          ]);
          await document.fonts.ready;
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 4000)),
      ]);
    })();
  }
  await fontsReadyPromise;
}

async function ensureReferenceDataLoaded(): Promise<void> {
  const refStore = useReferenceDataStore.getState();
  if (!refStore.isLoaded && !refStore.isLoading) {
    try {
      await refStore.loadAll();
    } catch {
      // Non-fatal fallback
    }
  }
}

let cachedBrandLogoCanvas: HTMLCanvasElement | null = null;
async function loadTrimmedBrandIcon(): Promise<HTMLCanvasElement | null> {
  if (typeof window === 'undefined') return null;
  if (cachedBrandLogoCanvas) return cachedBrandLogoCanvas;

  try {
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      const timer = setTimeout(() => resolve(null), 3500);
      el.onload = () => {
        clearTimeout(timer);
        resolve(el);
      };
      el.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
      el.src = '/nikah_icon.png';
    });

    if (!img || !img.width || !img.height) return null;

    const work = document.createElement('canvas');
    work.width = img.width;
    work.height = img.height;
    const wCtx = work.getContext('2d');
    if (!wCtx) return null;

    wCtx.drawImage(img, 0, 0);
    const imgData = wCtx.getImageData(0, 0, work.width, work.height);
    const d = imgData.data;

    let minX = work.width;
    let minY = work.height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < work.height; y++) {
      for (let x = 0; x < work.width; x++) {
        const idx = (y * work.width + x) * 4;
        const r = d[idx];
        const g = d[idx + 1];
        const b = d[idx + 2];
        const a = d[idx + 3];

        // Make pure/near-white background transparent so icon blends cleanly on #FAF8F5
        if (r > 240 && g > 240 && b > 240) {
          d[idx + 3] = 0;
        } else if (a > 20) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    wCtx.putImageData(imgData, 0, 0);

    if (maxX <= minX || maxY <= minY) return null;

    const pad = 4;
    const sx = Math.max(0, minX - pad);
    const sy = Math.max(0, minY - pad);
    const sw = Math.min(work.width - sx, maxX - minX + 1 + pad * 2);
    const sh = Math.min(work.height - sy, maxY - minY + 1 + pad * 2);

    const trimmed = document.createElement('canvas');
    trimmed.width = sw;
    trimmed.height = sh;
    const tCtx = trimmed.getContext('2d');
    if (!tCtx) return null;
    tCtx.drawImage(work, sx, sy, sw, sh, 0, 0, sw, sh);

    cachedBrandLogoCanvas = trimmed;
    return trimmed;
  } catch {
    return null;
  }
}

async function fetchCircularOrFramedPhoto(url: string): Promise<HTMLCanvasElement | null> {
  if (!url || typeof window === 'undefined') return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, { mode: 'cors', signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<HTMLCanvasElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const objUrl = URL.createObjectURL(blob);
      img.onload = () => {
        try {
          const size = 260;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.fillStyle = '#F3EFE7';
          ctx.fillRect(0, 0, size, size);
          const scale = Math.max(size / img.width, size / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
          resolve(canvas);
        } catch {
          resolve(null);
        } finally {
          URL.revokeObjectURL(objUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(null);
      };
      img.src = objUrl;
    });
  } catch {
    return null;
  }
}

function measureTextMm(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontCss: string,
  isRtl = false
): number {
  if (!text) return 0;
  ctx.save();
  ctx.font = fontCss;
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  const w = ctx.measureText(text).width / PX_PER_MM;
  ctx.restore();
  return w;
}

function wrapTextMm(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidthMm: number,
  fontCss: string,
  isRtl = false
): string[] {
  const clean = (text || '').trim();
  if (!clean) return [];

  if (measureTextMm(ctx, clean, fontCss, isRtl) <= maxWidthMm) {
    return [clean];
  }

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureTextMm(ctx, candidate, fontCss, isRtl) <= maxWidthMm) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // If a single token (like a long email/CNIC) exceeds maxWidthMm, break by characters
      if (measureTextMm(ctx, word, fontCss, isRtl) > maxWidthMm) {
        let chunk = '';
        for (const ch of word) {
          if (measureTextMm(ctx, chunk + ch, fontCss, isRtl) <= maxWidthMm) {
            chunk += ch;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawLtr(
  ctx: CanvasRenderingContext2D,
  text: string,
  xMm: number,
  yMm: number,
  fontCss: string,
  color: string
): void {
  if (!text) return;
  ctx.save();
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = fontCss;
  ctx.fillStyle = color;
  ctx.fillText(text, mm(xMm), mm(yMm));
  ctx.restore();
}

function drawRtl(
  ctx: CanvasRenderingContext2D,
  text: string,
  rightXMm: number,
  yMm: number,
  fontCss: string,
  color: string
): void {
  if (!text) return;
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.font = fontCss;
  ctx.fillStyle = color;
  ctx.fillText(text, mm(rightXMm), mm(yMm));
  ctx.restore();
}

function drawCenteredRtl(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerXMm: number,
  yMm: number,
  fontCss: string,
  color: string
): void {
  if (!text) return;
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = fontCss;
  ctx.fillStyle = color;
  ctx.fillText(text, mm(centerXMm), mm(yMm));
  ctx.restore();
}

function drawBilingualRightAlignedPair(
  ctx: CanvasRenderingContext2D,
  enText: string,
  urText: string,
  rightXMm: number,
  yMm: number,
  enFontCss: string,
  urFontCss: string,
  color: string
): void {
  const enW = measureTextMm(ctx, enText, enFontCss, false);
  drawLtr(ctx, enText, rightXMm - enW, yMm, enFontCss, color);

  if (urText) {
    const sep = '  •  ';
    const sepW = measureTextMm(ctx, sep, enFontCss, false);
    drawLtr(ctx, sep, rightXMm - enW - sepW, yMm, enFontCss, COLORS.muted);
    drawRtl(ctx, urText, rightXMm - enW - sepW, yMm, urFontCss, color);
  }
}

function drawLineMm(
  ctx: CanvasRenderingContext2D,
  x1Mm: number,
  y1Mm: number,
  x2Mm: number,
  y2Mm: number,
  color: string,
  widthMm = 0.25
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = mm(widthMm);
  ctx.beginPath();
  ctx.moveTo(mm(x1Mm), mm(y1Mm));
  ctx.lineTo(mm(x2Mm), mm(y2Mm));
  ctx.stroke();
  ctx.restore();
}

function drawRoundedImageMm(
  ctx: CanvasRenderingContext2D,
  imgCanvas: HTMLCanvasElement,
  xMm: number,
  yMm: number,
  wMm: number,
  hMm: number,
  radiusMm = 1.5,
  borderColor = COLORS.ruleDark
): void {
  ctx.save();
  const x = mm(xMm);
  const y = mm(yMm);
  const w = mm(wMm);
  const h = mm(hMm);
  const r = mm(radiusMm);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.save();
  ctx.clip();
  ctx.drawImage(imgCanvas, x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = mm(0.25);
  ctx.stroke();
  ctx.restore();
}

interface PageTheme {
  bg: string;
  primary: string;
  secondary: string;
  ink: string;
  muted: string;
  rule: string;
  subtitleEnOverride?: string;
  subtitleUrOverride?: string;
}

const DEFAULT_PAGE_THEME: PageTheme = {
  bg: COLORS.bg,
  primary: COLORS.primary,
  secondary: COLORS.sage,
  ink: COLORS.ink,
  muted: COLORS.muted,
  rule: COLORS.rule,
};

// Cohesive NikahKaru color-scheme theme for Partner Preferences pages
const PREFERENCES_PAGE_THEME: PageTheme = {
  bg: '#F2EDE1',       // Warm Sand Cream (distinct from #FAF8F5 profile pages)
  primary: '#2F3E51',  // Deep Slate Navy (matches ProfileSidebar & Compatibility cards)
  secondary: '#C86A4A', // Terracotta accent
  ink: '#1E2022',
  muted: '#676156',
  rule: '#DDD4C4',
  subtitleEnOverride: 'Partner Preferences Criteria',
  subtitleUrOverride: 'شریکِ حیات کی ترجیحات',
};

interface CanvasPage {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  theme: PageTheme;
}

function createNewA4Page(
  brandIcon: HTMLCanvasElement | null,
  headerConfig: {
    subtitleEn: string;
    subtitleUr: string;
    dateEn: string;
    dateUr: string;
  },
  theme: PageTheme = DEFAULT_PAGE_THEME
): CanvasPage {
  const canvas = document.createElement('canvas');
  canvas.width = mm(PAGE_W_MM);
  canvas.height = mm(PAGE_H_MM);
  const ctx = canvas.getContext('2d')!;

  // Page background (Warm Ivory for profile pages, Warm Sand Cream for preferences pages)
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Brand lockup on top-left using public/nikah_icon.png
  let textStartX = MARGIN_X;
  if (brandIcon) {
    const iconSizeMm = 9.5;
    const drawH = iconSizeMm;
    const drawW = (brandIcon.width / brandIcon.height) * drawH;
    ctx.drawImage(brandIcon, mm(MARGIN_X), mm(15.2), mm(drawW), mm(drawH));
    textStartX = MARGIN_X + drawW + 2.8;
  }

  const brandFont = fontEn(16.5, 700);
  drawLtr(ctx, 'nikah ', textStartX, 20.5, brandFont, COLORS.primary);
  const nikahW = measureTextMm(ctx, 'nikah ', brandFont);
  drawLtr(ctx, 'karu', textStartX + nikahW, 20.5, brandFont, COLORS.sage);

  drawLtr(
    ctx,
    theme.subtitleEnOverride || headerConfig.subtitleEn,
    textStartX,
    25.5,
    fontEn(9.2, 500),
    theme.muted
  );

  // Right side: Urdu subtitle + Date
  drawRtl(
    ctx,
    theme.subtitleUrOverride || headerConfig.subtitleUr,
    PAGE_W_MM - MARGIN_X,
    19.8,
    fontUr(11.5, 600),
    theme.primary
  );
  drawBilingualRightAlignedPair(
    ctx,
    headerConfig.dateEn,
    headerConfig.dateUr,
    PAGE_W_MM - MARGIN_X,
    25.5,
    fontEn(9.2, 500),
    fontUr(10, 500),
    theme.muted
  );

  // Minimalist single top rule
  drawLineMm(ctx, MARGIN_X, HEADER_RULE_Y, PAGE_W_MM - MARGIN_X, HEADER_RULE_Y, theme.primary, 0.35);

  return { canvas, ctx, theme };
}

function stampPageFootersAndExport(pages: CanvasPage[], filename: string): void {
  const total = pages.length;
  pages.forEach((page, idx) => {
    const p = idx + 1;
    drawLineMm(page.ctx, MARGIN_X, FOOTER_RULE_Y, PAGE_W_MM - MARGIN_X, FOOTER_RULE_Y, page.theme.rule, 0.25);
    drawLtr(
      page.ctx,
      'nikahkaru.com  •  Confidential Matrimonial Record',
      MARGIN_X,
      FOOTER_TEXT_Y,
      fontEn(9, 500),
      page.theme.muted
    );
    drawBilingualRightAlignedPair(
      page.ctx,
      `Page ${p} of ${total}`,
      `صفحہ ${p} از ${total}`,
      PAGE_W_MM - MARGIN_X,
      FOOTER_TEXT_Y,
      fontEn(9, 500),
      fontUr(10, 500),
      page.theme.muted
    );
  });

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pages.forEach((page, idx) => {
    const imgData = page.canvas.toDataURL('image/jpeg', 0.93);
    if (idx > 0) doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, 0, PAGE_W_MM, PAGE_H_MM, undefined, 'FAST');
  });

  doc.save(filename);
}

interface CellItem {
  label: BilingualText;
  value: BilingualText;
}

interface CellLayout {
  heightMm: number;
  stackLabels: boolean;
  stackValues: boolean;
  enValLines: string[];
  urValLines: string[];
}

const LABEL_EN_FONT = fontEn(9.2, 600);
const LABEL_UR_FONT = fontUr(10.5, 400);
const VAL_EN_FONT = fontEn(12, 600);
const VAL_UR_FONT = fontUr(12.8, 600);

function measureCell(ctx: CanvasRenderingContext2D, cell: CellItem): CellLayout {
  const enLabel = cell.label.en.toUpperCase();
  const urLabel = cell.label.ur;
  const enVal = cell.value.en;
  const urVal = cell.value.ur;

  const enLabelW = measureTextMm(ctx, enLabel, LABEL_EN_FONT, false);
  const urLabelW = measureTextMm(ctx, urLabel, LABEL_UR_FONT, true);
  const stackLabels = Boolean(urLabel) && enLabelW + urLabelW + 3 > COL_W;

  const enValLines = wrapTextMm(ctx, enVal, COL_W, VAL_EN_FONT, false);
  const urValLines = urVal ? wrapTextMm(ctx, urVal, COL_W, VAL_UR_FONT, true) : [];

  const enSingleW = measureTextMm(ctx, enVal, VAL_EN_FONT, false);
  const urSingleW = urVal ? measureTextMm(ctx, urVal, VAL_UR_FONT, true) : 0;

  // Stack Urdu value cleanly below English value if side-by-side would come within 4mm
  const stackValues =
    Boolean(urVal) &&
    (enValLines.length > 1 || urValLines.length > 1 || enSingleW + urSingleW + 4.5 > COL_W);

  const labelBlockH = stackLabels ? 9.2 : 5.0;
  let valueBlockH = 5.5;
  if (stackValues) {
    valueBlockH = enValLines.length * 5.5 + 1.2 + urValLines.length * 6.0;
  } else {
    valueBlockH = 5.8;
  }

  const heightMm = 2.2 + labelBlockH + 1.4 + valueBlockH + 2.5;

  return {
    heightMm,
    stackLabels,
    stackValues,
    enValLines,
    urValLines,
  };
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: CellItem,
  layout: CellLayout,
  xMm: number,
  topYMm: number,
  theme: PageTheme = DEFAULT_PAGE_THEME
): void {
  let y = topYMm + 5.0;

  // Labels
  drawLtr(ctx, cell.label.en.toUpperCase(), xMm, y, LABEL_EN_FONT, theme.muted);
  if (cell.label.ur) {
    if (layout.stackLabels) {
      y += 4.5;
    }
    drawRtl(ctx, cell.label.ur, xMm + COL_W, y, LABEL_UR_FONT, theme.muted);
  }

  // Values
  y += 5.5;
  if (layout.stackValues) {
    layout.enValLines.forEach((line, idx) => {
      drawLtr(ctx, line, xMm, y + idx * 5.5, VAL_EN_FONT, theme.ink);
    });
    const urStartY = y + (layout.enValLines.length - 1) * 5.5 + 6.0;
    layout.urValLines.forEach((line, idx) => {
      drawRtl(ctx, line, xMm + COL_W, urStartY + idx * 6.0, VAL_UR_FONT, theme.primary);
    });
  } else {
    drawLtr(ctx, cell.value.en, xMm, y, VAL_EN_FONT, theme.ink);
    if (cell.value.ur) {
      drawRtl(ctx, cell.value.ur, xMm + COL_W, y, VAL_UR_FONT, theme.primary);
    }
  }
}

/**
 * Render exact Lucide React `Venus` / `Mars` 24x24 vector icon directly on Canvas.
 */
function drawLucideGenderIconMm(
  ctx: CanvasRenderingContext2D,
  gender: 'MALE' | 'FEMALE',
  xMm: number,
  yMm: number,
  sizeMm: number,
  color: string
): void {
  const scale = mm(sizeMm) / 24;
  ctx.save();
  ctx.translate(mm(xMm), mm(yMm));
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (gender === 'FEMALE') {
    // Lucide <Venus />: <path d="M12 15v7"/><path d="M9 19h6"/><circle cx="12" cy="9" r="6"/>
    ctx.stroke(new Path2D('M12 15v7'));
    ctx.stroke(new Path2D('M9 19h6'));
    ctx.beginPath();
    ctx.arc(12, 9, 6, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Lucide <Mars />: <path d="M16 3h5v5"/><path d="m21 3-6.75 6.75"/><circle cx="10" cy="14" r="6"/>
    ctx.stroke(new Path2D('M16 3h5v5'));
    ctx.stroke(new Path2D('m21 3-6.75 6.75'));
    ctx.beginPath();
    ctx.arc(10, 14, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSectionHeader(
  ctx: CanvasRenderingContext2D,
  title: BilingualText,
  yMm: number,
  isContinuation = false,
  theme: PageTheme = DEFAULT_PAGE_THEME,
  seekingGender?: 'MALE' | 'FEMALE' | null
): number {
  const enTitle = isContinuation ? `${title.en} (Cont.)` : title.en;
  const urTitle = isContinuation && title.ur ? `${title.ur} (جاری)` : title.ur;

  let enX = MARGIN_X;
  if (!isContinuation && seekingGender) {
    const iconSizeMm = 5.0;
    drawLucideGenderIconMm(ctx, seekingGender, MARGIN_X, yMm + 0.8, iconSizeMm, theme.primary);
    enX = MARGIN_X + iconSizeMm + 2.0;
  }

  drawLtr(ctx, enTitle, enX, yMm + 5.2, fontDisplay(15.5, 700), theme.primary);
  if (urTitle) {
    drawRtl(ctx, urTitle, PAGE_W_MM - MARGIN_X, yMm + 5.2, fontUr(13.5, 700), theme.primary);
  }
  drawLineMm(ctx, MARGIN_X, yMm + 7.8, PAGE_W_MM - MARGIN_X, yMm + 7.8, theme.primary, 0.35);
  return yMm + 8.8;
}

interface SectionRenderInput {
  title: BilingualText;
  rows: Array<[CellItem, CellItem?]>;
  startOnNewPage?: boolean;
  theme?: PageTheme;
  seekingGender?: 'MALE' | 'FEMALE' | null;
  candidateBanner?: {
    index: number;
    name: string;
    scoreEn: string;
    scoreUr: string;
    photo: HTMLCanvasElement | null;
  };
}

function drawCandidateBanner(
  ctx: CanvasRenderingContext2D,
  banner: NonNullable<SectionRenderInput['candidateBanner']>,
  yMm: number
): number {
  const photoSize = banner.photo ? 13 : 0;
  let textX = MARGIN_X + 3.5;

  // Minimalist vertical forest accent bar
  ctx.save();
  ctx.fillStyle = COLORS.primary;
  ctx.fillRect(mm(MARGIN_X), mm(yMm), mm(0.9), mm(photoSize ? 13 : 10));
  ctx.restore();

  if (banner.photo) {
    drawRoundedImageMm(ctx, banner.photo, MARGIN_X + 3.2, yMm, photoSize, photoSize, 1.5);
    textX = MARGIN_X + 3.2 + photoSize + 3.5;
  }

  const label = `${String(banner.index).padStart(2, '0')}.  ${banner.name}`;
  drawLtr(ctx, label, textX, yMm + 6.2, fontDisplay(17.5, 700), COLORS.primary);
  drawLtr(
    ctx,
    `Proposal #${banner.index}`,
    textX,
    yMm + 11.2,
    fontEn(9.2, 500),
    COLORS.muted
  );

  // Clean right-aligned compatibility text (no heavy box)
  drawBilingualRightAlignedPair(
    ctx,
    banner.scoreEn,
    banner.scoreUr,
    PAGE_W_MM - MARGIN_X,
    yMm + 6.2,
    fontEn(10.8, 700),
    fontUr(11.5, 700),
    COLORS.primary
  );

  const bottomY = yMm + (banner.photo ? 14.5 : 11.8);
  drawLineMm(ctx, MARGIN_X, bottomY, PAGE_W_MM - MARGIN_X, bottomY, COLORS.primary, 0.35);
  return bottomY + 1;
}

function renderSectionsAcrossPages(
  brandIcon: HTMLCanvasElement | null,
  headerConfig: {
    subtitleEn: string;
    subtitleUr: string;
    dateEn: string;
    dateUr: string;
  },
  drawInitialHero: (ctx: CanvasRenderingContext2D, startY: number) => number,
  sections: SectionRenderInput[]
): CanvasPage[] {
  const pages: CanvasPage[] = [];
  let page = createNewA4Page(brandIcon, headerConfig);
  pages.push(page);

  let cursorY = drawInitialHero(page.ctx, HEADER_RULE_Y + 4);

  const startNewPage = (theme: PageTheme = DEFAULT_PAGE_THEME) => {
    page = createNewA4Page(brandIcon, headerConfig, theme);
    pages.push(page);
    cursorY = HEADER_RULE_Y + 4;
  };

  for (const section of sections) {
    if (section.rows.length === 0) continue;
    const sectionTheme = section.theme || DEFAULT_PAGE_THEME;

    if (section.startOnNewPage && (cursorY > HEADER_RULE_Y + 4.5 || page.theme !== sectionTheme)) {
      startNewPage(sectionTheme);
    }

    // Measure first row so header + first row stay together cleanly
    const firstPair = section.rows[0];
    const firstLeftLayout = measureCell(page.ctx, firstPair[0]);
    const firstRightLayout = firstPair[1] ? measureCell(page.ctx, firstPair[1]) : null;
    const firstRowH = Math.max(firstLeftLayout.heightMm, firstRightLayout?.heightMm ?? 0);
    const headerH = section.candidateBanner ? (section.candidateBanner.photo ? 16 : 13) : 8;

    if (cursorY + headerH + firstRowH + 2 > MAX_BODY_Y) {
      startNewPage(sectionTheme);
    }

    if (section.candidateBanner) {
      cursorY = drawCandidateBanner(page.ctx, section.candidateBanner, cursorY);
    } else {
      cursorY = drawSectionHeader(page.ctx, section.title, cursorY, false, sectionTheme, section.seekingGender);
    }

    for (let rIdx = 0; rIdx < section.rows.length; rIdx++) {
      const [leftCell, rightCell] = section.rows[rIdx];
      const leftLayout = measureCell(page.ctx, leftCell);
      const rightLayout = rightCell ? measureCell(page.ctx, rightCell) : null;
      const rowH = Math.max(leftLayout.heightMm, rightLayout?.heightMm ?? 0);

      if (cursorY + rowH > MAX_BODY_Y) {
        startNewPage(sectionTheme);
        if (section.candidateBanner) {
          cursorY = drawCandidateBanner(page.ctx, section.candidateBanner, cursorY);
        } else {
          cursorY = drawSectionHeader(page.ctx, section.title, cursorY, true, sectionTheme, section.seekingGender);
        }
      }

      drawCell(page.ctx, leftCell, leftLayout, MARGIN_X, cursorY, sectionTheme);
      if (rightCell && rightLayout) {
        drawCell(page.ctx, rightCell, rightLayout, MARGIN_X + COL_W + COL_GAP, cursorY, sectionTheme);
      }

      cursorY += rowH;
      if (rIdx < section.rows.length - 1) {
        drawLineMm(page.ctx, MARGIN_X, cursorY, PAGE_W_MM - MARGIN_X, cursorY, sectionTheme.rule, 0.2);
      }
    }

    cursorY += 5.5;
  }

  return pages;
}

/**
 * Draw minimalist 4-column hero summary strip with clean truncation/wrapping so values never collide.
 */
function drawHeroSummaryColumns(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  totalW: number,
  items: Array<{ labelEn: string; labelUr: string; valEn: string; valUr?: string }>
): number {
  const gap = 4;
  const itemW = (totalW - gap * (items.length - 1)) / items.length;
  let maxBottomY = startY + 10;

  items.forEach((item, idx) => {
    const x = startX + idx * (itemW + gap);
    drawLtr(ctx, item.labelEn.toUpperCase(), x, startY + 3.4, fontEn(8.5, 600), COLORS.muted);
    drawRtl(ctx, item.labelUr, x + itemW, startY + 3.4, fontUr(9.8, 600), COLORS.muted);

    const enLines = wrapTextMm(ctx, item.valEn, itemW, fontEn(11, 600), false);
    let y = startY + 8.5;
    enLines.slice(0, 2).forEach((line, lIdx) => {
      drawLtr(ctx, line, x, y + lIdx * 4.8, fontEn(11, 600), COLORS.ink);
    });
    y += Math.min(enLines.length, 2) * 4.8;

    if (item.valUr) {
      const urLines = wrapTextMm(ctx, item.valUr, itemW, fontUr(11.2, 600), true);
      urLines.slice(0, 2).forEach((line, lIdx) => {
        drawRtl(ctx, line, x + itemW, y + 0.5 + lIdx * 5.0, fontUr(11.2, 600), COLORS.primary);
      });
      y += 0.5 + Math.min(urLines.length, 2) * 5.0;
    }

    if (y > maxBottomY) maxBottomY = y;
  });

  return maxBottomY;
}

/**
 * Generate minimalist bilingual PDF dossier for approved match releases.
 */
export async function generateReleasedProfilesPDF(data: {
  sourceProfile: any;
  agent: any;
  releases: any[];
  requestId?: string;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  await Promise.all([ensureReferenceDataLoaded(), ensurePdfFontsLoaded()]);

  const clientName = data.sourceProfile?.full_name || 'Client Profile';
  const clientPhone = data.sourceProfile?.phone || 'N/A';
  const clientLocationRaw = data.sourceProfile?.location || 'N/A';
  const clientDobRaw = data.sourceProfile?.date_of_birth || '';
  const clientMaritalRaw = data.sourceProfile?.marital_status || '';
  const agentName = data.agent?.full_name || 'Assigned Advisor';
  const releases = data.releases || [];

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayBilingual = formatBilingualValue('document_date', todayIso);
  const clientDobBilingual = formatBilingualValue('date_of_birth', clientDobRaw);
  const clientMaritalBilingual = formatBilingualValue('marital_status', clientMaritalRaw);
  const clientLocBilingual = formatBilingualValue('current_city', clientLocationRaw);

  const [brandIcon, candidatePhotos] = await Promise.all([
    loadTrimmedBrandIcon(),
    Promise.all(
      releases.map(async (rel) => {
        const fields: Array<{ field_path: string; field_value: any }> = rel.fields || [];
        const picField = fields.find((f) => f.field_path === 'personal_information.profile_picture');
        if (!picField) return null;
        const picUrl =
          rel.candidate?.profile_url ||
          rel.candidate?.profile_URL ||
          (typeof picField.field_value === 'string' && picField.field_value.startsWith('http')
            ? picField.field_value
            : null);
        return picUrl ? fetchCircularOrFramedPhoto(picUrl) : null;
      })
    ),
  ]);

  const sections: SectionRenderInput[] = releases.map((rel, idx) => {
    const candName = rel.candidate?.full_name || `Candidate #${idx + 1}`;
    const hasScore = rel.score !== undefined && rel.score !== null;
    const scoreEn = hasScore ? `${Math.round(Number(rel.score))}% Match` : 'Verified Release';
    const scoreUr = hasScore ? `${Math.round(Number(rel.score))}% مطابقت` : 'منظور شدہ';

    const rawFields: Array<{ field_path: string; field_value: any }> = (rel.fields || []).filter(
      (f: any) => f.field_path !== 'personal_information.profile_picture'
    );

    const formattedFields = filterAndFormatReleaseFields(rawFields, {
      gender: rel.candidate?.gender,
      marital_status: rel.candidate?.marital_status,
      full_name: rel.candidate?.full_name,
    });

    const cells: CellItem[] = formattedFields
      .filter((f) => isMeaningfulFieldValue(f.value))
      .map((f) => ({
        label: getBilingualFieldLabel(f.path || f.label),
        value: formatBilingualValue(f.path || f.label, f.value),
      }));

    if (cells.length === 0) {
      cells.push({
        label: { en: 'Snapshot Status', ur: 'تفصیلات کی کیفیت' },
        value: { en: 'Approved Profile Summary', ur: 'منظور شدہ پروفائل کا خلاصہ' },
      });
    }

    const rows: Array<[CellItem, CellItem?]> = [];
    for (let i = 0; i < cells.length; i += 2) {
      rows.push([cells[i], cells[i + 1]]);
    }

    return {
      title: { en: candName, ur: '' },
      rows,
      candidateBanner: {
        index: idx + 1,
        name: candName,
        scoreEn,
        scoreUr,
        photo: candidatePhotos[idx],
      },
    };
  });

  const pages = renderSectionsAcrossPages(
    brandIcon,
    {
      subtitleEn: 'Official Match Release Dossier',
      subtitleUr: 'منظور شدہ رشتوں کی دستاویز',
      dateEn: todayBilingual.en,
      dateUr: todayBilingual.ur,
    },
    (ctx, startY) => {
      drawLtr(
        ctx,
        `PREPARED FOR  •  ${releases.length} APPROVED PROPOSAL${releases.length === 1 ? '' : 'S'}`,
        MARGIN_X,
        startY + 3.4,
        fontEn(8.8, 600),
        COLORS.goldMuted
      );
      drawRtl(
        ctx,
        'منتخب رشتوں کی فہرست برائے کلائنٹ',
        PAGE_W_MM - MARGIN_X,
        startY + 3.4,
        fontUr(10.5, 600),
        COLORS.goldMuted
      );

      drawLtr(ctx, clientName, MARGIN_X, startY + 11.2, fontDisplay(23, 700), COLORS.primary);

      const stripEndY = drawHeroSummaryColumns(ctx, MARGIN_X, startY + 13.5, CONTENT_W, [
        { labelEn: 'Contact', labelUr: 'فون نمبر', valEn: clientPhone },
        {
          labelEn: 'Status',
          labelUr: 'حیثیت',
          valEn: clientMaritalBilingual.en !== 'N/A' ? clientMaritalBilingual.en : clientDobBilingual.en,
          valUr: clientMaritalBilingual.ur || clientDobBilingual.ur,
        },
        {
          labelEn: 'City',
          labelUr: 'شہر',
          valEn: clientLocBilingual.en,
          valUr: clientLocBilingual.ur,
        },
        { labelEn: 'Advisor', labelUr: 'نمائندہ', valEn: agentName },
      ]);

      drawLineMm(ctx, MARGIN_X, stripEndY + 1.5, PAGE_W_MM - MARGIN_X, stripEndY + 1.5, COLORS.ruleDark, 0.25);
      return stripEndY + 6.5;
    },
    sections
  );

  const safeClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, '_');
  stampPageFootersAndExport(pages, `NikahKaru_Release_${safeClientName}.pdf`);
}

/**
 * Generate minimalist bilingual PDF dossier for a single client profile.
 */
export async function generateSingleProfilePDF(data: {
  item: RequestItem;
  preferences?: any;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  await Promise.all([ensureReferenceDataLoaded(), ensurePdfFontsLoaded()]);

  const { item } = data;
  let profileData = { ...(item.profileData || {}) } as any;

  const targetProfileId =
    profileData.profile_id || profileData.source_profile_id || profileData.id || item.id;

  const needsFullProfileFetch =
    Boolean(targetProfileId) &&
    (!Array.isArray(profileData.education_records) ||
      !Array.isArray(profileData.employment_records) ||
      !Array.isArray(profileData.parents) ||
      !Array.isArray(profileData.siblings) ||
      !Array.isArray(profileData.children) ||
      !Array.isArray(profileData.previous_marriages) ||
      profileData.relocation_information === undefined);

  const needsPrefsFetch =
    Boolean(targetProfileId) &&
    (!data.preferences ||
      Object.keys(data.preferences).length === 0 ||
      (!data.preferences.preferredLocations && !data.preferences.preferred_locations));

  let resolvedPreferences = data.preferences;

  if (needsFullProfileFetch || needsPrefsFetch) {
    const [fetchedProfile, fetchedPrefs] = await Promise.all([
      needsFullProfileFetch
        ? ProfileService.getProfileById(targetProfileId).catch(() => null)
        : Promise.resolve(null),
      needsPrefsFetch
        ? PreferenceService.getCurrentPreferences(targetProfileId).catch(() => null)
        : Promise.resolve(null),
    ]);

    if (fetchedProfile) {
      profileData = {
        ...fetchedProfile,
        ...profileData,
        personal_information: fetchedProfile.personal_information || profileData.personal_information,
        physical_information: fetchedProfile.physical_information || profileData.physical_information,
        religion_information: fetchedProfile.religion_information || profileData.religion_information,
        profile_locations: fetchedProfile.profile_locations || profileData.profile_locations,
        residency_information: fetchedProfile.residency_information || profileData.residency_information,
        income_information: fetchedProfile.income_information || profileData.income_information,
        family_information: fetchedProfile.family_information || profileData.family_information,
        lifestyle_information: fetchedProfile.lifestyle_information || profileData.lifestyle_information,
        relocation_information: fetchedProfile.relocation_information || profileData.relocation_information,
        education_records:
          Array.isArray(profileData.education_records) && profileData.education_records.length > 0
            ? profileData.education_records
            : fetchedProfile.education_records || [],
        employment_records:
          Array.isArray(profileData.employment_records) && profileData.employment_records.length > 0
            ? profileData.employment_records
            : fetchedProfile.employment_records || [],
        parents:
          Array.isArray(profileData.parents) && profileData.parents.length > 0
            ? profileData.parents
            : fetchedProfile.parents || [],
        siblings:
          Array.isArray(profileData.siblings) && profileData.siblings.length > 0
            ? profileData.siblings
            : fetchedProfile.siblings || [],
        children:
          Array.isArray(profileData.children) && profileData.children.length > 0
            ? profileData.children
            : fetchedProfile.children || [],
        previous_marriages:
          Array.isArray(profileData.previous_marriages) && profileData.previous_marriages.length > 0
            ? profileData.previous_marriages
            : fetchedProfile.previous_marriages || [],
      };
    }

    if (fetchedPrefs) {
      resolvedPreferences = {
        ...(resolvedPreferences || {}),
        ...fetchedPrefs,
        preferredLocations:
          fetchedPrefs.preferredLocations ||
          resolvedPreferences?.preferredLocations ||
          resolvedPreferences?.preferred_locations ||
          [],
        preferredRelocations:
          fetchedPrefs.preferredRelocations ||
          resolvedPreferences?.preferredRelocations ||
          resolvedPreferences?.preferred_relocations ||
          [],
      };
    }
  }

  const enrichedItem: RequestItem = {
    ...item,
    profileData,
  };

  const groups = getProfileGroups(enrichedItem, resolvedPreferences);

  const clientName = item.name || profileData.full_name || 'Client Profile';
  const clientPhone = item.phone || profileData.primary_phone || profileData.phone || 'N/A';
  const clientCnic = item.cnic || profileData.cnic || 'N/A';
  const staffName = item.staff || profileData.current_agent_name || 'Assigned Advisor';

  const cityEn = profileData.current_city_name_en || profileData.current_location_text || 'N/A';
  const cityUr = profileData.current_city_name_ur || null;
  const cityBilingual = formatBilingualValue('current_city', cityEn, cityUr);

  const maritalBilingual = formatBilingualValue('marital_status', profileData.marital_status);
  const genderBilingual = formatBilingualValue('gender', profileData.gender);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayBilingual = formatBilingualValue('document_date', todayIso);

  const picUrl = profileData.profile_url || profileData.profile_URL || profileData.profile_picture;

  const [brandIcon, portrait] = await Promise.all([
    loadTrimmedBrandIcon(),
    picUrl ? fetchCircularOrFramedPhoto(picUrl) : Promise.resolve(null),
  ]);

  const rawProfileGender = String(profileData.gender || '').trim().toUpperCase();
  const seekingGender: 'MALE' | 'FEMALE' | null =
    rawProfileGender === 'MALE' ? 'FEMALE' : rawProfileGender === 'FEMALE' ? 'MALE' : null;

  const sections: SectionRenderInput[] = groups
    .map(([groupTitle, rawFields]) => {
      const isPrefGroup = groupTitle.trim().toLowerCase() === 'partner preferences';
      const filtered = rawFields.filter(([label, val]) => {
        if (label === 'Profile picture') return false;
        return isMeaningfulFieldValue(val);
      });

      const cells: CellItem[] = filtered.map(([label, val]) => {
        const explicitUr = resolveExplicitUrduFromProfile(
          label,
          isPrefGroup ? null : profileData,
          isPrefGroup ? resolvedPreferences : null
        );
        return {
          label: getBilingualFieldLabel(label),
          value: formatBilingualValue(label, val, explicitUr),
        };
      });

      const rows: Array<[CellItem, CellItem?]> = [];
      for (let i = 0; i < cells.length; i += 2) {
        rows.push([cells[i], cells[i + 1]]);
      }

      return {
        title: getBilingualSectionTitle(groupTitle),
        rows,
        startOnNewPage: isPrefGroup,
        theme: isPrefGroup ? PREFERENCES_PAGE_THEME : DEFAULT_PAGE_THEME,
        seekingGender: isPrefGroup ? seekingGender : null,
      };
    })
    .filter((s) => s.rows.length > 0);

  const pages = renderSectionsAcrossPages(
    brandIcon,
    {
      subtitleEn: 'Matrimonial Profile Dossier',
      subtitleUr: 'ازدواجی پروفائل تفصیلات',
      dateEn: todayBilingual.en,
      dateUr: todayBilingual.ur,
    },
    (ctx, startY) => {
      const photoSize = portrait ? 20 : 0;
      const textStartX = portrait ? MARGIN_X + photoSize + 4.5 : MARGIN_X;
      const textAreaW = CONTENT_W - (portrait ? photoSize + 4.5 : 0);

      if (portrait) {
        drawRoundedImageMm(ctx, portrait, MARGIN_X, startY + 0.5, photoSize, photoSize, 2);
      }

      const eyebrowEn =
        genderBilingual.en !== 'N/A'
          ? `CLIENT DOSSIER  •  ${genderBilingual.en.toUpperCase()}`
          : 'CLIENT DOSSIER';
      const eyebrowUr = genderBilingual.ur ? `ذاتی ازدواجی پروفائل (${genderBilingual.ur})` : 'ذاتی ازدواجی پروفائل';

      drawLtr(ctx, eyebrowEn, textStartX, startY + 3.4, fontEn(8.8, 600), COLORS.goldMuted);
      drawRtl(ctx, eyebrowUr, PAGE_W_MM - MARGIN_X, startY + 3.4, fontUr(10.5, 600), COLORS.goldMuted);

      drawLtr(ctx, clientName, textStartX, startY + 11.2, fontDisplay(23.5, 700), COLORS.primary);

      const stripEndY = drawHeroSummaryColumns(ctx, textStartX, startY + 13.5, textAreaW, [
        { labelEn: 'Contact', labelUr: 'فون نمبر', valEn: clientPhone },
        { labelEn: 'CNIC', labelUr: 'شناختی کارڈ', valEn: clientCnic },
        {
          labelEn: 'Status',
          labelUr: 'حیثیت',
          valEn: maritalBilingual.en,
          valUr: maritalBilingual.ur,
        },
        {
          labelEn: 'City / Advisor',
          labelUr: 'شہر',
          valEn: `${cityBilingual.en} (${staffName})`,
          valUr: cityBilingual.ur,
        },
      ]);

      const finalY = Math.max(stripEndY, portrait ? startY + photoSize + 1 : 0);
      drawLineMm(ctx, MARGIN_X, finalY + 2, PAGE_W_MM - MARGIN_X, finalY + 2, COLORS.ruleDark, 0.25);
      return finalY + 7;
    },
    sections
  );

  const safeClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, '_');
  stampPageFootersAndExport(pages, `NikahKaru_Profile_${safeClientName}.pdf`);
}
