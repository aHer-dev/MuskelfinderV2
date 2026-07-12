"""App-Icons aus dem echten Markenlogo erzeugen (public/logo/af-logo.png).

Bisher waren favicon/apple-touch/pwa-* ein handgezeichneter Platzhalter-„A" und
hatten mit der Wortmarke nichts zu tun.
"""
from PIL import Image, ImageDraw

SRC = 'public/logo/af-logo.png'          # weisses A + oranger Schwung, transparent
TILE = (28, 27, 24, 255)                 # #1c1b18 — warmes Anthrazit (Marken-Token)
OUT = 'public'

logo = Image.open(SRC).convert('RGBA').crop(Image.open(SRC).getchannel('A').getbbox())


def tile(size: int, radius_pct: float, logo_pct: float, bg=TILE) -> Image.Image:
    """Quadratische Kachel mit zentriertem, proportional eingepasstem Logo."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r = int(size * radius_pct)
    if r > 0:
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=bg)
    else:
        draw.rectangle([0, 0, size - 1, size - 1], fill=bg)

    box = int(size * logo_pct)
    w, h = logo.size
    scale = min(box / w, box / h)
    mark = logo.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    img.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
    return img


# Favicon: klein, daher Logo groesser im Rahmen, damit die Form bei 16px noch trägt.
tile(32, 0.22, 0.76).save(f'{OUT}/favicon-32.png')
tile(180, 0.22, 0.72).convert('RGB').save(f'{OUT}/apple-touch-icon.png')  # iOS mag kein Alpha
tile(192, 0.22, 0.72).save(f'{OUT}/pwa-192.png')
tile(512, 0.22, 0.72).save(f'{OUT}/pwa-512.png')
# Maskable: randlos (das OS schneidet selbst), Logo in der 80%-Sicherheitszone.
tile(512, 0.0, 0.56).save(f'{OUT}/pwa-maskable-512.png')

print('geschrieben: favicon-32, apple-touch-icon, pwa-192, pwa-512, pwa-maskable-512')
