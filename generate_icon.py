from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs("icons", exist_ok=True)

sizes = [16, 24, 32, 48, 128]

orange_color = (255, 140, 0)  

for size in sizes:
    font_size = int(size * 0.8)
    
    img = Image.new('RGBA', (size, size), color=(255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("Arial Bold.ttf", font_size)
    except IOError:
        font = ImageFont.load_default()
    
    text = "S"
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_width = right - left
    text_height = bottom - top

    vertical_offset = int(text_height * 0.1)
    position = ((size - text_width) // 2, (size - text_height) // 2 - vertical_offset)
    draw.text(position, text, fill=orange_color, font=font)
    
    img.save(f"public/{size}.png")

print("generate ok！")
