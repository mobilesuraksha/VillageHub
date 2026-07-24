"""
VillageHub brand asset generator.

Generates the 'hub mark' - a center hub with 6 tapered spokes radiating to
node points, forming a hexagonal network shape. It reads as:
  - a "hub" (the app's name / a connection point for the community)
  - an abstract banyan tree / village-gathering-point silhouette from above

All geometry is computed with math.cos/sin so every coordinate is exact -
nothing here is a hand-typed path string.

Outputs:
  - PWA icons at all standard sizes (+ maskable variant)
  - apple-touch-icon.png
  - favicon.svg + favicon PNG fallbacks
  - placeholder.svg (broken/loading image fallback used across the app)
  - og-image.png (1200x630 social share image)
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

ICONS_DIR = "/home/claude/villagehub/public/assets/icons"
IMAGES_DIR = "/home/claude/villagehub/public/assets/images"
os.makedirs(ICONS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

# ---- Brand palette (matches css/variables.css) ----
GREEN = (20, 107, 77)        # #146B4D
GREEN_DARK = (14, 79, 56)    # #0E4F38
GOLD = (226, 155, 38)        # #E29B26
WHITE = (255, 255, 255)
INK = (22, 36, 29)           # #16241D


def hub_geometry(cx, cy, scale):
    """Compute the 6-spoke hub mark geometry at a given center/scale.
    Returns (spoke_polygons, center_circle, end_circles).
    """
    r_inner = 46 * scale
    r_outer = 150 * scale
    w_inner = 16 * scale
    w_outer = 7 * scale
    node_r = 22 * scale
    center_r = 50 * scale

    spokes = []
    end_circles = []
    for i in range(6):
        theta = math.radians(-90 + 60 * i)  # hexagon, first spoke points up
        dx, dy = math.cos(theta), math.sin(theta)
        px, py = -dy, dx  # perpendicular unit vector

        inner = (cx + dx * r_inner, cy + dy * r_inner)
        outer = (cx + dx * r_outer, cy + dy * r_outer)

        p1 = (inner[0] + px * w_inner, inner[1] + py * w_inner)
        p2 = (outer[0] + px * w_outer, outer[1] + py * w_outer)
        p3 = (outer[0] - px * w_outer, outer[1] - py * w_outer)
        p4 = (inner[0] - px * w_inner, inner[1] - py * w_inner)

        spokes.append([p1, p2, p3, p4])
        end_circles.append((outer, node_r))

    return spokes, (cx, cy, center_r), end_circles


def draw_hub_mark(draw, cx, cy, scale, fill):
    spokes, (ccx, ccy, cr), end_circles = hub_geometry(cx, cy, scale)
    for spoke in spokes:
        draw.polygon(spoke, fill=fill)
    for (ex, ey), r in end_circles:
        draw.ellipse([ex - r, ey - r, ex + r, ey + r], fill=fill)
    draw.ellipse([ccx - cr, ccy - cr, ccx + cr, ccy + cr], fill=fill)


def svg_hub_mark(cx, cy, scale, fill="#FFFFFF"):
    spokes, (ccx, ccy, cr), end_circles = hub_geometry(cx, cy, scale)
    parts = []
    for spoke in spokes:
        pts = " ".join(f"{x:.2f},{y:.2f}" for x, y in spoke)
        parts.append(f'<polygon points="{pts}" fill="{fill}"/>')
    for (ex, ey), r in end_circles:
        parts.append(f'<circle cx="{ex:.2f}" cy="{ey:.2f}" r="{r:.2f}" fill="{fill}"/>')
    parts.append(f'<circle cx="{ccx:.2f}" cy="{ccy:.2f}" r="{cr:.2f}" fill="{fill}"/>')
    return "\n  ".join(parts)


# ---------------------------------------------------------------------------
# 1. Master maskable-safe icon (512, full-bleed bg) -> used for all raster sizes
# ---------------------------------------------------------------------------
SIZE = 512
master = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(master)
d.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=int(SIZE * 0.22), fill=GREEN)
draw_hub_mark(d, SIZE / 2, SIZE / 2, scale=1.0, fill=WHITE)
master.save(f"{ICONS_DIR}/icon-512.png")

for s in [384, 192, 152, 144, 128, 96, 72]:
    master.resize((s, s), Image.LANCZOS).save(f"{ICONS_DIR}/icon-{s}.png")

# Maskable variant: full-bleed square background, mark shrunk into safe zone (~80%)
maskable = Image.new("RGBA", (SIZE, SIZE), GREEN + (255,))
dm = ImageDraw.Draw(maskable)
draw_hub_mark(dm, SIZE / 2, SIZE / 2, scale=0.72, fill=WHITE)
maskable.save(f"{ICONS_DIR}/icon-512-maskable.png")
maskable.resize((192, 192), Image.LANCZOS).save(f"{ICONS_DIR}/icon-192-maskable.png")

# Apple touch icon (180, solid bg since iOS applies its own corner mask)
apple = Image.new("RGBA", (180, 180), GREEN + (255,))
da = ImageDraw.Draw(apple)
draw_hub_mark(da, 90, 90, scale=180 / 512, fill=WHITE)
apple.convert("RGB").save(f"{ICONS_DIR}/apple-touch-icon.png")

# Favicon PNG fallback (32)
master.resize((32, 32), Image.LANCZOS).save(f"{ICONS_DIR}/favicon-32.png")
master.resize((16, 16), Image.LANCZOS).save(f"{ICONS_DIR}/favicon-16.png")

# ---------------------------------------------------------------------------
# 2. favicon.svg (scalable, computed with the same function -> no drift)
# ---------------------------------------------------------------------------
svg_size = 64
svg_body = svg_hub_mark(svg_size / 2, svg_size / 2, scale=svg_size / 512, fill="#FFFFFF")
favicon_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_size} {svg_size}">
  <rect width="{svg_size}" height="{svg_size}" rx="{svg_size * 0.22:.1f}" fill="#146B4D"/>
  {svg_body}
</svg>
'''
with open(f"{ICONS_DIR}/favicon.svg", "w") as f:
    f.write(favicon_svg)

# ---------------------------------------------------------------------------
# 3. placeholder.svg - generic broken/empty image fallback used site-wide
# ---------------------------------------------------------------------------
placeholder_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#F1F3F0"/>
  <path d="M0 230 L110 140 L180 200 L260 110 L400 230 V300 H0 Z" fill="#DDE3DC"/>
  <circle cx="290" cy="80" r="28" fill="#DDE3DC"/>
</svg>
'''
with open(f"{IMAGES_DIR}/placeholder.svg", "w") as f:
    f.write(placeholder_svg)

# ---------------------------------------------------------------------------
# 4. Social share OG image (1200x630)
# ---------------------------------------------------------------------------
OGW, OGH = 1200, 630
og = Image.new("RGB", (OGW, OGH), GREEN)
dog = ImageDraw.Draw(og)

# Subtle decorative echo of the hub mark, large + low-opacity, off to the right
echo_layer = Image.new("RGBA", (OGW, OGH), (0, 0, 0, 0))
decho = ImageDraw.Draw(echo_layer)
draw_hub_mark(decho, OGW - 180, OGH // 2, scale=1.55, fill=(255, 255, 255, 28))
og.paste(Image.alpha_composite(Image.new("RGBA", (OGW, OGH), GREEN + (255,)), echo_layer).convert("RGB"), (0, 0))
dog = ImageDraw.Draw(og)

# Foreground hub mark (top-left)
draw_hub_mark(dog, 130, 150, scale=0.62, fill=WHITE)

try:
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf", 76)
    font_tag = ImageFont.truetype("/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf", 30)
except Exception:
    font_title = ImageFont.load_default()
    font_tag = ImageFont.load_default()

dog.text((80, 300), "VillageHub", font=font_title, fill=WHITE)
dog.text((84, 400), "Buy, sell, work & connect - all in your village", font=font_tag, fill=(230, 242, 237))

og.save(f"{IMAGES_DIR}/og-image.png", quality=90)

print("Icon generation complete.")
print(os.listdir(ICONS_DIR))
print(os.listdir(IMAGES_DIR))
