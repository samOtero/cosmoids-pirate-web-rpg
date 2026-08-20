"""Generate branded PWA icons from the shipped Fueguana portrait."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "UI" / "Icons" / "fueguana_icon.png"
OUTPUT_DIR = ROOT / "public" / "icons"


def make_background(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), "#071a2b")
    pixels = image.load()
    center = (size - 1) / 2

    for y in range(size):
        for x in range(size):
            distance = min(1.0, ((x - center) ** 2 + (y - center) ** 2) ** 0.5 / center)
            glow = max(0.0, 1.0 - distance)
            pixels[x, y] = (
                round(7 + 13 * glow),
                round(26 + 49 * glow),
                round(43 + 67 * glow),
                255,
            )

    return image


def render_icon(size: int, portrait_scale: float) -> Image.Image:
    image = make_background(size)
    draw = ImageDraw.Draw(image)
    border = max(2, round(size * 0.018))
    inset = round(size * 0.045)
    draw.rounded_rectangle(
        (inset, inset, size - inset - 1, size - inset - 1),
        radius=round(size * 0.22),
        outline=(244, 228, 188, 210),
        width=border,
    )

    portrait = Image.open(SOURCE).convert("RGBA")
    portrait = portrait.crop(portrait.getbbox())
    target = round(size * portrait_scale)
    scale = min(target / portrait.width, target / portrait.height)
    portrait = portrait.resize(
        (round(portrait.width * scale), round(portrait.height * scale)),
        Image.Resampling.LANCZOS,
    )
    x = (size - portrait.width) // 2
    y = (size - portrait.height) // 2 + round(size * 0.015)
    image.alpha_composite(portrait, (x, y))
    return image


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for size in (180, 192, 512):
        render_icon(size, 0.84).save(OUTPUT_DIR / f"cosmoids-{size}.png")
    render_icon(512, 0.68).save(OUTPUT_DIR / "cosmoids-maskable-512.png")


if __name__ == "__main__":
    main()
