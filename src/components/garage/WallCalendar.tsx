import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

/**
 * DriveKare wall calendar (adapted from the KleanupCrew one). The printed face is drawn into an offscreen canvas
 * at print resolution and mapped onto the paper, so it stays sharp at the camera
 * distances the room is viewed from, and it is redrawn only when the visitor's
 * local calendar day actually changes: once at mount, then once a night.
 *
 * The sheet carries only the masthead and the month. Nothing sits below the
 * grid, and the head is a single compact band, which lets the whole calendar
 * hang smaller on the wall while the dates stay easy to read.
 */

const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 1200;

/** Printed size on the wall, in metres, keeping the artwork's proportions. */
const PAPER_WIDTH = 1.22;
const PAPER_HEIGHT = (PAPER_WIDTH * TEXTURE_HEIGHT) / TEXTURE_WIDTH;
const PAPER_THICKNESS = 0.02;

const PAPER = "#fffdf7";
const FOREST = "#1c2645";
const FOREST_SOFT = "#2a3764";
const LIME = "#e8741e";
const GOLD = "#f5a04a";
const INK = "#2b332e";
const GRID_LINE = "#ddd7c6";

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SLOGAN = "Care that comes to you.";

/** Printed layout, in texture pixels. */
const MARGIN = 56;
const RULE_Y = 226;
const BAND_Y = 250;
const BAND_H = 108;
const HEADER_Y = 386;
const HEADER_H = 54;
const GRID_Y = HEADER_Y + HEADER_H;
const GRID_BOTTOM = 1148;

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, radius);
    return;
  }
  // Older engines without roundRect still get the same shape.
  const r = Math.min(radius, width / 2, height / 2);
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function setTracking(context: CanvasRenderingContext2D, value: string) {
  // Supported by current engines; ignored elsewhere, which only costs tracking.
  const typed = context as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in typed) typed.letterSpacing = value;
}

/** A single soft leaf, used as a masthead accent. */
function drawLeaf(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  angle: number,
  color: string,
) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(length * 0.55, -length * 0.42, length, 0);
  context.quadraticCurveTo(length * 0.55, length * 0.42, 0, 0);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.55)";
  context.lineWidth = Math.max(1.5, length * 0.03);
  context.beginPath();
  context.moveTo(length * 0.08, 0);
  context.lineTo(length * 0.92, 0);
  context.stroke();
  context.restore();
}

/** Paint the whole sheet for the given local day. */
function drawCalendar(context: CanvasRenderingContext2D, today: Date) {
  const W = TEXTURE_WIDTH;
  const H = TEXTURE_HEIGHT;
  const year = today.getFullYear();
  const month = today.getMonth();
  const dayOfMonth = today.getDate();

  // Local-time construction, so the grid always agrees with the visitor's clock.
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekRows = Math.ceil((firstWeekday + daysInMonth) / 7);

  context.clearRect(0, 0, W, H);
  context.fillStyle = PAPER;
  context.fillRect(0, 0, W, H);
  const warmth = context.createLinearGradient(0, 0, W, H);
  warmth.addColorStop(0, "rgba(255,255,255,0.9)");
  warmth.addColorStop(1, "rgba(240,234,218,0.22)");
  context.fillStyle = warmth;
  context.fillRect(0, 0, W, H);

  // Binding margin: punched holes sit under the spiral modelled in the scene.
  context.fillStyle = "rgba(60,64,58,0.3)";
  for (let i = 0; i < 15; i += 1) {
    const cx = 56 + (i / 14) * (W - 112);
    context.beginPath();
    context.ellipse(cx, 24, 10, 8, 0, 0, Math.PI * 2);
    context.fill();
  }

  context.textBaseline = "alphabetic";

  // Masthead: the wordmark and the slogan, and nothing else above the month.

  context.textAlign = "left";
  context.font = `bold 78px ${SANS}`;
  const brandA = "Drive";
  const brandB = "Kare";
  const widthA = context.measureText(brandA).width;
  const widthB = context.measureText(brandB).width;
  const brandX = (W - (widthA + widthB)) / 2;
  context.fillStyle = FOREST;
  context.fillText(brandA, brandX, 148);
  context.fillStyle = LIME;
  context.fillText(brandB, brandX + widthA, 148);

  context.textAlign = "center";
  setTracking(context, "3px");
  context.font = `bold 33px ${SANS}`;
  context.fillStyle = FOREST_SOFT;
  context.fillText(SLOGAN, W / 2, 198);
  setTracking(context, "0px");

  context.strokeStyle = GOLD;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(MARGIN, RULE_Y);
  context.lineTo(W - MARGIN, RULE_Y);
  context.stroke();

  // Month band.
  context.fillStyle = FOREST;
  roundedRect(context, MARGIN, BAND_Y, W - MARGIN * 2, BAND_H, 12);
  context.fill();
  context.fillStyle = GOLD;
  context.fillRect(MARGIN, BAND_Y + BAND_H - 7, W - MARGIN * 2, 5);

  const monthLabel = MONTHS[month] ?? "";
  const yearLabel = ` ${year}`;
  context.textAlign = "left";
  context.font = `bold 66px ${SANS}`;
  const monthWidth = context.measureText(monthLabel).width;
  context.font = `300 60px ${SANS}`;
  const yearWidth = context.measureText(yearLabel).width;
  const headX = (W - (monthWidth + yearWidth)) / 2;
  context.font = `bold 66px ${SANS}`;
  context.fillStyle = "#ffffff";
  context.fillText(monthLabel, headX, BAND_Y + 76);
  context.font = `300 60px ${SANS}`;
  context.fillStyle = "#cfe6c4";
  context.fillText(yearLabel, headX + monthWidth, BAND_Y + 76);

  // Grid.
  const gridX = MARGIN;
  const gridW = W - MARGIN * 2;
  const cellW = gridW / 7;
  const gridH = GRID_BOTTOM - GRID_Y;
  const cellH = gridH / weekRows;

  context.fillStyle = "#f1ece0";
  context.fillRect(gridX, HEADER_Y, gridW, HEADER_H);
  context.textAlign = "center";
  setTracking(context, "2px");
  context.font = `bold 28px ${SANS}`;
  context.fillStyle = "#54655a";
  WEEKDAYS.forEach((label, index) => {
    context.fillText(label, gridX + cellW * (index + 0.5), HEADER_Y + 37);
  });
  setTracking(context, "0px");

  context.fillStyle = "#ffffff";
  context.fillRect(gridX, GRID_Y, gridW, gridH);

  context.strokeStyle = GRID_LINE;
  context.lineWidth = 2;
  for (let column = 0; column <= 7; column += 1) {
    const x = gridX + column * cellW;
    context.beginPath();
    context.moveTo(x, HEADER_Y);
    context.lineTo(x, GRID_Y + gridH);
    context.stroke();
  }
  for (let row = 0; row <= weekRows; row += 1) {
    const y = GRID_Y + row * cellH;
    context.beginPath();
    context.moveTo(gridX, y);
    context.lineTo(gridX + gridW, y);
    context.stroke();
  }
  context.beginPath();
  context.moveTo(gridX, HEADER_Y);
  context.lineTo(gridX + gridW, HEADER_Y);
  context.stroke();

  // Dates are sized from the cell, so a six-week month stays as readable as a
  // five-week one.
  const unit = Math.min(cellW, cellH);
  const dateFont = Math.round(unit * 0.4);
  const chip = unit * 0.72;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const slot = firstWeekday + day - 1;
    const column = slot % 7;
    const row = Math.floor(slot / 7);
    const centreX = gridX + cellW * (column + 0.5);
    const centreY = GRID_Y + cellH * (row + 0.5);

    if (day === dayOfMonth) {
      // Today: the only highlighted cell on the sheet.
      context.fillStyle = "#eaf5e0";
      context.fillRect(
        gridX + cellW * column + 1,
        GRID_Y + cellH * row + 1,
        cellW - 2,
        cellH - 2,
      );
      context.fillStyle = FOREST;
      roundedRect(context, centreX - chip / 2, centreY - chip / 2, chip, chip, chip * 0.28);
      context.fill();
      context.fillStyle = "#ffffff";
      context.font = `bold ${dateFont}px ${SANS}`;
    } else {
      context.fillStyle = INK;
      context.font = `500 ${dateFont}px ${SANS}`;
    }
    context.fillText(String(day), centreX, centreY + dateFont * 0.35);
  }
}

/** Today's local date, refreshed the moment the day rolls over. */
function useLocalDay() {
  const [today, setToday] = useState<Date>(() => new Date());

  useEffect(() => {
    let timer = 0;

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    // Only ever swaps in a new Date when the day genuinely changed, so a tab
    // coming back into view does not re-render the sheet for nothing.
    const refresh = () =>
      setToday((previous) => {
        const now = new Date();
        return sameDay(previous, now) ? previous : now;
      });

    const schedule = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        2,
      );
      timer = window.setTimeout(() => {
        refresh();
        schedule();
      }, Math.max(1000, nextMidnight.getTime() - now.getTime()));
    };

    schedule();
    // A laptop that slept through midnight wakes up on the wrong day otherwise.
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return today;
}

export function WallCalendar({ position }: { position: [number, number, number] }) {
  const { gl } = useThree();
  const today = useLocalDay();
  const dayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = TEXTURE_WIDTH;
    canvas.height = TEXTURE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const [yearPart, monthPart, dayPart] = dayKey.split("-").map(Number);
    drawCalendar(context, new Date(yearPart ?? 1970, monthPart ?? 0, dayPart ?? 1));
    const created = new CanvasTexture(canvas);
    created.colorSpace = SRGBColorSpace;
    created.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return created;
  }, [dayKey, gl]);

  useEffect(() => () => texture?.dispose(), [texture]);

  const halfWidth = PAPER_WIDTH / 2;
  const halfHeight = PAPER_HEIGHT / 2;

  return (
    <group position={position}>
      {/* Paper block: gives the sheet real thickness against the wall. */}
      <mesh position={[0, 0, -PAPER_THICKNESS / 2]} castShadow receiveShadow>
        <boxGeometry args={[PAPER_WIDTH, PAPER_HEIGHT, PAPER_THICKNESS]} />
        <meshStandardMaterial color="#f2ecdd" roughness={0.9} />
      </mesh>

      {/* Printed face. */}
      <mesh position={[0, 0, 0.0015]} receiveShadow>
        <planeGeometry args={[PAPER_WIDTH, PAPER_HEIGHT]} />
        <meshStandardMaterial map={texture} roughness={0.82} />
      </mesh>

      {/* Twin-loop spiral over the top edge. */}
      <mesh
        position={[0, halfHeight - 0.018, -PAPER_THICKNESS / 2]}
        rotation-z={Math.PI / 2}
        castShadow
      >
        <cylinderGeometry args={[0.005, 0.005, PAPER_WIDTH * 0.94, 8]} />
        <meshStandardMaterial color="#b89a55" metalness={0.55} roughness={0.34} />
      </mesh>
      {Array.from({ length: 15 }, (_, index) => (
        <mesh
          key={index}
          position={[
            -halfWidth + 0.06 + (index / 14) * (PAPER_WIDTH - 0.12),
            halfHeight - 0.018,
            -PAPER_THICKNESS / 2,
          ]}
          rotation-y={Math.PI / 2}
          castShadow
        >
          <torusGeometry args={[0.027, 0.0046, 6, 16]} />
          <meshStandardMaterial color="#c6a961" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Brass hanging tab. */}
      <mesh position={[0, halfHeight + 0.032, -PAPER_THICKNESS / 2]} castShadow>
        <boxGeometry args={[0.08, 0.055, 0.011]} />
        <meshStandardMaterial color="#f5a04a" metalness={0.62} roughness={0.34} />
      </mesh>
      <mesh
        position={[0, halfHeight + 0.042, -PAPER_THICKNESS / 2 + 0.007]}
        rotation-x={Math.PI / 2}
      >
        <cylinderGeometry args={[0.011, 0.011, 0.014, 12]} />
        <meshStandardMaterial color="#5d4f2c" roughness={0.5} />
      </mesh>
    </group>
  );
}
